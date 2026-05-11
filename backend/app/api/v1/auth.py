import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1._audit import get_ip, log_audit
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.audit_log import AuditLog
from app.models.organization import Invitation, MemberRole, MemberStatus, OrganizationMember
from app.models.subscription import BillingCycle, Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.user import AccountType, User
from app.schemas.user import (
    AuditLogResponse,
    ContactSalesRequest,
    PasswordUpdate,
    RefreshRequest,
    SubscriptionResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    VerifyEmailRequest,
)
from app.services.auth_service import auth_service
from app.services import email_service
from app.core.logging import get_logger

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)

_FRONTEND_BASE = settings.FRONTEND_URL if hasattr(settings, "FRONTEND_URL") else "http://localhost:3000"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.register(db, data)
        code = await auth_service.create_verification_code(db, user.id)
        await db.commit()
        await db.refresh(user)

        try:
            email_service.send_verification_code(user.email, code)
        except Exception as e:
            logger.exception("verification_email_failed", user_id=str(user.id), email=user.email, error=str(e))

        await log_audit(db, user.id, "REGISTER", resource_type="account", resource_name=user.email, ip_address=get_ip(request))

        tokens = auth_service.create_tokens(user.id)
        tokens.requires_verification = True
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == data.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Already verified"}

    ok = await auth_service.verify_code(db, user.id, data.code)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired code. Please request a new one.")

    user.is_verified = True
    await log_audit(db, user.id, "EMAIL_VERIFIED", resource_type="account", resource_name=user.email)

    # send trial started email
    sub = await auth_service.get_subscription(db, user)
    if sub and sub.trial_ends_at:
        try:
            email_service.send_trial_started(user.email, sub.plan, sub.trial_ends_at.strftime("%B %d, %Y"))
        except Exception:
            pass

    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.is_verified:
        return {"message": "Already verified"}
    code = await auth_service.create_verification_code(db, current_user.id)
    await db.commit()
    try:
        email_service.send_verification_code(current_user.email, code)
    except Exception as e:
        logger.exception("verification_email_failed", user_id=str(current_user.id), email=current_user.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send verification email. Please check SMTP configuration.",
        ) from e
    return {"message": "Verification code sent"}


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_service.authenticate(db, data.email, data.password)
        ip = get_ip(request)
        await log_audit(db, user.id, "LOGIN", resource_type="account", resource_name=user.email, ip_address=ip)
        await db.commit()
        tokens = auth_service.create_tokens(user.id)
        tokens.requires_verification = not user.is_verified
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await auth_service.refresh(db, data.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    request: Request,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.preferences is not None:
        from sqlalchemy.orm.attributes import flag_modified
        prefs = dict(current_user.preferences or {})
        prefs.update(data.preferences.model_dump(exclude_none=True))
        current_user.preferences = prefs
        flag_modified(current_user, "preferences")
    await log_audit(db, current_user.id, "PROFILE_UPDATED", resource_type="account", resource_name=current_user.email, ip_address=get_ip(request))
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    request: Request,
    data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters")
    current_user.hashed_password = hash_password(data.new_password)
    await log_audit(db, current_user.id, "PASSWORD_CHANGED", resource_type="account", resource_name=current_user.email, ip_address=get_ip(request))
    await db.commit()


@router.get("/me/activity", response_model=list[AuditLogResponse])
async def get_activity(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.organization import MemberRole as MR
    # Org owners see all org activity; others see own
    if current_user.organization_id:
        member_result = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.user_id == current_user.id,
                OrganizationMember.organization_id == current_user.organization_id,
            )
        )
        member = member_result.scalar_one_or_none()
        is_owner = member and member.role == MR.OWNER
    else:
        is_owner = False

    if is_owner and current_user.organization_id:
        q = (
            select(AuditLog)
            .where(AuditLog.organization_id == current_user.organization_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    else:
        q = (
            select(AuditLog)
            .where(AuditLog.user_id == current_user.id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

    result = await db.execute(q)
    logs = result.scalars().all()
    return [
        AuditLogResponse(
            id=log.id,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            resource_name=log.resource_name,
            ip_address=log.ip_address,
            created_at=log.created_at,
            user_email=current_user.email,
            user_full_name=current_user.full_name,
            details=log.details,
        )
        for log in logs
    ]


@router.get("/me/subscription", response_model=SubscriptionResponse | None)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await auth_service.get_subscription(db, current_user)
    return sub


# ── Invite acceptance ──────────────────────────────────────────────────────────

@router.get("/invite/{token}")
async def get_invite_details(token: _uuid.UUID, db: AsyncSession = Depends(get_db)):
    from datetime import UTC, datetime
    from app.models.organization import Organization
    result = await db.execute(
        select(Invitation).where(Invitation.token == token, Invitation.accepted_at.is_(None))
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already used")
    if invite.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=410, detail="This invite link has expired")
    org = await db.get(Organization, invite.organization_id)
    return {"email": invite.email, "org_name": org.name if org else "", "token": str(token)}


@router.post("/invite/{token}/accept", response_model=TokenResponse)
async def accept_invite(token: _uuid.UUID, data: dict, db: AsyncSession = Depends(get_db)):
    from datetime import UTC, datetime, timedelta
    from app.models.organization import Organization

    result = await db.execute(
        select(Invitation).where(Invitation.token == token, Invitation.accepted_at.is_(None))
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already used")
    if invite.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=410, detail="This invite link has expired")

    password = data.get("password", "")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Check if user already exists with this email (should not happen, but guard)
    existing = await db.execute(select(User).where(User.email == invite.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    org = await db.get(Organization, invite.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    full_name = data.get("full_name") or None
    user = User(
        email=invite.email,
        full_name=full_name,
        hashed_password=hash_password(password),
        account_type=AccountType.ORGANIZATION_MEMBER,
        organization_id=invite.organization_id,
        is_verified=True,
    )
    db.add(user)
    await db.flush()

    member = OrganizationMember(
        organization_id=invite.organization_id,
        user_id=user.id,
        role=MemberRole.MEMBER,
        status=MemberStatus.ACTIVE,
        invited_by=invite.invited_by,
    )
    db.add(member)

    invite.accepted_at = datetime.now(UTC)


    # Notify org owner
    owner_result = await db.execute(select(User).where(User.id == org.owner_id))
    owner = owner_result.scalar_one_or_none()
    if owner:
        from app.models.notification import Notification, NotificationType
        notif = Notification(
            user_id=owner.id,
            type=NotificationType.MEMBER_JOINED,
            title="New member joined",
            body=f"{invite.email} has joined {org.name}",
            resource_type="organization",
            resource_id=str(org.id),
        )
        db.add(notif)

    await log_audit(db, user.id, "MEMBER_JOINED", resource_type="organization", resource_id=str(org.id), resource_name=org.name)
    await db.commit()
    return auth_service.create_tokens(user.id)


# ── Contact Sales ─────────────────────────────────────────────────────────────

@router.post("/contact-sales", status_code=status.HTTP_200_OK)
async def contact_sales(data: ContactSalesRequest):
    try:
        email_service.send_contact_sales(data.name, data.email, data.company or "", data.message)
    except Exception:
        pass
    return {"message": "Thank you! We'll get back to you within 1 business day."}
