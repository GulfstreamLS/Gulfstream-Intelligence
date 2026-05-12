import uuid as _uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1._audit import get_ip, log_audit
from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.notification import Notification, NotificationType
from app.models.organization import (
    Invitation,
    MemberRole,
    MemberStatus,
    Organization,
    OrganizationMember,
)
from app.models.user import User
from app.services import email_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class OrgResponse(BaseModel):
    id: _uuid.UUID
    name: str
    slug: str
    org_email: str | None
    owner_id: _uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}


class OrgUpdate(BaseModel):
    name: str | None = None
    org_email: str | None = None


class MemberResponse(BaseModel):
    id: _uuid.UUID
    user_id: _uuid.UUID
    email: str
    full_name: str | None
    role: str
    status: str
    joined_at: datetime
    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None


class InviteResponse(BaseModel):
    id: _uuid.UUID
    email: str
    invited_at: datetime
    expires_at: datetime
    model_config = {"from_attributes": True}


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _require_owner(current_user: User, db: AsyncSession) -> tuple[Organization, OrganizationMember]:
    if not current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not part of an organization")
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    member_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.organization_id == org.id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role != MemberRole.OWNER:
        raise HTTPException(status_code=403, detail="Only the organization owner can perform this action")
    return org, member


async def _notify_org_members(db: AsyncSession, org_id: _uuid.UUID, exclude_user_id: _uuid.UUID, notif_type: str, title: str, body: str, resource_type: str, resource_id: str):
    members_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id != exclude_user_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
        )
    )
    for m in members_result.scalars().all():
        db.add(Notification(
            user_id=m.user_id,
            type=notif_type,
            title=title,
            body=body,
            resource_type=resource_type,
            resource_id=resource_id,
        ))


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=OrgResponse)
async def get_my_org(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="Not part of an organization")
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/me", response_model=OrgResponse)
async def update_my_org(
    request: Request,
    data: OrgUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)
    if data.name is not None:
        org.name = data.name
    if data.org_email is not None:
        org.org_email = data.org_email
    await log_audit(db, current_user.id, "ORG_UPDATED", resource_type="organization", resource_id=str(org.id), resource_name=org.name, ip_address=get_ip(request), organization_id=org.id)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/me/members", response_model=list[MemberResponse])
async def list_members(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org, _ = await _require_owner(current_user, db)
    result = await db.execute(
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == org.id)
    )
    rows = result.all()
    return [
        MemberResponse(
            id=m.id,
            user_id=m.user_id,
            email=u.email,
            full_name=u.full_name,
            role=m.role,
            status=m.status,
            joined_at=m.created_at,
        )
        for m, u in rows
    ]


@router.post("/me/invites", status_code=status.HTTP_201_CREATED)
async def invite_member(
    request: Request,
    data: InviteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)

    # Block if email already has an account
    existing_user = await db.execute(select(User).where(User.email == data.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email already has an account and cannot be invited.")

    # Block if pending invite exists
    existing_invite = await db.execute(
        select(Invitation).where(
            Invitation.organization_id == org.id,
            Invitation.email == data.email,
            Invitation.accepted_at.is_(None),
            Invitation.expires_at > datetime.now(UTC),
        )
    )
    if existing_invite.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An invite is already pending for this email.")

    invite = Invitation(
        organization_id=org.id,
        email=data.email,
        invited_by=current_user.id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    db.add(invite)
    await db.flush()

    frontend_base = "https://gulfstream-frontend-y7fj7rtwsa-uc.a.run.app"
    try:
        from app.core.config import settings as _s
        frontend_base = getattr(_s, "FRONTEND_URL", frontend_base)
    except Exception:
        pass

    invite_url = f"{frontend_base}/invite/{invite.token}"
    inviter_name = current_user.full_name or current_user.email

    try:
        email_service.send_invite_email(data.email, org.name, inviter_name, invite_url)
    except Exception:
        pass

    await log_audit(db, current_user.id, "MEMBER_INVITED", resource_type="organization", resource_id=str(org.id), resource_name=org.name, ip_address=get_ip(request), organization_id=org.id, details={"invited_email": data.email})
    await db.commit()
    return {"message": f"Invite sent to {data.email}", "invite_id": str(invite.id)}


@router.delete("/me/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invite(
    invite_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)
    invite = await db.get(Invitation, invite_id)
    if not invite or invite.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Invite not found")
    await db.delete(invite)
    await db.commit()


@router.patch("/me/members/{user_id}", response_model=MemberResponse)
async def update_member_role(
    user_id: _uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)

    new_role = data.get("role")
    if new_role not in (MemberRole.OWNER, MemberRole.MEMBER):
        raise HTTPException(status_code=400, detail="Role must be 'owner' or 'member'")

    target_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == org.id,
        )
    )
    target_member = target_result.scalar_one_or_none()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    if new_role == MemberRole.OWNER:
        # Demote current owner to member first
        current_member_result = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.user_id == current_user.id,
                OrganizationMember.organization_id == org.id,
            )
        )
        current_member = current_member_result.scalar_one_or_none()
        if current_member:
            current_member.role = MemberRole.MEMBER
        org.owner_id = user_id

    target_member.role = new_role

    target_user = await db.get(User, user_id)
    await log_audit(db, current_user.id, "ROLE_CHANGED", resource_type="organization_member", resource_id=str(user_id), resource_name=target_user.email if target_user else str(user_id), organization_id=org.id, details={"new_role": new_role})
    await db.commit()
    await db.refresh(target_member)

    return MemberResponse(
        id=target_member.id,
        user_id=target_member.user_id,
        email=target_user.email if target_user else "",
        full_name=target_user.full_name if target_user else None,
        role=target_member.role,
        status=target_member.status,
        joined_at=target_member.created_at,
    )


@router.delete("/me/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user_id: _uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Transfer ownership first.")

    target_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == org.id,
        )
    )
    target_member = target_result.scalar_one_or_none()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    target_user = await db.get(User, user_id)
    if target_user:
        target_user.organization_id = None
        target_user.account_type = "solo"
        db.add(Notification(
            user_id=user_id,
            type=NotificationType.MEMBER_REMOVED,
            title="Removed from organization",
            body=f"You have been removed from {org.name}",
            resource_type="organization",
            resource_id=str(org.id),
        ))

    await db.delete(target_member)
    await log_audit(db, current_user.id, "MEMBER_REMOVED", resource_type="organization_member", resource_id=str(user_id), resource_name=target_user.email if target_user else str(user_id), organization_id=org.id)
    await db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    request: Request,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org, _ = await _require_owner(current_user, db)
    confirm_name = data.get("confirm_name", "")
    if confirm_name != org.name:
        raise HTTPException(status_code=400, detail="Organization name does not match. Deletion cancelled.")

    # Revert all members to solo
    members_result = await db.execute(
        select(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == org.id)
    )
    for member, u in members_result.all():
        u.organization_id = None
        u.account_type = "solo"

    await log_audit(db, current_user.id, "ORG_DELETED", resource_type="organization", resource_id=str(org.id), resource_name=org.name, ip_address=get_ip(request))
    await db.delete(org)
    await db.commit()
