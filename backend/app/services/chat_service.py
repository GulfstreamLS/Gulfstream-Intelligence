import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.chat import Conversation, Message, MessageRole
from app.schemas.chat import ConversationCreate, ConversationUpdate

logger = get_logger(__name__)


class ChatService:
    async def get_conversations(self, db: AsyncSession, user_id: uuid.UUID) -> list[Conversation]:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_conversation(
        self, db: AsyncSession, conversation_id: uuid.UUID, user_id: uuid.UUID
    ) -> Conversation | None:
        result = await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self, db: AsyncSession, user_id: uuid.UUID, data: ConversationCreate
    ) -> Conversation:
        convo = Conversation(user_id=user_id, **data.model_dump())
        db.add(convo)
        await db.flush()
        return convo

    async def update_conversation(
        self, db: AsyncSession, conversation: Conversation, data: ConversationUpdate
    ) -> Conversation:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(conversation, field, value)
        await db.flush()
        return conversation

    async def delete_conversation(self, db: AsyncSession, conversation: Conversation) -> None:
        await db.delete(conversation)

    async def add_message(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        role: MessageRole,
        content: str,
        token_count: int | None = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            token_count=token_count,
        )
        db.add(msg)
        await db.flush()
        return msg

    async def get_messages_as_dicts(self, db: AsyncSession, conversation_id: uuid.UUID) -> list[dict]:
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()
        return [{"role": m.role.value, "content": m.content} for m in messages if m.role != MessageRole.SYSTEM]

    async def auto_title_conversation(self, conversation: Conversation, first_message: str) -> str:
        return first_message[:80].rstrip() + ("..." if len(first_message) > 80 else "")


chat_service = ChatService()
