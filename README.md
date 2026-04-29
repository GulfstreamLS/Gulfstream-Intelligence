# Gulfstream Intelligence — Project Guide

## Overview
Agentic AI intelligence platform. Next.js 15 frontend + FastAPI backend, deployed on GCP Cloud Run.

## Structure
```
├── backend/       FastAPI app (Python 3.12)
├── frontend/      Next.js 15 app (TypeScript)
├── infrastructure/
│   └── terraform/ GCP infra as code
└── .github/
    └── workflows/ CI (test + build) and CD (deploy to Cloud Run)
```

## Quick Start

### Local dev with Docker Compose
```bash
cp backend/.env.example backend/.env   # fill in API keys
cp frontend/.env.example frontend/.env
docker compose up
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Backend only
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend only
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Key conventions
- Backend: async throughout (asyncpg + SQLAlchemy async). All routes in `app/api/v1/`.
- AI streaming: SSE via `text/event-stream`, chunks are `{"type":"delta","content":"..."}` then `{"type":"done","message_id":"..."}`.
- Auth: JWT in `Authorization: Bearer <token>` header. Tokens stored in cookies on the frontend.
- Models: `claude-sonnet-4-6` default. Model prefix determines provider (`claude-*` → Anthropic, `gpt-*`/`o*` → OpenAI).

## GCP deployment
- Services: Cloud Run (frontend + backend), Cloud SQL Postgres 16, Memorystore Redis, Secret Manager, Artifact Registry.
- Terraform state in GCS bucket (update `backend "gcs"` in `infrastructure/terraform/main.tf`).
- CI/CD via GitHub Actions (Workload Identity Federation — no long-lived keys).

## Environment secrets (GitHub)
| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_REGION` | e.g. `us-central1` |
| `GCP_WIF_PROVIDER` | Workload Identity pool provider resource name |
| `GCP_SA_EMAIL` | Service account email for deployments |
