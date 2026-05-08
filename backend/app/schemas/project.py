import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    type: str = "IND"
    indication: Optional[str] = None
    therapeutic_area: Optional[str] = None
    dev_phase: Optional[str] = None
    status: str = "Planning"
    readiness_score: int = 0
    authorities: Optional[list[str]] = None
    product_type: Optional[str] = None
    icon_type: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    indication: Optional[str] = None
    therapeutic_area: Optional[str] = None
    dev_phase: Optional[str] = None
    status: Optional[str] = None
    readiness_score: Optional[int] = None
    authorities: Optional[list[str]] = None
    product_type: Optional[str] = None
    icon_type: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    indication: Optional[str] = None
    therapeutic_area: Optional[str] = None
    dev_phase: Optional[str] = None
    status: str
    readiness_score: int
    authorities: Optional[list[str]] = None
    product_type: Optional[str] = None
    icon_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int
