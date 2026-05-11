import stripe
from datetime import datetime, UTC
from typing import Any, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionPlan, BillingCycle
from app.models.user import User
from app.models.organization import Organization

stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    @staticmethod
    async def create_checkout_session(
        db: AsyncSession,
        user: User,
        plan_id: str,
        billing_cycle: str,
        success_url: str,
        cancel_url: str
    ) -> str:
        # Map plan and cycle to Stripe Price ID
        price_id = StripeService._get_price_id(plan_id, billing_cycle)
        if not price_id:
            raise ValueError(f"Invalid plan or billing cycle: {plan_id}, {billing_cycle}")

        # Get or create Stripe Customer
        customer_id = await StripeService.get_or_create_customer(db, user)

        # Create session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": str(user.id),
                "organization_id": str(user.organization_id) if user.organization_id else "",
                "plan": plan_id,
                "billing_cycle": billing_cycle
            }
        )
        return session.url

    @staticmethod
    async def get_or_create_customer(db: AsyncSession, user: User) -> str:
        # Check if user/org already has a customer ID
        sub_query = None
        if user.organization_id:
            sub_query = select(Subscription).where(Subscription.organization_id == user.organization_id)
        else:
            sub_query = select(Subscription).where(Subscription.user_id == user.id)
        
        result = await db.execute(sub_query)
        subscription = result.scalar_one_or_none()

        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # Create new customer in Stripe
        name = user.full_name or user.email
        if user.organization_id:
            org_result = await db.execute(select(Organization).where(Organization.id == user.organization_id))
            org = org_result.scalar_one_or_none()
            if org:
                name = org.name

        customer = stripe.Customer.create(
            email=user.email,
            name=name,
            metadata={
                "user_id": str(user.id),
                "organization_id": str(user.organization_id) if user.organization_id else ""
            }
        )

        # Update local subscription record with customer ID
        if not subscription:
            # This shouldn't normally happen as trial is created on register
            subscription = Subscription(
                user_id=user.id if not user.organization_id else None,
                organization_id=user.organization_id,
                stripe_customer_id=customer.id
            )
            db.add(subscription)
        else:
            subscription.stripe_customer_id = customer.id
        
        await db.flush()
        return customer.id

    @staticmethod
    def _get_price_id(plan_id: str, billing_cycle: str) -> Optional[str]:
        mapping = {
            (SubscriptionPlan.STARTER, BillingCycle.MONTHLY): settings.STRIPE_PRICE_STARTER_MONTHLY,
            (SubscriptionPlan.STARTER, BillingCycle.ANNUAL): settings.STRIPE_PRICE_STARTER_ANNUAL,
            (SubscriptionPlan.PROFESSIONAL, BillingCycle.MONTHLY): settings.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
            (SubscriptionPlan.PROFESSIONAL, BillingCycle.ANNUAL): settings.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
            (SubscriptionPlan.BUSINESS, BillingCycle.MONTHLY): settings.STRIPE_PRICE_BUSINESS_MONTHLY,
            (SubscriptionPlan.BUSINESS, BillingCycle.ANNUAL): settings.STRIPE_PRICE_BUSINESS_ANNUAL,
        }
        return mapping.get((plan_id, billing_cycle))

    @staticmethod
    async def handle_webhook(db: AsyncSession, payload: bytes, sig_header: str):
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

        event_type = event["type"]
        data_object = event["data"]["object"]

        if event_type == "checkout.session.completed":
            await StripeService._handle_checkout_completed(db, data_object)
        elif event_type == "invoice.paid":
            await StripeService._handle_invoice_paid(db, data_object)
        elif event_type == "customer.subscription.updated":
            await StripeService._handle_subscription_updated(db, data_object)
        elif event_type == "customer.subscription.deleted":
            await StripeService._handle_subscription_deleted(db, data_object)

    @staticmethod
    async def _handle_checkout_completed(db: AsyncSession, session: Any):
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        org_id = metadata.get("organization_id")
        plan = metadata.get("plan")
        cycle = metadata.get("billing_cycle")
        stripe_sub_id = session.get("subscription")
        stripe_cust_id = session.get("customer")

        # Find or create local subscription
        query = None
        if org_id:
            query = select(Subscription).where(Subscription.organization_id == uuid.UUID(org_id))
        else:
            query = select(Subscription).where(Subscription.user_id == uuid.UUID(user_id))
        
        result = await db.execute(query)
        subscription = result.scalar_one_or_none()

        if not subscription:
            subscription = Subscription(
                user_id=uuid.UUID(user_id) if not org_id else None,
                organization_id=uuid.UUID(org_id) if org_id else None,
            )
            db.add(subscription)

        subscription.plan = plan
        subscription.billing_cycle = cycle
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.stripe_customer_id = stripe_cust_id
        subscription.stripe_subscription_id = stripe_sub_id
        
        # Get subscription details to update period ends
        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
        subscription.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start, tz=UTC)
        subscription.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end, tz=UTC)
        subscription.stripe_price_id = stripe_sub["items"]["data"][0]["price"]["id"]

        await db.commit()

    @staticmethod
    async def _handle_invoice_paid(db: AsyncSession, invoice: Any):
        stripe_sub_id = invoice.get("subscription")
        if not stripe_sub_id:
            return

        result = await db.execute(select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id))
        subscription = result.scalar_one_or_none()
        
        if subscription:
            stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start, tz=UTC)
            subscription.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end, tz=UTC)
            await db.commit()

    @staticmethod
    async def _handle_subscription_updated(db: AsyncSession, stripe_sub: Any):
        stripe_sub_id = stripe_sub.get("id")
        result = await db.execute(select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id))
        subscription = result.scalar_one_or_none()
        
        if subscription:
            # Map stripe status to our status
            status_map = {
                "active": SubscriptionStatus.ACTIVE,
                "trialing": SubscriptionStatus.TRIALING,
                "past_due": SubscriptionStatus.ACTIVE, # Still active for a bit
                "canceled": SubscriptionStatus.CANCELLED,
                "unpaid": SubscriptionStatus.EXPIRED,
            }
            subscription.status = status_map.get(stripe_sub.status, SubscriptionStatus.EXPIRED)
            subscription.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start, tz=UTC)
            subscription.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end, tz=UTC)
            
            # Update plan if changed
            price_id = stripe_sub["items"]["data"][0]["price"]["id"]
            if price_id != subscription.stripe_price_id:
                subscription.stripe_price_id = price_id
                # Optionally reverse map price_id to plan/cycle
            
            await db.commit()

    @staticmethod
    async def _handle_subscription_deleted(db: AsyncSession, stripe_sub: Any):
        stripe_sub_id = stripe_sub.get("id")
        result = await db.execute(select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id))
        subscription = result.scalar_one_or_none()
        
        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED
            await db.commit()

    @staticmethod
    async def get_subscription_status(user: User, db: AsyncSession) -> Optional[Subscription]:
        query = None
        if user.organization_id:
            query = select(Subscription).where(Subscription.organization_id == user.organization_id)
        else:
            query = select(Subscription).where(Subscription.user_id == user.id)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def cancel_subscription(user: User, db: AsyncSession) -> bool:
        subscription = await StripeService.get_subscription_status(user, db)
        if not subscription or not subscription.stripe_subscription_id:
            return False
        
        try:
            # Cancel at end of period
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
            # Webhook will handle status update later, but we can set a flag or just wait
            return True
        except Exception as e:
            print(f"Error cancelling subscription: {e}")
            return False

stripe_service = StripeService()
