from fastapi import APIRouter

from app.api.v1 import admin, assessments, auth, billing, chat, health, lookups, notifications, organizations, projects, regulatory, simulation, support

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(chat.router)
router.include_router(regulatory.router)
router.include_router(assessments.router)
router.include_router(projects.router)
router.include_router(simulation.router)
router.include_router(lookups.router)
router.include_router(organizations.router)
router.include_router(notifications.router)
router.include_router(billing.router)
router.include_router(admin.router)
router.include_router(support.router)
