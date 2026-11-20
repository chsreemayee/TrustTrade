"""Deterministic detectors (PRD 6.1 step 2). Pure functions over the message text: no LLM, no I/O.

Each detector returns evidence (a short quote) or None. The scorer decides what fires.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from urllib.parse import urlsplit

from core.text import clean

# ---------------------------------------------------------------- phrase rules + negation

# Signs that awareness messages commonly mention in the negative ("Never share OTP",
# "There are no guaranteed returns"). A negation in the same sentence suppresses them.
NEGATABLE = {"GUARANTEED_RETURN", "OTP_PIN_SCREENSHARE", "JOIN_FEE", "ALWAYS_UPI_PIN_TO_RECEIVE",
             "ALWAYS_OTP_FOR_RETURNS", "ALWAYS_PAY_TO_RECEIVE"}
_NEG_BEFORE = re.compile(r"\b(never|no|not|don'?t|do not|won'?t|cannot|can'?t|without|nobody|no one)\b"
                         r"|नहीं|मत|कभी न|ఎప్పుడూ", re.I)
_NEG_AFTER = re.compile(r"नहीं|न कर|न दें|मत|వద్దు|కాదు|లేవు|ఉండవు|లేదు|కూడదు|ಬೇಡ|ಇಲ್ಲ|வேண்டாம்|இல்லை|கிடையாது"
                        r"|രുത്|ഇല്ല")
_SENTENCE_END = re.compile(r"[.!?।\n]")


@lru_cache(maxsize=256)
def compile_pattern(pattern: str) -> re.Pattern | None:
    try:
        return re.compile(clean(pattern), re.IGNORECASE)
    except re.error:
        return None  # a bad admin-entered pattern must never break a check


def _sentence_bounds(text: str, start: int, end: int) -> tuple[int, int]:
    left = max((m.end() for m in _SENTENCE_END.finditer(text, 0, start)), default=0)
    m = _SENTENCE_END.search(text, end)
    return left, (m.start() if m else len(text))


def snippet(text: str, start: int, end: int, pad: int = 15) -> str:
    a, b = max(0, start - pad), min(len(text), end + pad)
    while a > 0 and not text[a - 1].isspace():
        a -= 1
    while b < len(text) and not text[b].isspace():
        b += 1
    s = text[a:b].strip(" ,;:")
    return ("…" if a > 0 else "") + s + ("…" if b < len(text) else "")


def is_negated(text: str, start: int, end: int) -> bool:
    s0, s1 = _sentence_bounds(text, start, end)
    before = text[max(s0, start - 35):start]
    after = text[end:min(s1, end + 35)]
    return bool(_NEG_BEFORE.search(before) or _NEG_AFTER.search(after))


def phrase_hit(code: str, pattern: str | None, text: str) -> str | None:
    if not pattern:
        return None
    rx = compile_pattern(pattern)
    if rx is None:
        return None
    for m in rx.finditer(text):
        if code in NEGATABLE and is_negated(text, m.start(), m.end()):
            continue
        return snippet(text, m.start(), m.end())
    return None


# ---------------------------------------------------------------- returns (HIGH_RETURN)

_PCT = r"(\d+(?:\.\d+)?)\s*(?:%|percent|प्रतिशत|శాతం)"
_PERIODS = {
    1: r"day|daily|per day|a day|रोज|रोजाना|प्रतिदिन|రోజుకు|ప్రతిరోజూ|ದಿನಕ್ಕೆ|தினமும்|ദിവസ",
    7: r"week|weekly|हफ्ते|सप्ताह|వారానికి|ವಾರಕ್ಕೆ|வாரம்|ആഴ്ച",
    30: r"month|monthly|mahina|महीने|मासिक|నెలకు|నెల|ತಿಂಗಳ|மாத|മാസ",
    365: r"year|yearly|annual|annually|p\.?a\.?|साल|वार्षिक|సంవత్సర|వార్షిక|ವರ್ಷ|ஆண்டு|വർഷ",
}
_GAP = r"[^\d.!?।]{0,25}"
_DOUBLE = r"double|doubled|दोगुना|डबल|రెట్టింపు|ಡಬಲ್|ದ್ವಿಗುಣ|இரட்டிப்பு|ഇരട്ടി"
_DAYS = r"(\d+)\s*(?:days?|दिन|రోజుల|రోజుల్లో|ದಿನ|நாள|ദിവസ)"


def monthly_return_from_text(text: str) -> tuple[float, str] | None:
    """Highest stated return converted to % per month, with evidence."""
    best: tuple[float, str] | None = None
    for days, words in _PERIODS.items():
        for rx in (re.compile(_PCT + _GAP + rf"(?:{words})", re.I), re.compile(rf"(?:{words})" + _GAP + _PCT, re.I)):
            for m in rx.finditer(text):
                monthly = float(m.group(1)) * 30 / days
                if best is None or monthly > best[0]:
                    best = (monthly, snippet(text, m.start(), m.end()))
    for rx in (re.compile(rf"(?:{_DOUBLE}).{{0,30}}?{_DAYS}", re.I), re.compile(rf"{_DAYS}.{{0,30}}?(?:{_DOUBLE})", re.I)):
        for m in rx.finditer(text):
            days = max(int(m.group(1)), 1)
            monthly = 100 * 30 / days
            if best is None or monthly > best[0]:
                best = (monthly, snippet(text, m.start(), m.end()))
    return best


def monthly_return_from_extract(pct: float | None, days: float | None) -> float | None:
    if pct is None or not days or days <= 0:
        return None
    return float(pct) * 30 / float(days)


# ---------------------------------------------------------------- amounts (ALWAYS_DOUBLE_MONEY)

_AMOUNT = re.compile(
    r"(?:₹|rs\.?|inr|rupees?|रु\.?|రూ\.?)\s*(\d[\d,]*(?:\.\d+)?)\s*(lakh|lac|k|thousand|crore|लाख|లక్ష)?"
    r"|(\d[\d,]*(?:\.\d+)?)\s*(?:rupees|रुपये|रुपए|రూపాయలు)", re.I)
_MULT = {"lakh": 1e5, "lac": 1e5, "लाख": 1e5, "లక్ష": 1e5, "k": 1e3, "thousand": 1e3, "crore": 1e7}
_SEND_CUE = re.compile(r"\b(send|pay|invest|deposit|give|put|transfer)\b|भेज|लगा|जमा|दे|పంప|చెల్లి|పెట్ట|ఇవ్వ", re.I)
_GET_CUE = re.compile(r"\b(get|back|return|receive|earn|make|withdraw)\b|मिल|वापस|पाएं|कमा|పొంద|తిరిగి|వస్తా|సంపాది", re.I)


def find_amounts(text: str) -> list[tuple[float, int, int]]:
    out = []
    for m in _AMOUNT.finditer(text):
        raw = m.group(1) or m.group(3)
        try:
            value = float(raw.replace(",", ""))
        except ValueError:
            continue
        value *= _MULT.get((m.group(2) or "").lower(), 1)
        out.append((value, m.start(), m.end()))
    return out


def double_money_from_text(text: str) -> str | None:
    """'Send ₹5,000 and get ₹10,000 back': a later amount at least 2x an earlier one, with a
    send/pay cue around the first and a get/back cue around the second."""
    amounts = find_amounts(text)
    for i, (v1, s1, e1) in enumerate(amounts):
        for v2, s2, e2 in amounts[i + 1:]:
            if v1 <= 0 or v2 < 2 * v1 or s2 - e1 > 80:
                continue
            between = text[e1:s2]
            if _SEND_CUE.search(text[max(0, s1 - 25):s1] + between) and _GET_CUE.search(between + text[e2:e2 + 25]):
                return snippet(text, s1, e2, pad=10)
    return None


# ---------------------------------------------------------------- UPI IDs

_UPI = re.compile(r"(?<![\w.@])([a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63})(?![\w.@])", re.I)
# SEBI "validated UPI handles" for registered intermediaries look like  name.brk@validhdfc
_VALIDATED_UPI = re.compile(r"^[a-z0-9._-]+\.[a-z]{2,5}@valid[a-z]+$", re.I)


def find_upi_ids(text: str) -> list[str]:
    return list(dict.fromkeys(m.group(1) for m in _UPI.finditer(text)))


def is_validated_upi(upi: str) -> bool:
    return bool(_VALIDATED_UPI.match(upi.strip()))


# ---------------------------------------------------------------- links

_LINK = re.compile(r"(?<![@\w.])((?:https?://)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:/[^\s<>\"']*)?)", re.I)
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "cutt.ly", "rb.gy", "is.gd", "goo.gl", "shorturl.at",
              "tiny.cc", "ow.ly", "t.ly", "s.id", "rebrand.ly", "bitly.com"}
OFFICIAL_DOMAINS = {
    "sebi": "sebi.gov.in", "nseindia": "nseindia.com", "nse": "nseindia.com", "bseindia": "bseindia.com",
    "zerodha": "zerodha.com", "groww": "groww.in", "upstox": "upstox.com", "angelone": "angelone.in",
    "hdfcsec": "hdfcsec.com", "icicidirect": "icicidirect.com", "paytmmoney": "paytmmoney.com",
    "kotaksecurities": "kotaksecurities.com", "npci": "npci.org.in", "rbi": "rbi.org.in",
}
TRUSTED_SUFFIXES = (".gov.in", ".nic.in", ".org.in") + tuple(set(OFFICIAL_DOMAINS.values()))


def find_links(text: str) -> list[str]:
    return list(dict.fromkeys(m.group(1).rstrip(".,;:!?)") for m in _LINK.finditer(text)))


def host_of(link: str) -> str:
    url = link if "://" in link else "http://" + link
    return (urlsplit(url).hostname or "").lower().removeprefix("www.")


@dataclass
class LinkFacts:
    link: str
    host: str
    shortened: bool
    apk: bool
    lookalike_of: str | None
    official: bool


def link_facts(link: str) -> LinkFacts:
    host = host_of(link)
    path = link.lower().split("?")[0]
    # Exact domain or a real subdomain only: "fakezerodha.com" must not count as zerodha.com.
    official = any(host.endswith(d) if d.startswith(".") else (host == d or host.endswith("." + d))
                   for d in TRUSTED_SUFFIXES)
    lookalike = None
    if not official:
        if host.startswith("xn--") or ".xn--" in host:
            lookalike = "punycode"
        else:
            labels = re.split(r"[.-]", host)
            for brand, domain in OFFICIAL_DOMAINS.items():
                hit = brand in labels if len(brand) < 5 else any(brand in lab for lab in labels)
                if hit:
                    lookalike = domain
                    break
    return LinkFacts(link=link, host=host, shortened=host in SHORTENERS, apk=path.endswith(".apk"),
                     lookalike_of=lookalike, official=official)


# ---------------------------------------------------------------- SEBI claims

SEBI_REG_NO = re.compile(r"\bIN[AHZ]\d{9}\b", re.I)
_SEBI_CLAIM = re.compile(
    r"\b(we are|i am|i'm|we're|our (company|firm) is|a|an)\s+sebi[\s-]*(registered|regd|approved|certified)"
    r"|sebi[\s-]*(reg(istration)?\.?|regn\.?)\s*(no|number|#)"
    r"|सेबी (पंजीकृत|रजिस्टर्ड) (सलाहकार|एनालिस्ट|कंपनी)|SEBI (రిజిస్టర్డ్|నమోదిత) (సలహాదారు|అనలిస్ట్|సంస్థ)",
    re.I)


def sebi_claim(text: str) -> str | None:
    m = SEBI_REG_NO.search(text) or _SEBI_CLAIM.search(text)
    return snippet(text, m.start(), m.end()) if m else None
