import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.logging import get_logger
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import email_service

logger = get_logger(__name__)

router = APIRouter(prefix="/support", tags=["support"])

MAX_FILES = 5
MAX_TOTAL_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".csv", ".txt", ".log", ".zip",
}


@router.post("", status_code=status.HTTP_200_OK)
async def submit_support_request(
    subject: str = Form(..., min_length=1, max_length=200),
    message: str = Form(..., min_length=1, max_length=5000),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
):
    subject = subject.strip()
    message = message.strip()
    if not subject or not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject and message are required.",
        )

    attachments: list[email_service.Attachment] = []
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can attach at most {MAX_FILES} files.",
        )

    total_bytes = 0
    for upload in files:
        if not upload.filename:
            continue
        ext = os.path.splitext(upload.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {upload.filename}",
            )
        content = await upload.read()
        total_bytes += len(content)
        if total_bytes > MAX_TOTAL_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attachments exceed the 10 MB total limit.",
            )
        attachments.append(
            (upload.filename, content, upload.content_type or "application/octet-stream")
        )

    try:
        email_service.send_support_request(
            name=current_user.full_name or current_user.email,
            email=current_user.email,
            subject=subject,
            message=message,
            attachments=attachments,
        )
    except Exception:
        logger.exception("support_request_failed", user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We couldn't send your request right now. Please try again shortly.",
        )
    return {"message": "Thanks for reaching out — our support team will get back to you soon."}
