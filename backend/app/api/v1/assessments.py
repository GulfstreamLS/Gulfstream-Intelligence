from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.db.session import get_db
from app.models.chat import Conversation
from app.api.v1._audit import get_ip, log_audit
from app.models.project import Project
from app.models.notification import Notification, NotificationType
from app.models.organization import MemberRole, Organization, OrganizationMember
from app.models.regulatory import Gap, AnalysisDocument, SeverityLevel, GapAssessmentRun
from app.schemas.assessment import (
    AssessmentDocumentSummary,
    AnalyzedDocumentSummary,
    GapAssessmentRunCreate,
    GapAssessmentRunResponse,
    GapAssessmentResponse,
    DomainReadiness,
    ManualGapAssessmentRequest,
    SeverityStat,
    GapSummary,
    ActionItem,
)
from app.services.analysis_service import analysis_service
from app.services import email_service
from app.middleware.auth import get_current_user, require_plan
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


def _visible_analysis_document_filter():
    return or_(
        AnalysisDocument.conversation_id.is_(None),
        Conversation.is_temporary == False,  # noqa: E712
    )


def _accessible_analysis_document_filter(current_user: User):
    if current_user.organization_id:
        return AnalysisDocument.organization_id == current_user.organization_id
    return AnalysisDocument.user_id == current_user.id


def _document_source(doc: AnalysisDocument) -> str:
    if doc.conversation_id:
        return "Regulatory Chat"
    if doc.project_id and doc.gaps:
        return "Gap Assessment"
    if doc.project_id:
        return "Project Upload"
    return "Standalone Upload"


def _doc_summary(doc: AnalysisDocument) -> AssessmentDocumentSummary:
    return AssessmentDocumentSummary(
        id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        authority=doc.authority,
        source=_document_source(doc),
        created_at=doc.created_at,
    )


async def _get_accessible_project(project_id: UUID, current_user: User, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    accessible = project and (
        project.user_id == current_user.id
        or (current_user.organization_id and project.organization_id == current_user.organization_id)
    )
    if not accessible:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _load_assessment_documents(
    db: AsyncSession,
    current_user: User,
    authority: Optional[str] = None,
    document_ids: Optional[list[UUID]] = None,
    project_id: Optional[UUID] = None,
    source: Optional[str] = None,
) -> list[AnalysisDocument]:
    stmt = (
        select(AnalysisDocument)
        .options(selectinload(AnalysisDocument.gaps), selectinload(AnalysisDocument.actions))
        .outerjoin(Conversation, Conversation.id == AnalysisDocument.conversation_id)
        .where(_accessible_analysis_document_filter(current_user))
        .where(_visible_analysis_document_filter())
    )
    if authority:
        stmt = stmt.where(AnalysisDocument.authority.ilike(f"%{authority}%"))
    if document_ids:
        stmt = stmt.where(AnalysisDocument.id.in_(document_ids))
    if project_id:
        stmt = stmt.where(AnalysisDocument.project_id == project_id)
    if source == "chat":
        stmt = stmt.where(AnalysisDocument.conversation_id.is_not(None))

    result = await db.execute(stmt.order_by(AnalysisDocument.created_at.desc()))
    return result.scalars().unique().all()


def _build_assessment_response(docs: list[AnalysisDocument]) -> GapAssessmentResponse:
    all_gaps = [gap for doc in docs for gap in doc.gaps]
    gap_doc_name = {gap.id: doc.filename for doc in docs for gap in doc.gaps}

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
            documents_reviewed=[_doc_summary(doc) for doc in docs],
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
            why_this_matters=g.description,
            health_authority_relevance=g.regulatory_impact,
            source_evidence=g.quoted_excerpt,
            document_reference=g.page_reference or gap_doc_name.get(g.id),
            recommended_action=g.recommended_action,
            suggested_owner=f"{_normalize_domain(g.domain)} lead",
            target_date="Before next regulatory milestone",
            priority_level=str(g.severity).upper(),
        )
        for g in sorted_gaps[:5]
    ]

    actions = [action for doc in docs for action in doc.actions][:5]
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
        documents_reviewed=[_doc_summary(doc) for doc in docs],
    )


async def _notify_owner_critical_gaps(
    db: AsyncSession,
    current_user: User,
    critical_count: int,
    context: str,
    resource_id: UUID | str | None = None,
) -> None:
    if critical_count <= 0 or not current_user.organization_id:
        return

    owner_result = await db.execute(
        select(User, Organization)
        .join(OrganizationMember, OrganizationMember.user_id == User.id)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(
            OrganizationMember.organization_id == current_user.organization_id,
            OrganizationMember.role == MemberRole.OWNER,
        )
    )
    row = owner_result.first()
    if not row:
        return
    owner, org = row
    if owner.id == current_user.id:
        return
    if not (owner.preferences or {}).get("high_priority_alerts", True):
        return

    actor = current_user.full_name or current_user.email
    db.add(Notification(
        user_id=owner.id,
        type=NotificationType.CRITICAL_GAP_ALERT,
        title="Critical gaps detected",
        body=f"{actor} completed an analysis with {critical_count} critical gap{'s' if critical_count != 1 else ''}.",
        resource_type="gap_assessment",
        resource_id=str(resource_id) if resource_id else None,
    ))
    try:
        email_service.send_critical_gap_alert(owner.email, org.name, actor, critical_count, context)
    except Exception:
        pass


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
            AnalysisDocument.confidence_score,
            AnalysisDocument.created_at,
            func.count(Gap.id).label("gap_count"),
        )
        .outerjoin(Gap, Gap.document_id == AnalysisDocument.id)
        .outerjoin(Conversation, Conversation.id == AnalysisDocument.conversation_id)
        .where(_accessible_analysis_document_filter(current_user))
        .where(_visible_analysis_document_filter())
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
            confidence_score=r.confidence_score,
            gap_count=r.gap_count,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/global-gap", response_model=GapAssessmentResponse)
async def get_global_gap_assessment(
    authority: Optional[str] = None,
    document_id: Optional[UUID] = None,
    document_ids: Optional[str] = None,
    project_id: Optional[UUID] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_plan("professional")),
):
    if project_id:
        await _get_accessible_project(project_id, current_user, db)
    parsed_document_ids = [document_id] if document_id else None
    if document_ids:
        parsed_document_ids = [UUID(value) for value in document_ids.split(",") if value.strip()]

    docs = await _load_assessment_documents(
        db,
        current_user,
        authority=authority,
        document_ids=parsed_document_ids,
        project_id=project_id,
        source=source,
    )
    return _build_assessment_response(docs)


@router.post("/manual-analysis", response_model=GapAssessmentResponse)
async def run_manual_gap_assessment(
    payload: ManualGapAssessmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_plan("professional")),
):
    details = payload.program_details.strip()
    if len(details) < 20:
        raise HTTPException(status_code=400, detail="Please provide enough program details to assess.")

    if payload.project_id:
        await _get_accessible_project(payload.project_id, current_user, db)

    filename = "general-assessment-session.txt" if payload.source_type.lower().startswith("general") else "pasted-program-details.txt"
    doc = await analysis_service.analyze_text(
        db,
        current_user.id,
        details,
        filename=filename,
        authority=payload.authority,
        project_id=payload.project_id,
        organization_id=current_user.organization_id,
        source_basis=payload.source_type,
    )
    docs = await _load_assessment_documents(db, current_user, document_ids=[doc.id])
    assessment = _build_assessment_response(docs)
    await _notify_owner_critical_gaps(
        db,
        current_user,
        assessment.critical_gaps_count,
        payload.assessment_type,
        doc.id,
    )
    await db.commit()
    return assessment


def _run_response(run: GapAssessmentRun) -> GapAssessmentRunResponse:
    return GapAssessmentRunResponse(
        id=run.id,
        project_id=run.project_id,
        source_type=run.source_type,
        assessment_type=run.assessment_type,
        regions=run.regions or [],
        document_ids=run.document_ids or [],
        documents_reviewed=[
            AssessmentDocumentSummary(**doc) for doc in (run.documents_reviewed or [])
        ],
        confidence_level=run.confidence_level,
        readiness_score=run.readiness_score,
        critical_gaps_count=run.critical_gaps_count,
        high_priority_count=run.high_priority_count,
        recommendations_count=run.recommendations_count,
        top_risks=run.top_risks or [],
        recommendations=run.recommendations or [],
        created_at=run.created_at,
        updated_at=run.updated_at,
    )


@router.post("/runs", response_model=GapAssessmentRunResponse)
async def create_gap_assessment_run(
    payload: GapAssessmentRunCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_plan("professional")),
):
    if payload.project_id:
        project = await _get_accessible_project(payload.project_id, current_user, db)
    else:
        project = None

    authority = payload.regions[0] if len(payload.regions) == 1 and payload.regions[0].lower() != "global" else None
    docs = await _load_assessment_documents(
        db,
        current_user,
        authority=authority,
        document_ids=payload.document_ids or None,
        project_id=payload.project_id,
    )
    assessment = _build_assessment_response(docs)

    run = GapAssessmentRun(
        user_id=current_user.id,
        project_id=payload.project_id,
        organization_id=current_user.organization_id,
        source_type=payload.source_type,
        assessment_type=payload.assessment_type,
        regions=payload.regions,
        document_ids=[str(doc.id) for doc in assessment.documents_reviewed],
        documents_reviewed=[doc.model_dump(mode="json") for doc in assessment.documents_reviewed],
        confidence_level=payload.confidence_level,
        readiness_score=assessment.overall_readiness,
        critical_gaps_count=assessment.critical_gaps_count,
        high_priority_count=assessment.high_priority_count,
        recommendations_count=assessment.recommendations_count,
        top_risks=[gap.title for gap in assessment.top_gaps[:3]],
        recommendations=[step.title for step in assessment.next_steps[:3]],
    )
    db.add(run)

    if project:
        project.readiness_score = assessment.overall_readiness

    await db.flush()
    await log_audit(
        db, current_user.id, "GLOBAL_GAP_ASSESSMENT_RUN",
        resource_type="gap_assessment",
        resource_id=run.id,
        resource_name=payload.assessment_type,
        ip_address=get_ip(request),
        organization_id=current_user.organization_id,
    )
    await _notify_owner_critical_gaps(
        db,
        current_user,
        assessment.critical_gaps_count,
        payload.assessment_type,
        run.id,
    )
    await db.commit()
    await db.refresh(run)
    return _run_response(run)


@router.get("/runs/{run_id}", response_model=GapAssessmentRunResponse)
async def get_gap_assessment_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = await db.get(GapAssessmentRun, run_id)
    accessible = run and (
        run.user_id == current_user.id
        or (current_user.organization_id and run.organization_id == current_user.organization_id)
    )
    if not accessible:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return _run_response(run)


@router.get("/projects/{project_id}/runs", response_model=list[GapAssessmentRunResponse])
async def list_project_gap_assessment_runs(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_accessible_project(project_id, current_user, db)
    result = await db.execute(
        select(GapAssessmentRun)
        .where(GapAssessmentRun.project_id == project_id)
        .order_by(GapAssessmentRun.created_at.desc())
    )
    return [_run_response(run) for run in result.scalars().all()]


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gap_assessment_run(
    run_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = await db.get(GapAssessmentRun, run_id)
    if not run or run.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assessment not found")
    await db.delete(run)
    await log_audit(
        db, current_user.id, "GLOBAL_GAP_ASSESSMENT_DELETED",
        resource_type="gap_assessment",
        resource_id=run_id,
        resource_name=run.assessment_type,
        ip_address=get_ip(request),
        organization_id=current_user.organization_id,
    )
    await db.commit()
