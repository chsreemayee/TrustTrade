"""LLM access (Gemini Flash). The LLM only reads/extracts and writes wording; it never decides
a score or verdict. Every call has a timeout and may raise; callers must handle failure.

Tests (and a missing key) swap the client with set_llm(); get_llm() returns None when no
LLM is available, which the pipeline treats as "could not check".
"""
from __future__ import annotations

import json
import logging
from typing import Any, Protocol

from core.config import get_settings

log = logging.getLogger("trusttrade.llm")


class LLMError(RuntimeError):
    pass


class LLM(Protocol):
    def generate_json(self, prompt: str, schema: dict, *, image: bytes | None = None,
                      image_mime: str | None = None, timeout_ms: int = 6000) -> dict[str, Any]: ...


class GeminiLLM:
    def __init__(self, api_key: str, model: str):
        from google import genai  # lazy: tests never import the SDK client

        self._genai = genai
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def generate_json(self, prompt, schema, *, image=None, image_mime=None, timeout_ms=6000):
        from google.genai import types

        contents: list[Any] = [prompt]
        if image is not None:
            contents.append(types.Part.from_bytes(data=image, mime_type=image_mime or "image/jpeg"))
        config = types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema=schema,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            http_options=types.HttpOptions(timeout=timeout_ms),
        )
        try:
            res = self._client.models.generate_content(model=self._model, contents=contents, config=config)
            return json.loads(res.text)
        except Exception as e:  # noqa: BLE001 - network, quota, timeout, bad JSON: all the same to callers
            # Log the error type only: messages can echo the prompt (user text).
            log.warning("Gemini call failed: %s", type(e).__name__)
            raise LLMError(type(e).__name__) from e


_override: LLM | None = None
_override_set = False
_client: LLM | None = None


def set_llm(llm: LLM | None) -> None:
    """Test hook: force a specific client (or None for 'LLM unavailable')."""
    global _override, _override_set
    _override, _override_set = llm, True


def reset_llm() -> None:
    global _override, _override_set
    _override, _override_set = None, False


def get_llm() -> LLM | None:
    global _client
    if _override_set:
        return _override
    s = get_settings()
    if not s.gemini_configured:
        return None
    if _client is None:
        _client = GeminiLLM(s.gemini_api_key, s.gemini_model)
    return _client
