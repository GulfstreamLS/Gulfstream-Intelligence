import uuid

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.chat import Conversation, Message, MessageRole
from app.models.project import Project as ProjectModel
from app.models.regulatory import AnalysisDocument, Gap
from app.models.simulation import SimAction, SimConcern, SimFollowup, SimQuestion, SimulationSession
from app.schemas.simulation import SimulationLLMResult
from app.services.vector_service import vector_service

logger = get_logger(__name__)

TOPICS = ["CMC & Manufacturing", "Nonclinical", "Clinical Plan", "Quality Systems", "Regulatory Strategy"]

# Keys used by the frontend "Sources Included" panel and the run request.
SOURCE_PROJECT_PROFILE = "project_profile"
SOURCE_PROJECT_DOCUMENTS = "project_documents"
SOURCE_SUPPLEMENTAL_DOCUMENTS = "supplemental_documents"
SOURCE_PRIOR_GAP_ASSESSMENT = "prior_gap_assessment"
SOURCE_CHAT_OUTPUTS = "chat_outputs"
SOURCE_REGULATORY_CORE = "regulatory_core"
SOURCE_PASTED_QUESTIONS = "pasted_questions"
SOURCE_MANUAL_SCENARIO = "manual_scenario"
SOURCE_PRIOR_SIMULATIONS = "prior_simulations"
QUESTIONNAIRE_FILENAMES = ("pasted-questions", "simulation-questionnaire")


def _is_questionnaire_document(doc: AnalysisDocument) -> bool:
    filename = doc.filename.lower()
    return any(filename.startswith(prefix) for prefix in QUESTIONNAIRE_FILENAMES)


class SimulationService:
    def __init__(self):
        self._llm = None
        self._structured_llm = None

    @property
    def llm(self):
        if self._llm is None:
            model_name = getattr(settings, "SIMULATION_MODEL", "gpt-5.4-mini")
            self._llm = ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=model_name,
                temperature=1 if model_name.startswith("gpt-5.4-mini") else 0.3,
            )
        return self._llm

    @property
    def structured_llm(self):
        if self._structured_llm is None:
            self._structured_llm = self.llm.with_structured_output(SimulationLLMResult)
        return self._structured_llm

    SOURCE_CONTEXT_CHAR_CAP = 12000

    async def _gather_source_context(
        self,
        db: AsyncSession,
        project_id: uuid.UUID | None,
        supplemental_document_ids: list[uuid.UUID] | None,
        pasted_questions: str | None,
        manual_scenario: str | None,
        included_sources: list[str] | None,
    ) -> str:
        """Assemble the sponsor's own program material into a prompt context block."""
        wanted = set(included_sources) if included_sources is not None else None

        def wants(key: str) -> bool:
            return wanted is None or key in wanted

        blocks: list[str] = []
        seen_doc_ids: set[uuid.UUID] = set()

        if project_id and (wants(SOURCE_PROJECT_PROFILE) or wants(SOURCE_REGULATORY_CORE)):
            project = await db.get(ProjectModel, project_id)
            if project:
                blocks.append(
                    "PROJECT PROFILE / REGULATORY CORE:\n"
                    + "\n".join([
                        f"Name: {project.name}",
                        f"Type: {project.type}",
                        f"Indication: {project.indication or '—'}",
                        f"Therapeutic Area: {project.therapeutic_area or '—'}",
                        f"Development Phase: {project.dev_phase or '—'}",
                        f"Product Type: {project.product_type or '—'}",
                        f"Status: {project.status}",
                        f"Authorities: {', '.join(project.authorities) if project.authorities else '—'}",
                    ])
                )

        if project_id and wants(SOURCE_PROJECT_DOCUMENTS):
            rows = (await db.execute(
                select(AnalysisDocument)
                .where(AnalysisDocument.project_id == project_id)
                .order_by(AnalysisDocument.created_at.desc())
                .limit(8)
            )).scalars().all()
            for d in rows:
                seen_doc_ids.add(d.id)
                if _is_questionnaire_document(d):
                    continue
                body = (d.extracted_text or d.summary or "").strip()
                if body:
                    blocks.append(f"PROJECT DOCUMENT — {d.filename}:\n{body[:1500]}")

        if supplemental_document_ids and wants(SOURCE_SUPPLEMENTAL_DOCUMENTS):
            extra = [i for i in supplemental_document_ids if i not in seen_doc_ids]
            if extra:
                rows = (await db.execute(
                    select(AnalysisDocument).where(AnalysisDocument.id.in_(extra))
                )).scalars().all()
                for d in rows:
                    body = (d.extracted_text or d.summary or "").strip()
                    if body:
                        blocks.append(f"SUPPLEMENTAL DOCUMENT — {d.filename}:\n{body[:1500]}")

        if project_id and wants(SOURCE_PRIOR_GAP_ASSESSMENT):
            gaps = (await db.execute(
                select(Gap)
                .join(AnalysisDocument, Gap.document_id == AnalysisDocument.id)
                .where(AnalysisDocument.project_id == project_id)
                .limit(15)
            )).scalars().all()
            if gaps:
                blocks.append(
                    "PRIOR GAP ASSESSMENT FINDINGS:\n"
                    + "\n".join(f"- [{g.severity}] {g.title}: {(g.description or '')[:200]}" for g in gaps)
                )

        if project_id and wants(SOURCE_CHAT_OUTPUTS):
            messages = (await db.execute(
                select(Message, Conversation.title)
                .join(Conversation, Message.conversation_id == Conversation.id)
                .where(
                    Conversation.project_id == project_id,
                    Conversation.is_temporary == False,  # noqa: E712
                    Message.role == MessageRole.ASSISTANT,
                    Message.content != "",
                )
                .order_by(Message.created_at.desc())
                .limit(8)
            )).all()
            if messages:
                blocks.append(
                    "SAVED REGULATORY CHAT OUTPUTS:\n"
                    + "\n\n".join(
                        f"{title or 'Regulatory Chat'}:\n{message.content[:1200]}"
                        for message, title in messages
                    )
                )

        if project_id and wants(SOURCE_PRIOR_SIMULATIONS):
            prior = (await db.execute(
                select(SimulationSession)
                .where(SimulationSession.project_id == project_id)
                .order_by(SimulationSession.created_at.desc())
                .limit(3)
            )).scalars().all()
            if prior:
                blocks.append(
                    "PRIOR SIMULATION HISTORY:\n"
                    + "\n".join(
                        f"- {s.authority} / {s.focus_area}: readiness {round(s.readiness_score)}%, "
                        f"{s.total_questions} questions"
                        for s in prior
                    )
                )

        if wants(SOURCE_PASTED_QUESTIONS):
            pasted_blocks: list[str] = []
            if pasted_questions and pasted_questions.strip():
                pasted_blocks.append(pasted_questions.strip()[:4000])
            if project_id:
                rows = (await db.execute(
                    select(AnalysisDocument)
                    .where(AnalysisDocument.project_id == project_id)
                    .order_by(AnalysisDocument.created_at.desc())
                    .limit(20)
                )).scalars().all()
                for d in rows:
                    if not _is_questionnaire_document(d):
                        continue
                    body = (d.extracted_text or d.summary or "").strip()
                    if body:
                        pasted_blocks.append(f"{d.filename}:\n{body[:1500]}")
            if pasted_blocks:
                blocks.append("PASTED QUESTIONS / SPONSOR POSITIONS:\n" + "\n\n".join(pasted_blocks))

        if manual_scenario and manual_scenario.strip() and wants(SOURCE_MANUAL_SCENARIO):
            blocks.append("MANUAL SCENARIO INPUT:\n" + manual_scenario.strip()[:4000])

        return "\n\n".join(blocks)[: self.SOURCE_CONTEXT_CHAR_CAP]

    async def run_simulation(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        organization_id: uuid.UUID | None,
        project_id: uuid.UUID | None,
        authority: str,
        submission_type: str,
        product_type: str,
        stage: str,
        focus_area: str,
        mode: str | None = None,
        simulation_purpose: str | None = None,
        pasted_questions: str | None = None,
        manual_scenario: str | None = None,
        included_sources: list[str] | None = None,
        supplemental_document_ids: list[uuid.UUID] | None = None,
    ) -> SimulationSession:

        # Pull real regulatory guidance for this authority from vector store
        search_query = (
            f"{authority} {submission_type} {product_type} {stage} {focus_area} regulatory requirements questions"
        )
        context_sources = await vector_service.search_regulatory_context(
            db, search_query, authority=authority, limit=10
        )
        context_text = "\n\n".join(
            [f"SOURCE: {s.title} ({s.authority})\nCONTENT: {s.content}" for s in context_sources]
        ) if context_sources else "No specific regulatory guidance found. Use general regulatory knowledge."

        # Gather the sponsor's own program material. Only requests from the
        # updated UI carry a `mode`; legacy requests keep the original behaviour.
        source_context = ""
        if mode is not None:
            source_context = await self._gather_source_context(
                db, project_id, supplemental_document_ids,
                pasted_questions, manual_scenario, included_sources,
            )
        source_context = source_context or "No additional program material was provided for this simulation."

        purpose_directive = ""
        if simulation_purpose:
            purpose_directive = (
                f"PRIMARY OBJECTIVE: {simulation_purpose}. "
                "Shape the questions, severity weighting, and written outputs to serve this objective.\n\n"
            )

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    f"You are a senior regulatory reviewer at {authority}. "
                    f"You are preparing questions for a {submission_type} meeting regarding a {product_type} product "
                    f"at {stage} stage.\n\n"
                    + purpose_directive
                    + "REGULATORY CONTEXT (official guidance you must draw from):\n{context}\n\n"
                    "PROGRAM SOURCE MATERIAL (the sponsor's actual project — anchor your questions to this):\n"
                    "{source_context}\n\n"
                    "Your task:\n"
                    f"1. Generate 15-20 realistic questions you would ask, focusing primarily on {focus_area} "
                    f"but covering all relevant domains.\n"
                    f"2. Topics must be from: {', '.join(TOPICS)}.\n"
                    "3. Assign severity: Critical (show-stoppers), High (serious concerns), Medium (clarifications needed), Low (minor).\n"
                    "4. For each question, explain the regulatory rationale.\n"
                    "5. Identify 4-6 key underlying concerns.\n"
                    "6. Write 4-5 likely follow-up questions.\n"
                    "7. Suggest 4-5 recommended pre-meeting actions.\n"
                    "8. Write a feedback_summary (2-3 paragraphs: overall impression, main risks, recommendation).\n"
                    "9. Write a meeting_brief (structured agenda: what the authority will focus on, key discussion points).\n"
                    "10. Write response_guidance (how to best respond to the toughest questions, tone and strategy).\n"
                    "11. Set confidence_level: High if strong regulatory context found, Medium if partial, Low if limited."
                ),
            ),
            ("human", "Please generate the simulation for this program."),
        ])

        chain = prompt | self.structured_llm
        result: SimulationLLMResult = await chain.ainvoke(
            {"context": context_text, "source_context": source_context}
        )

        # Compute readiness score from severity distribution
        critical = sum(1 for q in result.questions if q.severity.lower() == "critical")
        high     = sum(1 for q in result.questions if q.severity.lower() == "high")
        medium   = sum(1 for q in result.questions if q.severity.lower() == "medium")
        low      = sum(1 for q in result.questions if q.severity.lower() == "low")
        penalty  = (critical * 15) + (high * 8) + (medium * 3) + (low * 1)
        readiness_score = max(0, min(100, 100 - penalty))

        # Persist session
        session = SimulationSession(
            user_id=user_id,
            organization_id=organization_id,
            project_id=project_id,
            authority=authority,
            submission_type=submission_type,
            product_type=product_type,
            stage=stage,
            focus_area=focus_area,
            total_questions=len(result.questions),
            critical_count=critical,
            key_concerns_count=len(result.key_concerns),
            readiness_score=readiness_score,
            confidence_level=result.confidence_level,
            feedback_summary=result.feedback_summary,
            meeting_brief=result.meeting_brief,
            response_guidance=result.response_guidance,
            mode=mode,
            simulation_purpose=simulation_purpose,
            pasted_questions=pasted_questions,
            manual_scenario=manual_scenario,
            included_sources=included_sources,
            supplemental_document_ids=(
                [str(i) for i in supplemental_document_ids] if supplemental_document_ids else None
            ),
        )
        db.add(session)
        await db.flush()

        for idx, q in enumerate(result.questions):
            db.add(SimQuestion(
                session_id=session.id,
                topic=q.topic,
                severity=q.severity.capitalize(),
                question=q.question,
                rationale=q.rationale,
                order_index=idx,
            ))

        for c in result.key_concerns:
            db.add(SimConcern(
                session_id=session.id,
                text=c.text,
                severity=c.severity.capitalize(),
            ))

        for f in result.likely_followup_questions:
            db.add(SimFollowup(session_id=session.id, text=f))

        for a in result.recommended_actions:
            db.add(SimAction(session_id=session.id, text=a, priority="Medium"))

        # Sync readiness score back to project
        if project_id:
            from app.models.project import Project as ProjectModel
            project = await db.get(ProjectModel, project_id)
            if project:
                project.readiness_score = readiness_score

        await db.commit()
        await db.refresh(session)
        return session


simulation_service = SimulationService()
