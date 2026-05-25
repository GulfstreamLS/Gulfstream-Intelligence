import asyncio
import json
import logging
import os
import sys
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.regulatory import RegulatorySource
from app.core.logging import get_logger
from app.services.document_processor import document_processor
from app.services.vector_service import vector_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = get_logger("ema_json_ingestor")

EMA_DOCS_JSON_URL = "https://www.ema.europa.eu/en/documents/report/documents-output-json-report_en.json"
EMA_LOCAL_CACHE = "scripts/ema_data.json"


async def ensure_ema_data(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    """Load cached EMA data or download & filter it on the fly if cached file doesn't exist."""
    # Try looking for cache file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_path = os.path.join(base_dir, EMA_LOCAL_CACHE)

    if os.path.exists(cache_path):
        logger.info(f"💾 Loading EMA scientific guidelines from local cache: {cache_path}")
        with open(cache_path, "r") as f:
            return json.load(f)

    logger.info("🌐 Local cache not found. Fetching full EMA documents report (this may take a few seconds)...")
    try:
        response = await client.get(EMA_DOCS_JSON_URL, timeout=60.0)
        response.raise_for_status()
        full_data = response.json()
        all_docs = full_data.get("data", [])
        
        # Filter for scientific guidelines
        guidelines = [doc for doc in all_docs if doc.get("type") == "scientific-guideline"]
        logger.info(f"✨ Found {len(guidelines)} scientific guidelines out of {len(all_docs)} total documents.")
        
        # Save filtered guidelines to cache
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "w") as f:
            json.dump(guidelines, f, indent=2)
        logger.info(f"💾 Cached filtered guidelines to: {cache_path}")
        
        return guidelines
    except Exception as e:
        logger.error(f"❌ Failed to download or parse EMA JSON report: {str(e)}")
        return []


async def ingest_record(db: AsyncSession, client: httpx.AsyncClient, item: dict[str, Any]):
    """Process a single JSON record and ingest it."""
    title_text = item.get("name", "").strip()
    pdf_url = item.get("document_url", "").strip()

    if not title_text or not pdf_url:
        return

    # Check if already exists to prevent duplication
    stmt = select(RegulatorySource).where(
        RegulatorySource.authority == "EMA", RegulatorySource.title == title_text
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        logger.info(f"⏭️ Skipping already ingested: {title_text}")
        return

    logger.info(f"Processing Guideline: {title_text}")
    logger.info(f"Downloading PDF: {pdf_url}")

    try:
        response = await client.get(pdf_url, timeout=30.0)
        response.raise_for_status()
        text = document_processor.extract_text(response.content, "pdf")
    except Exception as e:
        logger.error(f"❌ Failed to download/parse PDF for {title_text}: {str(e)}")
        return

    if not text.strip():
        logger.warning(f"Could not extract any text content for {title_text}")
        return

    # Prepare Metadata
    metadata = {
        "source": "EMA",
        "first_published_date": item.get("first_published_date"),
        "last_updated_date": item.get("last_updated_date"),
        "reference_number": item.get("reference_number"),
        "status": item.get("status"),
        "source_page": pdf_url,
    }

    # Embed and Store
    try:
        await vector_service.add_regulatory_content(
            db, authority="EMA", title=title_text, content=text, source_url=pdf_url, metadata=metadata
        )
        await db.commit()
        logger.info(f"✅ Successfully ingested EMA Guideline: {title_text}")
    except Exception as e:
        logger.error(f"❌ Failed to store {title_text} in vector DB: {str(e)}")


async def main(limit: int = 5, status_filter: str = "Adopted"):
    """Main ingestion loop for EMA guidelines."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=60.0) as client:
        guidelines = await ensure_ema_data(client)

    if not guidelines:
        logger.error("No EMA scientific guidelines available to process.")
        return

    # Filter by status if specified
    filtered_data = []
    for item in guidelines:
        if status_filter and status_filter.lower() not in item.get("status", "").lower():
            continue
        filtered_data.append(item)

    total_to_process = min(len(filtered_data), limit)
    logger.info(f"Loaded {len(guidelines)} scientific guidelines. After filtering status '{status_filter}', {total_to_process} will be processed.")

    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        for i, item in enumerate(filtered_data):
            if count >= limit:
                break

            logger.info(f"--- Document {i + 1} / {total_to_process} ---")
            try:
                async with async_session() as db:
                    await ingest_record(db, client, item)
            except Exception as e:
                logger.error(f"Unexpected error processing document {i + 1}: {e}")
            count += 1

    logger.info(f"Ingestion finished. Processed {count} records.")


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    status = sys.argv[2] if len(sys.argv) > 2 else "Adopted"

    asyncio.run(main(limit=limit, status_filter=status))
