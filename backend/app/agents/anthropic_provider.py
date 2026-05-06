from collections.abc import AsyncGenerator
from typing import Any

import anthropic

from app.agents.base_provider import BaseLLMProvider
from app.core.config import settings


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, model: str) -> None:
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def stream_response(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        api_kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system_prompt:
            api_kwargs["system"] = system_prompt

        # Merge additional kwargs
        for key, value in kwargs.items():
            if key not in api_kwargs:
                api_kwargs[key] = value

        async with self.client.messages.stream(**api_kwargs) as stream:
            async for text in stream.text_stream:
                yield text
