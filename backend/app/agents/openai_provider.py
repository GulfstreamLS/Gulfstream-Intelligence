import logging
from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from app.agents.base_provider import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model: str) -> None:
        self.model = model
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or None)

    async def stream_response(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        key = settings.OPENAI_API_KEY or ""
        key_hint = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("(not set)" if not key else "(short key)")
        logger.info(f"[OpenAIProvider] model={self.model}  key={key_hint}  messages={len(messages)}")

        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=all_messages,
                max_tokens=max_tokens,
                stream=True,
                **kwargs,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            logger.info(f"[OpenAIProvider] stream complete  model={self.model}")
        except Exception as e:
            logger.error(f"[OpenAIProvider] ERROR  model={self.model}  key={key_hint}  error={e}")
            yield f"Error from OpenAI: {str(e)}"
