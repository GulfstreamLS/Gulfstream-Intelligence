"""
Admin-only API endpoints.
Protected by X-Admin-Key header matching settings.ADMIN_SECRET_KEY.
No user account or JWT required — intended for the hardcoded frontend admin panel.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.organization import MemberRole, Organization, OrganizationMember
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Auth guard ────────────────────────────────────────────────────────────────

def _verify(x_admin_key: str = Header(..., alias="x-admin-key")) -> None:
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")


# ── Schemas ───────────────────────────────────────────────────────────────────

class UpdateSubscriptionBody(BaseModel):
    plan: str | None = None
    status: str | None = None
    extend_trial_days: int | None = None


async def _is_org_owner(user: User, db: AsyncSession) -> bool:
    if not user.organization_id:
        return False
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == user.organization_id,
            OrganizationMember.role == MemberRole.OWNER,
        )
    )
    return result.scalar_one_or_none() is not None


async def _org_role(user: User, db: AsyncSession) -> str | None:
    if not user.organization_id:
        return None
    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == user.organization_id,
        )
    )
    member = result.scalar_one_or_none()
    return member.role if member else None


async def _effective_subscription(user: User, db: AsyncSession) -> Subscription | None:
    if user.organization_id:
        result = await db.execute(
            select(Subscription)
            .where(Subscription.organization_id == user.organization_id)
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub = result.scalar_one_or_none()
        if sub:
            return sub

    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _get_or_create_effective_subscription(user: User, db: AsyncSession) -> Subscription:
    sub = await _effective_subscription(user, db)

    if user.organization_id:
        if sub and sub.organization_id == user.organization_id:
            return sub

        # Older admin edits may have created a user-level subscription for an org owner.
        # Move that record to the organization so the user dashboard resolves the same row.
        if sub and sub.user_id == user.id and await _is_org_owner(user, db):
            sub.user_id = None
            sub.organization_id = user.organization_id
            return sub

        sub = Subscription(
            organization_id=user.organization_id,
            plan=SubscriptionPlan.TRIAL,
            status=SubscriptionStatus.TRIALING,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(sub)
        return sub

    if sub:
        return sub

    sub = Subscription(
        user_id=user.id,
        plan=SubscriptionPlan.TRIAL,
        status=SubscriptionStatus.TRIALING,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(sub)
    return sub


def _allowed_admin_plans(user: User) -> set[str]:
    if user.organization_id:
        return {SubscriptionPlan.TRIAL, SubscriptionPlan.BUSINESS, SubscriptionPlan.ENTERPRISE}
    return {SubscriptionPlan.TRIAL, SubscriptionPlan.STARTER, SubscriptionPlan.PROFESSIONAL}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    _: None = Depends(_verify),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    rows = result.scalars().all()

    users = []
    for user in rows:
        sub = await _effective_subscription(user, db)
        role = await _org_role(user, db)
        users.append({
            "id":                 str(user.id),
            "email":              user.email,
            "full_name":          user.full_name,
            "account_type":        user.account_type,
            "organization_id":     str(user.organization_id) if user.organization_id else None,
            "organization_role":   role,
            "can_manage_subscription": not user.organization_id or role == MemberRole.OWNER,
            "subscription_scope":  "organization" if sub and sub.organization_id else "user" if sub else None,
            "is_active":          user.is_active,
            "created_at":         user.created_at.isoformat() if user.created_at else None,
            "subscription_id":    str(sub.id) if sub else None,
            "plan":               sub.plan if sub else None,
            "status":             sub.status if sub else None,
            "trial_ends_at":      sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
            "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
        })
    return users


@router.patch("/users/{user_id}/subscription")
async def update_subscription(
    user_id: str,
    body: UpdateSubscriptionBody,
    _: None = Depends(_verify),
    db: AsyncSession = Depends(get_db),
):
    uid = uuid.UUID(user_id)

    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == uid))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.organization_id and not await _is_org_owner(user, db):
        raise HTTPException(
            status_code=403,
            detail="Update this organization's subscription from the owner account row.",
        )

    sub = await _get_or_create_effective_subscription(user, db)

    if body.plan is not None:
        if body.plan not in [p.value for p in SubscriptionPlan]:
            raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")
        if body.plan not in _allowed_admin_plans(user):
            allowed = ", ".join(sorted(_allowed_admin_plans(user)))
            raise HTTPException(status_code=400, detail=f"Plan must be one of: {allowed}")
        sub.plan = body.plan
        if body.plan == SubscriptionPlan.TRIAL:
            sub.status = SubscriptionStatus.TRIALING
            if not sub.trial_ends_at or sub.trial_ends_at <= datetime.now(timezone.utc):
                sub.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=7)
            sub.current_period_start = None
            sub.current_period_end = None
            sub.cancel_at_period_end = False
        else:
            sub.status = SubscriptionStatus.ACTIVE
            sub.trial_ends_at = None
            sub.cancel_at_period_end = False

    if body.status is not None:
        if body.status not in [s.value for s in SubscriptionStatus]:
            raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
        sub.status = body.status

    if body.extend_trial_days is not None:
        days = max(1, body.extend_trial_days)
        base = (
            sub.trial_ends_at
            if sub.trial_ends_at and sub.trial_ends_at > datetime.now(timezone.utc)
            else datetime.now(timezone.utc)
        )
        sub.trial_ends_at = base + timedelta(days=days)
        sub.plan   = SubscriptionPlan.TRIAL
        sub.status = SubscriptionStatus.TRIALING
        sub.current_period_start = None
        sub.current_period_end = None
        sub.cancel_at_period_end = False

    await db.commit()
    await db.refresh(sub)

    return {
        "success":       True,
        "subscription_scope": "organization" if sub.organization_id else "user",
        "plan":          sub.plan,
        "status":        sub.status,
        "trial_ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    _: None = Depends(_verify),
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    user = await db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.organization_id and await _is_org_owner(user, db):
        other_members = (
            await db.execute(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == user.organization_id,
                    OrganizationMember.user_id != user.id,
                )
            )
        ).scalars().all()
        if other_members:
            raise HTTPException(
                status_code=400,
                detail="Transfer organization ownership before deleting this owner account.",
            )

        org = await db.get(Organization, user.organization_id)
        if org:
            await db.delete(org)
            await db.flush()

    await db.delete(user)
    await db.commit()
