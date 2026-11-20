import os

# Tests never touch real services or keys, whatever is in .env.
os.environ["STORE_BACKEND"] = "memory"
os.environ["GEMINI_API_KEY"] = ""
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_KEY"] = ""
os.environ["CORS_ORIGINS"] = "https://trusttrade.vercel.app,http://localhost:3000"
os.environ["ADMIN_EMAIL"] = "admin@test.local"
os.environ["ADMIN_PASSWORD"] = "correct horse battery staple"
os.environ["ADMIN_TOKEN_SECRET"] = "test-secret-not-for-production-0123456789"
os.environ["PRICE_SOURCE"] = "none"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(autouse=True)
def mem():
    """Fresh in-memory store, empty caches and the fake LLM for every test."""
    from agents.scam_investigator import pipeline
    from core.llm import reset_llm, set_llm
    from core.store import get_store
    from tests.fakes import FakeLLM

    from core import prices
    get_store.cache_clear()
    pipeline.clear_cache()
    prices._series_memo.clear()
    set_llm(FakeLLM())
    yield get_store()
    reset_llm()
    get_store.cache_clear()


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def uid_headers(uid="anon_test_0001"):
    return {"X-User-Id": uid}
