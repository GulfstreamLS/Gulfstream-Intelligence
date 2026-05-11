import random
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.email_verification import EmailVerification
from app.models.organization import MemberRole, MemberStatus, Organization, OrganizationMember
from app.models.subscription import BillingCycle, Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.user import AccountType, User
from app.schemas.user import TokenResponse, UserCreate


class AuthService:
    async def register(self, db: AsyncSession, data: UserCreate) -> User:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            account_type=data.account_type or AccountType.SOLO,
            is_verified=False,
        )
        db.add(user)
        await db.flush()

        if data.account_type == AccountType.ORGANIZATION_MEMBER and data.org_name:
            slug = _make_slug(data.org_name)
            slug = await _unique_slug(db, slug)
            org = Organization(
                name=data.org_name,
                slug=slug,
                org_email=data.org_email or data.email,
                owner_id=user.id,
            )
            db.add(org)
            await db.flush()

            user.organization_id = org.id
            member = OrganizationMember(
                organization_id=org.id,
                user_id=user.id,
                role=MemberRole.OWNER,
                status=MemberStatus.ACTIVE,
            )
            db.add(member)

            sub = Subscription(
                organization_id=org.id,
                plan=SubscriptionPlan.TRIAL,
                billing_cycle=BillingCycle.ANNUAL,
                status=SubscriptionStatus.TRIALING,
                trial_ends_at=datetime.now(UTC) + timedelta(days=7),
            )
        else:
            sub = Subscription(
                user_id=user.id,
                plan=SubscriptionPlan.TRIAL,
                billing_cycle=BillingCycle.ANNUAL,
                status=SubscriptionStatus.TRIALING,
                trial_ends_at=datetime.now(UTC) + timedelta(days=7),
            )

        db.add(sub)
        await db.flush()
        return user

    async def authenticate(self, db: AsyncSession, email: str, password: str) -> User:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise ValueError("Account is disabled")
        return user

    def create_tokens(self, user_id: uuid.UUID) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )

    async def refresh(self, db: AsyncSession, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        user_id = uuid.UUID(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        return self.create_tokens(user.id)

    async def get_current_user(self, db: AsyncSession, token: str) -> User:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        user_id = uuid.UUID(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise ValueError("User not found")
        return user

    async def create_verification_code(self, db: AsyncSession, user_id: uuid.UUID) -> str:
        code = f"{random.randint(0, 999999):06d}"
        ev = EmailVerification(
            user_id=user_id,
            code=code,
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )
        db.add(ev)
        await db.flush()
        return code

    async def verify_code(self, db: AsyncSession, user_id: uuid.UUID, code: str) -> bool:
        now = datetime.now(UTC)
        result = await db.execute(
            select(EmailVerification)
            .where(
                EmailVerification.user_id == user_id,
                EmailVerification.code == code,
                EmailVerification.verified_at.is_(None),
                EmailVerification.expires_at > now,
            )
            .order_by(EmailVerification.expires_at.desc())
            .limit(1)
        )
        ev = result.scalar_one_or_none()
        if not ev:
            return False
        ev.verified_at = now
        return True

    async def get_subscription(self, db: AsyncSession, user: User) -> Subscription | None:
        if user.organization_id:
            result = await db.execute(
                select(Subscription)
                .where(Subscription.organization_id == user.organization_id)
                .order_by(Subscription.created_at.desc())
                .limit(1)
            )
        else:
            result = await db.execute(
                select(Subscription)
                .where(Subscription.user_id == user.id)
                .order_by(Subscription.created_at.desc())
                .limit(1)
            )
        return result.scalar_one_or_none()


def _make_slug(name: str) -> str:
    import re
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")[:60]


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug = base
    counter = 1
    while True:
        result = await db.execute(select(Organization).where(Organization.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


auth_service = AuthService()
