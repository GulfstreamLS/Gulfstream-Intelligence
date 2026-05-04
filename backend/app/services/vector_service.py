from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import OpenAIEmbeddings

from app.core.config import settings
from app.models.regulatory import RegulatorySource
from app.services.document_processor import document_processor
from app.core.logging import get_logger

logger = get_logger(__name__)


class VectorService:
    def __init__(self):
        self._embeddings = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            if not settings.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not set. VectorService will fail on embedding operations.")
            self._embeddings = OpenAIEmbeddings(
                api_key=settings.OPENAI_API_KEY,
                model="text-embedding-3-small"
            )
        return self._embeddings

    async def add_regulatory_content(
        self, 
        db: AsyncSession, 
        authority: str, 
        title: str, 
        content: str, 
        source_url: str = None,
        metadata: dict = None
    ) -> None:
        """Process content, generate embeddings, and store in pgvector."""
        chunks = document_processor.split_text(content)
        
        for chunk in chunks:
            embedding = await self.embeddings.aembed_query(chunk)
            source = RegulatorySource(
                authority=authority,
                title=title,
                content=chunk,
                source_url=source_url,
                metadata=metadata,
                embedding=embedding
            )
            db.add(source)
        
        await db.flush()

    async def search_regulatory_context(
        self, 
        db: AsyncSession, 
        query: str, 
        authority: str | List[str] = None,
        limit: int = 5
    ) -> List[RegulatorySource]:
        """Search for relevant regulatory context based on a query."""
        query_embedding = await self.embeddings.aembed_query(query)
        
        stmt = select(RegulatorySource)
        if authority:
            if isinstance(authority, list):
                stmt = stmt.where(RegulatorySource.authority.in_(authority))
            else:
                stmt = stmt.where(RegulatorySource.authority == authority)

        
        # Using cosine distance for better embedding similarity
        stmt = stmt.order_by(RegulatorySource.embedding.cosine_distance(query_embedding)).limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())


vector_service = VectorService()
