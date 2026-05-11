from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class CheckoutSessionRequest(BaseModel):
    plan_id: str
    billing_cycle: str  # "monthly" or "annual"
    success_url: str
    cancel_url: str

class CheckoutSessionResponse(BaseModel):
    checkout_url: str

class SubscriptionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    plan: str
    billing_cycle: str
    status: str
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class PlanDetails(BaseModel):
    id: str
    name: str
    description: str
    monthly_price: Optional[int]
    annual_price: Optional[int]
    features: list[str]
    popular: bool = False

class BillingStatusResponse(BaseModel):
    plan: str
    status: str
    trial_ends_at: Optional[str] = None
    current_period_end: Optional[str] = None
    is_active: bool
