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

class ActionItem(BaseModel):
    title: str
    description: str
    priority: str

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
