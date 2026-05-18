import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import router as api_v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.tasks.cleanup import run_cleanup_loop

# Configure logging immediately at import time so third-party loggers
# (SQLAlchemy, httpx, asyncpg) are silenced before they emit anything.
configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()  # re-apply after any framework resets
    cleanup_task = asyncio.create_task(run_cleanup_loop())
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(o) for o in settings.ALLOWED_ORIGINS] or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    # Mount test UI
    import os

    app.mount("/test-ui", StaticFiles(directory="static_tests"), name="test-ui")

    # Mount Media for local fallback
    media_dir = os.path.join(os.getcwd(), "media")
    if not os.path.exists(media_dir):
        os.makedirs(media_dir, exist_ok=True)
    app.mount("/media", StaticFiles(directory=media_dir), name="media")

    return app


app = create_app()
