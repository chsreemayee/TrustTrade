"""Step 2: Scam Investigator acceptance + safety tests.

The 5 demo tips (Datasets §5), in English and Telugu, must get their expected verdict.
"""
import json
import re
from pathlib import Path

import pytest

from agents.scam_investigator import detectors as d
from agents.scam_investigator import pipeline
from agents.scam_investigator.pipeline import CheckInput, run_scam_check
from core import seed
from core.config import LANGUAGES
from core.llm import set_llm
from core.text import find_banned
from tests.fakes import BrokenLLM, FakeLLM

TIPS = json.loads((Path(__file__).parent / "data" / "demo_tips.json").read_text(encoding="utf-8"))
REAL_DRILLS = [x for x in json.loads((Path(__file__).parents[1] / "seed" / "drills.json").read_text()) if x["type"] == "real"]
DISCLAIMERS = seed.verdict_text()["phrases"]["no_signs_end"]


@pytest.fixture
def fresh_state(mem):
    """The fresh in-memory store from conftest (autouse), by its old name."""
    return mem


def check(text=None, **kw):
    return run_scam_check(CheckInput(kw.pop("input_type", "text"), text=text, **kw))


def tip_id(t):
    return f"tip{t['id']}-{t['lang']}"


# ------------------------------------------------------------------ acceptance: the 5 demo tips

@pytest.mark.parametrize("tip", TIPS, ids=tip_id)
def test_demo_tip_verdict(tip):
    r = check(tip["text"])
    assert r["verdict"] == tip["expected_verdict"], r
    if "expected_score" in tip:
        assert r["score"] == tip["expected_score"]
        assert {s["code"] for s in r["signs"]} == set(tip["expected_signs"])
    if "expected_always_rule" in tip:
        assert r["always_rule"] == "send money and get it doubled"
        assert "ALWAYS_DOUBLE_MONEY" in {s["code"] for s in r["signs"]}


@pytest.mark.parametrize("tip", TIPS, ids=tip_id)
def test_rules_only_when_llm_missing(tip):
    """Rule 2: no LLM → still runs on rules; reading marked could_not_check; never a fake green."""
    set_llm(None)
    r = check(tip["text"])
    expected = tip["expected_verdict"] if tip["expected_verdict"] == "scam" else "could_not_check"
    assert r["verdict"] == expected
    reading = next(c for c in r["checks"] if c["name"] == "Reading the message")
    assert reading["status"] == "could_not_check"


@pytest.mark.parametrize("tip", TIPS, ids=tip_id)
def test_rules_only_when_llm_fails(tip):
    set_llm(BrokenLLM())
    r = check(tip["text"])
    expected = tip["expected_verdict"] if tip["expected_verdict"] == "scam" else "could_not_check"
    assert r["verdict"] == expected
    for lang in LANGUAGES:   # stored wording still in every language
        assert r["explanation"][lang] and r["what_to_do"][lang]


def test_same_tip_same_verdict():
    a, b = check(TIPS[0]["text"]), check(TIPS[0]["text"])
    assert (a["verdict"], a["score"], a["signs"]) == (b["verdict"], b["score"], b["signs"])


# ------------------------------------------------------------------ contract shape

def test_response_matches_frontend_contract():
    r = check(TIPS[0]["text"])
    assert set(r) == {"check_id", "verdict", "score", "always_rule", "signs", "checks", "explanation",
                      "what_to_do", "lesson_id", "extracted_details"}
    assert set(r["extracted_details"]) == {"sender", "amount", "promised_return", "payment_mode", "links_or_upi"}
    for s in r["signs"]:
        assert set(s) == {"code", "weight", "evidence", "source"} and s["source"]
    for c in r["checks"]:
        assert set(c) == {"name", "status", "source", "as_of"}
        assert c["status"] in ("found", "not_found", "could_not_check")
    assert set(r["explanation"]) == set(LANGUAGES) == set(r["what_to_do"])
    assert r["lesson_id"] == "scam_guaranteed_returns"
    assert r["extracted_details"]["links_or_upi"] == "rahulprofits@ybl"


# ------------------------------------------------------------------ wording rules (PRD 6.4, rule 3)

def _without_disclaimer(text, lang):
    return text.replace(DISCLAIMERS[lang], "")


@pytest.mark.parametrize("tip", TIPS, ids=tip_id)
@pytest.mark.parametrize("llm", ["fake", "none"])
def test_no_banned_words_in_output(tip, llm):
    set_llm(FakeLLM() if llm == "fake" else None)
    r = check(tip["text"])
    for lang in LANGUAGES:
        assert not find_banned(_without_disclaimer(r["explanation"][lang], lang)), (lang, r["explanation"][lang])
        assert not any(find_banned(x) for x in r["what_to_do"][lang])
    assert not any(find_banned(v) for v in r["extracted_details"].values())


def test_llm_explanation_with_banned_words_is_replaced():
    bad = {lang: "This tip is safe and guaranteed, buy now." for lang in LANGUAGES}
    set_llm(FakeLLM(explain_bodies=bad))
    r = check(TIPS[0]["text"])
    state = _state_for(TIPS[0]["text"])
    for lang in LANGUAGES:
        assert not find_banned(r["explanation"][lang])
        assert r["explanation"][lang] == pipeline.template_explanation(state, lang)   # stored wording used


def _state_for(text):
    st = {"inp": CheckInput("text", text=text)}
    st.update(pipeline.read(st)); st.update(pipeline.run_checks(st)); st.update(pipeline.decide(st))
    return st


def test_llm_explanation_too_long_is_replaced():
    set_llm(FakeLLM(explain_bodies={lang: "word " * 80 for lang in LANGUAGES}))
    r = check(TIPS[0]["text"])
    assert all(len(r["explanation"][lang].split()) < 80 for lang in LANGUAGES)


def test_red_ends_with_1930_and_green_has_disclaimer():
    p = seed.verdict_text()["phrases"]
    red, green = check(TIPS[0]["text"]), check(TIPS[8]["text"])
    assert green["verdict"] == "no_signs"
    for lang in LANGUAGES:
        assert red["explanation"][lang].endswith(p["scam_end"][lang])
        assert green["explanation"][lang].endswith(p["no_signs_end"][lang])


def test_good_llm_explanation_is_used():
    r = check(TIPS[0]["text"])
    assert r["explanation"]["en"].startswith("Short plain explanation")


# ------------------------------------------------------------------ false alarms

@pytest.mark.parametrize("drill", REAL_DRILLS, ids=lambda x: x["id"])
@pytest.mark.parametrize("lang", ["en", "te", "hi"])
def test_real_messages_never_red(drill, lang):
    r = check(drill["message"][lang])
    assert r["verdict"] != "scam", r["signs"]


def test_negated_otp_is_not_a_sign():
    r = check("Never share your OTP or UPI PIN with anyone. - Your bank")
    assert "OTP_PIN_SCREENSHARE" not in {s["code"] for s in r["signs"]}


def test_asking_for_otp_is_a_sign():
    r = check("Your account is blocked. Share the OTP you received and install AnyDesk now.")
    assert "OTP_PIN_SCREENSHARE" in {s["code"] for s in r["signs"]}


# ------------------------------------------------------------------ SEBI lookup

SEBI_TIP = "We are a SEBI registered adviser, Reg No INA000012345. Join for tips."


def test_sebi_claim_with_empty_list_is_could_not_check(fresh_state):
    assert fresh_state.count("sebi_entities") == 0
    r = check(SEBI_TIP)
    sebi = next(c for c in r["checks"] if c["name"] == "SEBI registered intermediary")
    assert sebi["status"] == "could_not_check"
    assert "SEBI_NOT_FOUND" not in {s["code"] for s in r["signs"]}   # unknown ≠ not registered
    assert r["verdict"] == "could_not_check"


def test_sebi_found_and_not_found(fresh_state):
    fresh_state.upsert("sebi_entities", [{"registration_no": "INA000012345", "name": "Test Adviser",
                                          "category": "IA", "source_file": "test.csv"}])
    sebi = next(c for c in check(SEBI_TIP)["checks"] if c["name"] == "SEBI registered intermediary")
    assert sebi["status"] == "found" and sebi["source"].startswith("SEBI list, checked")

    pipeline.clear_cache()
    r = check(SEBI_TIP.replace("INA000012345", "INA000099999"))
    sign = next(s for s in r["signs"] if s["code"] == "SEBI_NOT_FOUND")
    assert sign["weight"] == 2 and sign["source"].startswith("SEBI list, checked")


# ------------------------------------------------------------------ admin rules apply at once

def test_new_admin_rule_applies_to_next_check(fresh_state):
    text = "Exclusive pre-launch scheme for SHG members, small share."
    before = check(text)
    fresh_state.insert("scam_rules", {"code": "PRE_LAUNCH", "pattern": "pre-launch scheme", "languages": ["en"],
                                      "weight": 1.0, "is_always_scam": False, "lesson_id": None, "active": True,
                                      "detector": "phrase", "label": {"en": "pre-launch scheme"}})
    after = check(text)
    assert "PRE_LAUNCH" not in {s["code"] for s in before["signs"]}
    assert "PRE_LAUNCH" in {s["code"] for s in after["signs"]} and after["verdict"] == "careful"


def test_bad_admin_regex_does_not_crash(fresh_state):
    fresh_state.insert("scam_rules", {"code": "BROKEN", "pattern": "(unclosed", "languages": ["en"], "weight": 1.0,
                                      "is_always_scam": False, "active": True, "detector": "phrase", "label": {}})
    assert check(TIPS[0]["text"])["verdict"] == "scam"


# ------------------------------------------------------------------ screenshots (rule 5)

PNG_1PX = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA"
           "60e6kgAAAABJRU5ErkJggg==")


def test_screenshot_is_read_then_dropped(fresh_state):
    fake = FakeLLM(extract_overrides={"message_text": TIPS[0]["text"], "upi_ids": ["rahulprofits@ybl"],
                                      "claims_fixed_or_assured_return": True, "asks_joining_fee": True,
                                      "promised_return_percent": 20, "promised_return_period_days": 30})
    set_llm(fake)
    inp = CheckInput("screenshot", image_data=PNG_1PX)
    r = run_scam_check(inp)
    assert fake.last_image and fake.last_image.startswith(b"\x89PNG")   # the model saw the image
    assert inp.image_data is None                                     # our copy is gone
    assert r["verdict"] == "scam"
    row = fresh_state.select("scam_checks")[0]
    assert row["input_type"] == "image"
    assert "base64" not in json.dumps(row) and "iVBOR" not in json.dumps(row)  # image never stored
    assert "rahulprofits@ybl" in row["extracted_text"]                         # only the text is kept


def test_screenshot_with_llm_down_is_could_not_check():
    set_llm(BrokenLLM())
    r = run_scam_check(CheckInput("screenshot", image_data=PNG_1PX))
    assert r["verdict"] == "could_not_check"


def test_bad_image_data_is_could_not_check():
    r = run_scam_check(CheckInput("screenshot", image_data="not-base64!!"))
    assert r["verdict"] == "could_not_check"


# ------------------------------------------------------------------ detectors

@pytest.mark.parametrize("link,short,apk,lookalike,official", [
    ("bit.ly/xx-trade.apk", True, True, None, False),
    ("https://zerodha.com/login", False, False, None, True),
    ("https://kite.zerodha.com", False, False, None, True),
    ("https://fakezerodha.com", False, False, "zerodha.com", False),
    ("sebi-gov.in/verify", False, False, "sebi.gov.in", False),
    ("https://www.sebi.gov.in", False, False, None, True),
])
def test_link_rules(link, short, apk, lookalike, official):
    f = d.link_facts(link)
    assert (f.shortened, f.apk, f.lookalike_of, f.official) == (short, apk, lookalike, official)


def test_upi_vs_email():
    assert d.find_upi_ids("pay rahulprofits@ybl or mail me at a@gmail.com") == ["rahulprofits@ybl"]
    assert d.is_validated_upi("abc.brk@validhdfc") and not d.is_validated_upi("rahulprofits@ybl")


# ------------------------------------------------------------------ HTTP endpoint

def test_endpoint_end_to_end(client, fresh_state):
    r = client.post("/scam-check", json={"type": "voice", "text": TIPS[0]["text"]},
                    headers={"X-User-Id": "anon_12345678"})
    assert r.status_code == 200 and r.json()["verdict"] == "scam"
    row = fresh_state.select("scam_checks")[0]
    assert row["user_id"] == "anon_12345678" and row["input_type"] == "voice"
    assert fresh_state.select("users", {"id": "anon_12345678"})


def test_endpoint_link_input(client):
    r = client.post("/scam-check", json={"type": "link", "urlOrUpi": "rahulprofits@ybl"})
    assert r.status_code == 200
    assert "PERSONAL_UPI" in {s["code"] for s in r.json()["signs"]}


def test_endpoint_rejects_empty(client):
    assert client.post("/scam-check", json={"type": "text", "text": "   "}).status_code == 422
    assert client.post("/scam-check", json={"type": "fax", "text": "hi"}).status_code == 422
