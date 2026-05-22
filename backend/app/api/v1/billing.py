from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.billing import CheckoutSessionRequest, CheckoutSessionResponse, SubscriptionSchema
from app.services.stripe_service import StripeService
from app.services.auth_service import auth_service
from app.services.plan_service import get_upload_limit, get_monthly_upload_count

router = APIRouter(prefix="/billing", tags=["billing"])


async def _is_org_owner(user: User, db: AsyncSession) -> bool:
    if not user.organization_id:
        return False
    from app.models.organization import MemberRole, OrganizationMember
    from sqlalchemy import select

    result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == user.organization_id,
            OrganizationMember.role == MemberRole.OWNER,
        )
    )
    return result.scalar_one_or_none() is not None


async def _require_billing_manager(user: User, db: AsyncSession) -> None:
    if user.organization_id and not await _is_org_owner(user, db):
        raise HTTPException(status_code=403, detail="Only the organization owner can manage billing.")

@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout Session."""
    await _require_billing_manager(current_user, db)
    try:
        url = await StripeService.create_checkout_session(
            db,
            current_user,
            request.plan_id,
            request.billing_cycle,
            request.success_url,
            request.cancel_url
        )
        return CheckoutSessionResponse(checkout_url=url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhooks."""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    payload = await request.body()
    try:
        await StripeService.handle_webhook(db, payload, stripe_signature)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

@router.get("/status", response_model=SubscriptionSchema)
async def get_billing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's subscription status."""
    sub = await auth_service.get_subscription(db, current_user)
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    return sub

@router.get("/plans")
async def get_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get available subscription plans."""
    is_org_owner = await _is_org_owner(current_user, db)

    plans = {
        "solo": [
            {
                "id": "starter",
                "name": "Individual",
                "description": "For independent regulatory professionals and consultants.",
                "monthly_price": 59,
                "annual_price": 649,
                "features": [
                    "Regulatory Chat",
                    "Document Intelligence",
                    "10 document uploads / month",
                    "Standard data coverage",
                    "Unlimited chat sessions",
                    "Global Gap Assessment",
                    "Health Authority Simulation",
                ],
                "popular": False
            }
        ],
        "organization": []
    }

    if is_org_owner:
        plans["organization"] = [
            {
                "id": "business",
                "name": "Business",
                "description": "For biotech teams and collaborative regulatory organizations.",
                "monthly_price": 275,
                "annual_price": 3000,
                "features": [
                    "Everything in Individual",
                    "Team access (up to 5 users)",
                    "Shared projects & folders",
                    "Priority support",
                    "Advanced analytics",
                ],
                "popular": True
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Custom infrastructure for global regulatory organizations.",
                "monthly_price": None,
                "annual_price": None,
                "features": [
                    "Everything in Business",
                    "Unlimited users",
                    "Custom integrations",
                    "Dedicated support",
                    "SLA & compliance support",
                ],
                "popular": False
            }
        ]

    return plans

@router.get("/sync")
async def sync_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually sync subscription status from Stripe."""
    await _require_billing_manager(current_user, db)
    success = await StripeService.sync_subscription_status(current_user, db)
    if not success:
        raise HTTPException(status_code=400, detail="No Stripe customer found for this user.")
    return {"message": "Subscription status synced successfully."}

@router.post("/reactivate")
async def reactivate_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a cancelled subscription."""
    await _require_billing_manager(current_user, db)
    success = await StripeService.reactivate_subscription(current_user, db)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reactivate subscription or no subscription found.")
    return {"message": "Subscription reactivated successfully."}

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel the current subscription."""
    await _require_billing_manager(current_user, db)
    success = await StripeService.cancel_subscription(current_user, db)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription or no active subscription found.")
    return {"message": "Subscription cancelled successfully. It will remain active until the end of the period."}


@router.get("/usage")
async def get_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return current plan and file-upload usage for the billing period.
    Resolves the correct subscription for both solo users and org members
    (org members use their organization's subscription).
    """
    sub = await auth_service.get_subscription(db, current_user)
    upload_limit = get_upload_limit(sub)

    uploads_this_month = 0
    if upload_limit is not None and upload_limit > 0:
        uploads_this_month = await get_monthly_upload_count(db, current_user.id)

    return {
        "plan": sub.plan if sub else "trial",
        "uploads_this_month": uploads_this_month,
        "upload_limit": upload_limit,
    }
