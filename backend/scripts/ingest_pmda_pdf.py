import asyncio
import json
import logging
import os
import sys
from typing import Any

from curl_cffi import requests
from bs4 import BeautifulSoup
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
logger = get_logger("pmda_pdf_ingestor")

PMDA_BASE_URL = "https://www.pmda.go.jp"
PMDA_REGULATORY_INFO_URL = f"{PMDA_BASE_URL}/english/review-services/regulatory-info"
PMDA_LOCAL_CACHE = "scripts/pmda_data.json"


async def crawl_pmda_regulatory_info() -> list[dict[str, Any]]:
    """Crawl PMDA's 19 subpages to extract absolute PDF links and clean titles."""
    guidelines = []
    total_pages = 19 # 0001.html to 0019.html

    logger.info("🌐 Crawling PMDA English regulatory info subpages to build the local cache...")
    
    for page in range(1, total_pages + 1):
        url = f"{PMDA_REGULATORY_INFO_URL}/{page:04d}.html"
        logger.info(f"Page {page}/{total_pages}: Fetching {url}...")
        try:
            # Impersonate chrome to bypass WAF
            resp = requests.get(url, impersonate="chrome", timeout=30.0)
            if resp.status_code != 200:
                if resp.status_code == 404:
                    logger.warning(f"⚠️ Page not found (404): {url}")
                else:
                    logger.error(f"❌ Failed to fetch page {page}: Status code {resp.status_code}")
                continue
            
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Extract category name from H1 or title
            h1 = soup.find("h1")
            category = h1.get_text(strip=True) if h1 else "General"
            
            # Find PDF links
            page_items_count = 0
            for link in soup.find_all("a", href=True):
                href = link["href"].strip()
                if href.endswith(".pdf"):
                    # Build absolute URL
                    if href.startswith("/"):
                        full_url = f"{PMDA_BASE_URL}{href}"
                    elif href.startswith("http"):
                        full_url = href
                    else:
                        full_url = f"{PMDA_REGULATORY_INFO_URL}/{href}"
                        
                    title_text = link.get_text(strip=True)
                    # Clean up double spaces or generic terms
                    if not title_text or title_text.lower() in ["pdf", "download", "link"]:
                        continue
                        
                    # Avoid duplicates on the same page
                    if not any(g["url"] == full_url for g in guidelines):
                        guidelines.append({
                            "title": title_text,
                            "url": full_url,
                            "category": category
                        })
                        page_items_count += 1
            
            logger.info(f"Discovered {page_items_count} guidelines in category '{category}' on page {page}.")
            await asyncio.sleep(0.5) # Polite delay
        except Exception as e:
            logger.error(f"❌ Error scraping PMDA subpage {page}: {e}")

    logger.info(f"✨ Crawling complete. Discovered {len(guidelines)} unique PMDA guidelines in total.")
    return guidelines


async def ensure_pmda_data() -> list[dict[str, Any]]:
    """Load cached PMDA guidance list or crawl it dynamically if no cache exists."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_path = os.path.join(base_dir, PMDA_LOCAL_CACHE)

    if os.path.exists(cache_path):
        logger.info(f"💾 Loading PMDA guidance listings from local cache: {cache_path}")
        with open(cache_path, "r") as f:
            return json.load(f)

    # Crawl listings
    guidelines = await crawl_pmda_regulatory_info()
    if guidelines:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "w") as f:
            json.dump(guidelines, f, indent=2)
        logger.info(f"💾 Cached {len(guidelines)} guidelines to: {cache_path}")
    
    return guidelines


async def ingest_record(db: AsyncSession, item: dict[str, Any]):
    """Fetch and ingest a single PMDA guidance document into pgvector."""
    title_text = item.get("title", "").strip()
    pdf_url = item.get("url", "").strip()
    category = item.get("category", "General").strip()

    if not title_text or not pdf_url:
        return

    # Duplicate check
    stmt = select(RegulatorySource).where(
        RegulatorySource.authority == "PMDA", RegulatorySource.title == title_text
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        logger.info(f"⏭️ Skipping already ingested PMDA document: {title_text}")
        return

    logger.info(f"Processing PMDA Guideline: {title_text}")
    logger.info(f"Downloading PDF: {pdf_url}")

    try:
        # Download PDF using curl-cffi impersonating Chrome
        resp = requests.get(pdf_url, impersonate="chrome", timeout=30.0)
        resp.raise_for_status()
        
        # Extract text from PDF content
        text = document_processor.extract_text(resp.content, "pdf")
    except Exception as e:
        logger.error(f"❌ Failed to fetch/parse PMDA PDF for {title_text}: {str(e)}")
        return

    if not text.strip():
        logger.warning(f"Could not extract any text content for PMDA PDF: {title_text}")
        return

    # Prepare Metadata
    metadata = {
        "source": "PMDA",
        "category": category,
        "source_page": pdf_url,
    }

    # Embed and Store
    try:
        await vector_service.add_regulatory_content(
            db, authority="PMDA", title=title_text, content=text, source_url=pdf_url, metadata=metadata
        )
        await db.commit()
        logger.info(f"✅ Successfully ingested PMDA Guideline: {title_text}")
    except Exception as e:
        logger.error(f"❌ Failed to store {title_text} in vector DB: {str(e)}")


async def main(limit: int = 5):
    """Main ingestion loop for PMDA guidelines."""
    guidelines = await ensure_pmda_data()

    if not guidelines:
        logger.error("No PMDA guidelines available to process.")
        return

    total_to_process = min(len(guidelines), limit)
    logger.info(f"Loaded {len(guidelines)} guidelines. {total_to_process} will be processed.")

    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    for i, item in enumerate(guidelines):
        if count >= limit:
            break

        logger.info(f"--- PMDA Document {i + 1} / {total_to_process} ---")
        try:
            async with async_session() as db:
                await ingest_record(db, item)
            count += 1
            # Rate limit politeness
            await asyncio.sleep(1.0)
        except Exception as e:
            logger.error(f"Unexpected error processing document {i + 1}: {e}")

    logger.info(f"PMDA Ingestion finished. Processed {count} records.")


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    asyncio.run(main(limit=limit))
