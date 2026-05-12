import uuid

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.simulation import SimAction, SimConcern, SimFollowup, SimQuestion, SimulationSession
from app.schemas.simulation import SimulationLLMResult
from app.services.vector_service import vector_service

logger = get_logger(__name__)

TOPICS = ["CMC & Manufacturing", "Nonclinical", "Clinical Plan", "Quality Systems", "Regulatory Strategy"]


class SimulationService:
    def __init__(self):
        self._llm = None
        self._structured_llm = None

    @property
    def llm(self):
        if self._llm is None:
            model_name = getattr(settings, "SIMULATION_MODEL", "gpt-5")
            self._llm = ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=model_name,
                temperature=1 if model_name.startswith("gpt-5") else 0.3,
            )
        return self._llm

    @property
    def structured_llm(self):
        if self._structured_llm is None:
            self._structured_llm = self.llm.with_structured_output(SimulationLLMResult)
        return self._structured_llm

    async def run_simulation(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        project_id: uuid.UUID | None,
        authority: str,
        submission_type: str,
        product_type: str,
        stage: str,
        focus_area: str,
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

        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                (
                    f"You are a senior regulatory reviewer at {authority}. "
                    f"You are preparing questions for a {submission_type} meeting regarding a {product_type} product "
                    f"at {stage} stage.\n\n"
                    "REGULATORY CONTEXT (official guidance you must draw from):\n{context}\n\n"
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
        result: SimulationLLMResult = await chain.ainvoke({"context": context_text})

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
