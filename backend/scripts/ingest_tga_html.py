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
logger = get_logger("tga_html_ingestor")

TGA_BASE_URL = "https://www.tga.gov.au"
TGA_LISTING_URL = f"{TGA_BASE_URL}/resources/guidance"
TGA_LOCAL_CACHE = "scripts/tga_data.json"


async def crawl_tga_listings() -> list[dict[str, Any]]:
    """Crawl the 13 paginated TGA guidance listing pages to discover all guidelines."""
    guidelines = []
    total_pages = 13 # 0-indexed page 0 to 12

    logger.info("🌐 Crawling TGA guidance listing pages to build the local cache (using curl-cffi Chrome impersonation)...")
    
    for page in range(total_pages):
        url = f"{TGA_LISTING_URL}?sort_by=updated_date_sort&sort_field=updated_date_sort&page={page}"
        logger.info(f"Page {page + 1}/{total_pages}: Fetching {url}...")
        try:
            # Impersonate chrome to completely bypass WAF/anti-bot protection
            resp = requests.get(url, impersonate="chrome", timeout=30.0)
            if resp.status_code != 200:
                logger.error(f"❌ Failed to fetch page {page}: Status code {resp.status_code}")
                continue
            
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Find all links starting with "/resources/guidance/" (excluding the listing page itself)
            page_items_count = 0
            for link in soup.find_all("a", href=True):
                href = link["href"].strip()
                if href.startswith("/resources/guidance/") and href != "/resources/guidance":
                    title_text = link.get_text(strip=True)
                    full_url = f"{TGA_BASE_URL}{href}"
                    
                    # Avoid duplicates on the listing page
                    if not any(g["url"] == full_url for g in guidelines) and title_text:
                        guidelines.append({
                            "title": title_text,
                            "url": full_url
                        })
                        page_items_count += 1
            
            logger.info(f"Discovered {page_items_count} guidelines on page {page + 1}.")
            # Polite wait between page requests
            await asyncio.sleep(1.0)
        except Exception as e:
            logger.error(f"❌ Error scraping TGA listing page {page}: {e}")

    logger.info(f"✨ Crawling complete. Discovered {len(guidelines)} unique TGA guidelines in total.")
    return guidelines


async def ensure_tga_data() -> list[dict[str, Any]]:
    """Load cached TGA guidance list or crawl it dynamically if no cache exists."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cache_path = os.path.join(base_dir, TGA_LOCAL_CACHE)

    if os.path.exists(cache_path):
        logger.info(f"💾 Loading TGA guidance listings from local cache: {cache_path}")
        with open(cache_path, "r") as f:
            return json.load(f)

    # Crawl listings
    guidelines = await crawl_tga_listings()
    if guidelines:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "w") as f:
            json.dump(guidelines, f, indent=2)
        logger.info(f"💾 Cached {len(guidelines)} guidelines to: {cache_path}")
    
    return guidelines


async def scrape_guideline_detail(url: str) -> str:
    """Fetch the detail page HTML and extract clean text content."""
    resp = requests.get(url, impersonate="chrome", timeout=30.0)
    resp.raise_for_status()
    
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Extract from main content container
    content_div = soup.find("div", class_="region--content") or soup.find("article")
    if not content_div:
        # Fallback to body if no content container is found
        content_div = soup.find("body")

    if content_div:
        # Clone to prevent modifying the original parsed tree
        import copy
        content_clone = copy.copy(content_div)
        # Decompose search lists, toolbars, listen buttons, and print options
        for trash in content_clone.find_all(class_=["health-toolbar", "health-toolbar__listen", "share-widget"]):
            trash.decompose()
        return content_clone.get_text(separator="\n", strip=True)

    return ""


async def ingest_record(db: AsyncSession, item: dict[str, Any]):
    """Fetch and ingest a single TGA guidance document into pgvector."""
    title_text = item.get("title", "").strip()
    detail_url = item.get("url", "").strip()

    if not title_text or not detail_url:
        return

    # Duplicate check
    stmt = select(RegulatorySource).where(
        RegulatorySource.authority == "TGA", RegulatorySource.title == title_text
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        logger.info(f"⏭️ Skipping already ingested TGA document: {title_text}")
        return

    logger.info(f"Processing TGA Guideline: {title_text}")
    logger.info(f"Fetching detail HTML: {detail_url}")

    try:
        text = await scrape_guideline_detail(detail_url)
    except Exception as e:
        logger.error(f"❌ Failed to fetch/parse TGA detail page for {title_text}: {str(e)}")
        return

    if not text.strip():
        logger.warning(f"Could not extract any text content for TGA guideline: {title_text}")
        return

    # Prepare Metadata
    metadata = {
        "source": "TGA",
        "source_page": detail_url,
    }

    # Embed and Store
    try:
        await vector_service.add_regulatory_content(
            db, authority="TGA", title=title_text, content=text, source_url=detail_url, metadata=metadata
        )
        await db.commit()
        logger.info(f"✅ Successfully ingested TGA Guideline: {title_text}")
    except Exception as e:
        logger.error(f"❌ Failed to store {title_text} in vector DB: {str(e)}")


async def main(limit: int = 5):
    """Main ingestion loop for TGA guidelines."""
    guidelines = await ensure_tga_data()

    if not guidelines:
        logger.error("No TGA guidelines available to process.")
        return

    total_to_process = min(len(guidelines), limit)
    logger.info(f"Loaded {len(guidelines)} guidelines. {total_to_process} will be processed.")

    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    for i, item in enumerate(guidelines):
        if count >= limit:
            break

        logger.info(f"--- TGA Document {i + 1} / {total_to_process} ---")
        try:
            async with async_session() as db:
                await ingest_record(db, item)
            count += 1
            # Rate limit politeness
            await asyncio.sleep(1.0)
        except Exception as e:
            logger.error(f"Unexpected error processing document {i + 1}: {e}")

    logger.info(f"TGA Ingestion finished. Processed {count} records.")


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    asyncio.run(main(limit=limit))
