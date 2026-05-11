import uuid as _uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


def get_ip(request: Request) -> str | None:
    """Extract client IP, respecting X-Forwarded-For set by Cloud Run / load balancers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def log_audit(
    db: AsyncSession,
    user_id: _uuid.UUID,
    action: str,
    resource_type: str | None = None,
    resource_id: _uuid.UUID | str | None = None,
    resource_name: str | None = None,
    ip_address: str | None = None,
    organization_id: _uuid.UUID | None = None,
    details: dict | None = None,
) -> None:
    db.add(AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        resource_name=resource_name,
        ip_address=ip_address,
        organization_id=organization_id,
        details=details,
    ))
