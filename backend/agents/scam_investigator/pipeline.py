"""Scam Investigator (PRD 6.1) as a LangGraph pipeline:

    read (LLM extract) → run_checks (code) → decide (code) → explain (LLM, filtered) → save

The score and verdict are computed in code from the warning-sign table. The LLM only extracts
details and words the explanation. If the LLM or a lookup fails, that check is marked
"could_not_check" and the rest still runs; nothing is invented.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import logging
import re
import uuid
from collections import OrderedDict
from dataclasses import dataclass
from datetime import date, datetime, timezone
from functools import lru_cache
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.prompts.scam_investigator import EXPLAIN_PROMPT, EXPLAIN_SCHEMA, EXTRACT_PROMPT, EXTRACT_SCHEMA
from agents.scam_investigator import detectors as d
from core import seed
from core.config import LANGUAGES
from core.llm import get_llm
from core.store import get_store
from core.text import clean, find_banned, scrub_banned

log = logging.getLogger("trusttrade.scam")

HIGH_RETURN_MONTHLY_PCT = 3.0
MIN_TEXT_CHARS = 15            # shorter than this (with no link/UPI) is "not enough to check"
EXPLAIN_MAX_WORDS = 45         # LLM body; fixed closing line is added in code (≤ 60 words total)
EXTRACT_TIMEOUT_MS = 6000
EXPLAIN_TIMEOUT_MS = 4000
MAX_IMAGE_BYTES = 5 * 1024 * 1024

SOURCE_RULES, SOURCE_UPI, SOURCE_URL, SOURCE_AI = "TrustTrade rules", "UPI ID rules", "URL rules", "AI reading"

# Signs whose detection comes from the LLM extract → extract field.
EXTRACT_FLAGS = {
    "GUARANTEED_RETURN": "claims_fixed_or_assured_return",
    "IMPERSONATION": "uses_famous_or_official_name",
    "JOIN_FEE": "asks_joining_fee",
    "PROFIT_SCREENSHOTS": "shows_profit_screenshots",
    "UNKNOWN_NUMBER": "sender_is_unknown_number",
    "SPELLING_OFFICIAL": "official_claim_with_spelling_mistakes",
}


@dataclass
class CheckInput:
    input_type: str                 # voice | text | screenshot | link (front-end values)
    text: str | None = None
    url_or_upi: str | None = None
    image_data: str | None = None   # data URL or bare base64
    user_id: str | None = None


class State(TypedDict, total=False):
    inp: CheckInput
    text: str
    image_present: bool
    extraction: dict | None
    extraction_status: str          # found | could_not_check
    extraction_note: str
    signs: list[dict]
    checks: list[dict]
    always_rule: dict | None
    score: float
    verdict: str
    lesson_id: str
    explanation: dict[str, str]
    what_to_do: dict[str, list[str]]
    extracted_details: dict[str, str]
    check_id: str


# ------------------------------------------------------------------------------ helpers

_extract_cache: OrderedDict[str, dict] = OrderedDict()   # same text → same extract → same verdict


def _cache_get(key: str) -> dict | None:
    if key in _extract_cache:
        _extract_cache.move_to_end(key)
        return _extract_cache[key]
    return None


def _cache_put(key: str, value: dict) -> None:
    _extract_cache[key] = value
    if len(_extract_cache) > 512:
        _extract_cache.popitem(last=False)


def clear_cache() -> None:
    _extract_cache.clear()


def _today() -> str:
    return date.today().isoformat()


def _pretty(iso: str) -> str:
    try:
        return datetime.fromisoformat(str(iso)[:10]).strftime("%-d %b %Y")
    except ValueError:
        return str(iso)[:10]


@lru_cache(maxsize=1)
def _texts() -> dict:
    return seed.verdict_text()


def decode_image(data: str) -> tuple[bytes, str]:
    """Data URL or base64 → (bytes, mime). Raises ValueError on bad or oversized input."""
    mime = "image/jpeg"
    m = re.match(r"^data:(image/[a-z0-9.+-]+);base64,", data, re.I)
    if m:
        mime, data = m.group(1).lower(), data[m.end():]
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError) as e:
        raise ValueError("imageData is not valid base64") from e
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("image is larger than 5 MB")
    return raw, mime


def _load_rules() -> list[dict]:
    try:
        rules = get_store().select("scam_rules", {"active": True})
        if rules:
            return rules
    except Exception as e:  # noqa: BLE001
        log.warning("Could not load scam_rules from store (%s); using seeded rules", type(e).__name__)
    return seed.scam_rules()


# ------------------------------------------------------------------------------ nodes

def read(state: State) -> State:
    inp = state["inp"]
    parts = [p for p in (inp.text, inp.url_or_upi) if p and p.strip()]
    text = clean(" ".join(parts))
    llm = get_llm()
    image: bytes | None = None
    mime = None
    out: State = {"image_present": bool(inp.image_data), "extraction": None}

    if inp.image_data:
        try:
            image, mime = decode_image(inp.image_data)
        except ValueError as e:
            out.update(text=text, extraction_status="could_not_check", extraction_note=str(e))
            return out
        finally:
            inp.image_data = None   # drop the base64 copy straight away

    try:
        if llm is None:
            out.update(extraction_status="could_not_check", extraction_note="AI reading not configured")
        elif image is None and not text:
            out.update(extraction_status="could_not_check", extraction_note="nothing to read")
        else:
            key = None if image is not None else hashlib.sha256(text.encode()).hexdigest()
            extraction = _cache_get(key) if key else None
            if extraction is None:
                block = ("The message is in the attached image." + (f"\nThe user also typed: {text}" if text else "")
                         if image is not None else f"Message:\n\"\"\"\n{text}\n\"\"\"")
                extraction = llm.generate_json(EXTRACT_PROMPT.format(input_block=block), EXTRACT_SCHEMA,
                                               image=image, image_mime=mime, timeout_ms=EXTRACT_TIMEOUT_MS)
                if not isinstance(extraction, dict):
                    raise ValueError("extract returned non-object")
                if key:
                    _cache_put(key, extraction)
            out.update(extraction=extraction, extraction_status="found", extraction_note="")
            if image is not None:
                text = clean(" ".join(p for p in (str(extraction.get("message_text") or ""), text) if p))
    except Exception as e:  # noqa: BLE001 - LLM down/timeout/bad output → rules only
        log.warning("Extraction failed: %s", type(e).__name__)
        out.update(extraction=None, extraction_status="could_not_check", extraction_note="AI reading failed")
    finally:
        # PRD 11: the uploaded image is deleted as soon as its text is read. It was only ever
        # held in memory; drop the last reference here. Nothing image-related is persisted.
        image = None  # noqa: F841

    has_target = bool(d.find_links(text) or d.find_upi_ids(text))
    if out.get("extraction_status") == "found" and len(text) < MIN_TEXT_CHARS and not has_target:
        out.update(extraction_status="could_not_check", extraction_note="not enough details")
    out["text"] = text
    return out


def run_checks(state: State) -> State:
    text = state.get("text", "")
    ex = state.get("extraction") or {}
    today = _today()
    signs: dict[str, dict] = {}
    checks: list[dict] = [{
        "name": "Reading the message",
        "status": "found" if state.get("extraction_status") == "found" else "could_not_check",
        "source": "Gemini AI reading" + (f" ({state['extraction_note']})" if state.get("extraction_note") else ""),
        "as_of": today,
    }]

    def add(code: str, evidence: str, source: str, rule_by_code: dict) -> None:
        rule = rule_by_code.get(code)
        if rule is None or code in signs:
            return
        signs[code] = {"code": code, "weight": float(rule["weight"]), "evidence": evidence[:160],
                       "source": source, "_always": bool(rule.get("is_always_scam")),
                       "_lesson": rule.get("lesson_id"), "_label": rule.get("label") or {}}

    rules = _load_rules()
    by_code = {r["code"]: r for r in rules}

    # 1. Phrase rules (seeded + any admin-added rule with a pattern)
    for r in rules:
        ev = d.phrase_hit(r["code"], r.get("pattern"), text)
        if ev:
            add(r["code"], f'Message says: "{ev}"', SOURCE_RULES, by_code)

    # 2. Returns more than 3% a month / doubling
    hr = d.monthly_return_from_text(text)
    hr_ex = d.monthly_return_from_extract(ex.get("promised_return_percent"), ex.get("promised_return_period_days"))
    if hr and hr[0] > HIGH_RETURN_MONTHLY_PCT:
        add("HIGH_RETURN", f'About {hr[0]:.0f}% a month: "{hr[1]}"', SOURCE_RULES, by_code)
    elif hr_ex is not None and hr_ex > HIGH_RETURN_MONTHLY_PCT:
        add("HIGH_RETURN", f"About {hr_ex:.0f}% a month (from the message)", SOURCE_RULES, by_code)

    dbl = d.double_money_from_text(text)
    asked, back = ex.get("amount_asked_rupees"), ex.get("amount_promised_back_rupees")
    if dbl:
        add("ALWAYS_DOUBLE_MONEY", f'Message says: "{dbl}"', SOURCE_RULES, by_code)
    elif isinstance(asked, (int, float)) and isinstance(back, (int, float)) and asked > 0 and back >= 2 * asked:
        add("ALWAYS_DOUBLE_MONEY", f"Pay ₹{asked:,.0f}, promised ₹{back:,.0f} back", SOURCE_RULES, by_code)

    # 3. UPI IDs (regex + extract)
    upis = list(dict.fromkeys(d.find_upi_ids(text) + [u for u in ex.get("upi_ids") or [] if "@" in str(u)]))
    for upi in upis:
        validated = d.is_validated_upi(upi)
        checks.append({"name": f"UPI ID {upi}", "status": "found" if validated else "not_found",
                       "source": "UPI ID rules (SEBI validated handle format)", "as_of": today})
        if not validated:
            add("PERSONAL_UPI", f"Pay to {upi} (not a SEBI validated handle)", SOURCE_UPI, by_code)

    # 4. Links (text only; never opened)
    links = list(dict.fromkeys(d.find_links(text) + [str(x) for x in ex.get("links") or []]))
    for link in links:
        f = d.link_facts(link)
        if not f.host:
            continue
        if f.apk:
            add("APK_INSTALL", f"Link to an app file: {link}", SOURCE_URL, by_code)
        if f.shortened:
            add("SHORT_LINK", f"Shortened link: {link}", SOURCE_URL, by_code)
        elif f.lookalike_of:
            add("SHORT_LINK", f"{f.host} looks like {f.lookalike_of} but is not", SOURCE_URL, by_code)
        checks.append({"name": f"Official website ({f.host})", "status": "found" if f.official else "not_found",
                       "source": "URL rules", "as_of": today})
    if links:
        checks.append({"name": "Google Safe Browsing / domain age", "status": "could_not_check",
                       "source": "Coming soon", "as_of": today})
    if any(str(a).lower().endswith(".apk") for a in ex.get("app_names") or []):
        add("APK_INSTALL", "Asks to install an app file (.apk)", SOURCE_URL, by_code)

    # 5. SEBI registration lookup (only when the sender claims to be registered)
    claim = d.sebi_claim(text)
    reg_no = (ex.get("sebi_registration_number") or "").strip().upper() or None
    m = d.SEBI_REG_NO.search(text)
    reg_no = reg_no or (m.group(0).upper() if m else None)
    name = (ex.get("registered_entity_name") or "").strip() or None
    if claim or ex.get("sebi_registration_claimed") or reg_no:
        checks.append(_sebi_check(reg_no, name, signs, by_code, add))

    # 6. Phase-2 sources: shown, never faked
    if ex.get("company_or_stock"):
        checks.append({"name": "NSE ASM/GSM surveillance list", "status": "could_not_check",
                       "source": "NSE surveillance (coming soon)", "as_of": today})

    # 7. Signs read by the LLM (extract-only or extract-confirmed)
    for code, field in EXTRACT_FLAGS.items():
        val = ex.get(field)
        if val is True or (isinstance(val, str) and val.strip()):
            detail = f": {scrub_banned(val)}" if isinstance(val, str) else ""
            add(code, f"Found when reading the message{detail}", f"{SOURCE_RULES} + {SOURCE_AI}", by_code)

    return {"signs": list(signs.values()), "checks": checks}


def _sebi_check(reg_no, name, signs, by_code, add) -> dict:
    store = get_store()
    try:
        total = store.count("sebi_entities")
        loaded = store.max_value("sebi_entities", "loaded_at") if total else None
    except Exception as e:  # noqa: BLE001
        log.warning("SEBI lookup failed: %s", type(e).__name__)
        total, loaded = None, None
    as_of = str(loaded)[:10] if loaded else _today()
    base = {"name": "SEBI registered intermediary", "as_of": as_of}
    if not total:
        why = "SEBI list not loaded" if total == 0 else "SEBI list unavailable"
        return {**base, "status": "could_not_check", "source": why}
    if not reg_no and not name:
        return {**base, "status": "could_not_check", "source": "SEBI list (no name or number to look up)"}
    try:
        hit = (store.select("sebi_entities", {"registration_no": reg_no}) if reg_no else []) or \
              (store.select_ieq("sebi_entities", "name", name) if name else [])
    except Exception as e:  # noqa: BLE001
        log.warning("SEBI lookup failed: %s", type(e).__name__)
        return {**base, "status": "could_not_check", "source": "SEBI list unavailable"}
    source = f"SEBI list, checked {_pretty(as_of)}"
    if hit:
        return {**base, "status": "found", "source": source}
    who = reg_no or name
    add("SEBI_NOT_FOUND", f"Claims SEBI registration; {who} is not on the SEBI list", source, by_code)
    return {**base, "status": "not_found", "source": source}


def decide(state: State) -> State:
    """PRD 6.3, in code. Grey wins over amber below 3, as in the mock and PRD table."""
    signs = sorted(state.get("signs", []), key=lambda s: -s["weight"])
    always = next((s for s in signs if s["_always"]), None)
    scoring = [s for s in signs if not s["_always"]]
    score = round(sum(s["weight"] for s in scoring), 2)
    checks = state.get("checks", [])
    sebi_cnc = any(c["name"] == "SEBI registered intermediary" and c["status"] == "could_not_check" for c in checks)
    extract_cnc = state.get("extraction_status") != "found"

    if always or score >= 3:
        verdict = "scam"
    elif sebi_cnc or extract_cnc:
        verdict = "could_not_check"
    elif score > 0:
        verdict = "careful"
    else:
        verdict = "no_signs"

    lesson = (always or {}).get("_lesson") or next((s["_lesson"] for s in signs if s.get("_lesson")), None)
    return {"signs": signs, "always_rule": always, "score": score, "verdict": verdict,
            "lesson_id": lesson or "start_safely"}


def _label(sign: dict, lang: str) -> str:
    lab = sign.get("_label") or {}
    return lab.get(lang) or lab.get("en") or sign["code"].replace("_", " ").lower()


def _source_label(source: str, lang: str) -> str:
    src = _texts()["sources"]
    if source.startswith("SEBI list, checked"):
        return f"{src['SEBI list'][lang]}, {source.removeprefix('SEBI list, checked').strip()}"
    parts = [src.get(p.strip(), {}).get(lang, p.strip()) for p in source.split("+")]
    return " + ".join(parts)


def _closing(verdict: str, lang: str) -> str:
    p = _texts()["phrases"]
    return {"scam": p["scam_end"], "careful": p["careful_end"], "no_signs": p["no_signs_end"],
            "could_not_check": p["cnc_end"]}[verdict][lang]


def template_explanation(state: State, lang: str) -> str:
    """Rules-only explanation from stored wording; used when the LLM is down or its text fails the filter."""
    t = _texts()
    verdict, signs = state["verdict"], [s for s in state.get("signs", []) if not s["_always"]][:3]
    parts = [t["verdict_label"][verdict][lang] + "."]
    if state.get("always_rule"):
        parts.append(f"{t['phrases']['always_rule'][lang]}: {_label(state['always_rule'], lang)}.")
    if signs:
        listed = "; ".join(f"{_label(s, lang)} ({_source_label(s['source'], lang)})" for s in signs)
        parts.append(f"{t['phrases']['signs_found'][lang]}: {listed}.")
    if verdict == "no_signs":
        srcs = {_source_label(c["source"], lang) for c in state.get("checks", []) if c["status"] != "could_not_check"}
        srcs.add(_source_label(SOURCE_RULES, lang))
        parts.append(f"{t['phrases']['checked'][lang]}: {', '.join(sorted(srcs))}.")
    if verdict == "could_not_check":
        missing = []
        for c in state.get("checks", []):
            if c["status"] == "could_not_check" and c["name"] in ("Reading the message", "SEBI registered intermediary"):
                missing.append(_source_label(SOURCE_AI if c["name"] == "Reading the message" else "SEBI list", lang))
        if missing:
            parts.append(f"{t['phrases']['not_checked'][lang]}: {', '.join(missing)}.")
    parts.append(_closing(verdict, lang))
    return " ".join(parts)


def _llm_body_ok(body: Any) -> bool:
    return isinstance(body, str) and bool(body.strip()) and not find_banned(body) \
        and len(body.split()) <= EXPLAIN_MAX_WORDS and "http" not in body.lower()


def explain(state: State) -> State:
    explanation = {lang: template_explanation(state, lang) for lang in LANGUAGES}
    llm = get_llm()
    if llm is not None and state.get("extraction_status") == "found":
        t = _texts()
        signs = state.get("signs", [])
        prompt = EXPLAIN_PROMPT.format(
            verdict_label=t["verdict_label"][state["verdict"]]["en"],
            always_line=(f"Always-a-scam rule: {_label(state['always_rule'], 'en')}\n" if state.get("always_rule") else ""),
            signs_block="\n".join(f"- {_label(s, 'en')} (source: {s['source']})" for s in signs) or "- none",
            not_checked=", ".join(c["name"] for c in state.get("checks", []) if c["status"] == "could_not_check") or "none",
        )
        try:
            bodies = llm.generate_json(prompt, EXPLAIN_SCHEMA, timeout_ms=EXPLAIN_TIMEOUT_MS)
            for lang in LANGUAGES:
                body = (bodies or {}).get(lang)
                if _llm_body_ok(body):   # banned-word / length filter on every LLM output
                    explanation[lang] = f"{body.strip()} {_closing(state['verdict'], lang)}"
        except Exception as e:  # noqa: BLE001
            log.warning("Explain failed, using stored wording: %s", type(e).__name__)
    what = _texts()["what_to_do"][state["verdict"]]
    return {"explanation": explanation, "what_to_do": {lang: list(what[lang]) for lang in LANGUAGES}}


def _details(state: State) -> dict[str, str]:
    ex = state.get("extraction") or {}
    text = state.get("text", "")

    def llm_val(key: str) -> str | None:
        v = ex.get(key)
        return scrub_banned(str(v))[:120] or None if v not in (None, "", []) else None

    amounts = d.find_amounts(text)
    upis = d.find_upi_ids(text) + [u for u in ex.get("upi_ids") or [] if "@" in str(u)]
    links = d.find_links(text) + [str(x) for x in ex.get("links") or []]
    targets = list(dict.fromkeys(upis + links))
    hr = d.monthly_return_from_text(text)
    return {
        "sender": llm_val("sender_claim") or "Not specified",
        "amount": llm_val("amount_asked") or (text[amounts[0][1]:amounts[0][2]].strip() if amounts else "Not specified"),
        "promised_return": llm_val("promised_return_text") or (hr[1].strip("…") if hr else "Not specified"),
        "payment_mode": llm_val("payment_method") or ("UPI ID" if upis else "Link" if links else "Not specified"),
        "links_or_upi": ", ".join(scrub_banned(t) for t in targets)[:200] or "None",
    }


_INPUT_TYPE_DB = {"voice": "voice", "text": "text", "screenshot": "image"}


def save(state: State) -> State:
    check_id = str(uuid.uuid4())
    details = _details(state)
    inp = state["inp"]
    input_type = _INPUT_TYPE_DB.get(inp.input_type) or (
        "upi" if inp.url_or_upi and "@" in inp.url_or_upi and "/" not in inp.url_or_upi else "link")
    try:
        store = get_store()
        if inp.user_id:
            store.upsert("users", [{"id": inp.user_id}])
        store.insert("scam_checks", {
            "id": check_id, "user_id": inp.user_id, "input_type": input_type,
            "extracted_text": state.get("text", "")[:5000],      # deleted after 30 days (delete_after)
            "extracted_json": state.get("extraction"),
            "verdict": state["verdict"], "score": state["score"],
            "signs_json": public_signs(state.get("signs", [])), "checks_json": state.get("checks", []),
            "language": (state.get("extraction") or {}).get("language"),
        })
    except Exception as e:  # noqa: BLE001 - saving history must never block the verdict
        log.warning("Could not save scam check: %s", type(e).__name__)
    return {"check_id": check_id, "extracted_details": details}


def public_signs(signs: list[dict]) -> list[dict]:
    return [{k: s[k] for k in ("code", "weight", "evidence", "source")} for s in signs]


# ------------------------------------------------------------------------------ graph

@lru_cache(maxsize=1)
def graph():
    g = StateGraph(State)
    for name, fn in (("read", read), ("run_checks", run_checks), ("decide", decide),
                     ("explain", explain), ("save", save)):
        g.add_node(name, fn)
    g.add_edge(START, "read")
    g.add_edge("read", "run_checks")
    g.add_edge("run_checks", "decide")
    g.add_edge("decide", "explain")
    g.add_edge("explain", "save")
    g.add_edge("save", END)
    return g.compile()


def to_response(state: State) -> dict:
    """Exactly the ScamCheckVerdict shape from frontend/mocks/scam_checks.ts."""
    always = state.get("always_rule")
    return {
        "check_id": state["check_id"],
        "verdict": state["verdict"],
        "score": state["score"],
        "always_rule": _label(always, "en") if always else None,
        "signs": public_signs([s for s in state.get("signs", []) if not s["_always"]] + ([always] if always else [])),
        "checks": state.get("checks", []),
        "explanation": state["explanation"],
        "what_to_do": state["what_to_do"],
        "lesson_id": state["lesson_id"],
        "extracted_details": state["extracted_details"],
    }


def run_scam_check(inp: CheckInput) -> dict:
    try:
        return to_response(graph().invoke({"inp": inp}))
    except Exception:  # noqa: BLE001 - last line of defence: honest "could not check", never a fake verdict
        log.exception("Scam check pipeline crashed")
        inp.image_data = None
        state: State = {"inp": inp, "verdict": "could_not_check", "score": 0.0, "signs": [], "always_rule": None,
                        "checks": [{"name": "TrustTrade checks", "status": "could_not_check",
                                    "source": "Internal error", "as_of": _today()}],
                        "lesson_id": "start_safely", "extraction_status": "could_not_check", "text": ""}
        state.update(explain(state))
        state.update(check_id=str(uuid.uuid4()), extracted_details={
            "sender": "Not specified", "amount": "Not specified", "promised_return": "Not specified",
            "payment_mode": "Not specified", "links_or_upi": "None"})
        return to_response(state)
