import asyncio
import os
from sqlalchemy import select, func
from app.db.session import async_session_maker
from app.models.regulatory import RegulatorySource

async def get_count():
    async with async_session_maker() as session:
        result = await session.execute(select(func.count(RegulatorySource.id)))
        count = result.scalar()
        print(f"\n✅ Currently ingested records in live DB: {count}")

if __name__ == "__main__":
    asyncio.run(get_count())
