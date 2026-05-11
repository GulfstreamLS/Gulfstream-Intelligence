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
async def get_plans():
    """Get available subscription plans."""
    return {
        "solo": [
            {
                "id": "starter",
                "name": "Starter",
                "description": "For individuals exploring regulatory intelligence.",
                "monthly_price": 99,
                "annual_price": 79,
                "features": ["Regulatory Chat", "Document Intelligence", "10 uploads / month", "Standard coverage"]
            },
            {
                "id": "professional",
                "name": "Professional",
                "description": "For professionals managing regulatory programs.",
                "monthly_price": 299,
                "annual_price": 239,
                "features": ["Everything in Starter", "Unlimited sessions", "Global Gap Assessment", "HA Simulation"]
            }
        ],
        "organization": [
            {
                "id": "business",
                "name": "Business",
                "description": "For teams collaborating on multiple programs.",
                "monthly_price": 699,
                "annual_price": 559,
                "features": ["Everything in Professional", "Team access (5 users)", "Shared projects", "Priority support"]
            }
        ]
    }

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
