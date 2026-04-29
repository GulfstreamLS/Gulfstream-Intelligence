# Gulfstream Intelligence — Developer Guide

> Full requirements: `docs/REQUIREMENTS.md`

## What This Is

A **regulatory intelligence operating system** for life sciences / pharma. NOT a chatbot.
The Regulatory Core is the central brain — every module reads from it and writes back to it.

## Confirmed Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query |
| Backend API | **FastAPI (Python)**, SQLAlchemy async, Alembic, PostgreSQL |
| AI Service | **Python FastAPI** (separate service — orchestration, routing, retrieval) |
| Database | PostgreSQL (Cloud SQL) + **pgvector** + Row-Level Security |
| Cloud | GCP — Cloud Run, Cloud SQL, Storage, Pub/Sub, Secret Manager |
| AI Providers | OpenAI GPT-4.1 + Anthropic Claude 3.5 Sonnet (model router) |
| Multi-tenant | RLS from Day 1 |

## Repository Structure

```
/apps/web          ← Next.js frontend
/apps/api          ← FastAPI backend (Python)
/apps/ai-service   ← FastAPI AI service (Python, separate service)
/packages/ui       ← Shared component library (Next.js)
/packages/types    ← Shared TypeScript types
/infra/terraform   ← GCP infrastructure
/docs              ← Requirements + API specs
```

## Non-Negotiable Rules

1. Every module reads from the Regulatory Core
2. Every module writes back to the Regulatory Core
3. All outputs: structured, source-grounded, stored as DB objects, exportable
4. No uncontrolled web scraping for AI answers
5. No hallucinated regulatory outputs

## Quick Start (Local Dev)

```bash
# 1. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp apps/web/.env.example apps/web/.env

# 2. Start infrastructure
docker compose up postgres redis

# 3. Run migrations
cd apps/api && alembic upgrade head

# 4. Start services
cd apps/api && uvicorn app.main:app --reload --port 8000      # :8000
cd apps/ai-service && uvicorn app.main:app --reload --port 8001  # :8001
cd apps/web && npm run dev -- --port 3002                        # :3002
```

## Key Architecture Points

- **Model routing**: `claude-*` → Anthropic, `gpt-*` → OpenAI. Default: `auto` (task-based)
- **Readiness score**: Base 100, subtract gap penalties, add evidence credits. Critical gap caps at 75.
- **Document pipeline**: Upload → GCS → Pub/Sub → chunk + embed → AI extract → Core writeback
- **RLS**: `app.current_organization_id` session var set on every DB connection after auth
- **Pub/Sub**: All async work (doc analysis, gap assessment, simulations) is event-driven

## GCP Environments

- dev / staging / production — all on Cloud Run
- Terraform state in GCS bucket
- CI/CD via GitHub Actions (Workload Identity Federation)
