from collections.abc import AsyncGenerator
from typing import Any

import anthropic
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AIService:
    def __init__(self) -> None:
        self._anthropic: anthropic.AsyncAnthropic | None = None
        self._openai: AsyncOpenAI | None = None

    @property
    def anthropic_client(self) -> anthropic.AsyncAnthropic:
        if self._anthropic is None:
            self._anthropic = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._anthropic

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai is None:
            self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str, None]:
        from app.agents.model_router import ModelRouter

        provider = ModelRouter.get_provider(model)

        kwargs = {}
        if tools:
            kwargs["tools"] = tools

        async for chunk in provider.stream_response(
            messages=messages, system_prompt=system_prompt, max_tokens=max_tokens, **kwargs
        ):
            yield chunk


ai_service = AIService()
