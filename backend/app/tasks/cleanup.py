"""Background task: delete temporary conversations whose last activity is > 1 hour old."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.db.session import AsyncSessionLocal
from app.models.chat import Conversation, Message

logger = logging.getLogger(__name__)

_STALE_AFTER = timedelta(hours=1)
# Run once per day; first run waits until next 06:00 UTC.
_RUN_HOUR_UTC = 6


def _seconds_until_next_run() -> float:
    now = datetime.now(timezone.utc)
    next_run = now.replace(hour=_RUN_HOUR_UTC, minute=0, second=0, microsecond=0)
    if next_run <= now:
        next_run += timedelta(days=1)
    return (next_run - now).total_seconds()


async def _delete_stale_temporary_conversations() -> int:
    cutoff = datetime.now(timezone.utc) - _STALE_AFTER
    deleted = 0
    async with AsyncSessionLocal() as db:
        # Find temporary convos whose updated_at is older than the cutoff.
        # updated_at reflects the last message sent, so it's a reliable proxy.
        result = await db.execute(
            select(Conversation.id).where(
                Conversation.is_temporary == True,  # noqa: E712
                Conversation.updated_at < cutoff,
            )
        )
        stale_ids = result.scalars().all()
        if stale_ids:
            await db.execute(
                delete(Conversation).where(Conversation.id.in_(stale_ids))
            )
            await db.commit()
            deleted = len(stale_ids)
    return deleted


async def run_cleanup_loop() -> None:
    """Runs forever: waits until 06:00 UTC, deletes stale temp chats, repeats daily."""
    await asyncio.sleep(_seconds_until_next_run())
    while True:
        try:
            count = await _delete_stale_temporary_conversations()
            if count:
                logger.info("Cleanup: deleted %d stale temporary conversation(s)", count)
        except Exception:
            logger.exception("Cleanup task failed — will retry tomorrow")
        await asyncio.sleep(86_400)  # 24 hours
