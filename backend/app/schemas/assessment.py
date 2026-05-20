from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID

class DomainReadiness(BaseModel):
    domain: str
    readiness: int
    difference: int

class SeverityStat(BaseModel):
    severity: str
    count: int
    percentage: float

class GapSummary(BaseModel):
    id: UUID
    domain: str
    title: str
    severity: str
    impact: str
    status: str
    why_this_matters: Optional[str] = None
    health_authority_relevance: Optional[str] = None
    source_evidence: Optional[str] = None
    document_reference: Optional[str] = None
    recommended_action: Optional[str] = None
    suggested_owner: Optional[str] = None
    target_date: Optional[str] = None
    priority_level: Optional[str] = None

class ActionItem(BaseModel):
    title: str
    description: str
    priority: str

class AnalyzedDocumentSummary(BaseModel):
    id: UUID
    filename: str
    authority: Optional[str]
    gap_count: int
    confidence_score: Optional[float]
    created_at: datetime

class AssessmentDocumentSummary(BaseModel):
    id: UUID
    filename: str
    file_type: Optional[str] = None
    authority: Optional[str] = None
    source: Optional[str] = None
    created_at: Optional[datetime] = None

class GapAssessmentResponse(BaseModel):
    overall_readiness: int
    readiness_vs_last: int
    critical_gaps_count: int
    high_priority_count: int
    recommendations_count: int
    domain_readiness: List[DomainReadiness]
    severity_distribution: List[SeverityStat]
    top_gaps: List[GapSummary]
    next_steps: List[ActionItem]
    documents_reviewed: List[AssessmentDocumentSummary] = []

class GapAssessmentRunCreate(BaseModel):
    source_type: str
    assessment_type: str
    regions: List[str] = []
    project_id: Optional[UUID] = None
    document_ids: List[UUID] = []
    confidence_level: str = "Moderate"

class ManualGapAssessmentRequest(BaseModel):
    program_details: str
    source_type: str = "Pasted Program Details"
    assessment_type: str = "Global Development Readiness"
    authority: Optional[str] = None
    project_id: Optional[UUID] = None
    confidence_level: str = "Moderate"

class GapAssessmentRunResponse(BaseModel):
    id: UUID
    project_id: Optional[UUID] = None
    source_type: str
    assessment_type: str
    regions: List[str] = []
    document_ids: List[UUID] = []
    documents_reviewed: List[AssessmentDocumentSummary] = []
    confidence_level: str
    readiness_score: int
    critical_gaps_count: int
    high_priority_count: int
    recommendations_count: int
    top_risks: List[str] = []
    recommendations: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
