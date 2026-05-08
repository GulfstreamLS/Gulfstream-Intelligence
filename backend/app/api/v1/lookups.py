import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.middleware.auth import get_user_or_none
from app.models.lookup import LookupValue
from app.models.user import User

router = APIRouter(prefix="/lookups", tags=["lookups"])

ALLOWED_CATEGORIES = {"therapeutic_area", "dev_phase", "product_type"}


class LookupAddRequest(BaseModel):
    value: str


class LookupValueResponse(BaseModel):
    value: str
    is_default: bool
    model_config = {"from_attributes": True}


async def _get_user_id(db: AsyncSession, user: Optional[User]) -> Optional[uuid.UUID]:
    if user:
        return user.id
    return None


@router.get("/{category}", response_model=list[str])
async def list_lookup_values(
    category: str,
    db: AsyncSession = Depends(get_db),
):
    """Return all values for a lookup category, defaults first then user-added alphabetically."""
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
    result = await db.execute(
        select(LookupValue.value)
        .where(LookupValue.category == category)
        .order_by(LookupValue.is_default.desc(), LookupValue.value.asc())
    )
    return [row[0] for row in result]


@router.post("/{category}", response_model=str, status_code=status.HTTP_201_CREATED)
async def add_lookup_value(
    category: str,
    body: LookupAddRequest,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Add a custom value to a lookup category. Returns the saved value string."""
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
    value = body.value.strip()
    if not value:
        raise HTTPException(status_code=422, detail="Value cannot be empty")

    # Check if already exists (case-insensitive)
    existing = await db.execute(
        select(LookupValue.value).where(
            LookupValue.category == category,
            LookupValue.value.ilike(value),
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        return row  # return the existing canonical value

    user_id = await _get_user_id(db, current_user)
    entry = LookupValue(category=category, value=value, is_default=False, created_by=user_id)
    db.add(entry)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # Race condition — return existing
        result = await db.execute(
            select(LookupValue.value).where(
                LookupValue.category == category, LookupValue.value == value
            )
        )
        return result.scalar_one()
    return value
