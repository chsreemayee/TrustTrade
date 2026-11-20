"""Orchestrator (PRD 9): routes a big-mic utterance to the right agent.

    classify → scam_check | tutor | fixed reply

Code rules decide first (stock-pick, tip/message detection, money keywords); the LLM classifier
is asked only when the rules can't tell, and its answer is limited to the 4 routes.
"""
from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from agents import tutor
from agents.prompts.orchestrator import ROUTE_PROMPT, ROUTE_SCHEMA
from agents.scam_investigator import detectors as d
from agents.scam_investigator.pipeline import CheckInput, run_checks, run_scam_check
from core import seed
from core.config import LANGUAGES
from core.content import lesson_out
from core.llm import get_llm
from core.store import get_store
from core.text import clean

log = logging.getLogger("trusttrade.orchestrator")
ROUTES = ("scam_check", "stock_pick", "money_question", "lesson_question", "off_topic")
_TIP_CUES = re.compile(r"\b(someone|they|he|she|a man|a person|my (cousin|friend|uncle|relative))\b.{0,40}"
                       r"\b(sent|said|told|messaged|called|offered|asked)\b|\b(got|received) (a|this|an) "
                       r"(message|sms|tip|call|offer)\b|\bthis message\b|मैसेज आया|मुझे .{0,20} बोला|సందేశం వచ్చింది|"
                       r"మెసేజ్ వచ్చింది|టిప్ వచ్చింది", re.I)


class AskState(TypedDict, total=False):
    text: str
    user_id: str | None
    job: str | None
    lesson_id: str | None
    route: str
    answer: dict
    lesson: dict | None
    scam_check: dict | None


def classify(state: AskState) -> AskState:
    text = state["text"]
    if tutor.is_stock_pick(text):
        return {"route": "stock_pick"}
    rules_only = run_checks({"text": text, "extraction": None, "extraction_status": "could_not_check"})
    if rules_only["signs"] or d.find_upi_ids(text) or d.find_links(text) or _TIP_CUES.search(text):
        return {"route": "scam_check"}
    if state.get("lesson_id"):
        return {"route": "lesson_question"}
    if tutor.is_money_related(text):
        return {"route": "money_question"}
    llm = get_llm()
    if llm is not None:
        try:
            route = (llm.generate_json(ROUTE_PROMPT.format(text=text[:1000]), ROUTE_SCHEMA, timeout_ms=4000) or {}).get("route")
            if route in ("scam_check", "stock_pick", "money_question", "off_topic"):
                return {"route": route}
        except Exception as e:  # noqa: BLE001
            log.warning("Route classifier failed: %s", type(e).__name__)
    return {"route": "off_topic"}


def do_scam_check(state: AskState) -> AskState:
    verdict = run_scam_check(CheckInput("voice", text=state["text"], user_id=state.get("user_id")))
    return {"scam_check": verdict, "answer": dict(seed.fixed_replies()["scam_check"]), "lesson": None}


def do_tutor(state: AskState) -> AskState:
    store = get_store()
    row = None
    if state.get("lesson_id"):
        rows = store.select("lessons", {"id": state["lesson_id"]})
        row = rows[0] if rows else None
    if row is None:
        row, _ = tutor.closest_lesson(store, state["text"])
    if row is None:
        row = next(iter(sorted(store.select("lessons", {"id": "lesson_1"}), key=lambda r: r["id"])), None)
    if row is None:
        return {"route": "off_topic", **do_fixed({"route": "off_topic"})}
    answer = tutor.answer_from_lesson(row, state["text"], state.get("job"))
    return {"answer": answer, "lesson": lesson_out(row)}


def do_fixed(state: AskState) -> AskState:
    replies = seed.fixed_replies()
    key = "stock_pick" if state["route"] == "stock_pick" else "off_topic"
    out: AskState = {"answer": {lang: replies[key][lang] for lang in LANGUAGES}, "lesson": None}
    if key == "stock_pick":   # offer the lesson on checking tips safely
        rows = get_store().select("lessons", {"id": "start_safely"})
        out["lesson"] = lesson_out(rows[0]) if rows else None
    return out


def _route(state: AskState) -> str:
    return {"scam_check": "scam_check", "money_question": "tutor", "lesson_question": "tutor"}.get(state["route"], "fixed")


@lru_cache(maxsize=1)
def graph():
    g = StateGraph(AskState)
    g.add_node("classify", classify)
    g.add_node("scam_check", do_scam_check)
    g.add_node("tutor", do_tutor)
    g.add_node("fixed", do_fixed)
    g.add_edge(START, "classify")
    g.add_conditional_edges("classify", _route, {"scam_check": "scam_check", "tutor": "tutor", "fixed": "fixed"})
    for n in ("scam_check", "tutor", "fixed"):
        g.add_edge(n, END)
    return g.compile()


def ask(text: str, user_id: str | None = None, job: str | None = None, lesson_id: str | None = None) -> dict:
    text = clean(text)
    try:
        s = graph().invoke({"text": text, "user_id": user_id, "job": job, "lesson_id": lesson_id})
    except Exception:  # noqa: BLE001
        log.exception("Orchestrator crashed")
        s = {"route": "off_topic", **do_fixed({"route": "off_topic"})}
    lesson = s.get("lesson")
    return {"route": s["route"], "question": text, "answer": s["answer"],
            "lesson_id": lesson["id"] if lesson else (s.get("scam_check") or {}).get("lesson_id"),
            "lesson": lesson, "scam_check": s.get("scam_check")}
