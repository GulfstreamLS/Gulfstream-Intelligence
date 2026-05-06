import asyncio
import json
import logging
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.logging import get_logger
from app.services.document_processor import document_processor
from app.services.vector_service import vector_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = get_logger("fda_ingestor")

FDA_DATA_URL = "https://www.fda.gov/datatables-json/search-for-guidance.json"


async def fetch_fda_metadata(local_path: str = None) -> list[dict[str, Any]]:
    """Fetch metadata from FDA remote or a local file."""
    if local_path:
        logger.info(f"Loading local FDA metadata from {local_path}...")
        with open(local_path) as f:
            if local_path.endswith(".json"):
                data = json.load(f)
                return data.get("data", [])
        return []

    logger.info(f"Fetching FDA metadata from {FDA_DATA_URL}...")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.fda.gov/regulatory-information/search-fda-guidance-documents",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive",
    }

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        for attempt in range(3):
            try:
                response = await client.get(FDA_DATA_URL, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    rows = data.get("data", [])
                    logger.info(f"Successfully fetched {len(rows)} entries from FDA.")
                    return rows

                logger.warning(f"Attempt {attempt + 1} failed with status {response.status_code}. Retrying...")
                await asyncio.sleep(2 * (attempt + 1))
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} encountered error: {str(e)}. Retrying...")
                await asyncio.sleep(2 * (attempt + 1))

        logger.error("All attempts to fetch FDA metadata failed.")
        return []


def parse_fda_row(row: list[str]) -> dict[str, Any]:
    """Parse a single row from the FDA DataTables JSON."""
    title_html = row[0]
    doc_html = row[1]
    issue_date = row[2]
    org = row[3]
    topic = row[4]
    status = row[5]

    # Extract PDF URL
    pdf_url = ""
    if 'href="' in doc_html:
        pdf_url = doc_html.split('href="')[1].split('"')[0]
        if not pdf_url.startswith("http"):
            pdf_url = "https://www.fda.gov" + pdf_url

    # Clean title
    title = title_html.split(">")[-2].split("<")[0] if "<" in title_html else title_html

    return {
        "title": title.strip(),
        "pdf_url": pdf_url,
        "issue_date": issue_date,
        "organization": org,
        "topic": topic,
        "status": status.strip() if status else "",
    }


async def ingest_document(db: AsyncSession, doc_meta: dict[str, Any]):
    """Download PDF, extract text, and seed into vector DB."""
    if not doc_meta["pdf_url"]:
        return

    logger.info(f"Processing: {doc_meta['title']}...")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            response = await client.get(doc_meta["pdf_url"], headers=headers)
            response.raise_for_status()
            pdf_bytes = response.content

        text = document_processor.extract_text(pdf_bytes, "pdf")
        if not text.strip():
            return

        metadata = {
            "source": "FDA",
            "issue_date": doc_meta["issue_date"],
            "organization": doc_meta["organization"],
            "topic": doc_meta["topic"],
            "status": doc_meta["status"],
        }

        await vector_service.add_regulatory_content(
            db,
            authority="FDA",
            title=doc_meta["title"],
            content=text,
            source_url=doc_meta["pdf_url"],
            metadata=metadata,
        )
        await db.commit()
        logger.info(f"✅ Ingested: {doc_meta['title']}")

    except Exception as e:
        logger.error(f"❌ Failed {doc_meta['title']}: {str(e)}")


async def main(limit: int = 10, status_filter: str = "Final", local_path: str = None):
    """Main entry point for ingestion."""
    rows = await fetch_fda_metadata(local_path)
    if not rows:
        logger.error("No metadata found. Exiting.")
        return

    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    count = 0
    async with async_session() as db:
        for row in rows:
            if count >= limit:
                break

            doc_meta = parse_fda_row(row)
            if status_filter and status_filter.lower() not in doc_meta["status"].lower():
                continue

            await ingest_document(db, doc_meta)
            count += 1

    logger.info(f"Processed {count} documents.")


if __name__ == "__main__":
    import sys

    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    status = sys.argv[2] if len(sys.argv) > 2 else "Final"
    local_path = sys.argv[3] if len(sys.argv) > 3 else None

    asyncio.run(main(limit=limit, status_filter=status, local_path=local_path))
