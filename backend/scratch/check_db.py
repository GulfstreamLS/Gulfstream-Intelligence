import asyncio
import uuid
from app.db.session import AsyncSessionLocal
from app.models.chat import Conversation, Message
from sqlalchemy import select
import json

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Conversation).order_by(Conversation.created_at.desc()).limit(1))
        convo = res.scalar_one_or_none()
        if convo:
            print(f"Convo ID: {convo.id}")
            print(f"Metadata: {json.dumps(convo.metadata_, indent=2)}")
            print(f"Active File ID: {convo.active_file_id}")
            
            res_msg = await db.execute(select(Message).where(Message.conversation_id == convo.id))
            messages = res_msg.scalars().all()
            for m in messages:
                print(f"Msg {m.id}: role={m.role}, is_analysis={m.is_analysis}, has_data={m.analysis_data is not None}")

if __name__ == "__main__":
    asyncio.run(check())
