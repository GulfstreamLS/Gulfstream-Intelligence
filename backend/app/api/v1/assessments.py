from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.models.regulatory import Gap, Action, AnalysisDocument, SeverityLevel
from app.schemas.assessment import (
    AnalyzedDocumentSummary,
    GapAssessmentResponse,
    DomainReadiness,
    SeverityStat,
    GapSummary,
    ActionItem,
)
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/assessments", tags=["assessments"])

KNOWN_DOMAINS = ["CMC", "Clinical", "Nonclinical", "Regulatory", "Safety", "Quality"]


def _normalize_domain(raw: str | None) -> str:
    if not raw:
        return "General"
    upper = raw.strip().upper()
    mapping = {
        "CMC": "CMC",
        "CLINICAL": "Clinical",
        "NONCLINICAL": "Nonclinical",
        "NON-CLINICAL": "Nonclinical",
        "NON CLINICAL": "Nonclinical",
        "REGULATORY": "Regulatory",
        "SAFETY": "Safety",
        "QUALITY": "Quality",
        "STRATEGY": "Regulatory",
        "GENERAL": "General",
    }
    return mapping.get(upper, raw.strip().title())


@router.get("/documents", response_model=list[AnalyzedDocumentSummary])
async def list_analyzed_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents the user has run analysis on, with gap counts."""
    stmt = (
        select(
            AnalysisDocument.id,
            AnalysisDocument.filename,
            AnalysisDocument.authority,
            AnalysisDocument.created_at,
            func.count(Gap.id).label("gap_count"),
        )
        .outerjoin(Gap, Gap.document_id == AnalysisDocument.id)
        .where(AnalysisDocument.user_id == current_user.id)
        .group_by(AnalysisDocument.id)
        .order_by(AnalysisDocument.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        AnalyzedDocumentSummary(
            id=r.id,
            filename=r.filename,
            authority=r.authority,
            gap_count=r.gap_count,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/global-gap", response_model=GapAssessmentResponse)
async def get_global_gap_assessment(
    authority: Optional[str] = None,
    document_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Gap).join(AnalysisDocument).where(AnalysisDocument.user_id == current_user.id)
    if authority:
        stmt = stmt.where(AnalysisDocument.authority.ilike(f"%{authority}%"))
    if document_id:
        stmt = stmt.where(AnalysisDocument.id == document_id)

    result = await db.execute(stmt)
    all_gaps = result.scalars().all()

    if not all_gaps:
        return GapAssessmentResponse(
            overall_readiness=0,
            readiness_vs_last=0,
            critical_gaps_count=0,
            high_priority_count=0,
            recommendations_count=0,
            domain_readiness=[],
            severity_distribution=[],
            top_gaps=[],
            next_steps=[],
        )

    total_gaps     = len(all_gaps)
    critical_count = sum(1 for g in all_gaps if str(g.severity).lower() == SeverityLevel.CRITICAL)
    high_count     = sum(1 for g in all_gaps if str(g.severity).lower() == SeverityLevel.HIGH)
    medium_count   = sum(1 for g in all_gaps if str(g.severity).lower() == SeverityLevel.MEDIUM)
    low_count      = sum(1 for g in all_gaps if str(g.severity).lower() == SeverityLevel.LOW)

    penalty = (critical_count * 15) + (high_count * 8) + (medium_count * 3) + (low_count * 1)
    overall_readiness = max(0, min(100, 100 - penalty))

    severity_distribution = [
        SeverityStat(severity="CRITICAL", count=critical_count, percentage=round(critical_count / total_gaps * 100, 1)),
        SeverityStat(severity="HIGH",     count=high_count,     percentage=round(high_count     / total_gaps * 100, 1)),
        SeverityStat(severity="MEDIUM",   count=medium_count,   percentage=round(medium_count   / total_gaps * 100, 1)),
        SeverityStat(severity="LOW",      count=low_count,      percentage=round(low_count      / total_gaps * 100, 1)),
    ]

    domain_gap_map: dict[str, list] = {}
    for g in all_gaps:
        domain = _normalize_domain(g.domain)
        domain_gap_map.setdefault(domain, []).append(g)

    domain_readiness = []
    ordered_domains = [d for d in KNOWN_DOMAINS if d in domain_gap_map]
    extra_domains   = [d for d in domain_gap_map if d not in KNOWN_DOMAINS]
    for domain in ordered_domains + extra_domains:
        gaps = domain_gap_map[domain]
        crit = sum(1 for g in gaps if str(g.severity).lower() == SeverityLevel.CRITICAL)
        high = sum(1 for g in gaps if str(g.severity).lower() == SeverityLevel.HIGH)
        med  = sum(1 for g in gaps if str(g.severity).lower() == SeverityLevel.MEDIUM)
        low  = sum(1 for g in gaps if str(g.severity).lower() == SeverityLevel.LOW)
        penalty_d = (crit * 20) + (high * 10) + (med * 5) + (low * 2)
        score = max(0, min(100, 100 - penalty_d))
        domain_readiness.append(DomainReadiness(domain=domain, readiness=score, difference=score - 100))

    severity_order = {SeverityLevel.CRITICAL: 0, SeverityLevel.HIGH: 1, SeverityLevel.MEDIUM: 2, SeverityLevel.LOW: 3}
    sorted_gaps = sorted(all_gaps, key=lambda g: severity_order.get(str(g.severity).lower(), 4))
    top_gaps = [
        GapSummary(
            id=g.id,
            domain=_normalize_domain(g.domain),
            title=g.title,
            severity=str(g.severity).upper(),
            impact="HIGH" if str(g.severity).lower() in (SeverityLevel.CRITICAL, SeverityLevel.HIGH) else "MEDIUM",
            status="OPEN",
        )
        for g in sorted_gaps[:5]
    ]

    action_stmt = (
        select(Action)
        .join(AnalysisDocument)
        .where(AnalysisDocument.user_id == current_user.id)
    )
    if authority:
        action_stmt = action_stmt.where(AnalysisDocument.authority.ilike(f"%{authority}%"))
    if document_id:
        action_stmt = action_stmt.where(AnalysisDocument.id == document_id)
    action_stmt = action_stmt.limit(5)
    action_result = await db.execute(action_stmt)
    actions = action_result.scalars().all()

    next_steps = [
        ActionItem(title=a.title, description=a.description, priority=a.priority or "Medium")
        for a in actions
    ]

    return GapAssessmentResponse(
        overall_readiness=overall_readiness,
        readiness_vs_last=0,
        critical_gaps_count=critical_count,
        high_priority_count=high_count,
        recommendations_count=len(actions),
        domain_readiness=domain_readiness,
        severity_distribution=severity_distribution,
        top_gaps=top_gaps,
        next_steps=next_steps,
    )
