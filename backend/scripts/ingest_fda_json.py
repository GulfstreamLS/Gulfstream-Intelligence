import asyncio
import json
import logging
from typing import Any

import httpx
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
logger = get_logger("fda_json_ingestor")

FDA_BASE_URL = "https://www.fda.gov"


async def get_pdf_link_from_page(client: httpx.AsyncClient, page_url: str) -> str:
    """Visit a guidance page and find the PDF download link."""
    try:
        response = await client.get(page_url, timeout=20.0)
        if response.status_code != 200:
            return ""

        soup = BeautifulSoup(response.text, "html.parser")
        # Pattern 1: Links containing '/media/' and 'download'
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if "/media/" in href and "/download" in href:
                if not href.startswith("http"):
                    href = FDA_BASE_URL + href
                return href
            if href.lower().endswith(".pdf"):
                if not href.startswith("http"):
                    href = FDA_BASE_URL + href
                return href
        return ""
    except Exception as e:
        logger.error(f"Error finding PDF link on {page_url}: {str(e)}")
        return ""


async def extract_html_content(client: httpx.AsyncClient, page_url: str) -> str:
    """Fallback to extract text directly from the HTML page if no PDF is found."""
    try:
        response = await client.get(page_url, timeout=20.0)
        if response.status_code != 200:
            return ""
        soup = BeautifulSoup(response.text, "html.parser")
        # FDA guidance pages usually have content in 'div.col-md-9' or 'article'
        content_div = soup.find("div", {"class": "col-md-9"}) or soup.find("article")
        if content_div:
            return content_div.get_text(separator="\n", strip=True)
        return ""
    except Exception as e:
        logger.error(f"Error extracting HTML from {page_url}: {str(e)}")
        return ""


async def ingest_record(db: AsyncSession, client: httpx.AsyncClient, item: dict[str, Any]):
    """Process a single JSON record."""
    title_html = item.get("title", "")
    if not title_html:
        return

    soup = BeautifulSoup(title_html, "html.parser")
    link_tag = soup.find("a")
    if not link_tag:
        return

    title_text = link_tag.get_text().strip()
    page_path = link_tag["href"]
    page_url = FDA_BASE_URL + page_path if not page_path.startswith("http") else page_path

    # Check if already exists to prevent duplication and save time
    stmt = select(RegulatorySource).where(RegulatorySource.title == title_text)
    result = await db.execute(stmt)
    if result.scalars().first():
        logger.info(f"⏭️ Skipping already ingested: {title_text}")
        return

    logger.info(f"Processing Guidance: {title_text}")

    # 1. Try to find the PDF link
    pdf_url = await get_pdf_link_from_page(client, page_url)
    text = ""
    source_url = page_url

    if pdf_url:
        logger.info(f"Found PDF: {pdf_url}")
        try:
            response = await client.get(pdf_url, timeout=30.0)
            response.raise_for_status()
            text = document_processor.extract_text(response.content, "pdf")
            source_url = pdf_url
        except Exception as e:
            logger.error(f"Failed to download/parse PDF for {title_text}: {str(e)}")

    # 2. Fallback to HTML if PDF failed or wasn't found
    if not text.strip():
        logger.info(f"Falling back to HTML content for {title_text}")
        text = await extract_html_content(client, page_url)

    if not text.strip():
        logger.warning(f"Could not extract any content for {title_text}")
        return

    # 3. Prepare Metadata
    metadata = {
        "source": "FDA",
        "issue_date": item.get("field_issue_datetime"),
        "organization": item.get("field_center"),
        "topics": item.get("topics-product"),
        "status": item.get("field_final_guidance_1"),
        "source_page": page_url,
    }

    # 4. Embed and Store
    try:
        await vector_service.add_regulatory_content(
            db, authority="FDA", title=title_text, content=text, source_url=source_url, metadata=metadata
        )
        await db.commit()
        logger.info(f"✅ Successfully ingested: {title_text}")
    except Exception as e:
        logger.error(f"❌ Failed to store {title_text}: {str(e)}")


async def main(limit: int = 5, status_filter: str = "Final"):
    """Main ingestion loop from JSON file."""
    try:
        with open("fda_data.json") as f:
            data = json.load(f)
    except FileNotFoundError:
        logger.error("fda_data.json not found in backend directory.")
        return

    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        async with async_session() as db:
            for item in data:
                if count >= limit:
                    break

                # Filter by status
                if status_filter and status_filter.lower() not in item.get("field_final_guidance_1", "").lower():
                    continue

                await ingest_record(db, client, item)
                count += 1

    logger.info(f"Ingestion finished. Processed {count} records.")


if __name__ == "__main__":
    import sys

    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    status = sys.argv[2] if len(sys.argv) > 2 else "Final"

    asyncio.run(main(limit=limit, status_filter=status))
