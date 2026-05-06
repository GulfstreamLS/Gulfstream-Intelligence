import asyncio
import uuid
from sqlalchemy import select
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User
from app.models.regulatory import AnalysisDocument, Gap, SeverityLevel, Action
from app.api.v1.assessments import get_global_gap_assessment
from fastapi.testclient import TestClient
from app.main import app

# We'll use a test script that directly interacts with the DB and then calls the API logic
async def setup_test_data():
    async with AsyncSessionLocal() as db:
        # 1. Get or create a test user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found. Please register a user first.")
            return None

        print(f"Using user: {user.email}")

        # 2. Create a mock AnalysisDocument for FDA
        doc = AnalysisDocument(
            user_id=user.id,
            filename="test_fda_doc.pdf",
            file_type="pdf",
            file_path="/tmp/test.pdf",
            authority="FDA",
            summary="Test FDA Analysis Summary",
            confidence_score=0.95
        )
        db.add(doc)
        await db.flush()

        # 3. Create some Gaps
        gaps = [
            Gap(
                document_id=doc.id,
                title="Missing Stability Data",
                domain="CMC",
                severity=SeverityLevel.CRITICAL,
                description="Long-term stability data is missing for the active ingredient.",
                regulatory_impact="High",
                recommended_action="Conduct 12-month stability study."
            ),
            Gap(
                document_id=doc.id,
                title="Incomplete Toxicology Report",
                domain="NON-CLINICAL",
                severity=SeverityLevel.HIGH,
                description="Repeat-dose study is missing for one species.",
                regulatory_impact="Medium",
                recommended_action="Perform repeat-dose study in rodents."
            )
        ]
        db.add_all(gaps)

        # 4. Create an Action
        action = Action(
            document_id=doc.id,
            title="Update CMC Section",
            description="Add missing stability data once available.",
            priority="High"
        )
        db.add(action)
        
        await db.commit()
        print(f"Test data created for document: {doc.id}")
        return user.id

async def test_api_call(user_id):
    # Since we can't easily do full HTTP auth in a script, we'll test the logic directly
    # or use TestClient with a mock dependency
    print("\n--- Testing API Logic Directly ---")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        
        response = await get_global_gap_assessment(authority="FDA", db=db, current_user=user)
        print(f"Overall Readiness: {response.overall_readiness}%")
        print(f"Critical Gaps: {response.critical_gaps_count}")
        print(f"Top Gaps found: {len(response.top_gaps)}")
        for gap in response.top_gaps:
            print(f" - [{gap.domain}] {gap.title} ({gap.severity})")

async def main():
    uid = await setup_test_data()
    if uid:
        await test_api_call(uid)

if __name__ == "__main__":
    asyncio.run(main())
