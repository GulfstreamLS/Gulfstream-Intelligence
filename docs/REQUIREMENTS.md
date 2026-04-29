# Gulfstream Intelligence — Complete Requirements Specification

> Version 1.0 | Source: Developer Starting Instruction, Full Platform Spec, Elite Output Design + Scoring, Regulatory Core Knowledge Architecture + UI Design Screens
> Status: Pre-Development Reference

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core Principle — Non-Negotiable](#2-core-principle)
3. [System Architecture](#3-system-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Tech Stack](#5-tech-stack)
6. [Database Schema](#6-database-schema)
7. [Multi-Tenant RLS](#7-multi-tenant-rls)
8. [API Contract](#8-api-contract)
9. [Module Requirements](#9-module-requirements)
10. [AI Orchestration Layer](#10-ai-orchestration-layer)
11. [Regulatory Core Knowledge Architecture](#11-regulatory-core-knowledge-architecture)
12. [Output Design & Scoring](#12-output-design--scoring)
13. [Event System — Pub/Sub](#13-event-system--pubsub)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Design System](#15-design-system)
16. [Security Requirements](#16-security-requirements)
17. [Document Storage](#17-document-storage)
18. [GCP Infrastructure](#18-gcp-infrastructure)
19. [Build Phases](#19-build-phases)
20. [MVP Acceptance Criteria](#20-mvp-acceptance-criteria)

---

## 1. Product Vision

Gulfstream Intelligence is a **regulatory intelligence operating system** for global life sciences companies — not a chatbot, not a document viewer. It is a decision engine that:

- Anticipates what regulators will ask before they ask it
- Maintains a living Regulatory Core of program intelligence
- Drives structured, traceable, exportable outputs
- Supports FDA, EMA, MHRA, PMDA, Health Canada, TGA, NMPA
- Is enterprise-grade, pharma-ready, multi-tenant from Day 1

**Target users:** Regulatory affairs professionals, regulatory leads, CMC leads, clinical ops, and senior leadership at pharma/biotech companies.

**Positioning headline:**
> "Know what regulators will say before they say it."

---

## 2. Core Principle

> **The Regulatory Core is the system. Everything else is an interface to it.**

### Non-Negotiable Rules

1. Every module **reads from** the Regulatory Core
2. Every module **writes back to** the Regulatory Core
3. Every module **updates the Regulatory Core state**
4. All outputs must be:
   - Structured (not free text blobs)
   - Source-grounded (traceable to FDA/EMA/ICH guidance or uploaded documents)
   - Stored as database objects (not only chat history)
   - Exportable as PDF/Word
5. No uncontrolled web scraping to drive answers
6. No hallucinated outputs presented as regulatory fact
7. This must feel like **enterprise SaaS**, not a prototype

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  Dashboard | Chat | Gap | Simulation | Docs | Projects   │
└───────────────────────┬─────────────────────────────────┘
                        │ REST / HTTP
┌───────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (Python)                    │
│   Auth | Programs | Core | Chat | Docs | Reports | RBAC  │
│   SQLAlchemy async | Cloud Tasks | Pub/Sub Publisher     │
└──────┬────────────────────────────┬──────────────────────┘
       │ Internal call              │ Pub/Sub Events
┌──────▼──────────────┐    ┌────────▼────────────────────┐
│  FastAPI AI Service │    │   GCP Pub/Sub               │
│  (Python)           │    │   Event Workers             │
│  OpenAI + Anthropic │    │   (Cloud Run Jobs)          │
│  Model Router       │    └─────────────────────────────┘
│  Retrieval Engine   │
│  Context Pack Build │
└──────┬──────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│               PostgreSQL (Cloud SQL)                     │
│   + pgvector extension                                   │
│   + Row-Level Security (RLS)                             │
│   Regulatory Core | Programs | Knowledge Base            │
└─────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│              GCP Services                               │
│  Cloud Storage (docs) | Secret Manager | IAM            │
│  Cloud Logging | Cloud Monitoring | Firestore (RT logs) │
└─────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility |
|---|---|
| **Next.js Web** | All UI, client-side state, SSR pages |
| **FastAPI Backend** | Business logic, auth, RBAC, DB writes, Pub/Sub publishing, file upload pre-signing |
| **FastAPI AI Service** | AI orchestration, model routing, context pack assembly, prompt execution, retrieval, validation |
| **Cloud Run Workers** | Async event processing (document analysis, gap assessment, ingestion) |
| **PostgreSQL** | Single source of truth — Regulatory Core, programs, knowledge base |
| **Cloud Storage** | Secure document storage per org/program |
| **Pub/Sub** | Decoupled async event system |

---

## 4. Repository Structure

```
/gulfstream-intelligence              ← GitHub monorepo
  /apps
    /web                              ← Next.js 15 (App Router)
      /app
        /dashboard
        /regulatory-chat
        /global-gap-assessment
        /health-authority-simulation
        /document-intelligence
        /projects
        /history
        /reports
        /settings
      /components
      /hooks
      /lib
      /store
      /styles
    /api                              ← FastAPI Backend (Python)
      /app
        /api
          /v1
            /auth
            /organizations
            /programs
            /core
            /chat
            /documents
            /gap_assessments
            /simulations
            /reports
            /audit
            /settings
        /core
          /config.py
          /security.py
          /dependencies.py
        /db
          /session.py
          /base.py
        /models
        /schemas
        /services
        /middleware
    /ai-service                       ← FastAPI AI Service (Python)
      /app
        /providers
        /services
        /prompts
        /retrieval
        /validators
  /packages
    /ui                               ← Shared component library
    /types                            ← Shared TypeScript types
    /config                           ← ESLint, tsconfig, etc.
  /infra
    /terraform                        ← GCP infrastructure as code
    /gcp                              ← GCP-specific configs
    /docker                           ← Dockerfiles
  /docs
    /api                              ← OpenAPI spec
    /architecture
    /prompts
  .github/
    /workflows                        ← CI/CD pipelines
```

### Environment Branches
- `main` → production
- `staging` → staging environment
- `develop` → development environment
- Feature branches → preview environments (Cloud Run)

---

## 5. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (client state) + TanStack Query (server state) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP | TanStack Query + fetch |

### Backend API
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12) |
| Language | Python |
| ORM | SQLAlchemy (async) |
| DB Migrations | Alembic |
| Database | PostgreSQL (Cloud SQL) + pgvector |
| Auth | JWT + refresh tokens |
| Queue | GCP Cloud Tasks + Pub/Sub |
| Logging | Cloud Logging + structlog |
| Analytics | BigQuery (optional, audit/usage analytics) |

### AI Service
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12) — separate service |
| AI Providers | OpenAI GPT-4.1 + Anthropic Claude 3.5 Sonnet |
| Embeddings | OpenAI text-embedding-3-small (1536 dimensions) |
| Vector Search | pgvector (PostgreSQL extension) |
| DB Client | asyncpg |
| Validation | Pydantic v2 |

### Infrastructure
| Layer | Technology |
|---|---|
| Cloud | Google Cloud Platform |
| Compute | Cloud Run (all services) |
| Database | Cloud SQL (PostgreSQL 16) |
| Storage | Cloud Storage |
| Messaging | Cloud Pub/Sub |
| Scheduler | Cloud Scheduler |
| Secrets | Secret Manager |
| IAM | GCP IAM |
| Monitoring | Cloud Monitoring + Cloud Logging |
| CDN | Cloud CDN (optional) |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Containers | Docker |

---

## 6. Database Schema

### Complete PostgreSQL Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ═══════════════════════════════════════
-- IDENTITY & ACCESS
-- ═══════════════════════════════════════

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',   -- starter | professional | business | enterprise
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    job_title VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles (name, description) VALUES
('admin',            'Full platform and organization control'),
('regulatory_lead',  'Can manage programs, assessments, simulations, and reports'),
('contributor',      'Can upload documents, run chats, and contribute analysis'),
('viewer',           'Read-only access');

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- PROGRAMS / PROJECTS
-- ═══════════════════════════════════════

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    indication VARCHAR(255),
    therapeutic_area VARCHAR(255),
    modality VARCHAR(255),
    product_type VARCHAR(255),      -- Small Molecule | Biologic | Gene Therapy | Cell Therapy | Vaccine | etc.
    submission_type VARCHAR(100),   -- Pre-IND | IND | CTA | NDA | BLA | MAA | etc.
    development_stage VARCHAR(100), -- Discovery | Preclinical | IND-Enabling | Phase 1 | Phase 2 | Phase 3 | Filing
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE health_authorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    country VARCHAR(255)
);

INSERT INTO health_authorities (code, name, region, country) VALUES
('FDA',  'Food and Drug Administration',                          'North America', 'United States'),
('EMA',  'European Medicines Agency',                             'Europe',        'European Union'),
('MHRA', 'Medicines and Healthcare products Regulatory Agency',   'Europe',        'United Kingdom'),
('HC',   'Health Canada',                                         'North America', 'Canada'),
('PMDA', 'Pharmaceuticals and Medical Devices Agency',            'Asia',          'Japan'),
('TGA',  'Therapeutic Goods Administration',                      'Oceania',       'Australia'),
('NMPA', 'National Medical Products Administration',              'Asia',          'China');

CREATE TABLE program_health_authorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    health_authority_id UUID NOT NULL REFERENCES health_authorities(id) ON DELETE CASCADE,
    priority BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- REGULATORY CORE
-- ═══════════════════════════════════════

CREATE TABLE regulatory_core_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL UNIQUE REFERENCES programs(id) ON DELETE CASCADE,
    readiness_score INTEGER DEFAULT 0,          -- 0–100
    confidence_score INTEGER DEFAULT 0,         -- 0–100
    risk_level VARCHAR(50) DEFAULT 'unknown',   -- Critical | High | Moderate | Low | Strong
    current_summary TEXT,
    last_synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE regulatory_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO regulatory_domains (name) VALUES
('CMC'), ('Clinical'), ('Nonclinical'), ('Regulatory'),
('Safety'), ('Quality'), ('Labeling'), ('Clinical Pharmacology'), ('Statistics');

CREATE TABLE core_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES regulatory_domains(id),
    health_authority_id UUID REFERENCES health_authorities(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,              -- Critical | High | Medium | Low
    impact VARCHAR(255),
    regulatory_impact TEXT,
    expected_evidence JSONB,                    -- array of strings
    authority_impact JSONB,                     -- array of authority codes
    status VARCHAR(50) DEFAULT 'open',          -- open | in_progress | closed
    source_type VARCHAR(100),                   -- chat | gap_assessment | simulation | document | manual
    source_id UUID,
    recommendation TEXT,
    confidence_label VARCHAR(100),
    core_status VARCHAR(50) DEFAULT 'Added',    -- Added | Pending Review | Rejected
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE core_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,         -- Risk | Recommendation | Insight | Observation
    title VARCHAR(255),
    content TEXT NOT NULL,
    domain_id UUID REFERENCES regulatory_domains(id),
    health_authority_id UUID REFERENCES health_authorities(id),
    confidence_score INTEGER,
    source_type VARCHAR(100),
    source_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE core_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50),                       -- Immediate | Near-term | Long-term
    status VARCHAR(50) DEFAULT 'open',
    owner_id UUID REFERENCES users(id),
    due_date DATE,
    source_type VARCHAR(100),
    source_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- DOCUMENTS
-- ═══════════════════════════════════════

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id),
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    document_category VARCHAR(100),
    source VARCHAR(255),
    status VARCHAR(50) DEFAULT 'uploaded',      -- uploaded | processing | analyzed | failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    page_number INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    insight_type VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    domain VARCHAR(100),
    severity VARCHAR(50),
    page_reference VARCHAR(100),
    quoted_excerpt TEXT,
    interpretation TEXT,
    recommended_action TEXT,
    source_confidence VARCHAR(100),
    pushed_to_core BOOLEAN DEFAULT false,
    confidence_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- CHAT
-- ═══════════════════════════════════════

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    model_provider VARCHAR(50) DEFAULT 'auto',  -- auto | openai | anthropic
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,                  -- user | assistant
    content TEXT NOT NULL,
    model_provider VARCHAR(50),
    model VARCHAR(100),
    token_count INTEGER,
    structured_outputs JSONB,                   -- gaps/insights/actions extracted
    sources JSONB,                              -- citations
    confidence_score INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- GAP ASSESSMENTS
-- ═══════════════════════════════════════

CREATE TABLE gap_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    submission_type VARCHAR(100),
    product_type VARCHAR(100),
    development_stage VARCHAR(100),
    domains JSONB,
    readiness_score INTEGER,
    total_gaps INTEGER,
    critical_gaps INTEGER,
    high_gaps INTEGER,
    medium_gaps INTEGER,
    low_gaps INTEGER,
    risk_level VARCHAR(50),
    confidence_score INTEGER,
    status VARCHAR(50) DEFAULT 'completed',
    report_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gap_assessment_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gap_assessment_id UUID NOT NULL REFERENCES gap_assessments(id) ON DELETE CASCADE,
    health_authority_id UUID NOT NULL REFERENCES health_authorities(id)
);

CREATE TABLE gap_assessment_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gap_assessment_id UUID NOT NULL REFERENCES gap_assessments(id) ON DELETE CASCADE,
    domain VARCHAR(100),
    domain_score INTEGER,
    severity VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    regulatory_impact TEXT,
    expected_evidence JSONB,
    recommended_action TEXT,
    authority_impact JSONB,
    source_ids JSONB,
    confidence_label VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- SIMULATIONS
-- ═══════════════════════════════════════

CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    health_authority_id UUID REFERENCES health_authorities(id),
    submission_type VARCHAR(100),
    product_type VARCHAR(100),
    development_stage VARCHAR(100),
    focus_area VARCHAR(255),
    simulation_summary TEXT,
    readiness_score INTEGER,
    confidence_level VARCHAR(50),
    total_questions INTEGER,
    critical_questions INTEGER,
    status VARCHAR(50) DEFAULT 'completed',
    report_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE simulation_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    topic VARCHAR(255),
    question TEXT NOT NULL,
    severity VARCHAR(50),
    reviewer_rationale TEXT,
    expected_evidence JSONB,
    likely_follow_up TEXT,
    recommended_response TEXT,
    source_basis JSONB,
    confidence_label VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id),
    report_type VARCHAR(100),    -- executive_summary | gap_assessment | simulation | document_intelligence
    title VARCHAR(255),
    format VARCHAR(20),          -- pdf | docx
    storage_path TEXT,
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- AUDIT + LOGGING
-- ═══════════════════════════════════════

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    provider VARCHAR(50),
    model VARCHAR(100),
    task_type VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    latency_ms INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organization_ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    default_provider VARCHAR(50) DEFAULT 'auto',
    allow_openai BOOLEAN DEFAULT true,
    allow_anthropic BOOLEAN DEFAULT true,
    data_retention_policy VARCHAR(100) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- KNOWLEDGE BASE (Regulatory Core)
-- ═══════════════════════════════════════

CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authority VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    country VARCHAR(100),
    title TEXT NOT NULL,
    document_type VARCHAR(100),
    source_url TEXT NOT NULL,
    source_status VARCHAR(100),
    source_confidence VARCHAR(50) DEFAULT 'core_verified',
    publication_date DATE,
    effective_date DATE,
    version VARCHAR(100),
    file_hash TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE knowledge_document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    tag_type VARCHAR(100) NOT NULL,   -- authority | domain | submission_type | product_type | stage | region | etc.
    tag_value VARCHAR(255) NOT NULL,
    confidence_score INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    section_heading TEXT,
    page_number INTEGER,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding VECTOR(1536),
    citation_text TEXT,
    source_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE regulatory_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id),
    chunk_id UUID REFERENCES knowledge_chunks(id),
    authority VARCHAR(100),
    domain VARCHAR(100),
    subdomain VARCHAR(100),
    submission_type VARCHAR(100),
    product_type VARCHAR(100),
    development_stage VARCHAR(100),
    requirement_text TEXT NOT NULL,
    requirement_type VARCHAR(100),   -- Required | Expected | Recommended | Conditional | Best Practice | Warning
    criticality VARCHAR(50),         -- Critical | High | Medium | Low
    evidence_expected TEXT,
    citation TEXT,
    source_url TEXT,
    confidence_score INTEGER DEFAULT 80,
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Key Indexes
```sql
CREATE INDEX idx_programs_org ON programs(organization_id);
CREATE INDEX idx_core_gaps_program ON core_gaps(program_id);
CREATE INDEX idx_core_gaps_severity ON core_gaps(severity);
CREATE INDEX idx_documents_program ON documents(program_id);
CREATE INDEX idx_chat_sessions_program ON chat_sessions(program_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## 7. Multi-Tenant RLS

### Session Variables (set by API after auth)
```sql
SET app.current_user_id = 'USER_UUID';
SET app.current_organization_id = 'ORG_UUID';
SET app.current_role = 'admin';  -- admin | regulatory_lead | contributor | viewer
```

### Enable RLS on All Tenant Tables
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_core_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### RLS Policies
```sql
-- Programs: org isolation
CREATE POLICY org_isolation_programs ON programs
USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Core tables: via program membership
CREATE POLICY program_core_state_access ON regulatory_core_state
USING (program_id IN (
    SELECT id FROM programs
    WHERE organization_id = current_setting('app.current_organization_id')::uuid
));

CREATE POLICY program_core_gaps_access ON core_gaps
USING (program_id IN (
    SELECT id FROM programs
    WHERE organization_id = current_setting('app.current_organization_id')::uuid
));

-- Documents: org isolation
CREATE POLICY org_isolation_documents ON documents
USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Write policy: role-based
CREATE POLICY program_write_policy ON programs FOR INSERT
WITH CHECK (current_setting('app.current_role') IN ('admin', 'regulatory_lead'));

CREATE POLICY core_gap_write_policy ON core_gaps FOR INSERT
WITH CHECK (current_setting('app.current_role') IN ('admin', 'regulatory_lead', 'contributor'));

-- Audit logs: org isolation
CREATE POLICY org_isolation_audit_logs ON audit_logs
USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### RBAC Permission Matrix

| Permission | Admin | Regulatory Lead | Contributor | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create/delete programs | ✓ | ✓ | — | — |
| Run gap assessment | ✓ | ✓ | — | — |
| Run simulation | ✓ | ✓ | — | — |
| Upload documents | ✓ | ✓ | ✓ | — |
| Use regulatory chat | ✓ | ✓ | ✓ | — |
| View all outputs | ✓ | ✓ | ✓ | ✓ |
| Export reports | ✓ | ✓ | ✓ | — |
| Manage team | ✓ | — | — | — |
| Organization settings | ✓ | — | — | — |
| AI model settings | ✓ | — | — | — |

---

## 8. API Contract

### Base Path: `/api/v1`
### Auth: `Authorization: Bearer <JWT>`

---

### Auth
```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

### Organizations
```
GET    /organizations/current
PATCH  /organizations/current
GET    /organizations/current/users
POST   /organizations/current/users/invite
PATCH  /organizations/current/users/:userId/role
DELETE /organizations/current/users/:userId
```

### Programs
```
GET    /programs
POST   /programs
GET    /programs/:programId
PATCH  /programs/:programId
DELETE /programs/:programId
GET    /programs/:programId/core          ← Core summary for this program
GET    /programs/:programId/activity      ← Activity feed
```

**Create Program Body:**
```json
{
  "name": "AAV Gene Therapy Program",
  "indication": "Duchenne Muscular Dystrophy",
  "therapeutic_area": "Rare Disease",
  "modality": "Gene Therapy",
  "product_type": "Biologic",
  "submission_type": "IND",
  "development_stage": "Preclinical",
  "health_authorities": ["FDA", "EMA"]
}
```

### Regulatory Core
```
GET   /core/programs/:programId/summary
GET   /core/programs/:programId/gaps
GET   /core/programs/:programId/insights
GET   /core/programs/:programId/actions
POST  /core/programs/:programId/recalculate
POST  /core/programs/:programId/sync
PATCH /core/gaps/:gapId
PATCH /core/actions/:actionId
```

### Regulatory Chat
```
POST /chat/sessions
GET  /chat/sessions
GET  /chat/sessions/:sessionId
POST /chat/sessions/:sessionId/messages
POST /chat/ask                            ← Stateless ask (no session)
```

**Chat Request:**
```json
{
  "program_id": "uuid",
  "message": "What are the key FDA risks for this IND?",
  "model_provider": "auto",
  "include_core_context": true,
  "include_documents": true
}
```

**Chat Response:**
```json
{
  "answer": "...",
  "model_provider": "openai",
  "model": "gpt-4.1",
  "sources": [],
  "confidence_score": 82,
  "structured_outputs": {
    "gaps": [],
    "insights": [],
    "actions": []
  }
}
```

### Global Gap Assessment
```
POST /gap-assessments
GET  /gap-assessments
GET  /gap-assessments/:assessmentId
GET  /programs/:programId/gap-assessments
POST /gap-assessments/:assessmentId/export
```

**Request:**
```json
{
  "program_id": "uuid",
  "health_authorities": ["FDA", "EMA"],
  "submission_type": "IND",
  "product_type": "Biologic",
  "development_stage": "Preclinical",
  "domains": ["CMC", "Clinical", "Nonclinical", "Regulatory"]
}
```

### Health Authority Simulation
```
POST /simulations
GET  /simulations
GET  /simulations/:simulationId
GET  /programs/:programId/simulations
POST /simulations/:simulationId/export
```

**Request:**
```json
{
  "program_id": "uuid",
  "health_authority": "FDA",
  "submission_type": "IND",
  "product_type": "Biologic",
  "development_stage": "Preclinical",
  "focus_area": "CMC & Manufacturing",
  "model_provider": "auto"
}
```

### Document Intelligence
```
POST   /documents/upload              ← Returns signed GCS URL
GET    /documents
GET    /documents/:documentId
DELETE /documents/:documentId
POST   /documents/:documentId/analyze
GET    /documents/:documentId/insights
GET    /programs/:programId/documents
POST   /documents/:documentId/extract-gaps
```

### Reports
```
POST /reports/generate
GET  /reports
GET  /reports/:reportId
GET  /programs/:programId/reports
```

**Generate Report:**
```json
{
  "program_id": "uuid",
  "report_type": "executive_summary",
  "format": "pdf"
}
```
`report_type`: `executive_summary | gap_assessment | simulation | document_intelligence`

### History / Audit
```
GET /audit-logs
GET /audit-logs/programs/:programId
GET /activity
GET /activity/programs/:programId
```

### Settings
```
GET   /settings/profile
PATCH /settings/profile
GET   /settings/security
PATCH /settings/security
GET   /settings/ai
PATCH /settings/ai
```

### AI Internal (AI Service — internal only, not public)
```
POST /ai/run         ← Called by NestJS API only
```

---

## 9. Module Requirements

### 9.1 Regulatory Core Engine

**Purpose:** Single source of truth. Every module contributes to it; every module reads from it.

**Readiness Score Formula:**
```
Base Score = 100

Penalties:
  Critical Gap = -10 each
  High Gap     = -6 each
  Medium Gap   = -3 each
  Low Gap      = -1 each

Credits:
  Closed critical gap                  = +5
  Closed high gap                      = +3
  Validated source evidence present    = +3
  Complete document set present        = +5
  Cross-functional alignment           = +3
  Prior HA interaction documented      = +5
  Recent successful simulation         = +3

Source Confidence Credits:
  Core Verified                        = +5
  Validated Authority Source           = +4
  User Document Derived                = +2
  AI-Inferred from Source              = +1
  External / Unvalidated               = +0

Cap Rules:
  Score cannot exceed 100
  Score cannot fall below 0
  Any unresolved Critical Gap caps score at 75
  3+ unresolved Critical Gaps cap score at 60
  No validated source support caps score at 70
```

**Risk Level:**
| Score | Risk Level |
|---|---|
| 0–30 | Critical |
| 31–55 | High |
| 56–75 | Moderate |
| 76–90 | Low |
| 91–100 | Strong |

**Core recalculation triggers:**
- New gap added/closed
- Document analyzed
- Gap assessment completed
- Simulation completed
- Manual sync requested

---

### 9.2 Regulatory Chat

**Purpose:** AI-powered regulatory Q&A with context awareness and Core writeback.

**Flow:**
1. User types question, optionally selects program
2. Context pack assembled (Core state + gaps + requirements + documents)
3. Model router selects provider
4. AI generates structured response
5. Extracted gaps/insights/actions saved to Core
6. Chat message + structured outputs stored
7. `core.recalculate.requested` event published

**Required UI Elements (from design screens):**
- Left nav persistent
- Chat message thread (center)
- Right context panel with: Active Program, Indication, Development Stage, Submission Type, Health Authorities, Key Insights, Suggested Prompts, Recent Chats
- Model toggle: `Auto | GPT | Claude`
- Source chips below input bar (recent documents)
- New Chat button

**Output format per message:**
- Narrative answer
- Structured sections: Direct Answer, Regulatory Rationale, Key Risks, Next Steps, Items to Confirm, Follow-Up Questions
- Inline source citations
- Confidence score
- Extracted: `gaps[]`, `insights[]`, `actions[]`

---

### 9.3 Global Gap Assessment

**Purpose:** Rules + AI hybrid scoring against regulatory framework expectations.

**Flow:**
1. User selects health authorities, submission type, product type, development stage, domains
2. Job queued via Pub/Sub
3. AI service: maps program to regulatory requirements, compares vs knowledge base, scores gaps, generates insights
4. Results stored in DB
5. Core updated with new gaps/insights/actions
6. Readiness score recalculated

**Required UI Elements (from design screen):**
- Top: authority selector (FDA, EMA, MHRA, HC, PMDA, TGA flags), submission type, product type dropdown, "Start Assessment" button
- Summary row: Overall Readiness Score (%), Risk Level badge, High Priority Gaps count, Recommendations count
- Charts: Readiness by FDA Domain (bar), Gap Severity Distribution (donut), Authority Comparison (FDA vs EMA)
- Tabs: Critical Gaps | High Priority Gaps | Domain Breakdown | Recommended Actions | Sources
- Each gap card: severity badge, domain, authority impact, title, why it matters, expected evidence, recommended action, source citation, "Add to Action Plan" button
- Recent Assessments panel, Next Steps panel
- Export Report button

**Domain Scoring:**
```
Domain Score = 100 - Domain Gap Penalties + Domain Evidence Credits
```

---

### 9.4 Health Authority Simulation

**Purpose:** Persona-based AI simulation of regulatory reviewer behavior.

**Supported Authorities:**
- FDA (CDER/CBER reviewer)
- EMA (CHMP assessor)
- PMDA (Japanese reviewer)
- Health Canada (CTA reviewer)
- MHRA (UK reviewer)

**Reviewer Behavior Rules:**
- FDA: evidence sufficiency, safety margin, CMC control, clinical rationale
- EMA: benefit-risk, comparability, quality robustness, RMP implications
- PMDA: local applicability, quality consistency, bridging considerations
- Health Canada: CTA completeness, safety oversight, clinical rationale
- MHRA: risk management, quality documentation, clinical justification

**Required UI Elements (from design screen):**
- Top: Health Authority, Submission Type, Product Type, Development Stage, Focus Area display
- Summary row: Total Questions, Critical Questions, Key Concerns count, Readiness Score gauge, Confidence Level badge
- Reviewer Lens Panel (reviewer behavior profile)
- Main table with columns: Topic, Question, Severity, Relevance, Recommended Response
- Accordion sections: Critical Questions | High Priority | Likely Follow-Ups | Recommended Responses | Core Impact
- Key Concerns Identified panel
- Likely Follow-Up Questions panel
- Recommended Actions panel
- Simulation Summary donut chart (Critical/High/Medium/Low breakdown)
- Export Report button, Run New Simulation button

**Simulation Readiness Score Formula:**
```
Simulation Readiness =
  40% × Core Readiness Score
+ 25% × Evidence Completeness (0/25/50/75/100)
+ 20% × Response Preparedness (0/50/70/100)
+ 15% × Authority Alignment (10/40/70/100)
```

---

### 9.5 Document Intelligence

**Purpose:** Convert uploaded regulatory documents into structured regulatory intelligence.

**Pipeline:**
```
Upload → GCS Storage → Pub/Sub Event → Worker:
  OCR (if scanned PDF) →
  Text Extraction →
  Chunking (512 token chunks, 50 token overlap) →
  Embedding Generation (OpenAI text-embedding-3-small) →
  Store chunks + embeddings in DB →
  AI Analysis (document intelligence prompt) →
  Extract: insights, gaps, risks, inconsistencies, HA implications, actions, quotes →
  Store as document_insights →
  Push to Core (core_gaps, core_insights, core_actions) →
  Publish core.recalculate.requested
```

**Required UI Elements (from design screen):**
- Top stats: Documents Analyzed, Key Insights Extracted, Regulatory Gaps Identified, Compliance Mentions, Key Confidence Score
- Document Categories donut chart (Regulatory Guidance | CMC/Quality | Clinical Development | Safety Toxicology | Administrative)
- Recent Documents table: file name, category, type, date, insights count, status badge
- Recent Insights panel (right)
- AI-Powered Extraction panel with recent uploads
- Key Topics Detected cloud
- Recommended Actions panel
- Upload Document button (drag-and-drop), Run New Analysis button

**Document Intelligence Confidence Score:**
```
Confidence =
  40% × Text Extraction Quality
+ 25% × Source Quality
+ 20% × Metadata Match
+ 15% × Citation Precision

Labels:
  90–100 = High
  70–89  = Medium-High
  50–69  = Medium
  30–49  = Low
  0–29   = Very Low
```

---

### 9.6 Projects / Programs

**Purpose:** Program management hub. Each project is a regulatory development program.

**Required UI Elements (from design screen):**
- Top stats: Total Projects, On Track, At Risk, No Change
- Search + filter bar (All Status, All Therapeutic Areas, All Health Authorities)
- Programs table: name, therapeutic area, development stage, health authorities (flag icons), readiness score bar + %, status badge, last update, actions
- "Import Project" and "New Project" buttons
- Empty state with CTA

---

### 9.7 History

**Purpose:** Full activity audit trail across the platform.

**Required UI Elements (from design screen):**
- Top stats: Activities (30d), Documents Processed, Simulations Run, Files consulted
- Date range filter, activity type filter, "All Users" filter
- Activity table: Activity (icon + description), Document/Program, Program, User, Date & Time
- Export History button

**Tracked Events:**
- User login/logout
- Document upload / delete
- Chat message sent
- Gap assessment created
- Simulation created
- Report generated
- Settings changed
- User invited
- Role changed
- Export downloaded
- Core sync triggered
- Gap status changed

---

### 9.8 Reports

**Report types:**
- Executive Summary (PDF/Word)
- Global Gap Assessment Report
- Health Authority Simulation Report
- Document Intelligence Report

**Each PDF includes:** Cover page, executive snapshot, detailed findings, source citations, action plan, confidence labels.

---

### 9.9 Settings

**Tabs (from design screen):** Profile | Preferences | Team | Security | Notifications | Audit Log

**Profile:** Full name, email, job title, organization, timezone, language, date format
**Team:** Invite members, manage roles, remove users
**Security:** Change password, MFA toggle (placeholder), Active Sessions panel
**AI:** Default provider (Auto/GPT/Claude), allow/disable providers per org, data retention policy
**Notifications:** Email/in-app preferences
**Audit Log:** Exportable activity log for org admins

---

## 10. AI Orchestration Layer

### AI Service Architecture (Python FastAPI)

```
/ai-service/app/
  main.py
  config.py
  models.py           ← Pydantic request/response models
  router.py           ← Task routing + model selection
  prompts.py          ← All prompt templates
  retrieval.py        ← Context pack assembly
  validators.py       ← Post-generation validation
  providers/
    openai_provider.py
    anthropic_provider.py
  services/
    chat_service.py
    gap_service.py
    simulation_service.py
    document_service.py
    summary_service.py
```

### Task Types
| Task Type | Default Model | Rationale |
|---|---|---|
| `regulatory_chat` | OpenAI GPT-4.1 | Fast, structured |
| `gap_assessment` | OpenAI GPT-4.1 | Structured JSON output |
| `health_authority_simulation` | Anthropic Claude 3.5 Sonnet | Deep reasoning, persona |
| `document_intelligence` | Anthropic Claude 3.5 Sonnet | Long document handling |
| `executive_summary` | OpenAI GPT-4.1 | Concise structured output |

### Model Router Logic
```typescript
function selectModel(taskType: string, provider: ModelProvider) {
  if (provider === "openai")     return "openai:gpt-4.1";
  if (provider === "anthropic")  return "anthropic:claude-3-5-sonnet-latest";

  switch (taskType) {
    case "document_intelligence":         return "anthropic:claude-3-5-sonnet-latest";
    case "health_authority_simulation":   return "anthropic:claude-3-5-sonnet-latest";
    case "gap_assessment":                return "openai:gpt-4.1";
    case "regulatory_chat":               return "openai:gpt-4.1";
    default:                              return "openai:gpt-4.1";
  }
}
```

### Global System Prompt
```
You are Gulfstream Intelligence, an enterprise regulatory intelligence assistant for life sciences regulatory professionals.

Your role: support global regulatory strategy, submission readiness, gap identification, document analysis, and health authority preparation.

You must provide structured, practical, regulatory-focused outputs.

Always prioritize:
1. Regulatory clarity
2. Health authority expectations
3. Submission readiness
4. Risk identification
5. Actionable recommendations
6. Traceability to source material when available

You must only answer using the provided context pack.
If the context pack does not support a conclusion, state: "The available source material does not support a definitive conclusion."
Every regulatory expectation, risk, or recommendation must trace back to a structured requirement, a validated authority source, or a user-uploaded program document.
Do not rely on general model knowledge for regulatory conclusions.
Return valid JSON only.
```

### Context Pack Structure
```json
{
  "program_context": {
    "program_name": "",
    "indication": "",
    "product_type": "",
    "development_stage": "",
    "submission_type": "",
    "target_authorities": []
  },
  "core_state": {
    "readiness_score": 0,
    "risk_level": "",
    "confidence_score": 0
  },
  "known_gaps": [],
  "known_insights": [],
  "structured_requirements": [],
  "knowledge_sources": [],
  "program_documents": [],
  "instructions": {
    "answer_only_from_sources": true,
    "cite_every_material_claim": true,
    "flag_unsourced_claims": true
  }
}
```

### Retrieval Priority Order
1. **Priority 1 — Structured Core:** `regulatory_requirements`, `core_gaps`, `core_insights`
2. **Priority 2 — Curated Knowledge Base:** FDA/EMA/ICH validated guidance chunks
3. **Priority 3 — Program Documents:** Uploaded documents (chunked + embedded)
4. **Priority 4 — External Web:** Disabled in V1

### Retrieval Ranking Score
```
Final Retrieval Score =
  Authority Match      × 25
+ Domain Match         × 20
+ Submission Type Match× 20
+ Product Type Match   × 15
+ Dev Stage Match      × 10
+ Recency              ×  5
+ Semantic Similarity  ×  5
```

### Post-Generation Validation
Every AI response must be validated for:
1. Each key claim has a source
2. Citations are present
3. Unsupported recommendations are flagged
4. Confidence labels are applied
5. Source types are correctly identified
6. Claims are not overreaching
7. Gaps link back to requirements or documents

**Source Confidence Labels:**
- `Core Verified`
- `Validated Authority Source`
- `User Document Derived`
- `AI-Inferred from Source`
- `External Web / Not Validated`
- `Low Confidence`

### Output Data Objects

**Gap Object:**
```json
{
  "gap_id": "uuid",
  "program_id": "uuid",
  "title": "",
  "domain": "",
  "subdomain": "",
  "severity": "Critical | High | Medium | Low",
  "authority_impact": ["FDA", "EMA"],
  "description": "",
  "regulatory_impact": "",
  "expected_evidence": [],
  "recommended_action": "",
  "source_ids": [],
  "confidence_label": "",
  "core_status": "Added | Pending Review | Rejected"
}
```

**Simulation Question Object:**
```json
{
  "question_id": "uuid",
  "simulation_id": "uuid",
  "authority": "FDA",
  "topic": "",
  "severity": "",
  "question": "",
  "reviewer_rationale": "",
  "expected_evidence": [],
  "likely_follow_up": "",
  "recommended_response": "",
  "source_basis": [],
  "confidence_label": ""
}
```

**Document Finding Object:**
```json
{
  "finding_id": "uuid",
  "document_id": "uuid",
  "program_id": "uuid",
  "title": "",
  "domain": "",
  "severity": "",
  "page_reference": "",
  "quoted_excerpt": "",
  "interpretation": "",
  "recommended_action": "",
  "source_confidence": "",
  "pushed_to_core": true
}
```

---

## 11. Regulatory Core Knowledge Architecture

### Ingestion Pipeline

```
Approved Source URL
  → Source Discovery (approved list only)
  → Document Download (PDF/HTML/DOCX)
  → SHA-256 File Hash + Duplicate Check
  → Metadata Extraction
  → Document Classification
  → Text Parsing + Chunking
  → Regulatory Tagging
  → Embedding Generation
  → Structured Requirement Extraction (AI-assisted)
  → Admin Validation Queue
  → Publish to Regulatory Core
  → Version + Audit Log
```

### Approved Source List (V1)

| Authority | Sources |
|---|---|
| FDA | fda.gov guidance documents, CDER/CBER guidance pages, accessdata.fda.gov, drugs@FDA, FDA approval packages |
| EMA | ema.europa.eu guidelines, European public assessment reports, CHMP/PRAC guidance |
| ICH | ich.org — Efficacy (E), Safety (S), Quality (Q), Multidisciplinary (M) guidelines |

### Document Lifecycle Status
`Draft → Ingested → Parsed → Tagged → Pending Validation → Validated → Published → Deprecated → Archived`

### Scheduled Update Frequency
| Source | Frequency |
|---|---|
| FDA guidance checks | Weekly |
| EMA guideline checks | Weekly |
| ICH updates | Monthly |
| Approval packages | Monthly |

### Knowledge Base Version Control
- Never overwrite existing documents
- On change: create new version, flag for admin review, preserve prior version
- New document: add to staging, notify admin, do not auto-publish

### Tagging Schema (mandatory per document)

Required tag types: `authority`, `region`, `document_type`, `domain`, `subdomain`, `submission_type`, `product_type`, `modality`, `development_stage`, `therapeutic_area`, `source_status`, `source_confidence`

---

## 12. Output Design & Scoring

### Build Standard
> "Gulfstream outputs must look like they were prepared by a senior regulatory strategist, structured by a product team, scored by a rules engine, and supported by traceable source material."

### Every Major Output Screen Must Include:
1. Executive summary card row (score, risk, counts)
2. Score / status cards
3. Structured findings with severity badges
4. Recommended actions
5. Source citations with confidence labels
6. Export button (PDF + Word)
7. Core update trail (what was written to Core)
8. All findings stored as DB objects — not only in chat history

### Citation Format
```
Source:
FDA Guidance: [Document Title], Section [X], Page [Y], Version [Date]

Uploaded Document:
Uploaded Document: [File Name], Page [Y], Section [X]

AI Inference:
Basis: AI inference based on FDA Guidance [Title] and uploaded Protocol [Name].
```

---

## 13. Event System — Pub/Sub

### Topics

```
document.uploaded
document.analysis.requested
document.analysis.completed

chat.message.created
chat.core_updates.extracted

gap_assessment.requested
gap_assessment.completed

simulation.requested
simulation.completed

core.recalculate.requested
core.recalculated

report.generate.requested
report.generated

knowledge.ingestion.requested
knowledge.ingestion.completed
knowledge.validation.required
```

### Standard Event Payload
```json
{
  "event_id": "uuid",
  "event_type": "document.analysis.requested",
  "organization_id": "uuid",
  "user_id": "uuid",
  "program_id": "uuid",
  "entity_id": "uuid",
  "entity_type": "document",
  "created_at": "2026-04-28T12:00:00Z",
  "payload": {}
}
```

### Workflow: Document Upload
```
User uploads document
→ API creates document record (status: uploaded)
→ File stored in GCS
→ publish document.uploaded
→ worker: publish document.analysis.requested
→ AI service: parse → chunk → embed → analyze
→ creates document_insights
→ creates core_gaps / core_insights / core_actions
→ publish core.recalculate.requested
→ core service recalculates readiness score
→ publish document.analysis.completed
→ document status: analyzed
```

### Workflow: Chat Message
```
User sends message
→ API saves user chat_message
→ publish chat.message.created
→ AI service: build context pack → select model → run prompt
→ API saves assistant message + structured_outputs
→ extracted gaps/insights/actions written to Core
→ publish chat.core_updates.extracted
→ publish core.recalculate.requested
```

### Workflow: Gap Assessment
```
User submits configuration
→ API creates gap_assessment record (status: pending)
→ publish gap_assessment.requested
→ AI service: build context → run gap prompt → score domains
→ store gap_assessment_findings + core updates
→ publish core.recalculate.requested
→ publish gap_assessment.completed
```

---

## 14. Frontend Architecture

### Pages & Routes
```
/                         → redirect to /dashboard
/dashboard                → Program overview + Core summary + activity
/regulatory-chat          → Chat interface
/global-gap-assessment    → Gap assessment run + results
/health-authority-simulation → Simulation run + results
/document-intelligence    → Document list + upload + insights
/projects                 → Program management
/history                  → Activity audit trail
/reports                  → Report generation + history
/settings                 → Profile / Team / Security / AI
/login                    → Auth
/register                 → Auth
```

### Global UI Requirements (Every Logged-In Screen)
- Left navigation sidebar (persistent)
- Gulfstream Intelligence logo (top left)
- Global region/authority selector (top right)
- Notification icon (top right)
- User profile avatar (top right)
- **Active Program selector** (global — affects all modules)
- **Regulatory Core sync status indicator** ("Regulatory Core: Synced" | "Updating…")
- Readiness score visible from dashboard

### Global Context Bar (top of every screen)
- Active Program name
- Submission Type
- Development Stage
- Target Authorities (flag icons)
- Regulatory Core last sync timestamp

### State Management
- **Zustand**: active program, user, UI state, model preference
- **TanStack Query**: all server data (programs, core, chat, gaps, docs)

---

## 15. Design System

### Colors
```css
:root {
  --gs-blue:      #2563EB;   /* Primary blue */
  --gs-deep-blue: #0F2A6B;   /* Deep blue */
  --gs-navy:      #071B4D;   /* Navy */
  --gs-sky:       #38BDF8;   /* Sky */
  --gs-green:     #16A34A;   /* Success / Low risk */
  --gs-orange:    #F97316;   /* Warning / Medium risk */
  --gs-red:       #DC2626;   /* Error / Critical */
  --gs-purple:    #7C3AED;   /* Accent */
  --gs-bg:        #F8FAFC;   /* Background */
  --gs-card:      #FFFFFF;   /* Card background */
  --gs-border:    #E5E7EB;   /* Border */
  --gs-text:      #0F172A;   /* Primary text */
  --gs-muted:     #64748B;   /* Secondary text */
}
```

### Severity Colors
| Severity | Color |
|---|---|
| Critical | `#DC2626` (red) |
| High | `#F97316` (orange) |
| Medium | `#F59E0B` (amber) |
| Low | `#16A34A` (green) |

### Typography
- Font: **Inter**
- Headings: 600–700 weight
- Body: 400–500 weight
- Buttons: 600 weight

### Card Style
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}
```

### Button Styles
```css
.primary-button {
  background: #2563EB;
  color: #FFFFFF;
  border-radius: 10px;
  font-weight: 600;
}
.secondary-button {
  background: #FFFFFF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}
```

### AI Model Toggle (Required on Every AI-Powered Page)
```
AI Model: [ Auto ] [ GPT ] [ Claude ]
```
- Setting saved at user + organization level
- Admin can disable either provider org-wide

---

## 16. Security Requirements

### Must Have (Day 1)
- AES-256 encryption (Cloud Storage)
- TLS 1.2+ (all transport)
- Row-Level Security (PostgreSQL)
- RBAC (4 roles: admin, regulatory_lead, contributor, viewer)
- JWT auth with refresh tokens
- Audit logging (all events)
- Tenant data isolation (RLS + organization_id on all tables)
- No user data used to train AI models
- Admin controls for model provider usage

### Enterprise-Ready (Phase 2)
- SSO (Okta, Azure AD)
- MFA
- Audit log export (CSV/JSON)
- Data residency options
- Private AI deployment option
- API access keys

### Mandatory Audit Events
`user.login`, `user.logout`, `document.upload`, `document.delete`, `chat.message`, `gap_assessment.created`, `simulation.created`, `report.generated`, `settings.changed`, `user.invited`, `role.changed`, `export.downloaded`

---

## 17. Document Storage

### GCS Bucket Structure
```
gs://gulfstream-{env}-documents/
  /org/{organization_id}/
    /program/{program_id}/
      /documents/{document_id}/{filename}
    /reports/{report_id}/{filename}
```

### Environments
- `gs://gulfstream-dev-documents`
- `gs://gulfstream-staging-documents`
- `gs://gulfstream-prod-documents`

### Upload Flow
1. Frontend requests pre-signed URL from API (`POST /documents/upload`)
2. API creates document record (status: `uploaded`), returns signed URL
3. Frontend uploads directly to GCS (no file bytes through API)
4. Frontend confirms upload complete → API publishes `document.uploaded`

---

## 18. GCP Infrastructure

### Services Required
| Service | Purpose |
|---|---|
| Cloud Run | Frontend, API, AI Service, Workers |
| Cloud SQL (PostgreSQL 16) | Primary database |
| Cloud Storage | Document storage |
| Cloud Pub/Sub | Event system |
| Cloud Tasks | Async job queue |
| Cloud Scheduler | Scheduled ingestion jobs |
| Secret Manager | API keys, DB passwords |
| Artifact Registry | Docker images |
| Cloud Logging | Structured logs |
| Cloud Monitoring | Uptime + alerting |
| IAM | Service accounts + permissions |
| Firestore | Real-time activity feed (optional) |
| BigQuery | Analytics / audit queries (optional) |

### Environments
- `dev` — rapid iteration, low cost
- `staging` — production mirror for QA
- `production` — customer-facing

### CI/CD (GitHub Actions)
1. PR opened → lint + typecheck + unit tests
2. Merge to `develop` → build images → deploy to dev
3. Merge to `staging` → build images → deploy to staging + run E2E
4. Merge to `main` → build images → deploy to production

---

## 19. Build Phases

### Phase 0 — Foundation
> Goal: Working infrastructure, schema, auth, and proof-of-architecture demo running end-to-end.

**Deliverables:**
- GitHub monorepo set up (`apps/web`, `apps/api`, `apps/ai-service`)
- GCP environments provisioned (dev / staging / production) via Terraform
- CI/CD pipelines live (GitHub Actions → Cloud Run)
- PostgreSQL with pgvector and RLS enabled
- Alembic migrations baseline
- Docker setup for all three services
- Auth (JWT + refresh tokens) working end-to-end
- RBAC middleware in place
- Regulatory Core schema deployed
- **Proof-of-architecture demo:**
  1. Create a program
  2. Ask a chat question
  3. Receive structured AI output
  4. Write gap/insight/action to Regulatory Core
  5. Readiness score recalculates

---

### Phase 1 — Core Data Layer + Programs
> Goal: All foundational data models live, accessible via API, with multi-tenant RLS enforced.

**Deliverables:**
- Organizations, users, roles, user_roles — full CRUD
- Programs + health authority mappings — full CRUD
- Regulatory Core state — schema + API endpoints
- Core gaps, insights, actions — full CRUD
- Audit log framework (all writes emit audit events)
- Pub/Sub event infrastructure connected
- OpenAPI docs served at `/docs`

---

### Phase 2 — Frontend Shell + Dashboard
> Goal: App shell that matches Figma designs. Global context bar wired to live data.

**Deliverables:**
- Left sidebar navigation (all routes)
- Global context bar: Active Program selector, authority flags, Core sync status indicator
- Dashboard homepage: readiness score, top gaps, recent activity, module shortcuts
- Notification icon
- User profile / avatar
- Program selector (global — persists across modules)
- Readiness score gauge component
- Responsive layout baseline
- Empty states and loading states for all dashboard components

---

### Phase 3 — Regulatory Chat
> Goal: AI-powered chat with Regulatory Core context injection, model toggle, and Core writeback.

**Deliverables:**
- Chat sessions + message history
- OpenAI GPT-4.1 integration
- Anthropic Claude 3.5 Sonnet integration
- Model toggle: Auto / GPT / Claude (saved per user + org)
- Context pack assembly (Core state + gaps + requirements + documents)
- Structured output extraction (gaps, insights, actions) from every response
- Extracted outputs written to Regulatory Core
- Core recalculation triggered after each assistant message
- Right context panel (program info, key insights, suggested prompts)
- Source citations rendered inline
- Confidence score displayed per response

---

### Phase 4 — Document Intelligence
> Goal: Secure upload pipeline with full AI extraction and Core writeback.

**Deliverables:**
- GCS pre-signed URL upload flow
- Document record creation + status tracking
- Chunking pipeline (512-token chunks, 50-token overlap)
- Embedding generation (OpenAI text-embedding-3-small)
- AI document analysis prompt (Claude)
- Structured finding extraction: insights, gaps, risks, inconsistencies, HA implications, quotes
- Document insights stored as DB objects
- "Push to Core" flow for each finding
- Core gaps / insights / actions created from document analysis
- Readiness score recalculation triggered
- Document Intelligence UI matching Figma design

---

### Phase 5 — Global Gap Assessment
> Goal: Rules + AI hybrid scoring engine against FDA/EMA/ICH requirements.

**Deliverables:**
- Health authority + submission type + product type + domain selector UI
- Gap assessment job queued via Pub/Sub
- Context pack with structured requirements from knowledge base
- Domain-level scoring (CMC, Clinical, Nonclinical, Regulatory, Safety, etc.)
- Readiness score calculation per domain and overall
- Gap findings stored as structured DB objects
- All gaps written to Regulatory Core
- Core recalculation triggered
- Domain readiness bar chart
- Authority comparison view (FDA vs EMA)
- Severity distribution donut chart
- Gap cards with: severity badge, domain, authority impact, description, evidence expected, recommended action, source citation
- Export stub (PDF/Word)

---

### Phase 6 — Health Authority Simulation
> Goal: Realistic health authority reviewer simulation with authority-specific personas.

**Deliverables:**
- Simulation configuration UI (authority, submission type, product type, focus area)
- Authority-specific reviewer persona prompts (FDA / EMA / PMDA / HC / MHRA)
- Simulated question generation with: topic, severity, reviewer rationale, expected evidence, likely follow-up, recommended response
- Simulation summary: readiness score, confidence level, critical question count
- Reviewer lens panel per authority
- Simulation questions stored as structured DB objects
- Core gaps / insights / actions written from simulation results
- Readiness score recalculation triggered
- Export stub (PDF/Word)

---

### Phase 7 — Projects, History, Reports
> Goal: Program management, platform-wide audit trail, and exportable reports.

**Deliverables:**
- Projects page: program table with readiness scores, authority flags, status badges, filters
- History page: full activity feed with date range + type filters, export
- Reports page: generate PDF/Word for gap assessment, simulation, document intelligence, executive summary
- PDF/Word export pipeline (cover page, findings, action plan, source citations)
- Program activity feed (per-program view)

---

### Phase 8 — Settings, Admin, Enterprise Readiness
> Goal: Full org management, security controls, and enterprise feature placeholders.

**Deliverables:**
- Profile settings (name, job title, timezone, language)
- Team management (invite, role change, remove)
- Security settings (password change, active sessions)
- AI settings (default model provider, org-level allow/disable per provider)
- Notifications preferences
- Audit log tab (exportable, filterable)
- MFA placeholder (UI ready, logic deferred to Phase 9)
- SSO placeholder (Okta/Azure AD — UI ready)

---

### Phase 9 — Hardening + Pilot Launch
> Goal: Production-ready. Security reviewed. All states handled. Pilot users onboarded.

**Deliverables:**
- End-to-end QA across all modules
- Security review (RLS audit, RBAC verification, secret scanning)
- All error states, loading states, empty states implemented
- AI output validation layer active (post-generation source checks)
- Cost monitoring + AI token usage alerts
- Usage logging dashboard
- Performance testing (Cloud Run scaling)
- Pilot onboarding package (1–3 customers)

---

## 20. MVP Acceptance Criteria

The MVP is complete when a user can:

1. **Create a program** with indication, product type, submission type, development stage, and target health authorities
2. **Upload documents** securely to GCS
3. **Ask regulatory questions** in Regulatory Chat with Core context injection and model toggle
4. **Run a Global Gap Assessment** and receive scored, domain-grouped, source-cited gaps
5. **Run a Health Authority Simulation** and receive authority-specific reviewer questions
6. **View Regulatory Core Summary** showing readiness score, risk level, top gaps, insights, actions
7. **See readiness score update** after each module interaction
8. **Export a summary report** (PDF/Word)
9. **Review history/audit activity**
10. **Manage basic settings** (profile, team, AI model preferences)

**And in all cases:**
- All gaps, insights, and actions are stored as structured DB objects
- All AI outputs are source-grounded with confidence labels
- All writes go back to the Regulatory Core
- No uncontrolled hallucinated regulatory conclusions

---

*This document is the single source of requirements truth for Gulfstream Intelligence v1.0.*
*UI source of truth: Figma designs (as provided in design screens).*
*No implementation deviations without approval.*
