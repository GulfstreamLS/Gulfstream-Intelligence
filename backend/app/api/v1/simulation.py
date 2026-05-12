import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1._audit import get_ip, log_audit
from app.db.session import get_db
from app.middleware.auth import get_current_user, check_active_subscription, require_plan
from app.models.chat import Conversation
from app.models.project import Project as ProjectModel
from app.models.simulation import SimulationSession
from app.models.user import User
from app.schemas.simulation import (
    SimulationListItem,
    SimulationRunRequest,
    SimulationSessionResponse,
)
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["simulation"])

_LOAD_FULL = [
    selectinload(SimulationSession.questions),
    selectinload(SimulationSession.concerns),
    selectinload(SimulationSession.followups),
    selectinload(SimulationSession.actions),
]


@router.post("/run", response_model=SimulationSessionResponse)
async def run_simulation(
    request: Request,
    body: SimulationRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_plan("professional")),
):
    """Run a new simulation and return the full session with all results."""
    # Require at least one regulatory chat before running a project simulation
    if body.project_id:
        chat_count = (
            await db.execute(
                select(func.count()).select_from(Conversation).where(
                    Conversation.project_id == body.project_id
                )
            )
        ).scalar_one()
        if chat_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This project has no regulatory chats. Start a chat first so the simulation has document context to work with.",
            )

    session = await simulation_service.run_simulation(
        db=db,
        user_id=current_user.id,
        project_id=body.project_id,
        authority=body.authority,
        submission_type=body.submission_type,
        product_type=body.product_type,
        stage=body.stage,
        focus_area=body.focus_area,
    )
    # Re-fetch with all relationships loaded
    result = await db.execute(
        select(SimulationSession)
        .options(*_LOAD_FULL)
        .where(SimulationSession.id == session.id)
    )
    full = result.scalar_one()
    await log_audit(
        db, current_user.id, "SIMULATION_RUN",
        resource_type="simulation",
        resource_id=full.id,
        resource_name=f"{full.authority} · {full.focus_area}",
        ip_address=get_ip(request),
    )
    return full


@router.get("/sessions", response_model=list[SimulationListItem])
async def list_sessions(
    project_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_active_subscription),
):
    """List all simulation sessions for the current user, optionally filtered by project."""
    stmt = (
        select(SimulationSession)
        .where(SimulationSession.user_id == current_user.id)
        .order_by(SimulationSession.created_at.desc())
    )
    if project_id:
        stmt = stmt.where(SimulationSession.project_id == project_id)
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    # Bulk-fetch project names to avoid N+1 queries
    project_ids = {s.project_id for s in sessions if s.project_id}
    project_names: dict[uuid.UUID, str] = {}
    if project_ids:
        proj_result = await db.execute(
            select(ProjectModel.id, ProjectModel.name).where(ProjectModel.id.in_(project_ids))
        )
        project_names = {row[0]: row[1] for row in proj_result}

    return [
        SimulationListItem(
            id=s.id,
            project_id=s.project_id,
            project_name=project_names.get(s.project_id) if s.project_id else None,
            authority=s.authority,
            submission_type=s.submission_type,
            stage=s.stage,
            focus_area=s.focus_area,
            total_questions=s.total_questions,
            readiness_score=s.readiness_score,
            confidence_level=s.confidence_level,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SimulationSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_active_subscription),
):
    result = await db.execute(
        select(SimulationSession)
        .options(*_LOAD_FULL)
        .where(SimulationSession.id == session_id, SimulationSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_active_subscription),
):
    result = await db.execute(
        select(SimulationSession).where(
            SimulationSession.id == session_id,
            SimulationSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    await db.delete(session)
    await db.commit()
