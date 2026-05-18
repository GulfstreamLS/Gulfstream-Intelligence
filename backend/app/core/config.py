from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "Gulfstream Intelligence"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # API
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: list[str] = []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list) -> list:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Security
    APP_SECRET_KEY: str = "change-me-in-production-use-secrets-manager"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Database (Cloud SQL via Unix socket on GCP, TCP locally)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/gulfstream"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis (Memorystore on GCP)
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Providers
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: Literal["anthropic", "openai"] = "openai"
    DEFAULT_MODEL: str = "gpt-5.4-mini"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # GCP
    GCP_PROJECT_ID: str = ""
    GCP_REGION: str = "us-central1"
    GCS_BUCKET_NAME: str = ""

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Stripe Price IDs (Placeholders)
    STRIPE_PRICE_STARTER_MONTHLY: str = "price_starter_mo"
    STRIPE_PRICE_STARTER_ANNUAL: str = "price_starter_ann"
    STRIPE_PRICE_PROFESSIONAL_MONTHLY: str = "price_prof_mo"
    STRIPE_PRICE_PROFESSIONAL_ANNUAL: str = "price_prof_ann"
    STRIPE_PRICE_BUSINESS_MONTHLY: str = "price_biz_mo"
    STRIPE_PRICE_BUSINESS_ANNUAL: str = "price_biz_ann"

    # Admin
    ADMIN_SECRET_KEY: str = "gs-admin-k3y-2026"

    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
