import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── LLM structured output ────────────────────────────────────────────────────

class SimQuestionOutput(BaseModel):
    topic: str = Field(..., description="Must be one of: CMC & Manufacturing, Nonclinical, Clinical Plan, Quality Systems, Regulatory Strategy")
    severity: str = Field(..., description="Must be one of: Critical, High, Medium, Low")
    question: str
    rationale: str


class SimConcernOutput(BaseModel):
    text: str
    severity: str = Field(..., description="Must be one of: Critical, High, Medium, Low")


class SimulationLLMResult(BaseModel):
    questions: list[SimQuestionOutput]
    feedback_summary: str
    meeting_brief: str
    response_guidance: str
    key_concerns: list[SimConcernOutput]
    likely_followup_questions: list[str]
    recommended_actions: list[str]
    confidence_level: str = Field(..., description="Must be one of: Low, Medium, High")


# ── API request ───────────────────────────────────────────────────────────────

class SimulationRunRequest(BaseModel):
    project_id: Optional[uuid.UUID] = None
    authority: str
    submission_type: str
    product_type: str
    stage: str
    focus_area: str


# ── API response ──────────────────────────────────────────────────────────────

class SimQuestionResponse(BaseModel):
    id: uuid.UUID
    topic: str
    severity: str
    question: str
    rationale: str
    order_index: int

    model_config = {"from_attributes": True}


class SimConcernResponse(BaseModel):
    id: uuid.UUID
    text: str
    severity: str

    model_config = {"from_attributes": True}


class SimFollowupResponse(BaseModel):
    id: uuid.UUID
    text: str

    model_config = {"from_attributes": True}


class SimActionResponse(BaseModel):
    id: uuid.UUID
    text: str
    priority: str

    model_config = {"from_attributes": True}


class SimulationSessionResponse(BaseModel):
    id: uuid.UUID
    project_id: Optional[uuid.UUID]
    authority: str
    submission_type: str
    product_type: str
    stage: str
    focus_area: str
    total_questions: int
    critical_count: int
    key_concerns_count: int
    readiness_score: float
    confidence_level: str
    feedback_summary: Optional[str]
    meeting_brief: Optional[str]
    response_guidance: Optional[str]
    questions: list[SimQuestionResponse] = []
    concerns: list[SimConcernResponse] = []
    followups: list[SimFollowupResponse] = []
    actions: list[SimActionResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulationListItem(BaseModel):
    id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    project_name: Optional[str] = None
    authority: str
    submission_type: str
    stage: str
    focus_area: str
    total_questions: int
    readiness_score: float
    confidence_level: str
    created_at: datetime

    model_config = {"from_attributes": True}
