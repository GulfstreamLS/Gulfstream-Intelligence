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
            self._anthropic = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY or None)
        return self._anthropic

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai is None:
            self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or None)
        return self._openai

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        system_prompt: str | None = None,
        max_tokens: int = 16384,
        tools: list[dict[str, Any]] | None = None,
        native_files: list[dict] | None = None,
    ) -> AsyncGenerator[str, None]:
        from app.agents.model_router import ModelRouter

        provider = ModelRouter.get_provider(model)

        kwargs: dict[str, Any] = {}
        if tools:
            kwargs["tools"] = tools
        if native_files:
            kwargs["native_files"] = native_files

        async for chunk in provider.stream_response(
            messages=messages, system_prompt=system_prompt, max_tokens=max_tokens, **kwargs
        ):
            yield chunk


    async def generate_title(self, message: str, response_snippet: str = "") -> str:
        """Generate a short 4-6 word conversation title using a fast model."""
        context = message[:300]
        if response_snippet:
            context += "\n\nResponse preview: " + response_snippet[:150]
        try:
            completion = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Generate a concise 4-6 word title for this conversation. "
                            "Reply with ONLY the title. No quotes, no punctuation at the end."
                        ),
                    },
                    {"role": "user", "content": context},
                ],
                max_tokens=20,
                temperature=0.7,
            )
            title = (completion.choices[0].message.content or "").strip().strip("\"'")
            return title[:80] if title else message[:60]
        except Exception:
            return message[:60]


ai_service = AIService()
