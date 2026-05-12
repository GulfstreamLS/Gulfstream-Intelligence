import logging
from collections.abc import AsyncGenerator
from typing import Any

import anthropic

from app.agents.base_provider import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, model: str) -> None:
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY or None)

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

        key = settings.ANTHROPIC_API_KEY or ""
        key_hint = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("(not set)" if not key else "(short key)")
        logger.info(f"[AnthropicProvider] model={self.model}  key={key_hint}  messages={len(messages)}")
        try:
            async with self.client.messages.stream(**api_kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
            logger.info(f"[AnthropicProvider] stream complete  model={self.model}")
        except Exception as e:
            logger.error(f"[AnthropicProvider] ERROR  model={self.model}  key={key_hint}  error={e}")
            yield f"Error from Anthropic: {str(e)}"
