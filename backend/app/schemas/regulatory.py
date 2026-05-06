import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GapAnalysis(BaseModel):
    title: str
    domain: str = Field(..., description="CMC / Nonclinical / Clinical / Strategy")
    severity: str = Field(..., description="Critical / High / Medium / Low")
    description: str
    regulatory_impact: str
    recommended_action: str
    quoted_excerpt: str | None = None
    page_reference: str | None = None


class ActionItem(BaseModel):
    title: str
    description: str
    priority: str | None = None


class InsightItem(BaseModel):
    content: str
    category: str | None = None


class FullAnalysisResponse(BaseModel):
    summary: str
    insights: list[InsightItem]
    gaps: list[GapAnalysis]
    risks: list[str]
    actions: list[ActionItem]
    confidence_score: float
    source_basis: str


class DocumentAnalysisResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    summary: str | None
    confidence_score: float | None
    created_at: datetime

    gaps: list[GapAnalysis] = []
    insights: list[InsightItem] = []
    actions: list[ActionItem] = []

    model_config = {"from_attributes": True}
