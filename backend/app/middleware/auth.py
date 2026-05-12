from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import auth_service

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await auth_service.get_current_user(db, credentials.credentials)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e


async def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return current_user


async def get_user_or_none(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return await auth_service.get_current_user(db, credentials.credentials)
    except Exception:
        return None

async def check_active_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    from app.models.subscription import SubscriptionStatus
    from datetime import datetime, UTC

    sub = await auth_service.get_subscription(db, current_user)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Active subscription required"
        )
    
    is_active = False
    if sub.status == SubscriptionStatus.ACTIVE:
        is_active = True
    elif sub.status == SubscriptionStatus.TRIALING:
        if sub.trial_ends_at and sub.trial_ends_at > datetime.now(UTC):
            is_active = True
    
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription expired or trial ended. Please upgrade your plan."
        )

    return current_user


def require_plan(min_plan: str):
    """
    Dependency factory that enforces a minimum plan rank.

    Usage:
        current_user: User = Depends(require_plan("professional"))

    Handles both solo users (their own subscription) and org members
    (their organization's subscription) via auth_service.get_subscription,
    which already resolves the correct subscription for both tenancy types.
    """
    async def _dep(
        current_user: User = Depends(check_active_subscription),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        from app.services.plan_service import PLAN_RANK, get_plan_rank

        sub = await auth_service.get_subscription(db, current_user)
        user_rank = get_plan_rank(sub)
        required_rank = PLAN_RANK.get(min_plan, 99)

        if user_rank < required_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"upgrade_required:{min_plan}",
            )
        return current_user

    return _dep
