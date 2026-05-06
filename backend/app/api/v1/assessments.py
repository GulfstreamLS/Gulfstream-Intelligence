from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.models.regulatory import Gap, Action, AnalysisDocument, SeverityLevel
from app.schemas.assessment import (
    GapAssessmentResponse, 
    DomainReadiness, 
    SeverityStat, 
    GapSummary, 
    ActionItem
)
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/assessments", tags=["assessments"])

@router.get("/global-gap", response_model=GapAssessmentResponse)
async def get_global_gap_assessment(
    authority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch all gaps for the user
    # We join with AnalysisDocument to filter by user_id and optionally authority
    stmt = select(Gap).join(AnalysisDocument).where(AnalysisDocument.user_id == current_user.id)
    
    if authority:
        # Match case-insensitive or exact depending on your data
        stmt = stmt.where(AnalysisDocument.authority.ilike(f"%{authority}%"))
        
    result = await db.execute(stmt)
    all_gaps = result.scalars().all()

    if not all_gaps:
        # Return empty state if no data
        return GapAssessmentResponse(
            overall_readiness=0,
            readiness_vs_last=0,
            critical_gaps_count=0,
            high_priority_count=0,
            recommendations_count=0,
            domain_readiness=[],
            severity_distribution=[],
            top_gaps=[],
            next_steps=[]
        )

    # 2. Calculate Statistics
    total_gaps = len(all_gaps)
    critical_count = sum(1 for g in all_gaps if g.severity == SeverityLevel.CRITICAL)
    high_count = sum(1 for g in all_gaps if g.severity == SeverityLevel.HIGH)
    medium_count = sum(1 for g in all_gaps if g.severity == SeverityLevel.MEDIUM)
    low_count = sum(1 for g in all_gaps if g.severity == SeverityLevel.LOW)

    # Simple readiness calculation logic (can be refined)
    # Deduct points based on gap severity
    penalty = (critical_count * 10) + (high_count * 5) + (medium_count * 2) + (low_count * 1)
    overall_readiness = max(0, min(100, 100 - (penalty // max(1, (total_gaps // 5)))))

    # 3. Severity Distribution
    severity_distribution = [
        SeverityStat(severity="CRITICAL", count=critical_count, percentage=round(critical_count/total_gaps*100, 1)),
        SeverityStat(severity="HIGH", count=high_count, percentage=round(high_count/total_gaps*100, 1)),
        SeverityStat(severity="MEDIUM", count=medium_count, percentage=round(medium_count/total_gaps*100, 1)),
        SeverityStat(severity="LOW", count=low_count, percentage=round(low_count/total_gaps*100, 1)),
    ]

    # 4. Domain Readiness (Aggregated by domain)
    domains = ["CMC", "NON-CLINICAL", "CLINICAL", "SAFETY", "REGULATORY", "QUALITY"]
    domain_readiness = []
    for domain in domains:
        domain_gaps = [g for g in all_gaps if g.domain and g.domain.upper() == domain]
        d_penalty = sum(1 for g in domain_gaps if g.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH])
        d_readiness = max(-20, min(20, 15 - (d_penalty * 5))) # Matching the +/- % style in UI
        domain_readiness.append(DomainReadiness(
            domain=domain,
            readiness=d_readiness,
            difference=d_readiness # Mocking the diff vs expectation
        ))

    # 5. Top Gaps (Latest 5 critical/high)
    sorted_gaps = sorted(all_gaps, key=lambda x: (x.severity != SeverityLevel.CRITICAL, x.severity != SeverityLevel.HIGH))
    top_gaps = [
        GapSummary(
            id=g.id,
            domain=g.domain or "General",
            title=g.title,
            severity=g.severity.upper(),
            impact="HIGH" if g.severity == SeverityLevel.CRITICAL else "MEDIUM",
            status="OPEN"
        ) for g in sorted_gaps[:5]
    ]

    # 6. Next Steps (Actions)
    action_stmt = select(Action).join(AnalysisDocument).where(AnalysisDocument.user_id == current_user.id)
    if authority:
        action_stmt = action_stmt.where(AnalysisDocument.authority.ilike(f"%{authority}%"))
    
    action_stmt = action_stmt.limit(5)
    action_result = await db.execute(action_stmt)
    actions = action_result.scalars().all()
    
    next_steps = [
        ActionItem(title=a.title, description=a.description, priority=a.priority or "Medium")
        for a in actions
    ]

    return GapAssessmentResponse(
        overall_readiness=overall_readiness,
        readiness_vs_last=8, # Mocked trend
        critical_gaps_count=critical_count,
        high_priority_count=high_count,
        recommendations_count=len(actions),
        domain_readiness=domain_readiness,
        severity_distribution=severity_distribution,
        top_gaps=top_gaps,
        next_steps=next_steps
    )
