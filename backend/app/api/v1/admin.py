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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    _: None = Depends(_verify),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User, Subscription)
        .outerjoin(Subscription, Subscription.user_id == User.id)
        .order_by(User.created_at.desc())
    )
    rows = result.all()

    users = []
    for user, sub in rows:
        users.append({
            "id":                 str(user.id),
            "email":              user.email,
            "full_name":          user.full_name,
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
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == uuid.UUID(user_id))
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found for this user")

    if body.plan is not None:
        if body.plan not in [p.value for p in SubscriptionPlan]:
            raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan}")
        sub.plan = body.plan
        # Activating a paid plan → mark active
        if body.plan not in (SubscriptionPlan.TRIAL,):
            sub.status = SubscriptionStatus.ACTIVE

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

    await db.commit()
    await db.refresh(sub)

    return {
        "success":       True,
        "plan":          sub.plan,
        "status":        sub.status,
        "trial_ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
    }
