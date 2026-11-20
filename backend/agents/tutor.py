"""Job-based Tutor (PRD 7.1): picks today's lesson and answers money questions from lesson scripts."""
from __future__ import annotations

import logging
import math
import re

from agents.prompts.tutor import ANSWER_PROMPT, ANSWER_SCHEMA
from core import seed
from core.config import LANGUAGES
from core.content import lesson_out
from core.llm import get_llm
from core.store import Store
from core.text import find_banned, normalize

log = logging.getLogger("trusttrade.tutor")
JOBS = ("vegetable_seller", "driver", "farmer", "shopkeeper", "daily_wage", "homemaker")
ANSWER_MAX_WORDS = 40

# Keywords that point a question at a lesson (en / hi / te; other scripts fall back to the LLM).
LESSON_KEYWORDS = {
    "lesson_1": ["inflation", "price rise", "prices rise", "cash", "value of money", "loses value", "महंगाई", "मुद्रास्फीति",
                 "ద్రవ్యోల్బణం", "ధరలు పెరుగ", "డబ్బు విలువ"],
    "lesson_2": ["what is a share", "share", "stock", "company owner", "part owner", "शेयर", "షేర్", "వాటా"],
    "lesson_3": ["buyer", "seller", "who sets the price", "market", "बाजार", "खरीदार", "మార్కెట్", "కొనేవారు"],
    "lesson_4": ["go up", "go down", "fall", "rise", "news", "why price", "दाम क्यों", "ఎందుకు పెరుగ", "ధర ఎందుకు"],
    "lesson_5": ["risk", "loss", "lose money", "all my savings", "spread", "जोखिम", "नुकसान", "రిస్క్", "నష్టం"],
    "start_safely": ["demat", "broker", "how to start", "open account", "sebi registered", "डीमैट", "ब्रोकर",
                     "డీమ్యాట్", "బ్రోకర్", "ఎలా మొదలు"],
    "scam_guaranteed_returns": ["guaranteed", "assured", "fixed return", "double", "पक्का", "दोगुना", "రెట్టింపు", "హామీ"],
    "scam_fake_apps": ["apk", "app link", "download app", "fake app", "ऐप", "యాప్"],
    "scam_vip_groups": ["vip", "telegram", "whatsapp group", "insider", "tips group", "ग्रुप", "గ్రూప్"],
    "scam_pay_to_receive": ["upi pin", "otp", "fee to receive", "pay to receive", "पिन", "ఓటీపీ", "పిన్"],
    "scam_impersonation": ["sebi officer", "celebrity", "ambani", "famous", "fake officer", "अधिकारी", "అధికారి"],
}
MONEY_WORDS = ["money", "rupee", "₹", "bank", "loan", "interest", "save", "saving", "gold", "chit", "fund", "sip",
               "invest", "fd", "deposit", "upi", "pension", "insurance", "पैसा", "पैसे", "बैंक", "बचत", "ब्याज", "सोना",
               "డబ్బు", "బ్యాంక్", "పొదుపు", "వడ్డీ", "బంగారం", "చిట్టీ", "ಹಣ", "ಬ್ಯಾಂಕ್", "பணம்", "வங்கி", "പണം", "ബാങ്ക്"]


def _published(store: Store) -> list[dict]:
    rows = [r for r in store.select("lessons") if r.get("status", "published") == "published"]
    return sorted(rows, key=lambda r: r["topic_no"])


def pass_mark(n_questions: int) -> int:
    """PRD: below 2 of 3 → replay. Scaled for lessons with fewer questions."""
    return math.ceil(2 * n_questions / 3) if n_questions else 0


def next_lesson(store: Store, user_id: str | None) -> dict:
    """PRD 7.1 Tutor rules → {"lesson": Lesson, "reason": ...}."""
    lessons = _published(store)
    by_id = {r["id"]: r for r in lessons}
    topics = [r for r in lessons if r.get("kind") != "micro"]
    progress = store.select("lesson_progress", {"user_id": user_id}) if user_id else []

    # 1. After a Scam Check, the matching micro-lesson (if not done since).
    if user_id:
        checks = sorted(store.select("scam_checks", {"user_id": user_id}), key=lambda c: str(c.get("created_at")))
        if checks:
            last = checks[-1]
            lesson_id = _lesson_for_check(last)
            done_after = any(p["lesson_id"] == lesson_id and str(p.get("completed_at")) >= str(last.get("created_at"))
                             for p in progress)
            if lesson_id in by_id and by_id[lesson_id].get("kind") == "micro" and not done_after:
                return {"lesson": lesson_out(by_id[lesson_id]), "reason": "after_scam_check"}

    # 2. Topics in order 1→6; replay one whose latest quiz was below the pass mark.
    for row in topics:
        attempts = sorted((p for p in progress if p["lesson_id"] == row["id"]), key=lambda p: str(p.get("completed_at")))
        if not attempts:
            return {"lesson": lesson_out(row), "reason": "next_in_order"}
        n = len((row.get("translations") or {}).get("quiz") or [])
        score = attempts[-1].get("quiz_score")
        if n and score is not None and score < pass_mark(n):
            return {"lesson": lesson_out(row), "reason": "replay"}
    first = topics[0] if topics else lessons[0]
    return {"lesson": lesson_out(first), "reason": "all_done"}


def _lesson_for_check(check: dict) -> str | None:
    signs = check.get("signs_json") or []
    rules = {r["code"]: r.get("lesson_id") for r in seed.scam_rules()}
    for s in sorted(signs, key=lambda s: -float(s.get("weight", 0))):
        if rules.get(s.get("code")):
            return rules[s["code"]]
    return None


def closest_lesson(store: Store, question: str) -> tuple[dict | None, int]:
    q = normalize(question)
    best, best_hits = None, 0
    rows = {r["id"]: r for r in _published(store)}
    for lesson_id, words in LESSON_KEYWORDS.items():
        hits = sum(1 for w in words if w in q)
        if hits > best_hits and lesson_id in rows:
            best, best_hits = rows[lesson_id], hits
    return best, best_hits


def is_money_related(question: str) -> bool:
    q = normalize(question)
    return any(w in q for words in LESSON_KEYWORDS.values() for w in words) or any(w in q for w in MONEY_WORDS)


def _script(row: dict, lang: str = "en") -> str:
    t = row.get("translations") or {}
    lines = [t.get("core_idea", {}).get(lang, "")]
    for s in t.get("scenes", []):
        lines += [s.get("caption", {}).get(lang, ""), s.get("script", {}).get(lang, "")]
    return "\n".join(x for x in lines if x)


def _ok(body) -> bool:
    return isinstance(body, str) and bool(body.strip()) and not find_banned(body) \
        and len(body.split()) <= ANSWER_MAX_WORDS and "http" not in body.lower()


def answer_from_lesson(row: dict, question: str, job: str | None) -> dict[str, str]:
    """LLM answer grounded in the lesson; falls back to the lesson's stored core idea per language."""
    t = row.get("translations") or {}
    answer = {lang: t.get("core_idea", {}).get(lang) or t.get("core_idea", {}).get("en", "") for lang in LANGUAGES}
    llm = get_llm()
    if llm is None:
        return answer
    job = job if job in JOBS else "shopkeeper"   # PRD: homemaker/daily-wage use the shopkeeper version
    prompt = ANSWER_PROMPT.format(job=job.replace("_", " "), title=t.get("title", {}).get("en", row["id"]),
                                  script=_script(row), question=question[:500])
    try:
        out = llm.generate_json(prompt, ANSWER_SCHEMA, timeout_ms=6000)
        for lang in LANGUAGES:
            if _ok((out or {}).get(lang)):
                answer[lang] = out[lang].strip()
    except Exception as e:  # noqa: BLE001
        log.warning("Tutor answer failed, using lesson text: %s", type(e).__name__)
    return answer


def complete_lesson(store: Store, user_id: str, lesson_id: str, quiz_score: int | None) -> dict:
    from core import badges
    from core.users import ensure_user

    rows = store.select("lessons", {"id": lesson_id})
    if not rows:
        raise KeyError(lesson_id)
    ensure_user(store, user_id)
    store.insert("lesson_progress", {"user_id": user_id, "lesson_id": lesson_id, "quiz_score": quiz_score})
    n = len((rows[0].get("translations") or {}).get("quiz") or [])
    passed = quiz_score is None or not n or quiz_score >= pass_mark(n)
    new = []
    if badges.award(store, user_id, "first_lesson"):
        new.append("first_lesson")
    topic_ids = {r["id"] for r in _published(store) if r.get("kind") != "micro"}
    done = {p["lesson_id"] for p in store.select("lesson_progress", {"user_id": user_id})}
    if topic_ids and topic_ids <= done and badges.award(store, user_id, "money_basics"):
        new.append("money_basics")
    return {"lesson_id": lesson_id, "passed": passed, "replay": not passed, "badges_unlocked": new}


_STOCK_PICK = re.compile(
    r"\b(which|what|best|good|top)\b.{0,30}\b(share|shares|stock|stocks|fund|ipo)\b.{0,40}\b(buy|sell|pick|invest|choose|purchase)\b"
    r"|\b(should i|shall i|can i)\b.{0,20}\b(buy|sell|invest)\b|\brecommend\b.{0,20}\b(share|stock|fund)\b"
    r"|\b(tell|give) me (a )?(share|stock|tip)\b|kaunsa share|kaun sa share|कौन सा शेयर|कौनसा शेयर|कौन-सा शेयर"
    r"|ఏ షేర్|ఏ స్టాక్|ఏ షేరు", re.I)


def is_stock_pick(question: str) -> bool:
    return bool(_STOCK_PICK.search(question))
