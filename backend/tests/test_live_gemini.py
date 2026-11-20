"""Live acceptance against real Gemini. Skipped unless you opt in:

    RUN_LIVE=1 .venv/bin/python -m pytest tests/test_live_gemini.py -v

Reads GEMINI_API_KEY from backend/.env. Costs ~20 Gemini Flash calls.
"""
import json
import os
from pathlib import Path

import pytest
from dotenv import dotenv_values

from agents.scam_investigator.pipeline import CheckInput, run_scam_check
from core.config import LANGUAGES
from core.llm import GeminiLLM, reset_llm, set_llm
from core.text import find_banned

KEY = dotenv_values(Path(__file__).parents[1] / ".env").get("GEMINI_API_KEY")
pytestmark = pytest.mark.skipif(not (os.environ.get("RUN_LIVE") and KEY), reason="set RUN_LIVE=1 and GEMINI_API_KEY in .env")
TIPS = json.loads((Path(__file__).parent / "data" / "demo_tips.json").read_text(encoding="utf-8"))


@pytest.fixture(autouse=True)
def live(mem):
    set_llm(GeminiLLM(KEY, dotenv_values(Path(__file__).parents[1] / ".env").get("GEMINI_MODEL") or "gemini-2.5-flash"))
    yield
    reset_llm()


@pytest.mark.parametrize("tip", TIPS, ids=lambda t: f"tip{t['id']}-{t['lang']}")
def test_live_demo_tip(tip):
    r = run_scam_check(CheckInput("text", text=tip["text"]))
    reading = next(c for c in r["checks"] if c["name"] == "Reading the message")
    assert reading["status"] == "found", "Gemini call failed (key, quota or network)"
    assert r["verdict"] == tip["expected_verdict"], [s["code"] for s in r["signs"]]
    disclaimer_free = {lang: r["explanation"][lang] for lang in LANGUAGES}
    assert not any(find_banned(v) for k, v in disclaimer_free.items() if r["verdict"] != "no_signs")
