import asyncio
import base64
import datetime
import io
import json
import os
import uuid
import zipfile
from collections.abc import AsyncGenerator
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

import logging
import time

from app.api.v1._audit import get_ip, log_audit

logger = logging.getLogger(__name__)
from app.core.config import settings
from app.db.session import get_db
from app.middleware.auth import get_user_or_none, check_active_subscription
from app.services.plan_service import get_upload_limit, get_monthly_upload_count
from app.services.auth_service import auth_service
from app.models.chat import Conversation as ConversationModel, MessageRole
from app.models.notification import Notification, NotificationType
from app.models.organization import MemberRole, MemberStatus, OrganizationMember
from app.models.user import User
from app.schemas.chat import (
    ChatRequest,
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageResponse,
)
from app.services.ai_service import ai_service
from app.services.chat_service import chat_service
from app.services.document_processor import document_processor
from app.services.vector_service import vector_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_export_url(url: str) -> str:
    """Ensure export URLs embedded in message text use the absolute backend URL."""
    if url.startswith("http"):
        return url
    base = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
    return f"{base}{url}"

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}

# ── Unified send endpoint ──────────────────────────────────────────────────────


@router.post("/send")
async def send(
    request: Request,
    conversation_id: Optional[str] = Form(None),
    message: Optional[str]         = Form(None),
    authorities: Optional[str]     = Form(None),   # JSON-encoded list e.g. '["EMA","FDA"]'
    model: Optional[str]           = Form(None),
    files: list[UploadFile]        = File(default=[]),
    project_id: Optional[str]      = Form(None),
    chat_mode: Optional[str]       = Form(None),   # "general" | "program"
    current_user: User              = Depends(check_active_subscription),
    db: AsyncSession               = Depends(get_db),
):
    """Single endpoint: create/get conversation, attach file, set authorities, stream AI response.

    Returns an SSE stream immediately after conversation creation — all heavy work
    (file upload to GCS, text extraction, RAG search) happens inside the generator
    so the first chunk reaches the client in ~5-7 seconds instead of 40-50 seconds.
    """
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None

    # ── 1. Get or create conversation — fast DB op only ───────────────────────
    is_new_convo = False
    if conversation_id:
        convo = await chat_service.get_conversation(db, uuid.UUID(conversation_id), user_id, org_id)
        if not convo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        convo = await chat_service.create_conversation(
            db, user_id, ConversationCreate(
                model=model or settings.DEFAULT_MODEL,
                chat_mode=chat_mode or "program",
            )
        )
        convo.organization_id = org_id
        if project_id:
            try:
                convo.project_id = uuid.UUID(project_id)
            except (ValueError, Exception):
                pass
        await db.commit()
        await db.refresh(convo)
        is_new_convo = True

    # ── 2. Subscription quota check for files — fast DB reads ─────────────────
    file_data: list[tuple[str, str, bytes]] = []
    if files:
        sub = await auth_service.get_subscription(db, current_user)
        upload_limit = get_upload_limit(sub)
        if upload_limit is not None and upload_limit > 0:
            used = await get_monthly_upload_count(db, current_user.id)
            if used + len(files) > upload_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"upload_limit_reached:{upload_limit}",
                )
        # Read file bytes into memory — already buffered in the request body, instant
        for f in files:
            content = await f.read()
            file_data.append((f.filename, f.content_type or "", content))

    # ── 3. Return SSE stream immediately — generator does the heavy work ──────
    new_convo_payload = {
        "id": str(convo.id),
        "model": convo.model,
        "created_at": convo.created_at.isoformat(),
        "updated_at": convo.updated_at.isoformat(),
    } if is_new_convo else None

    return StreamingResponse(
        _stream_full(
            db=db,
            convo=convo,
            message=message,
            authorities_raw=authorities,
            model=model,
            file_data=file_data,
            new_convo_payload=new_convo_payload,
            current_user=current_user,
            org_id=org_id,
            is_new_convo=is_new_convo,
            request=request,
            chat_mode=chat_mode,
        ),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


async def _stream_full(
    db: AsyncSession,
    convo,
    message: str | None,
    authorities_raw: str | None,
    model: str | None,
    file_data: list[tuple[str, str, bytes]],
    new_convo_payload: dict | None,
    current_user,
    org_id,
    is_new_convo: bool,
    request,
    chat_mode: str | None = None,
) -> AsyncGenerator[str, None]:
    from app.agents.prompts import get_persona
    from app.services.storage_service import storage_service

    t0 = time.perf_counter()
    logger.info(f"[Chat] ▶ stream_full start  convo={convo.id}  files={len(file_data)}  has_msg={bool(message)}")

    # ── STEP 1: Yield conversation_ready IMMEDIATELY ──────────────────────────
    # This is the first thing the frontend receives — no waiting.
    if new_convo_payload:
        yield f"data: {json.dumps({'type': 'conversation_ready', **new_convo_payload})}\n\n"
        logger.info(f"[Chat] conversation_ready sent  +{time.perf_counter()-t0:.2f}s")

    try:
        # ── STEP 2: Audit log + org notifications for new convo (fast DB writes)
        if is_new_convo and current_user:
            await log_audit(
                db, current_user.id, "CHAT_CREATED",
                resource_type="chat",
                resource_id=convo.id,
                resource_name=convo.title or "New Chat",
                ip_address=get_ip(request),
                organization_id=org_id,
            )
            if org_id:
                org_members = await db.execute(
                    select(OrganizationMember).where(
                        OrganizationMember.organization_id == org_id,
                        OrganizationMember.user_id != current_user.id,
                        OrganizationMember.status == MemberStatus.ACTIVE,
                    )
                )
                for m in org_members.scalars().all():
                    db.add(Notification(
                        user_id=m.user_id,
                        type=NotificationType.CHAT_CREATED,
                        title="New chat started",
                        body=f"{current_user.full_name or current_user.email} started a new chat",
                        resource_type="chat",
                        resource_id=str(convo.id),
                    ))

        # ── STEP 3: Update authorities / model (in-memory, instant) ──────────
        if authorities_raw:
            try:
                convo.authorities = json.loads(authorities_raw)
            except (json.JSONDecodeError, ValueError):
                pass
        if model:
            convo.model = model

        # ── STEP 4: Fast path — only what the AI needs RIGHT NOW ─────────────
        # • Native files (PDF / images): base64 encode only — instant, no I/O.
        # • Text files (DOCX / PPTX / TXT / ZIP): extract text — AI needs it in prompt.
        # Everything else (GCS upload, native-file text extraction, DB metadata
        # update with real URLs) runs in a background task after the AI starts.
        _NATIVE_EXTS = {"pdf", "png", "jpg", "jpeg"}

        if file_data:
            t_files_start = time.perf_counter()
            logger.info(f"[Chat] file processing start  count={len(file_data)}  +{t_files_start-t0:.2f}s")
            loop = asyncio.get_running_loop()

            async def _prepare_for_ai(filename: str, content_type: str, content: bytes) -> dict:
                ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"
                is_native = ext in _NATIVE_EXTS

                if is_native:
                    media_type = (
                        "application/pdf" if ext == "pdf"
                        else f"image/{'jpeg' if ext == 'jpg' else ext}"
                    )
                    return {
                        "filename":     filename,
                        "content_type": content_type,
                        "content":      content,
                        "ext":          ext,
                        "is_native":    True,
                        "extracted_text": None,
                        "zip_count":    None,
                        "native_block": {
                            "filename":   filename,
                            "media_type": media_type,
                            "data":       base64.b64encode(content).decode(),
                        },
                    }

                # Text file — extract now, AI needs it in the system prompt.
                if ext == "zip":
                    texts = await loop.run_in_executor(None, _extract_zip, content)
                    extracted_text = "\n\n".join(texts)
                    zip_count = len(texts)
                else:
                    extracted_text = await loop.run_in_executor(
                        None, document_processor.extract_text, content, ext
                    )
                    zip_count = None
                return {
                    "filename":     filename,
                    "content_type": content_type,
                    "content":      content,
                    "ext":          ext,
                    "is_native":    False,
                    "extracted_text": extracted_text,
                    "zip_count":    zip_count,
                    "native_block": None,
                }

            prepared: list[dict] = list(await asyncio.gather(*[
                _prepare_for_ai(fn, ct, raw) for fn, ct, raw in file_data
            ]))
            native_files = [p["native_block"] for p in prepared if p["native_block"]]

            logger.info(
                f"[Chat] file processing done  "
                f"text_files={sum(1 for p in prepared if not p['is_native'])}  "
                f"native_files={len(native_files)}  "
                f"+{time.perf_counter()-t0:.2f}s  (files took {time.perf_counter()-t_files_start:.2f}s)"
            )

            # Write preliminary metadata (no GCS URLs yet — background task fills them).
            metadata: dict = convo.metadata_ or {}
            existing: list[dict] = list(metadata.get("uploaded_files") or [])
            for p in prepared:
                entry: dict = {
                    "filename":       p["filename"],
                    "type":           p["ext"] if p["ext"] != "zip" else "txt",
                    "url":            "",          # filled by background task
                    "extracted_text": p["extracted_text"] or "",
                    "is_native":      p["is_native"],
                }
                if p.get("zip_count"):
                    entry["zip_count"] = p["zip_count"]
                existing.append(entry)

            metadata["uploaded_files"] = existing
            last_p = prepared[-1]
            metadata["last_uploaded_filename"] = last_p["filename"]
            metadata["last_uploaded_url"]      = ""   # filled by background task
            metadata["last_uploaded_type"]     = last_p["ext"]
            convo.active_file_id = uuid.uuid4()
            convo.metadata_ = metadata

        else:
            native_files: list[dict] = []
            prepared: list[dict] = []

        # ── STEP 4b: Auto-inject message for file-only uploads ───────────────
        # When files are uploaded with no message, inject a hidden prompt so the AI
        # streams a real response. We save an empty string to the DB so the injected
        # text never appears in the conversation history.
        _auto_injected = False
        if not message and prepared:
            message = "Please analyze the attached document(s) and provide a detailed review."
            _auto_injected = True

        # ── STEP 5: Save user message + auto-title ────────────────────────────
        if message:
            msg_filename = msg_file_url = None
            if file_data and convo.metadata_:
                filenames = [e["filename"] for e in (convo.metadata_.get("uploaded_files") or [])]
                msg_filename = ", ".join(filenames[-len(file_data):]) if filenames else None
                # URL empty for now; background task will update the metadata entry.
            await chat_service.add_message(
                db, convo.id, MessageRole.USER,
                "" if _auto_injected else message,   # hide injected prompt from history
                attached_filename=msg_filename,
                attached_url=None,
            )
        await db.commit()

        # ── STEP 5b: Background task — GCS upload + native extraction + DB ───
        # Runs concurrently while the AI is streaming. Uses its own DB session
        # so it never interferes with the main request session.
        if prepared:
            _convo_id = convo.id
            _new_active_file_id = convo.active_file_id

            async def _background_save() -> None:
                from app.db.session import AsyncSessionLocal
                from app.models.chat import Conversation as _Convo
                from sqlalchemy import select as _select

                try:
                    t_bg = time.perf_counter()
                    logger.info(f"[Chat] ⬆ background save start  convo={_convo_id}  files={len(prepared)}")

                    # Upload all files to GCS/local in parallel.
                    urls: list[str] = list(await asyncio.gather(*[
                        storage_service.upload_file(p["content"], p["filename"], p["content_type"])
                        for p in prepared
                    ]))

                    # Extract text for native files (PDF/images) for follow-up context.
                    async def _extract_native(p: dict) -> str:
                        if not p["is_native"]:
                            return p["extracted_text"] or ""
                        try:
                            return await loop.run_in_executor(
                                None, document_processor.extract_text, p["content"], p["ext"]
                            )
                        except Exception:
                            return ""

                    extracted: list[str] = list(await asyncio.gather(*[
                        _extract_native(p) for p in prepared
                    ]))

                    # Update conversation metadata with real URLs + extracted text.
                    async with AsyncSessionLocal() as bg_db:
                        result = await bg_db.execute(
                            _select(_Convo).where(_Convo.id == _convo_id)
                        )
                        bg_convo = result.scalar_one_or_none()
                        if not bg_convo:
                            return

                        bg_meta: dict = bg_convo.metadata_ or {}
                        bg_files: list[dict] = list(bg_meta.get("uploaded_files") or [])

                        # Match entries by filename + empty URL (the ones we just added).
                        for p, url, text in zip(prepared, urls, extracted):
                            for entry in reversed(bg_files):
                                if entry["filename"] == p["filename"] and entry.get("url") == "":
                                    entry["url"] = url
                                    if text:
                                        entry["extracted_text"] = text
                                    break

                        bg_meta["uploaded_files"] = bg_files
                        bg_meta["last_uploaded_url"] = urls[-1]
                        bg_convo.metadata_ = bg_meta
                        await bg_db.commit()

                    logger.info(
                        f"[Chat] ✓ background save done  convo={_convo_id}  "
                        f"took={time.perf_counter()-t_bg:.2f}s"
                    )
                except Exception as exc:
                    logger.error(f"[Chat] ✗ background save failed  convo={_convo_id}  error={exc}")

            asyncio.create_task(_background_save())

        # ── STEP 6: Truly empty submission (no message, no files) ────────────────
        if not message:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # ── STEP 7: Normalise message for downstream checks ───────────────────
        msg_lower = message.lower()

        # ── STEP 7b: Analysis detection — capture file content only, run AFTER streaming ──
        # We detect whether this is an analysis request and capture the file bytes here,
        # but we do NOT run the analysis yet. The heavy LLM call runs after the AI response
        # has fully streamed so the user sees output immediately instead of waiting 2+ min.
        _analysis_kw = {"analyze", "analysis", "gap", "audit", "evaluate", "assess"}
        is_analysis_req = bool(convo.active_file_id) and any(t in msg_lower for t in _analysis_kw)

        _analysis_content: bytes | None  = None
        _analysis_filename: str | None   = None
        _analysis_filetype: str | None   = None
        # All uploaded files for multi-doc Document Intelligence listing
        _all_uploaded_files: list[dict]  = []

        if is_analysis_req:
            if prepared:
                # Use the last prepared file as primary; collect all for multi-doc
                for _p_item in prepared:
                    if _p_item.get("content"):
                        _all_uploaded_files.append({
                            "content": _p_item["content"],
                            "filename": _p_item["filename"],
                            "filetype": _p_item["ext"],
                        })
                if _all_uploaded_files:
                    _primary = _all_uploaded_files[-1]
                    _analysis_content  = _primary["content"]
                    _analysis_filename = _primary["filename"]
                    _analysis_filetype = _primary["filetype"]
            elif convo.metadata_:
                # Try legacy raw-content hex first (set by old /upload endpoint).
                _hex = convo.metadata_.get("last_uploaded_content")
                if _hex:
                    _analysis_content  = bytes.fromhex(_hex)
                    _analysis_filename = convo.metadata_.get("last_uploaded_filename", "Document")
                    _analysis_filetype = convo.metadata_.get("last_uploaded_type", "txt")
                    _all_uploaded_files = [{"content": _analysis_content, "filename": _analysis_filename, "filetype": _analysis_filetype}]
                else:
                    # New upload path stores extracted_text per file — collect all files.
                    _uploaded_files: list[dict] = convo.metadata_.get("uploaded_files") or []
                    for _uf in _uploaded_files:
                        _text = _uf.get("extracted_text") or ""
                        if _text:
                            _all_uploaded_files.append({
                                "content": _text.encode("utf-8"),
                                "filename": _uf.get("filename", "Document"),
                                "filetype": "txt",
                            })
                    if _all_uploaded_files:
                        _primary = _all_uploaded_files[-1]
                        _analysis_content  = _primary["content"]
                        _analysis_filename = _primary["filename"]
                        _analysis_filetype = _primary["filetype"]

            if not _analysis_content:
                is_analysis_req = False  # No file content available — treat as normal chat

        # ── STEP 8: Build system prompt — RAG + doc context in parallel ───────
        from app.agents.prompts import GENERAL_MODE_SYSTEM_PROMPT, PROGRAM_MODE_NO_PROJECT_SYSTEM_PROMPT

        selected_authorities = convo.authorities or []

        # Resolve effective chat mode from param → convo field → default
        effective_mode = chat_mode or convo.chat_mode or "program"
        # Persist mode on conversation if it changed
        if effective_mode != convo.chat_mode:
            convo.chat_mode = effective_mode

        if effective_mode == "general":
            base_prompt = GENERAL_MODE_SYSTEM_PROMPT
        elif convo.project_id is None and not selected_authorities:
            base_prompt = PROGRAM_MODE_NO_PROJECT_SYSTEM_PROMPT
        else:
            base_prompt = (
                get_persona(convo.authority) or convo.system_prompt or "You are a Regulatory Intelligence Assistant."
            )

        async def _rag_context() -> str:
            # Skip RAG in general mode — not relevant for open-ended questions
            if effective_mode == "general" or not selected_authorities:
                return ""
            sources = await vector_service.search_regulatory_context(
                db, message, authority=selected_authorities, limit=3
            )
            if not sources:
                return ""
            return "\n\nREGULATORY CONTEXT:\n" + "\n".join(
                f"- {s.title} ({s.authority}): {s.content}" for s in sources
            )

        # Names of native files being sent directly to the AI this request —
        # no need to also inject their text into the system prompt.
        native_filenames_this_req = {b["filename"] for b in native_files}

        async def _doc_context() -> str:
            if not convo.active_file_id or not convo.metadata_:
                return ""
            uploaded_files: list[dict] = convo.metadata_.get("uploaded_files") or []
            if not uploaded_files:
                # Legacy single-file path
                if convo.metadata_.get("last_uploaded_content"):
                    loop = asyncio.get_running_loop()
                    file_hex = convo.metadata_["last_uploaded_content"]
                    doc_text = await loop.run_in_executor(
                        None, document_processor.extract_text,
                        bytes.fromhex(file_hex), convo.metadata_.get("last_uploaded_type", "txt")
                    )
                    zip_count = convo.metadata_.get("zip_file_count")
                    label = (
                        f"ZIP ARCHIVE ({zip_count} docs) — {convo.metadata_.get('last_uploaded_filename', 'archive.zip')}"
                        if zip_count else convo.metadata_.get("last_uploaded_filename", "document")
                    )
                    return (
                        f"\n\nCRITICAL: You have access to an uploaded document. NEVER say you cannot see files."
                        f"\n\nACTIVE DOCUMENT ({label}):\n{doc_text[:6000]}"
                    )
                return ""

            loop = asyncio.get_running_loop()
            parts: list[str] = []
            chars_per_doc = max(2000, 8000 // len(uploaded_files))

            for i, uf in enumerate(uploaded_files, 1):
                # Skip files being sent natively — AI sees them directly in the message.
                if uf["filename"] in native_filenames_this_req:
                    continue
                # Use pre-stored extracted text — no re-parsing on every request.
                text = uf.get("extracted_text") or ""
                if not text and uf.get("content_hex"):
                    # Legacy fallback for files uploaded before this refactor
                    text = await loop.run_in_executor(
                        None, document_processor.extract_text,
                        bytes.fromhex(uf["content_hex"]), uf.get("type", "txt")
                    )
                label = f"Document {i}: {uf['filename']}"
                if uf.get("zip_count"):
                    label += f" (ZIP — {uf['zip_count']} files extracted)"
                parts.append(f"=== {label} ===\n{text[:chars_per_doc]}")

            if not parts:
                return ""
            combined = "\n\n".join(parts)
            return (
                f"\n\nCRITICAL: You have access to uploaded document(s). "
                f"NEVER say you cannot see files or that no documents were provided.\n\n"
                f"UPLOADED DOCUMENTS:\n{combined}"
            )

        rag_ctx, doc_ctx = await asyncio.gather(_rag_context(), _doc_context())
        system_prompt = base_prompt
        if rag_ctx:
            system_prompt += rag_ctx
        if doc_ctx:
            system_prompt += doc_ctx

        logger.info(
            f"[Chat] context ready  "
            f"prompt_chars={len(system_prompt)}  "
            f"rag={'yes' if rag_ctx else 'no'}  "
            f"doc_ctx={'yes' if doc_ctx else 'no'}  "
            f"+{time.perf_counter()-t0:.2f}s"
        )

        # ── STEP 9: Stream AI response ─────────────────────────────────────────
        history = await chat_service.get_messages_as_dicts(db, convo.id)
        used_model = model or convo.model or settings.DEFAULT_MODEL

        t_ai_send = time.perf_counter()
        logger.info(
            f"[Chat] ➤ sending to AI  model={used_model}  "
            f"history_msgs={len(history)}  native_files={len(native_files)}  "
            f"+{t_ai_send-t0:.2f}s"
        )

        full_response = ""
        first_chunk_logged = False
        async for chunk in ai_service.stream_chat(
            history, used_model, system_prompt, max_tokens=16384, native_files=native_files or None
        ):
            if not first_chunk_logged:
                t_first = time.perf_counter()
                logger.info(
                    f"[Chat] ◀ first chunk from AI  "
                    f"TTFT={t_first-t_ai_send:.2f}s  "
                    f"total_elapsed={t_first-t0:.2f}s"
                )
                first_chunk_logged = True
            full_response += chunk
            yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"

        t_done = time.perf_counter()
        logger.info(
            f"[Chat] ■ stream complete  "
            f"response_chars={len(full_response)}  "
            f"stream_duration={t_done-t_ai_send:.2f}s  "
            f"total={t_done-t0:.2f}s"
        )

        msg = await chat_service.add_message(db, convo.id, MessageRole.ASSISTANT, full_response, model=used_model)
        await db.commit()

        yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"

        # ── Post-stream: Background Analysis ──────────────────────────────────
        if is_analysis_req and _analysis_content and current_user:
            # Run analysis in a truly background task so the SSE stream can close
            # and the frontend loader clears immediately.
            _msg_id = msg.id
            _user_id = current_user.id
            _convo_id = convo.id
            _auths = convo.authorities or ["Global"]
            _extra_files = [f for f in _all_uploaded_files if f["filename"] != _analysis_filename]

            async def _bg_analysis():
                import traceback as _tb
                from app.db.session import AsyncSessionLocal
                from app.models.chat import Conversation as _Convo
                from app.models.notification import Notification as _Notif, NotificationType as _NT
                from app.services.export_service import export_service as _exp_svc
                from sqlalchemy import select as _sel

                async with AsyncSessionLocal() as bg_db:
                    # ── 1. Run the analysis LLM call ──────────────────────────
                    try:
                        logger.info(f"[Analysis] ▶ starting  convo={_convo_id}  file={_analysis_filename}  auths={_auths}")
                        analysis_msg = await chat_service.perform_analysis_for_chat(
                            bg_db, _convo_id, _user_id,
                            _analysis_content, _analysis_filename, _analysis_filetype, _auths,
                            message_id=_msg_id
                        )
                    except Exception as e:
                        logger.error(f"[Analysis] ✗ failed  convo={_convo_id}  error={e}\n{_tb.format_exc()}")
                        return

                    if not analysis_msg or not analysis_msg.analysis_data:
                        logger.warning(f"[Analysis] no data produced  convo={_convo_id}")
                        return

                    # ── 1.5 Analyze additional uploaded files ─────────────────
                    # Creates AnalysisDocument records so they appear in Document Intelligence
                    if _extra_files:
                        from app.services.analysis_service import analysis_service as _as_svc
                        for _ef in _extra_files:
                            try:
                                await _as_svc.analyze_document_multi(
                                    bg_db, _user_id,
                                    _ef["content"], _ef["filename"], _ef["filetype"], _auths,
                                )
                                await bg_db.commit()
                                logger.info(f"[Analysis] ✓ extra doc  file={_ef['filename']}")
                            except Exception as _ef_err:
                                logger.warning(f"[Analysis] ✗ extra doc  file={_ef['filename']}  err={_ef_err}")

                    # ── 2. Auto-generate all 3 export formats ─────────────────
                    try:
                        results = await asyncio.gather(
                            _exp_svc.generate_pdf(analysis_msg.analysis_data, _analysis_filename),
                            _exp_svc.generate_docx(analysis_msg.analysis_data, _analysis_filename),
                            _exp_svc.generate_pptx(analysis_msg.analysis_data, _analysis_filename),
                            return_exceptions=True,
                        )
                        pdf_res, docx_res, pptx_res = results

                        cached: dict = {}
                        if not isinstance(pdf_res, Exception):
                            cached["pdf"] = _resolve_export_url(pdf_res)
                        else:
                            logger.warning(f"[Analysis] PDF export failed  convo={_convo_id}  error={pdf_res}")
                        if not isinstance(docx_res, Exception):
                            cached["word"] = cached["docx"] = _resolve_export_url(docx_res)
                        else:
                            logger.warning(f"[Analysis] DOCX export failed  convo={_convo_id}  error={docx_res}")
                        if not isinstance(pptx_res, Exception):
                            cached["ppt"] = cached["pptx"] = _resolve_export_url(pptx_res)
                        else:
                            logger.warning(f"[Analysis] PPTX export failed  convo={_convo_id}  error={pptx_res}")

                        if cached:
                            res = await bg_db.execute(_sel(_Convo).where(_Convo.id == _convo_id))
                            bg_convo = res.scalar_one_or_none()
                            if bg_convo:
                                meta = dict(bg_convo.metadata_ or {})
                                meta["cached_exports"] = cached
                                bg_convo.metadata_ = meta

                            # Notify the user that documents are ready
                            fmt_list = " + ".join(k.upper() for k in ["pdf", "word", "ppt"] if k in cached)
                            bg_db.add(_Notif(
                                user_id=_user_id,
                                type=_NT.EXPORT_READY,
                                title="Your documents are ready",
                                body=f"{fmt_list} reports for \"{_analysis_filename}\" are ready to download.",
                                resource_type="conversation",
                                resource_id=str(_convo_id),
                            ))
                            await bg_db.commit()
                            logger.info(f"[Analysis] ✓ exports cached + notification sent  convo={_convo_id}  formats={list(cached)}")
                        else:
                            logger.error(f"[Analysis] ✗ all export formats failed  convo={_convo_id}")
                    except Exception as e:
                        logger.error(f"[Analysis] ✗ export generation error  convo={_convo_id}  error={e}\n{_tb.format_exc()}")

            asyncio.create_task(_bg_analysis())

        # Generate AI title for new conversations after the response is committed.
        if is_new_convo and message:
            try:
                ai_title = await ai_service.generate_title(message, full_response[:200])
                if ai_title:
                    convo_id_for_title = convo.id
                    await db.execute(
                        update(ConversationModel)
                        .where(ConversationModel.id == convo_id_for_title)
                        .values(title=ai_title)
                    )
                    await db.commit()
                    yield f"data: {json.dumps({'type': 'title_update', 'id': str(convo_id_for_title), 'content': ai_title})}\n\n"
                    logger.info(f"[Chat] title_update  convo={convo_id_for_title}  title={ai_title!r}")
            except Exception as exc:
                logger.warning(f"[Chat] title generation failed  convo={convo.id}  error={exc}")

        return

    except Exception as e:
        # ── Always save an error assistant message so the conversation turn is complete.
        # The frontend will render this inside the chat bubble, not as a toast.
        error_content = "I encountered an error processing your request. Please try again."
        try:
            err_msg = await chat_service.add_message(db, convo.id, MessageRole.ASSISTANT, error_content)
            await db.commit()
            yield f"data: {json.dumps({'type': 'delta', 'content': error_content})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(err_msg.id)})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = 1,
    page_size: int = 50,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    page_size = min(page_size, 500)
    return await chat_service.get_conversations(db, user_id, org_id, page=page, page_size=page_size)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        user_result = await db.execute(select(User).limit(1))
        current_user = user_result.scalar_one_or_none()
        if not current_user:
            raise HTTPException(status_code=500, detail="No users found in database.")

    convo = await chat_service.create_conversation(db, current_user.id, data)
    convo.organization_id = current_user.organization_id
    await log_audit(
        db, current_user.id, "CHAT_CREATED",
        resource_type="chat",
        resource_id=convo.id,
        resource_name=convo.title or "New Chat",
        organization_id=current_user.organization_id,
    )
    return convo


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    data: ConversationUpdate,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    updated = await chat_service.update_conversation(db, convo, data)
    await db.commit()
    await db.refresh(updated)
    return updated


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    request: Request,
    conversation_id: uuid.UUID,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Delete permission: creator or org owner only
    if current_user and convo.user_id != current_user.id and org_id:
        owner_check = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.user_id == current_user.id,
                OrganizationMember.organization_id == org_id,
            )
        )
        member = owner_check.scalar_one_or_none()
        if not member or member.role != MemberRole.OWNER:
            raise HTTPException(status_code=403, detail="Only the chat creator or organization owner can delete this chat")

    convo_title = convo.title or "Untitled Chat"
    convo_id = convo.id
    await chat_service.delete_conversation(db, convo)
    await log_audit(
        db, user_id, "CHAT_DELETED",
        resource_type="chat",
        resource_id=convo_id,
        resource_name=convo_title,
        ip_address=get_ip(request),
        organization_id=org_id,
    )
    if org_id and current_user:
        org_members = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id != current_user.id,
                OrganizationMember.status == MemberStatus.ACTIVE,
            )
        )
        for m in org_members.scalars().all():
            db.add(Notification(
                user_id=m.user_id,
                type=NotificationType.CHAT_DELETED,
                title="Chat deleted",
                body=f"{current_user.full_name or current_user.email} deleted chat \"{convo_title}\"",
                resource_type="chat",
                resource_id=str(convo_id),
            ))


class _BulkDeleteBody(BaseModel):
    ids: list[uuid.UUID]


@router.post("/conversations/bulk-delete")
async def bulk_delete_conversations(
    request: Request,
    data: _BulkDeleteBody,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple conversations in a single request."""
    if not data.ids:
        return {"deleted": 0, "skipped": 0}

    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None

    is_org_owner = False
    if org_id and current_user:
        owner_res = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.user_id == current_user.id,
                OrganizationMember.organization_id == org_id,
            )
        )
        member = owner_res.scalar_one_or_none()
        is_org_owner = member is not None and member.role == MemberRole.OWNER

    if org_id:
        stmt = select(ConversationModel).where(
            ConversationModel.id.in_(data.ids),
            ConversationModel.organization_id == org_id,
        )
    else:
        stmt = select(ConversationModel).where(
            ConversationModel.id.in_(data.ids),
            ConversationModel.user_id == user_id,
        )

    result = await db.execute(stmt)
    convos = result.scalars().all()

    deleted = skipped = 0
    for convo in convos:
        if convo.user_id == user_id or is_org_owner:
            await chat_service.delete_conversation(db, convo)
            deleted += 1
        else:
            skipped += 1

    if deleted:
        await log_audit(
            db, user_id, "CHAT_BULK_DELETED",
            resource_type="chat",
            resource_name=f"{deleted} conversations",
            ip_address=get_ip(request),
            organization_id=org_id,
        )

    await db.commit()
    return {"deleted": deleted, "skipped": skipped}


@router.get("/messages/{message_id}/export")
async def export_message_analysis(
    message_id: uuid.UUID,
    format: str = "pdf",
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_user_or_none),
):
    """Export an analysis message to PDF/Word/PPT.

    Returns cached URL immediately if the background job already generated it.
    Returns 202 when analysis is still running so the frontend can show a
    "you'll be notified" message instead of a generic error.
    """
    from app.models.chat import Message, Conversation
    msg = await db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    convo = await db.get(Conversation, msg.conversation_id)

    # ── Fast path: return cached export URL if available ─────────────────────
    if convo:
        cached = (convo.metadata_ or {}).get("cached_exports", {})
        # Normalise format aliases → canonical cache key
        if format in ["word", "docx"]:
            cache_key = "word" if "word" in cached else "docx"
        elif format in ["ppt", "pptx"]:
            cache_key = "ppt" if "ppt" in cached else "pptx"
        else:
            cache_key = format
        if cached.get(cache_key):
            return {"url": cached[cache_key]}

    # ── Locate analysis data ──────────────────────────────────────────────────
    analysis_msg = msg if (msg.is_analysis and msg.analysis_data) else None
    if not analysis_msg:
        res = await db.execute(
            select(Message)
            .where(Message.conversation_id == msg.conversation_id, Message.is_analysis == True)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        analysis_msg = res.scalar_one_or_none()

    if not analysis_msg or not analysis_msg.analysis_data:
        # Analysis not ready yet — tell the frontend gracefully
        raise HTTPException(
            status_code=202,
            detail="Your documents are being prepared. You'll receive a notification when they're ready.",
        )

    # ── On-demand generation (cache miss, analysis exists) ────────────────────
    from app.services.export_service import export_service
    filename = (convo.metadata_ or {}).get("last_uploaded_filename", "Document") if convo else "Document"

    try:
        if format == "pdf":
            url = await export_service.generate_pdf(analysis_msg.analysis_data, filename)
        elif format in ["word", "docx"]:
            url = await export_service.generate_docx(analysis_msg.analysis_data, filename)
        elif format in ["ppt", "pptx"]:
            url = await export_service.generate_pptx(analysis_msg.analysis_data, filename)
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use pdf, word, or ppt.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export failed  format={format}  msg={message_id}  error={e}")
        raise HTTPException(status_code=500, detail="Export generation failed. Please try again.")

    abs_url = _resolve_export_url(url)

    # Cache the result so subsequent requests are instant
    if convo:
        meta = dict(convo.metadata_ or {})
        cached = dict(meta.get("cached_exports", {}))
        cached[format] = abs_url
        # Store both aliases so either key works
        if format == "word":
            cached["docx"] = abs_url
        elif format == "docx":
            cached["word"] = abs_url
        elif format == "ppt":
            cached["pptx"] = abs_url
        elif format == "pptx":
            cached["ppt"] = abs_url
        meta["cached_exports"] = cached
        convo.metadata_ = meta
        await db.commit()

    return {"url": abs_url}


@router.get("/conversations/{conversation_id}/insights")
async def get_conversation_insights(
    conversation_id: uuid.UUID,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated insight counts from all analysis messages in a conversation."""
    from app.models.chat import Message as _Msg
    user_id = await _get_user_id_fallback(db, current_user)

    convo = await db.get(ConversationModel, conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    stmt = select(_Msg).where(
        _Msg.conversation_id == conversation_id,
        _Msg.is_analysis == True,
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    guidelines = differences = risk_areas = recommendations = 0
    for msg in messages:
        data = msg.analysis_data or {}
        for auth in data.values():
            if not isinstance(auth, dict):
                continue
            guidelines     += len(auth.get("insights", []))
            differences    += len(auth.get("gaps", []))
            risk_areas     += len(auth.get("risks", []))
            recommendations += len(auth.get("actions", []))

    return {
        "guidelines": guidelines,
        "differences": differences,
        "riskAreas": risk_areas,
        "recommendations": recommendations,
    }


@router.patch("/conversations/{conversation_id}/authorities", response_model=ConversationResponse)
async def update_authorities(
    conversation_id: uuid.UUID,
    authorities: list[str],
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Update the active regulatory authorities for a conversation."""
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    convo.authorities = authorities
    await db.commit()
    await db.refresh(convo)
    return convo


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Receive an audio blob, send to Whisper, return English transcript."""
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    audio_buf = io.BytesIO(content)
    # Whisper requires a filename with a supported extension to infer format
    filename = audio.filename or "audio.webm"
    audio_buf.name = filename

    try:
        # translations always returns English regardless of source language
        response = await client.audio.translations.create(
            model="whisper-1",
            file=(filename, audio_buf, audio.content_type or "audio/webm"),
        )
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")


@router.post("/conversations/{conversation_id}/upload")
async def upload_file_to_chat(
    conversation_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to a conversation for regulatory analysis."""
    user_id = await _get_user_id_fallback(db, current_user)
    org_id = current_user.organization_id if current_user else None
    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    content = await file.read()
    file_extension = file.filename.split(".")[-1].lower()

    from app.services.storage_service import storage_service

    try:
        file_url = await storage_service.upload_file(content, file.filename, file.content_type)
    except (RuntimeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Storage Error: {str(e)}"
        )

    # Store file metadata in conversation
    convo.active_file_id = uuid.uuid4()
    convo.metadata_ = convo.metadata_ or {}
    convo.metadata_["last_uploaded_filename"] = file.filename
    convo.metadata_["last_uploaded_url"] = file_url
    convo.metadata_["last_uploaded_type"] = file_extension
    convo.metadata_["last_uploaded_content"] = content.hex()
    await db.commit()

    # Trigger analysis if authorities are selected
    if convo.authorities:
        msg = await chat_service.perform_analysis_for_chat(
            db, conversation_id, current_user.id, content, file.filename, file_extension, convo.authorities
        )
        return MessageResponse.model_validate(msg)

    return {"message": f"File '{file.filename}' uploaded. Select authorities to begin analysis."}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    data: ChatRequest,
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        user_result = await db.execute(select(User).limit(1))
        current_user = user_result.scalar_one_or_none()

    user_id = current_user.id if current_user else None
    org_id = current_user.organization_id if current_user else None

    convo = await chat_service.get_conversation(db, conversation_id, user_id, org_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await chat_service.add_message(db, conversation_id, MessageRole.USER, data.message)

    if not convo.title:
        title = await chat_service.auto_title_conversation(convo, data.message)
        convo.title = title

    model = data.model or convo.model or settings.DEFAULT_MODEL
    history = await chat_service.get_messages_as_dicts(db, conversation_id)

    from app.agents.prompts import get_persona

    system_prompt = (
        get_persona(convo.authority) or convo.system_prompt or "You are a Regulatory Intelligence Assistant."
    )

    # 1. RAG Context Injection
    selected_authorities = convo.authorities or []
    context_text = ""
    if selected_authorities:
        # Search knowledge base for relevant context based on user query
        context_sources = await vector_service.search_regulatory_context(
            db, data.message, authority=selected_authorities, limit=3
        )
        if context_sources:
            context_text = "\n\nREGULATORY CONTEXT:\n" + "\n".join(
                [f"- {s.title} ({s.authority}): {s.content}" for s in context_sources]
            )

    # 2. Document Awareness
    document_context = ""
    if convo.active_file_id and convo.metadata_:
        filename = convo.metadata_.get("last_uploaded_filename")
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            file_content = bytes.fromhex(file_hex)
            file_type = convo.metadata_.get("last_uploaded_type", "txt")
            doc_text = document_processor.extract_text(file_content, file_type)
            document_context = f"\n\nACTIVE DOCUMENT ({filename}):\n{doc_text[:5000]}"

    if document_context:
        prompt_warning = (
            "\n\nCRITICAL: You have access to an uploaded document. "
            "If the user asks about 'this document' or 'the file', "
            "they are referring to the content below. NEVER say you cannot see files.\n"
        )
        system_prompt += f"{prompt_warning}{document_context}"

    if context_text:
        system_prompt += (
            f"\n\nUse the following regulatory knowledge to help answer the user's question:\n{context_text}"
        )

    # 3. Detect Analysis Request
    analysis_triggers = [
        "analyze",
        "analysis",
        "gap",
        "audit",
        "this document",
        "the document",
        "thoughts",
        "review",
        "check",
        "evaluate",
        "assess",
        "is this okay",
    ]
    is_analysis_request = any(word in data.message.lower() for word in analysis_triggers)

    # 4. Detect Export Requests
    export_triggers = [
        "pdf",
        "docx",
        "word",
        "pptx",
        "ppt",
        "powerpoint",
        "presentation",
        "export",
        "download",
        "convert",
        "doc",
        "docs",
    ]
    msg_lower = data.message.lower()
    is_export_request = any(word in msg_lower for word in export_triggers)

    # Use 'Global' if no authorities selected
    effective_authorities = selected_authorities or ["Global"]

    # HANDLE ANALYSIS COMMAND
    if is_analysis_request and convo.active_file_id:
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            msg = await chat_service.perform_analysis_for_chat(
                db,
                conversation_id,
                user_id,
                bytes.fromhex(file_hex),
                (convo.metadata_ or {}).get("last_uploaded_filename", "Document"),
                convo.metadata_.get("last_uploaded_type", "txt"),
                effective_authorities,
            )
            return StreamingResponse(
                _stream_analysis(msg),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

    # HANDLE EXPORT COMMAND
    if is_export_request and convo.active_file_id:
        last_analysis_msg = next((m for m in reversed(convo.messages) if m.is_analysis), None)
        if last_analysis_msg:
            from app.services.export_service import export_service

            filename = convo.metadata_.get("last_uploaded_filename", "Document")

            try:
                if "pdf" in msg_lower:
                    url, file_type_label = (
                        await export_service.generate_pdf(last_analysis_msg.analysis_data, filename),
                        "PDF",
                    )
                elif any(w in msg_lower for w in ["word", "docx", "doc", "docs"]):
                    url, file_type_label = (
                        await export_service.generate_docx(last_analysis_msg.analysis_data, filename),
                        "Word",
                    )
                elif any(w in msg_lower for w in ["ppt", "pptx", "power", "presentation"]):
                    url, file_type_label = (
                        await export_service.generate_pptx(last_analysis_msg.analysis_data, filename),
                        "PowerPoint",
                    )
            except (RuntimeError, ValueError) as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Export/Storage Error: {str(e)}"
                )

            if url:
                ext = "pdf" if file_type_label == "PDF" else ("docx" if file_type_label == "Word" else "pptx")
                display_name = f"Regulatory Analysis Report.{ext}"
                abs_url = _resolve_export_url(url)
                response_text = (
                    f"✅ **{file_type_label} Generated Successfully.**\n\n"
                    f"[{display_name}]({abs_url})"
                )
                await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, response_text)
                await db.commit()
                if data.stream:

                    async def _stream_export_simple():
                        yield f"data: {json.dumps({'type': 'delta', 'content': response_text})}\n\n"
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"

                    return StreamingResponse(
                        _stream_export_simple(),
                        media_type="text/event-stream",
                        headers={
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                            "X-Accel-Buffering": "no",
                        },
                    )
                return MessageResponse(
                    id=uuid.uuid4(),
                    conversation_id=conversation_id,
                    role=MessageRole.ASSISTANT,
                    content=response_text,
                    created_at=datetime.utcnow(),
                )

    if data.stream:
        return StreamingResponse(
            _stream_response(db, convo.id, history, model, system_prompt),
            media_type="text/event-stream",
            headers={
                "X-Conversation-Id": str(conversation_id),
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    full_response = ""
    async for chunk in ai_service.stream_chat(history, model, system_prompt):
        full_response += chunk

    msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
    return MessageResponse.model_validate(msg)


async def _stream_response(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    history: list[dict],
    model: str,
    system_prompt: str | None,
) -> AsyncGenerator[str, None]:
    full_response = ""
    try:
        async for chunk in ai_service.stream_chat(history, model, system_prompt):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"

        msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
        await db.commit()
        yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


async def _stream_analysis(msg) -> AsyncGenerator[str, None]:
    analysis_payload = {
        "type": "analysis",
        "content": msg.content,
        "data": msg.analysis_data,
        "message_id": str(msg.id),
    }
    yield f"data: {json.dumps(analysis_payload)}\n\n"
    yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        from app.services.auth_service import auth_service

        current_user = await auth_service.get_current_user(db, token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                user_message = payload.get("message")
                model = payload.get("model") or convo.model or settings.DEFAULT_MODEL
            except json.JSONDecodeError:
                user_message = data
                model = convo.model or settings.DEFAULT_MODEL

            if not user_message:
                continue

            await chat_service.add_message(db, conversation_id, MessageRole.USER, user_message)

            from app.agents.prompts import get_persona

            system_prompt = get_persona(convo.authority) or convo.system_prompt

            history = await chat_service.get_messages_as_dicts(db, conversation_id)

            full_response = ""
            async for chunk in ai_service.stream_chat(history, model, system_prompt):
                full_response += chunk
                await websocket.send_text(json.dumps({"type": "delta", "content": chunk}))

            if full_response:
                msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
                await db.commit()
                await websocket.send_text(json.dumps({"type": "done", "message_id": str(msg.id)}))

    except WebSocketDisconnect:
        pass


def _extract_zip(content: bytes) -> list[str]:
    """Extract text from all supported documents inside a ZIP archive."""
    supported = {"pdf", "docx", "doc", "txt", "pptx"}
    results: list[str] = []
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            for name in zf.namelist():
                if name.endswith("/") or name.startswith("__"):
                    continue
                ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
                if ext not in supported:
                    continue
                try:
                    data = zf.read(name)
                    text = document_processor.extract_text(data, ext)
                    if text.strip():
                        results.append(f"=== {name} ===\n{text[:4000]}")
                except Exception:
                    pass
    except Exception:
        pass
    return results


async def _get_user_id_fallback(db: AsyncSession, user: Optional[User]) -> uuid.UUID:
    if user:
        return user.id
    user_result = await db.execute(select(User).limit(1))
    mock_user = user_result.scalar_one_or_none()
    if not mock_user:
        raise HTTPException(status_code=500, detail="No users found in database.")
    return mock_user.id
