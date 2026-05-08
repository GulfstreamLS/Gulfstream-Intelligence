import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.services.vector_service import vector_service

# A collection of high-quality regulatory mock data for the demo
MOCK_DATA_PACK = [
    {"title": "21 CFR Part 11: Electronic Records; Electronic Signatures", "content": "This part sets forth the criteria under which the agency considers electronic records, electronic signatures, and handwritten signatures executed to electronic records to be trustworthy, reliable, and generally equivalent to paper records and handwritten signatures executed on paper."},
    {"title": "Guidance for Industry: Computer Software Assurance", "content": "This guidance describes a risk-based approach to computer software assurance for production or quality system software. The FDA recommends focusing on those software features, functions, and operations that present a high risk to patient safety or product quality."},
    {"title": "Postmarket Surveillance of Medical Devices", "content": "Manufacturers are required to establish and maintain procedures for receiving, reviewing, and evaluating complaints by a formally designated unit. This section ensures that any device defects or patient safety issues are reported to the FDA within 30 days."},
    {"title": "Good Laboratory Practice for Nonclinical Laboratory Studies", "content": "These regulations prescribe good laboratory practices for conducting nonclinical laboratory studies that support or are intended to support applications for research or marketing permits for products regulated by the FDA."},
    {"title": "Content and Format of Investigational New Drug Applications (INDs)", "content": "An IND must include information in three broad areas: Animal Pharmacology and Toxicology Studies, Manufacturing Information, and Clinical Protocols and Investigator Information."},
    {"title": "Current Good Manufacturing Practice (CGMP) for Finished Pharmaceuticals", "content": "The regulations in this part contain the minimum current good manufacturing practice for methods to be used in, and the facilities or controls to be used for, the manufacture, processing, packing, or holding of a drug to assure that such drug meets the requirements of the act as to safety, and has the identity and strength and meets the quality and purity characteristics."},
    {"title": "Guidance on Informed Consent for Clinical Trials", "content": "Informed consent is a process that involves providing a potential subject with adequate information to allow for an informed decision about participation in the clinical investigation."},
    {"title": "FDA Enforcement Policy for Digital Health Devices", "content": "This guidance document provides the FDA's enforcement policy for certain low-risk digital health products, such as mobile apps intended for wellness or basic health tracking, which do not require formal premarket clearance."},
    {"title": "Labeling of Human Prescription Drug and Biological Products", "content": "Prescription drug labeling must provide a summary of the essential scientific information needed for the safe and effective use of the drug. The labeling must be informative and accurate and neither promotional in tone nor false or misleading."},
    {"title": "Prevention of Salmonella in Shell Eggs During Production", "content": "Shell egg producers are required to implement measures to prevent Salmonella Enteritidis from contaminating shell eggs during production, storage, and transportation, including refrigeration requirements and testing protocols."}
]

# We will duplicate these with slight variations to reach a higher record count for the demo
async def seed_demo_data(count_target: int = 100):
    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    print(f"DEBUG: Seeding {count_target} records for the demo...")
    
    async with SessionLocal() as db:
        for i in range(count_target):
            template = MOCK_DATA_PACK[i % len(MOCK_DATA_PACK)]
            title = f"{template['title']} - Ref #{1000 + i}"
            content = f"Record {i+1}: {template['content']}"
            
            await vector_service.add_regulatory_content(
                db, 
                authority="FDA", 
                title=title, 
                content=content, 
                source_url="https://www.fda.gov/demo-docs",
                metadata={"source": "Demo-Pack", "index": i}
            )
            
            if (i + 1) % 10 == 0:
                await db.commit()
                print(f"DEBUG: Committed {i+1} records...")
        
        await db.commit()
    print("DEBUG: Demo data seeding COMPLETE.")

if __name__ == "__main__":
    asyncio.run(seed_demo_data(150)) # Seeding 150 records to start
