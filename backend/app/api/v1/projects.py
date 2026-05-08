import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1._audit import get_ip, log_audit
from app.db.session import get_db
from app.middleware.auth import get_user_or_none
from app.models.chat import Conversation
from app.models.project import Project
from app.models.user import User
from app.schemas.chat import ConversationResponse
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_user_id(db: AsyncSession, user: Optional[User]) -> uuid.UUID:
    if user:
        return user.id
    result = await db.execute(select(User).limit(1))
    mock = result.scalar_one_or_none()
    if not mock:
        raise HTTPException(status_code=500, detail="No users found in database.")
    return mock.id


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    authority: Optional[str] = None,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    q = select(Project).where(Project.user_id == user_id)

    if search:
        term = f"%{search}%"
        q = q.where(
            Project.name.ilike(term)
            | Project.indication.ilike(term)
            | Project.therapeutic_area.ilike(term)
        )
    if status_filter:
        q = q.where(Project.status == status_filter)
    if authority:
        q = q.where(Project.authorities.contains([authority]))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    q = q.order_by(Project.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()

    return ProjectListResponse(items=list(rows), total=total, page=page, page_size=page_size)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: Request,
    data: ProjectCreate,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    project = Project(user_id=user_id, **data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    if current_user:
        await log_audit(db, current_user.id, "PROJECT_CREATED", resource_type="project", resource_id=project.id, resource_name=project.name, ip_address=get_ip(request))
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    project = await db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    request: Request,
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    project = await db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    if current_user:
        await log_audit(db, current_user.id, "PROJECT_UPDATED", resource_type="project", resource_id=project.id, resource_name=project.name, ip_address=get_ip(request))
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    request: Request,
    project_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    project = await db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    project_name = project.name
    await db.execute(update(Conversation).where(Conversation.project_id == project_id).values(project_id=None))
    await db.delete(project)
    await db.commit()
    if current_user:
        await log_audit(db, current_user.id, "PROJECT_DELETED", resource_type="project", resource_id=project_id, resource_name=project_name, ip_address=get_ip(request))


@router.get("/{project_id}/conversations", response_model=list[ConversationResponse])
async def get_project_conversations(
    project_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id(db, current_user)
    project = await db.get(Project, project_id)
    if not project or project.user_id != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    result = await db.execute(
        select(Conversation)
        .where(Conversation.project_id == project_id)
        .options(selectinload(Conversation.messages), selectinload(Conversation.project))
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/import", response_model=dict)
async def import_projects(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Import projects from an XLSX file. Expected columns: Name, Type, Indication,
    Therapeutic Area, Dev Phase, Status, Authorities, Readiness Score."""
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed")

    user_id = await _get_user_id(db, current_user)
    contents = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(contents), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise HTTPException(status_code=400, detail="File is empty")

    headers = [str(h).strip().lower() if h else "" for h in rows[0]]

    def col(row, name):
        try:
            idx = headers.index(name)
            return row[idx]
        except ValueError:
            return None

    created, errors = 0, []
    for i, row in enumerate(rows[1:], start=2):
        name = col(row, "name")
        if not name:
            errors.append(f"Row {i}: missing Name")
            continue
        raw_auth = col(row, "authorities")
        authorities = [a.strip() for a in str(raw_auth).split(",")] if raw_auth else []
        raw_score = col(row, "readiness score")
        try:
            readiness_score = int(raw_score) if raw_score is not None else 0
        except (ValueError, TypeError):
            readiness_score = 0

        project = Project(
            user_id=user_id,
            name=str(name),
            type=str(col(row, "type") or "IND"),
            indication=str(col(row, "indication") or "") or None,
            therapeutic_area=str(col(row, "therapeutic area") or "") or None,
            dev_phase=str(col(row, "dev phase") or "") or None,
            status=str(col(row, "status") or "Planning"),
            readiness_score=readiness_score,
            authorities=authorities if authorities else None,
            product_type=str(col(row, "product type") or "") or None,
        )
        db.add(project)
        created += 1

    await db.commit()
    return {"created": created, "errors": errors}
