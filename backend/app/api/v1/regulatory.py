import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1._audit import get_ip, log_audit
from app.api.v1.assessments import _accessible_analysis_document_filter, _notify_owner_critical_gaps
from app.db.session import get_db
from app.middleware.auth import get_current_user, get_user_or_none, check_active_subscription
from app.models.chat import Conversation
from app.models.project import Project
from app.models.regulatory import AnalysisDocument, RegulatorySource
from app.models.user import User
from app.schemas.regulatory import DocumentAnalysisResponse
from app.services.analysis_service import analysis_service
from app.services.vector_service import vector_service

router = APIRouter(prefix="/regulatory", tags=["regulatory"])


def _visible_analysis_document_filter():
    return or_(
        AnalysisDocument.conversation_id.is_(None),
        Conversation.is_temporary == False,  # noqa: E712
    )


@router.get("/authorities", response_model=list[str])
async def list_authorities(db: AsyncSession = Depends(get_db)):
    """List all unique regulatory authorities in the system."""
    result = await db.execute(select(RegulatorySource.authority).distinct())
    authorities = [row[0] for row in result.all()]
    return sorted(authorities)


@router.post("/analysis/upload", response_model=DocumentAnalysisResponse)
async def upload_for_analysis(
    request: Request,
    file: UploadFile = File(...),
    authority: str = Form(None),
    project_id: uuid.UUID | None = Form(None),
    current_user: User = Depends(check_active_subscription),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document for regulatory gap analysis."""
    # For development/test-ui, we allow a mock user if none is provided
    if not current_user:
        user_result = await db.execute(select(User).limit(1))
        mock_user = user_result.scalar_one_or_none()
        if not mock_user:
            raise HTTPException(status_code=500, detail="No users found in database to assign analysis to.")
        user_id = mock_user.id
    else:
        user_id = current_user.id

    if project_id and current_user:
        project = await db.get(Project, project_id)
        accessible = project and (
            project.user_id == current_user.id
            or (current_user.organization_id and project.organization_id == current_user.organization_id)
        )
        if not accessible:
            raise HTTPException(status_code=404, detail="Project not found")

    content = await file.read()
    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in ["pdf", "docx", "doc", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, Word, or TXT documents.",
        )

    try:
        doc = await analysis_service.analyze_document(
            db,
            user_id,
            content,
            file.filename,
            file_extension,
            authority=authority,
            project_id=project_id,
            organization_id=current_user.organization_id if current_user else None,
        )
        # Fetch with relationships for the response
        result = await db.execute(
            select(AnalysisDocument)
            .options(
                selectinload(AnalysisDocument.gaps),
                selectinload(AnalysisDocument.insights),
                selectinload(AnalysisDocument.actions),
            )
            .where(AnalysisDocument.id == doc.id)
        )
        full_doc = result.scalar_one()
        if current_user:
            await log_audit(
                db, current_user.id, "GAP_ASSESSMENT_RUN",
                resource_type="document",
                resource_id=full_doc.id,
                resource_name=file.filename,
                ip_address=get_ip(request),
                organization_id=current_user.organization_id,
            )
            critical_count = sum(1 for gap in full_doc.gaps if str(gap.severity).lower() == "critical")
            await _notify_owner_critical_gaps(db, current_user, critical_count, file.filename, full_doc.id)
            await db.commit()
        return full_doc
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/{document_id}", response_model=DocumentAnalysisResponse)
async def get_analysis_result(
    document_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Retrieve the results of a previous analysis."""
    result = await db.execute(
        select(AnalysisDocument)
        .options(
            selectinload(AnalysisDocument.gaps),
            selectinload(AnalysisDocument.insights),
            selectinload(AnalysisDocument.actions),
        )
        .outerjoin(Conversation, Conversation.id == AnalysisDocument.conversation_id)
        .where(AnalysisDocument.id == document_id)
        .where(_accessible_analysis_document_filter(current_user))
        .where(_visible_analysis_document_filter())
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return doc


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_regulatory_knowledge(
    authority: str = Form(...),
    title: str = Form(...),
    content: str = Form(None),
    file: UploadFile = File(None),
    source_url: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Seed the regulatory knowledge base via text or file upload."""
    # Only superusers or specific roles should do this in production

    final_content = content
    if file:
        file_content = await file.read()
        file_extension = file.filename.split(".")[-1].lower()
        from app.services.document_processor import document_processor

        final_content = document_processor.extract_text(file_content, file_extension)

    if not final_content:
        raise HTTPException(status_code=400, detail="Either content or file must be provided")

    await vector_service.add_regulatory_content(db, authority, title, final_content, source_url)
    await db.commit()
    return {"message": f"Knowledge '{title}' seeded successfully"}


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get the total count of ingested records and unique documents, with a per-authority breakdown."""
    from sqlalchemy import func, distinct
    
    # Count total chunks
    result_chunks = await db.execute(select(func.count()).select_from(RegulatorySource))
    chunk_count = result_chunks.scalar() or 0
    
    # Count unique documents by title
    result_docs = await db.execute(select(func.count(distinct(RegulatorySource.title))).select_from(RegulatorySource))
    doc_count = result_docs.scalar() or 0
    
    # Per-authority breakdown
    breakdown = {}
    res_auths = await db.execute(select(distinct(RegulatorySource.authority)))
    authorities = res_auths.scalars().all()
    
    for auth in authorities:
        if not auth:
            continue
        
        # Chunks per authority
        res_chunks_auth = await db.execute(
            select(func.count()).select_from(RegulatorySource).where(RegulatorySource.authority == auth)
        )
        chunks_auth = res_chunks_auth.scalar() or 0
        
        # Unique documents per authority
        res_docs_auth = await db.execute(
            select(func.count(distinct(RegulatorySource.title))).select_from(RegulatorySource).where(RegulatorySource.authority == auth)
        )
        docs_auth = res_docs_auth.scalar() or 0
        
        breakdown[auth] = {
            "chunks": chunks_auth,
            "documents": docs_auth
        }
        
    return {
        "total_chunks": chunk_count,
        "total_documents": doc_count,
        "breakdown": breakdown
    }


@router.post("/seed-demo")
async def seed_demo(background_tasks: BackgroundTasks, limit: int = 150):
    """FOR DEMO: Instantly inject high-quality records."""
    from scripts.seed_demo_data import seed_demo_data
    background_tasks.add_task(seed_demo_data, limit)
    return {"message": f"Demo seeding started in background for {limit} records"}


@router.post("/ingest-fda", status_code=status.HTTP_202_ACCEPTED)
async def trigger_fda_ingestion(
    background_tasks: BackgroundTasks,
    limit: int = 50,
):
    """Trigger a background job to ingest documents from the FDA."""
    from app.services.ingestion_service import ingestion_service

    background_tasks.add_task(ingestion_service.ingest_all, limit)
    return {
        "message": f"FDA Ingestion started for {limit} documents in the background. Check logs for progress."
    }


@router.post("/ingest-ema", status_code=status.HTTP_202_ACCEPTED)
async def trigger_ema_ingestion(
    background_tasks: BackgroundTasks,
    limit: int = 50,
    status_filter: str = "Adopted",
):
    """Trigger a background job to ingest documents from the EMA."""
    from app.services.ingestion_service import ingestion_service

    background_tasks.add_task(ingestion_service.ingest_ema_all, limit, status_filter)
    return {
        "message": f"EMA Ingestion started for {limit} documents with status '{status_filter}' in the background. Check logs for progress."
    }


@router.post("/ingest-tga", status_code=status.HTTP_202_ACCEPTED)
async def trigger_tga_ingestion(
    background_tasks: BackgroundTasks,
    limit: int = 50,
):
    """Trigger a background job to ingest documents from the TGA."""
    from app.services.ingestion_service import ingestion_service

    background_tasks.add_task(ingestion_service.ingest_tga_all, limit)
    return {
        "message": f"TGA Ingestion started for {limit} documents in the background. Check logs for progress."
    }

