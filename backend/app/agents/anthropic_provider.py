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

    @staticmethod
    def _build_content_block(native_file: dict) -> dict:
        """Convert a provider-agnostic native file dict to an Anthropic content block."""
        mt = native_file["media_type"]
        data = native_file["data"]
        if mt == "application/pdf":
            return {
                "type": "document",
                "source": {"type": "base64", "media_type": mt, "data": data},
            }
        # image/*
        return {
            "type": "image",
            "source": {"type": "base64", "media_type": mt, "data": data},
        }

    async def stream_response(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
        max_tokens: int = 16384,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        native_files: list[dict] = kwargs.pop("native_files", None) or []

        # Inject native file content blocks into the last user message when present.
        if native_files and messages:
            *prior, last = messages
            last_content = last.get("content", "")
            content_array: list[dict] = [{"type": "text", "text": last_content}]
            content_array.extend(self._build_content_block(f) for f in native_files)
            messages = list(prior) + [{"role": last.get("role", "user"), "content": content_array}]

        api_kwargs: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system_prompt:
            api_kwargs["system"] = system_prompt

        for k, v in kwargs.items():
            if k not in api_kwargs:
                api_kwargs[k] = v

        key = settings.ANTHROPIC_API_KEY or ""
        key_hint = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("(not set)" if not key else "(short key)")
        logger.info(f"[AnthropicProvider] model={self.model}  key={key_hint}  messages={len(messages)}  native_files={len(native_files)}")
        try:
            async with self.client.messages.stream(**api_kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
            logger.info(f"[AnthropicProvider] stream complete  model={self.model}")
        except Exception as e:
            logger.error(f"[AnthropicProvider] ERROR  model={self.model}  key={key_hint}  error={e}")
            yield f"Error from Anthropic: {str(e)}"
