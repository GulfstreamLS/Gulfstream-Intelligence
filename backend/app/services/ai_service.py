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
        provider = self._resolve_provider(model)
        if provider == "anthropic":
            async for chunk in self._stream_anthropic(messages, model, system_prompt, max_tokens, tools):
                yield chunk
        else:
            async for chunk in self._stream_openai(messages, model, system_prompt, max_tokens):
                yield chunk

    async def _stream_anthropic(
        self,
        messages: list[dict],
        model: str,
        system_prompt: str | None,
        max_tokens: int,
        tools: list[dict] | None,
    ) -> AsyncGenerator[str, None]:
        kwargs: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system_prompt:
            kwargs["system"] = system_prompt
        if tools:
            kwargs["tools"] = tools

        async with self.anthropic_client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

    async def _stream_openai(
        self,
        messages: list[dict],
        model: str,
        system_prompt: str | None,
        max_tokens: int,
    ) -> AsyncGenerator[str, None]:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        stream = await self.openai_client.chat.completions.create(
            model=model,
            messages=all_messages,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    def _resolve_provider(self, model: str) -> str:
        if model.startswith("claude"):
            return "anthropic"
        if model.startswith("gpt") or model.startswith("o1") or model.startswith("o3"):
            return "openai"
        return settings.DEFAULT_AI_PROVIDER


ai_service = AIService()
