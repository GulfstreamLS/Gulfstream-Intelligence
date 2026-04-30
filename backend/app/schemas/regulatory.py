import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GapAnalysis(BaseModel):
    title: str
    domain: str = Field(..., description="CMC / Nonclinical / Clinical / Strategy")
    severity: str = Field(..., description="Critical / High / Medium / Low")
    description: str
    regulatory_impact: str
    recommended_action: str
    quoted_excerpt: Optional[str] = None
    page_reference: Optional[str] = None


class ActionItem(BaseModel):
    title: str
    description: str
    priority: Optional[str] = None


class InsightItem(BaseModel):
    content: str
    category: Optional[str] = None


class FullAnalysisResponse(BaseModel):
    summary: str
    insights: List[InsightItem]
    gaps: List[GapAnalysis]
    risks: List[str]
    actions: List[ActionItem]
    confidence_score: float
    source_basis: str


class DocumentAnalysisResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    summary: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime
    
    gaps: List[GapAnalysis] = []
    insights: List[InsightItem] = []
    actions: List[ActionItem] = []

    model_config = {"from_attributes": True}
