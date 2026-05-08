import asyncio
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.regulatory import RegulatorySource

async def count_records():
    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(RegulatorySource))
        count = result.scalar()
        print(f"TOTAL_RECORDS: {count}")

if __name__ == "__main__":
    asyncio.run(count_records())
