from app.agents.anthropic_provider import AnthropicProvider
from app.agents.base_provider import BaseLLMProvider
from app.agents.openai_provider import OpenAIProvider
from app.core.config import settings


class ModelRouter:
    @staticmethod
    def get_provider(model: str) -> BaseLLMProvider:
        """Resolve the appropriate LLM provider based on the model name."""
        if not model:
            model = settings.DEFAULT_MODEL

        if model.startswith("claude"):
            return AnthropicProvider(model=model)
        if model.startswith("gpt") or model.startswith("o1") or model.startswith("o3"):
            return OpenAIProvider(model=model)

        # Default fallback
        default_provider = settings.DEFAULT_AI_PROVIDER
        if default_provider == "anthropic":
            return AnthropicProvider(model=settings.DEFAULT_MODEL)
        return OpenAIProvider(model=settings.DEFAULT_MODEL)
