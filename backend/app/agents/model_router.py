import logging
from typing import Final

from app.agents.anthropic_provider import AnthropicProvider
from app.agents.base_provider import BaseLLMProvider
from app.agents.openai_provider import OpenAIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

# Mapping frontend/mock model IDs to real production model IDs if needed
MODEL_MAPPING: Final[dict[str, str]] = {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
}


class ModelRouter:
    @staticmethod
    def get_provider(model: str | None) -> BaseLLMProvider:
        """Resolve the appropriate LLM provider based on the model name."""
        if not model:
            model = settings.DEFAULT_MODEL

        # Apply mapping if exists
        mapped_model = MODEL_MAPPING.get(model, model)
        
        logger.info(f"Routing request for model: {model} (mapped to: {mapped_model})")

        if mapped_model.startswith("claude"):
            logger.info(f"[ModelRouter] {model!r} → Anthropic  (mapped={mapped_model!r})")
            return AnthropicProvider(model=mapped_model)

        if mapped_model.startswith("gpt") or mapped_model.startswith("o1") or mapped_model.startswith("o3"):
            logger.info(f"[ModelRouter] {model!r} → OpenAI  (mapped={mapped_model!r})")
            return OpenAIProvider(model=mapped_model)

        # Default fallback logic if prefix matching fails
        logger.warning(f"[ModelRouter] no match for {mapped_model!r} — falling back to default provider ({settings.DEFAULT_AI_PROVIDER}, model={settings.DEFAULT_MODEL})")
        default_provider = settings.DEFAULT_AI_PROVIDER

        if default_provider == "anthropic":
            return AnthropicProvider(model=settings.DEFAULT_MODEL)

        return OpenAIProvider(model=settings.DEFAULT_MODEL)
