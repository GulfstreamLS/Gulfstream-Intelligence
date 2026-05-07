from fastapi import APIRouter

from app.api.v1 import auth, chat, health, projects, regulatory, assessments

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(chat.router)
router.include_router(regulatory.router)
router.include_router(assessments.router)
router.include_router(projects.router)

