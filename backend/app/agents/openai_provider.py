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

    @staticmethod
    def _build_content_block(native_file: dict) -> dict:
        """Convert a provider-agnostic native file dict to an OpenAI content block."""
        mt = native_file["media_type"]
        data = native_file["data"]
        filename = native_file["filename"]
        if mt == "application/pdf":
            return {
                "type": "file",
                "file": {
                    "filename": filename,
                    "file_data": f"data:{mt};base64,{data}",
                },
            }
        # image/*
        return {
            "type": "image_url",
            "image_url": {"url": f"data:{mt};base64,{data}"},
        }

    async def stream_response(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
        max_tokens: int = 16384,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        native_files: list[dict] = kwargs.pop("native_files", None) or []

        key = settings.OPENAI_API_KEY or ""
        key_hint = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("(not set)" if not key else "(short key)")
        logger.info(f"[OpenAIProvider] model={self.model}  key={key_hint}  messages={len(messages)}  native_files={len(native_files)}")

        all_messages: list[dict] = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})

        if native_files and messages:
            # Inject file content blocks into the last user message.
            *prior, last = messages
            all_messages.extend(prior)
            last_content = last.get("content", "")
            content_array: list[dict] = [{"type": "text", "text": last_content}]
            content_array.extend(self._build_content_block(f) for f in native_files)
            all_messages.append({"role": last.get("role", "user"), "content": content_array})
        else:
            all_messages.extend(messages)

        # gpt-5 and o-series models use max_completion_tokens; older models use max_tokens
        _new_token_param_models = ("gpt-5", "o1", "o3", "o4")
        token_param = "max_completion_tokens" if self.model.startswith(_new_token_param_models) else "max_tokens"

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=all_messages,
                **{token_param: max_tokens},
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
