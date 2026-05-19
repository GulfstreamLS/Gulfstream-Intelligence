from collections.abc import AsyncGenerator
from typing import Any

import anthropic
from openai import AsyncOpenAI

from app.agents.message_normalizer import count_empty_ai_message_contents, normalize_ai_messages
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
        messages: list[dict[str, Any]],
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

        messages_for_ai = list(messages or [])
        if native_files:
            if messages_for_ai:
                messages_for_ai[-1] = {**messages_for_ai[-1], "_has_native_files": True}
            else:
                messages_for_ai.append({"role": "user", "content": "", "_has_native_files": True})

        normalized_messages, stats = normalize_ai_messages(messages_for_ai)
        if stats.fallback_count or stats.dropped_empty_count or stats.trimmed_count:
            logger.info(
                "[AIService] normalized AI messages  "
                "input=%s  output=%s  trimmed=%s  fallback=%s  dropped_empty=%s",
                stats.input_count,
                stats.output_count,
                stats.trimmed_count,
                stats.fallback_count,
                stats.dropped_empty_count,
            )

        empty_count = count_empty_ai_message_contents(normalized_messages)
        if empty_count:
            logger.error("[AIService] detected %s empty AI message(s); retrying payload cleanup", empty_count)
            normalized_messages, _ = normalize_ai_messages(normalized_messages)

        async for chunk in provider.stream_response(
            messages=normalized_messages, system_prompt=system_prompt, max_tokens=max_tokens, **kwargs
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
