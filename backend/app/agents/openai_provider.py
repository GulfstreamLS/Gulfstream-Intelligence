from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from app.agents.base_provider import BaseLLMProvider
from app.core.config import settings


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
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

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
