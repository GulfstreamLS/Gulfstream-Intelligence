import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test_db():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_database();"))
            db_name = result.scalar()
            print(f"Connected to database: {db_name}")
            
            result = await conn.execute(text("SELECT count(*) FROM users;"))
            count = result.scalar()
            print(f"Users count: {count}")
    except Exception as e:
        print(f"Database connection failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_db())
