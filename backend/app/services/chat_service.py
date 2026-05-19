import uuid
from collections.abc import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.chat import Conversation, Message, MessageRole
from app.schemas.chat import ConversationCreate, ConversationUpdate

logger = get_logger(__name__)


class ChatService:
    async def get_conversations(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        organization_id: uuid.UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict:
        if organization_id:
            q = select(Conversation).where(
                Conversation.organization_id == organization_id,
                Conversation.is_temporary == False,  # noqa: E712
            )
        else:
            q = select(Conversation).where(
                Conversation.user_id == user_id,
                Conversation.is_temporary == False,  # noqa: E712
            )

        from sqlalchemy import func as _func
        count_result = await db.execute(select(_func.count()).select_from(q.subquery()))
        total = count_result.scalar_one()

        offset = (page - 1) * page_size
        result = await db.execute(
            q.options(selectinload(Conversation.messages), selectinload(Conversation.project), selectinload(Conversation.user))
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(result.scalars().all())
        return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": max(1, -(-total // page_size))}

    async def get_conversation(
        self, db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID, organization_id: uuid.UUID | None = None
    ) -> Conversation | None:
        _opts = [selectinload(Conversation.messages), selectinload(Conversation.project), selectinload(Conversation.user)]
        if organization_id:
            result = await db.execute(
                select(Conversation)
                .options(*_opts)
                .where(Conversation.id == conversation_id, Conversation.organization_id == organization_id)
            )
        else:
            result = await db.execute(
                select(Conversation)
                .options(*_opts)
                .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
            )
        return result.scalar_one_or_none()

    async def create_conversation(self, db: AsyncSession, user_id: uuid.UUID, data: ConversationCreate) -> Conversation:
        convo = Conversation(user_id=user_id, **data.model_dump())
        convo.messages = []  # Prevent SQLAlchemy lazy-load greenlet error
        db.add(convo)
        await db.flush()
        return convo

    async def update_conversation(
        self, db: AsyncSession, conversation: Conversation, data: ConversationUpdate
    ) -> Conversation:
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "metadata":
                if value is not None:
                    current_meta = dict(conversation.metadata_ or {})
                    current_meta.update(value)
                    conversation.metadata_ = current_meta
            else:
                setattr(conversation, field, value)
        await db.flush()

        # Propagate project_id & organization_id to associated analysis documents if updated
        if "project_id" in data.model_dump(exclude_unset=True):
            from app.models.regulatory import AnalysisDocument
            from sqlalchemy import update as sa_update
            
            project_id = getattr(conversation, "project_id")
            await db.execute(
                sa_update(AnalysisDocument)
                .where(AnalysisDocument.conversation_id == conversation.id)
                .values(project_id=project_id, organization_id=conversation.organization_id)
            )
            await db.flush()

        return conversation

    async def delete_conversation(self, db: AsyncSession, conversation: Conversation) -> None:
        await db.delete(conversation)

    async def add_message(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        role: MessageRole,
        content: str,
        token_count: int | None = None,
        is_analysis: bool = False,
        analysis_data: dict | None = None,
        attached_filename: str | None = None,
        attached_url: str | None = None,
        model: str | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            token_count=token_count,
            is_analysis=is_analysis,
            analysis_data=analysis_data,
            attached_filename=attached_filename,
            attached_url=attached_url,
            model=model,
        )

        db.add(msg)
        await db.flush()
        return msg

    async def get_messages_as_dicts(self, db: AsyncSession, conversation_id: uuid.UUID, limit: int = 20) -> list[dict]:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        history: list[dict] = []
        for m in messages:
            if str(m.role) == MessageRole.SYSTEM.value:
                continue
            item = {"role": str(m.role), "content": m.content}
            if m.attached_filename:
                item["attached_filename"] = m.attached_filename
            if m.attached_url:
                item["attached_url"] = m.attached_url
            history.append(item)
        return history

    async def auto_title_conversation(self, conversation: "Conversation", first_message: str) -> str:
        return first_message[:80].rstrip() + ("..." if len(first_message) > 80 else "")

    async def process_chat_message(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        message_content: str,
    ) -> AsyncGenerator[str, None]:
        from app.agents.prompts import get_persona  # noqa: F811
        from app.services.ai_service import ai_service

        convo = await self.get_conversation(db, conversation_id, user_id)
        if not convo:
            raise ValueError("Conversation not found")

        await self.add_message(db, conversation_id, MessageRole.USER, message_content)
        await db.commit()

        history = await self.get_messages_as_dicts(db, conversation_id)

        # 1. System prompt — mode-aware
        from app.agents.prompts import (
            GENERAL_MODE_SYSTEM_PROMPT,
            PROGRAM_MODE_NO_PROJECT_SYSTEM_PROMPT,
        )
        effective_mode = convo.chat_mode or "program"
        selected_authorities = convo.authorities or []

        if effective_mode == "general":
            system_prompt = GENERAL_MODE_SYSTEM_PROMPT
        elif convo.project_id is None and not selected_authorities:
            system_prompt = PROGRAM_MODE_NO_PROJECT_SYSTEM_PROMPT
        else:
            system_prompt = get_persona(convo.authority) or "You are a Regulatory Intelligence Assistant."

        # 2. RAG — skipped in general mode
        context_text = ""
        if effective_mode != "general" and selected_authorities:
            from app.services.vector_service import vector_service

            context_sources = await vector_service.search_regulatory_context(
                db, message_content, authority=selected_authorities, limit=3
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
                from app.services.document_processor import document_processor

                doc_text = document_processor.extract_text(file_content, file_type)
                document_context = f"\n\nACTIVE DOCUMENT ({filename}):\n{doc_text[:5000]}"  # Limit context size

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
        is_analysis_request = any(word in message_content.lower() for word in analysis_triggers)
        if is_analysis_request and convo.active_file_id and selected_authorities:
            # If they ask for analysis, we return the structured analysis message
            file_hex = convo.metadata_.get("last_uploaded_content")
            if file_hex:
                await self.perform_analysis_for_chat(
                    db,
                    conversation_id,
                    user_id,
                    bytes.fromhex(file_hex),
                    convo.metadata_.get("last_uploaded_filename", "Document"),
                    convo.metadata_.get("last_uploaded_type", "txt"),
                    selected_authorities,
                )
                yield (
                    "I have completed the regulatory analysis. "
                    "You can see the structured results in the bubble above."
                )
                return

        full_response = ""

        async for chunk in ai_service.stream_chat(
            messages=history,
            model=convo.model,
            system_prompt=system_prompt,
        ):
            full_response += chunk
            yield chunk

        if full_response:
            await self.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
            await db.commit()

    async def perform_analysis_for_chat(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        file_content: bytes,
        filename: str,
        file_type: str,
        authorities: list[str],
        message_id: uuid.UUID | None = None
    ) -> Message:
        """Analyze document and save results to a chat message.
        
        If message_id is provided, it updates that existing message with analysis_data
        instead of creating a new one.
        """
        from app.services.analysis_service import analysis_service

        convo = await db.get(Conversation, conversation_id)
        results = await analysis_service.analyze_document_multi(
            db,
            user_id,
            file_content,
            filename,
            file_type,
            authorities,
            conversation_id=conversation_id,
            project_id=convo.project_id if convo else None,
            organization_id=convo.organization_id if convo else None,
        )

        # Convert results to dict for JSON storage
        analysis_dict = {auth: analysis.model_dump() for auth, analysis in results.items()}

        if message_id:
            msg = await db.get(Message, message_id)
            if msg:
                msg.is_analysis = True
                msg.analysis_data = analysis_dict
                await db.commit()
                await db.refresh(msg)
                return msg

        # Fallback: create a summary for the chat bubble if no message_id provided
        summary = f"I have analyzed the document against {', '.join(authorities)}.\n"
        for auth, analysis in results.items():
            summary += f"\n**{auth} Summary:** {analysis.summary[:200]}..."

        msg = await self.add_message(
            db, conversation_id, MessageRole.ASSISTANT, summary, is_analysis=True, analysis_data=analysis_dict
        )
        await db.commit()
        return msg


chat_service = ChatService()
