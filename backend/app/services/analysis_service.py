import uuid
from typing import Optional, List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import settings
from app.services.document_processor import document_processor
from app.services.vector_service import vector_service
from app.models.regulatory import AnalysisDocument, Gap, Insight, Action, SeverityLevel
from app.schemas.regulatory import FullAnalysisResponse
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnalysisService:
    def __init__(self):
        self._llm = None
        self._structured_llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model="gpt-4o",  # Using a strong model for complex gap analysis
                temperature=0
            )
        return self._llm

    @property
    def structured_llm(self):
        if self._structured_llm is None:
            self._structured_llm = self.llm.with_structured_output(FullAnalysisResponse)
        return self._structured_llm

    async def analyze_document(
        self, 
        db: AsyncSession, 
        user_id: uuid.UUID, 
        file_content: bytes, 
        filename: str, 
        file_type: str, 
        authority: str = None
    ) -> AnalysisDocument:
        """Perform full RAG-based gap analysis on a document."""
        
        # 1. Extract text from document
        text = document_processor.extract_text(file_content, file_type)
        
        # 2. Retrieve relevant regulatory context
        # We use the beginning of the document to get initial context
        search_query = text[:3000]
        context_sources = await vector_service.search_regulatory_context(
            db, search_query, authority=authority, limit=10
        )
        context_text = "\n\n".join([
            f"SOURCE: {s.title} ({s.authority})\nCONTENT: {s.content}" 
            for s in context_sources
        ])

        # 3. Construct Prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert Regulatory Affairs Consultant. Your task is to perform a detailed "
                "Gap Analysis of a user-provided document against official regulatory guidelines.\n\n"
                "REGULATORY CONTEXT:\n{context}\n\n"
                "Follow these rules:\n"
                "1. Each gap must include a Domain (CMC/Nonclinical/Clinical/Strategy).\n"
                "2. Each gap must have a Severity (Critical/High/Medium/Low).\n"
                "3. Provide exact quoted excerpts from the user document where possible.\n"
                "4. Be objective and professional."
            )),
            ("human", "Please analyze this document:\n\n{document_text}")
        ])

        # 4. Invoke LLM with Structured Output
        chain = prompt | self.structured_llm
        analysis_result: FullAnalysisResponse = await chain.ainvoke({
            "context": context_text,
            "document_text": text
        })

        # 5. Persist Results
        # TODO: In a real production app, save the file to GCS/S3 and store the path
        doc = AnalysisDocument(
            user_id=user_id,
            filename=filename,
            file_type=file_type,
            file_path=f"uploads/{filename}", # Placeholder
            summary=analysis_result.summary,
            confidence_score=analysis_result.confidence_score
        )
        db.add(doc)
        await db.flush()

        # Save Gaps
        for g in analysis_result.gaps:
            gap = Gap(
                document_id=doc.id,
                title=g.title,
                domain=g.domain,
                severity=g.severity.lower(),
                description=g.description,
                regulatory_impact=g.regulatory_impact,
                recommended_action=g.recommended_action,
                quoted_excerpt=g.quoted_excerpt,
                page_reference=g.page_reference
            )
            db.add(gap)

        # Save Insights
        for i in analysis_result.insights:
            insight = Insight(
                document_id=doc.id,
                content=i.content,
                category=i.category
            )
            db.add(insight)

        # Save Actions
        for a in analysis_result.actions:
            action = Action(
                document_id=doc.id,
                title=a.title,
                description=a.description,
                priority=a.priority
            )
            db.add(action)

        await db.commit()
        await db.refresh(doc)
        return doc

    async def analyze_document_multi(
        self,
        db: AsyncSession,
        file_content: bytes,
        file_type: str,
        authorities: List[str]
    ) -> Dict[str, FullAnalysisResponse]:
        """Perform RAG analysis across multiple authorities separately."""
        text = document_processor.extract_text(file_content, file_type)
        search_query = text[:3000]
        
        results = {}
        for auth in authorities:
            # Retrieve context for THIS specific authority
            context_sources = await vector_service.search_regulatory_context(
                db, search_query, authority=auth, limit=10
            )
            context_text = "\n\n".join([
                f"SOURCE: {s.title} ({s.authority})\nCONTENT: {s.content}" 
                for s in context_sources
            ])

            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    f"You are an expert Regulatory Affairs Consultant specializing in {auth}.\n\n"
                    "REGULATORY CONTEXT:\n{context}\n\n"
                    "Analyze the document against THESE specific guidelines only."
                )),
                ("human", "Please analyze this document:\n\n{document_text}")
            ])

            chain = prompt | self.structured_llm
            analysis: FullAnalysisResponse = await chain.ainvoke({
                "context": context_text,
                "document_text": text
            })
            results[auth] = analysis
            
        return results



analysis_service = AnalysisService()
