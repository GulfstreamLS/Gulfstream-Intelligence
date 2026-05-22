"""
Centralised subscription / plan business logic.

Plan access matrix
──────────────────
  active trial →  rank 4  (full feature access during the trial)
  starter      →  rank 2  (Individual plan; includes core intelligence modules)
  business     →  rank 3
  enterprise   →  rank 4

Org subscriptions start at "business" (rank 3), so org members always have
Individual-tier access and above; upload limits never apply to them.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus

# ── Plan rank ────────────────────────────────────────────────────────────────

PLAN_RANK: dict[str, int] = {
    SubscriptionPlan.TRIAL:        4,   # active trial gets full feature access
    SubscriptionPlan.STARTER:      2,
    SubscriptionPlan.PROFESSIONAL: 2,   # legacy alias for existing records
    SubscriptionPlan.BUSINESS:     3,
    SubscriptionPlan.ENTERPRISE:   4,
}

# ── Monthly upload limits (None = unlimited) ─────────────────────────────────

UPLOAD_LIMIT: dict[str, int | None] = {
    SubscriptionPlan.TRIAL:        None,  # unlimited during trial — full access
    SubscriptionPlan.STARTER:      None,
    SubscriptionPlan.PROFESSIONAL: None,
    SubscriptionPlan.BUSINESS:     None,
    SubscriptionPlan.ENTERPRISE:   None,
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def is_sub_active(sub: Subscription) -> bool:
    if sub.status == SubscriptionStatus.ACTIVE:
        return True
    if sub.status == SubscriptionStatus.TRIALING:
        if sub.trial_ends_at and sub.trial_ends_at > datetime.now(timezone.utc):
            return True
    return False


def get_plan_rank(sub: Subscription | None) -> int:
    if not sub or not is_sub_active(sub):
        return 0
    return PLAN_RANK.get(sub.plan, 0)


def get_upload_limit(sub: Subscription | None) -> int | None:
    """
    Returns:
      None  — unlimited
      0     — no active subscription
      N > 0 — monthly cap
    """
    if not sub or not is_sub_active(sub):
        return 0
    return UPLOAD_LIMIT.get(sub.plan, 10)


async def get_monthly_upload_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Count file-upload messages for *user_id* in the current calendar month."""
    from app.models.chat import Conversation, Message  # local import avoids circular deps

    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    stmt = (
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.user_id == user_id,
            Message.attached_filename.is_not(None),
            Message.created_at >= month_start,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one() or 0
