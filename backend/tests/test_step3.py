"""Step 3: drills, lessons, badges, alerts, big mic."""
import json
from pathlib import Path

import pytest

from core.config import LANGUAGES
from core.llm import set_llm
from tests.conftest import uid_headers
from tests.fakes import BrokenLLM

MOCKS = Path(__file__).parents[1] / "seed"
H = uid_headers()


# ---------------------------------------------------------------- shapes match the mocks exactly

def test_drills_match_mock(client):
    mock = {d["id"]: d for d in json.loads((MOCKS / "drills.json").read_text())}
    got = client.get("/drills").json()
    assert len(got) == 12
    for d in got:
        assert d == mock[d["id"]]   # identical to frontend/mocks/drills.ts


def test_lessons_match_mock_and_cover_prd(client):
    mock = {l["id"]: l for l in json.loads((MOCKS / "lessons_mock.json").read_text())}
    got = client.get("/lessons").json()
    assert [l["topic_no"] for l in got] == list(range(1, 12))
    assert sum(not l["is_micro"] for l in got) == 6 and sum(l["is_micro"] for l in got) == 5
    for l in got:
        if l["id"] in mock:
            assert l == mock[l["id"]]
        assert set(l) >= {"id", "topic_no", "is_micro", "core_idea", "title", "estimated_time", "job_adaptation", "scenes"}
        for field in ("title", "core_idea"):
            assert set(l[field]) == set(LANGUAGES)
        for s in l["scenes"]:
            assert set(s["caption"]) == set(LANGUAGES) == set(s["script"])
    assert client.get("/lessons/lesson_3").json()["title"]["en"] == "Buyers and sellers"
    assert client.get("/lessons/nope").status_code == 404


def test_every_scam_rule_lesson_exists(client):
    ids = {l["id"] for l in client.get("/lessons").json()}
    from core import seed
    assert {r["lesson_id"] for r in seed.scam_rules() if r["lesson_id"]} <= ids


def test_alerts_match_mock(client):
    mock = json.loads((MOCKS / "alerts.json").read_text())
    assert client.get("/alerts").json() == mock


# ---------------------------------------------------------------- badges

def test_badges_start_locked_and_unlock(client):
    b = client.get("/badges", headers=H).json()
    assert len(b) == 8 and not any(x["unlocked"] for x in b)
    assert set(b[0]) == {"code", "name", "description", "icon", "unlocked"}
    b = client.post("/badges/first_trade/unlock", headers=H).json()
    ft = next(x for x in b if x["code"] == "first_trade")
    assert ft["unlocked"] and len(ft["earned_at"]) == 10
    assert client.post("/badges/nope/unlock", headers=H).status_code == 404
    assert client.post("/badges/first_trade/unlock").status_code == 400   # needs a user id


def test_scam_check_awards_first_check(client):
    client.post("/scam-check", json={"type": "text", "text": "Assured 20% monthly returns, pay to x1@ybl"}, headers=H)
    assert next(x for x in client.get("/badges", headers=H).json() if x["code"] == "first_check")["unlocked"]


def test_badges_are_per_user(client):
    client.post("/badges/protector/unlock", headers=H)
    other = client.get("/badges", headers=uid_headers("anon_other_0002")).json()
    assert not any(x["unlocked"] for x in other)


# ---------------------------------------------------------------- drills

def test_drill_answer_and_streak_badges(client):
    drills = client.get("/drills", headers=H).json()
    for d in drills[:5]:
        r = client.post(f"/drills/{d['id']}/answer", json={"answer": d["correct_answer"]}, headers=H).json()
        assert r["correct"] and r["tricks"] == d["tricks"]
    assert set(r["badges_unlocked"]) == {"scam_spotter", "sharp_eye"}
    wrong = "real" if drills[5]["correct_answer"] == "scam" else "scam"
    r = client.post(f"/drills/{drills[5]['id']}/answer", json={"answer": wrong}, headers=H).json()
    assert not r["correct"] and r["correct_answer"] == drills[5]["correct_answer"]


def test_drills_no_repeat_until_all_played(client):
    played = set()
    for _ in range(12):
        first = client.get("/drills", headers=H).json()[0]
        assert first["id"] not in played
        played.add(first["id"])
        client.post(f"/drills/{first['id']}/answer", json={"answer": "scam"}, headers=H)
    assert len(played) == 12
    assert len(client.get("/drills", headers=H).json()) == 12   # new round starts


def test_sharp_eye_needs_a_row(client):
    drills = client.get("/drills", headers=H).json()
    for i, d in enumerate(drills[:9]):
        ans = d["correct_answer"] if i % 2 == 0 else ("real" if d["correct_answer"] == "scam" else "scam")
        client.post(f"/drills/{d['id']}/answer", json={"answer": ans}, headers=H)
    b = {x["code"]: x["unlocked"] for x in client.get("/badges", headers=H).json()}
    assert b["scam_spotter"] and not b["sharp_eye"]


# ---------------------------------------------------------------- Tutor rules (PRD 7.1)

def test_tutor_order_replay_and_after_check(client):
    nxt = lambda: client.get("/lessons/next", headers=H).json()   # noqa: E731
    assert nxt()["lesson"]["id"] == "lesson_1" and nxt()["reason"] == "next_in_order"
    r = client.post("/lessons/lesson_1/complete", json={"quiz_score": 0}, headers=H).json()
    assert r["replay"] and r["badges_unlocked"] == ["first_lesson"]
    assert nxt() == {**nxt(), "reason": "replay"} and nxt()["lesson"]["id"] == "lesson_1"
    client.post("/lessons/lesson_1/complete", json={"quiz_score": 1}, headers=H)
    assert nxt()["lesson"]["id"] == "lesson_2"
    client.post("/scam-check", json={"type": "text", "text": "Download our app from bit.ly/x.apk"}, headers=H)
    after = nxt()
    assert after["reason"] == "after_scam_check" and after["lesson"]["id"] == "scam_fake_apps"
    client.post("/lessons/scam_fake_apps/complete", json={}, headers=H)
    assert nxt()["lesson"]["id"] == "lesson_2"


def test_money_basics_after_all_six(client):
    for lid in ("lesson_1", "lesson_2", "lesson_3", "lesson_4", "lesson_5"):
        assert "money_basics" not in client.post(f"/lessons/{lid}/complete", json={"quiz_score": 1}, headers=H).json()["badges_unlocked"]
    assert "money_basics" in client.post("/lessons/start_safely/complete", json={}, headers=H).json()["badges_unlocked"]


# ---------------------------------------------------------------- big mic (PRD 7.5)

@pytest.mark.parametrize("text,route", [
    ("Which share should I buy?", "stock_pick"),
    ("कौन सा शेयर खरीदूं?", "stock_pick"),
    ("ఏ షేర్ కొనాలి?", "stock_pick"),
    ("Join our VIP group, assured 20% monthly returns", "scam_check"),
    ("My cousin said someone offered him a share tip", "scam_check"),
    ("Why does cash lose value?", "money_question"),
    ("What is a demat account?", "money_question"),
    ("ద్రవ్యోల్బణం అంటే ఏమిటి?", "money_question"),
    ("Who won the cricket match?", "off_topic"),
])
def test_ask_routes(client, text, route):
    r = client.post("/ask", json={"text": text}, headers=H).json()
    assert r["route"] == route
    assert set(r["answer"]) == set(LANGUAGES)


def test_ask_fixed_replies(client):
    r = client.post("/ask", json={"text": "Which share should I buy?"}).json()
    assert r["answer"]["en"] == "I can't recommend shares. I can teach you how to check any tip safely."
    r = client.post("/ask", json={"text": "Who won the cricket match?"}).json()
    assert r["answer"]["en"] == "I can help with money and scams only." and r["lesson"] is None


def test_ask_tip_returns_full_verdict(client):
    r = client.post("/ask", json={"text": "Send ₹5,000 and get ₹10,000 back in 7 days"}).json()
    assert r["scam_check"]["verdict"] == "scam" and r["lesson_id"] == "scam_guaranteed_returns"


def test_ask_money_answer_grounded_and_filtered(client):
    r = client.post("/ask", json={"text": "Why does cash lose value?", "job": "vegetable_seller"}).json()
    assert r["lesson"]["id"] == "lesson_1" and r["lesson_id"] == "lesson_1"
    assert all(len(r["answer"][lang].split()) <= 40 for lang in LANGUAGES)


def test_ask_llm_banned_words_fall_back_to_lesson_text(client):
    from tests.fakes import FakeLLM
    set_llm(FakeLLM(explain_bodies={lang: "Buy Reliance now, it is safe." for lang in LANGUAGES}))
    r = client.post("/ask", json={"text": "Why does cash lose value?"}).json()
    lesson = client.get("/lessons/lesson_1").json()
    assert r["answer"] == lesson["core_idea"]          # stored lesson text replaces the rejected LLM text
    assert not any("Reliance" in v for v in r["answer"].values())


def test_ask_works_without_llm(client):
    set_llm(BrokenLLM())
    r = client.post("/ask", json={"text": "What is risk?"}).json()
    assert r["route"] == "money_question" and r["lesson_id"] == "lesson_5"
    set_llm(None)
    assert client.post("/ask", json={"text": "hello there"}).json()["route"] == "off_topic"


def test_ask_from_lesson_player(client):
    r = client.post("/ask", json={"text": "can you explain again", "lesson_id": "lesson_2"}).json()
    assert r["route"] == "lesson_question" and r["lesson_id"] == "lesson_2"
