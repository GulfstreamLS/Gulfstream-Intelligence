from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.billing import CheckoutSessionRequest, CheckoutSessionResponse, SubscriptionSchema
from app.services.stripe_service import StripeService

router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout Session."""
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
    sub = await StripeService.get_subscription_status(current_user, db)
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    return sub

@router.get("/plans")
async def get_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get available subscription plans."""
    # Check if user is an organization owner
    is_org_owner = False
    if current_user.organization_id:
        from app.models.organization import OrganizationMember, MemberRole
        from sqlalchemy import select
        stmt = select(OrganizationMember).where(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.organization_id == current_user.organization_id,
            OrganizationMember.role == MemberRole.OWNER
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            is_org_owner = True

    plans = {
        "solo": [
            {
                "id": "starter",
                "name": "Starter",
                "description": "For individuals exploring regulatory intelligence.",
                "monthly_price": 99,
                "annual_price": 79,
                "features": ["Regulatory Chat", "Document Intelligence", "10 uploads / month", "Standard coverage"],
                "popular": False
            },
            {
                "id": "professional",
                "name": "Professional",
                "description": "For professionals managing regulatory programs.",
                "monthly_price": 299,
                "annual_price": 239,
                "features": ["Everything in Starter", "Unlimited sessions", "Global Gap Assessment", "HA Simulation"],
                "popular": True
            }
        ],
        "organization": []
    }

    if is_org_owner:
        plans["organization"] = [
            {
                "id": "business",
                "name": "Business",
                "description": "Full-scale solution for regulatory teams.",
                "monthly_price": 400,
                "annual_price": 320,
                "features": ["Everything in Professional", "Team collaboration", "Advanced analytics", "Priority support"],
                "popular": False
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Custom solution for large organizations.",
                "monthly_price": None,
                "annual_price": None,
                "features": ["Everything in Business", "Unlimited users", "Custom integrations", "Dedicated support", "SLA & compliance support"],
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
    success = await StripeService.cancel_subscription(current_user, db)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription or no active subscription found.")
    return {"message": "Subscription cancelled successfully. It will remain active until the end of the period."}
