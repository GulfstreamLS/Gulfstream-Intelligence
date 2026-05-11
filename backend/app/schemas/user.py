import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    account_type: str | None = "solo"
    org_name: str | None = None
    org_email: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPreferences(BaseModel):
    language: str | None = None
    date_format: str | None = None
    number_format: str | None = None
    timezone: str | None = None
    job_title: str | None = None
    organization: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    preferences: UserPreferences | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None
    avatar_url: str | None
    is_active: bool
    is_verified: bool
    account_type: str
    organization_id: uuid.UUID | None = None
    created_at: datetime
    preferences: dict | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_verification: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    user_id: uuid.UUID
    code: str


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    action: str
    resource_type: str | None
    resource_id: str | None
    resource_name: str | None
    ip_address: str | None
    created_at: datetime
    user_email: str | None = None
    user_full_name: str | None = None
    details: dict | None = None

    model_config = {"from_attributes": True}


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    plan: str
    billing_cycle: str
    status: str
    trial_ends_at: datetime | None
    current_period_end: datetime | None

    model_config = {"from_attributes": True}


class ContactSalesRequest(BaseModel):
    name: str
    email: EmailStr
    company: str | None = None
    message: str
