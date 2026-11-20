"""Text normalisation for rule matching, and the banned-word filter (PRD 6.4, rule 3).

Every piece of LLM output passes through `find_banned` / `scrub_banned` before it is shown.
"""
import re
import unicodedata

_ZERO_WIDTH = dict.fromkeys(map(ord, "​‌‍⁠﻿"), None)


def clean(text: str) -> str:
    """NFC + strip zero-width joiners + squash spaces. Case is kept (rules match with IGNORECASE)
    so evidence snippets can be shown exactly as the user wrote them."""
    text = unicodedata.normalize("NFC", text or "").translate(_ZERO_WIDTH)
    return re.sub(r"\s+", " ", text).strip()


def normalize(text: str) -> str:
    """NFC, strip zero-width joiners (Indic scripts use them inconsistently), lowercase, squash spaces."""
    text = unicodedata.normalize("NFC", text or "").translate(_ZERO_WIDTH)
    return re.sub(r"\s+", " ", text).strip().lower()


# Words TrustTrade must never say about a tip, in the 6 languages (English matched as whole words).
BANNED_PATTERNS: list[str] = [
    r"\bsafe\b", r"\bsafely\b", r"\bgenuine\b", r"100\s*%", r"\bguarantee(d|s)?\b",
    r"\bbuy(ing)?\b", r"\bsell(ing)?\b", r"\binvest(ing)? in\b",
    # Hindi
    "सुरक्षित", "असली", "गारंटी", "खरीदें", "खरीदो", "खरीद लें", "खरीद लो", "बेचें", "बेचो", "बेच दें", "निवेश करें",
    # Telugu
    "సురక్షిత", "నిజమైన", "గ్యారెంటీ", "గ్యారంటీ", "కొనండి", "కొనుగోలు చేయండి", "అమ్మండి", "పెట్టుబడి పెట్టండి",
    # Kannada
    "ಸುರಕ್ಷಿತ", "ಖಚಿತ", "ಖರೀದಿಸಿ", "ಮಾರಾಟ ಮಾಡಿ",
    # Tamil
    "பாதுகாப்பான", "உத்தரவாத", "வாங்குங்கள்", "விற்குங்கள்",
    # Malayalam
    "സുരക്ഷിത", "ഗ്യാരണ്ടി", "ഉറപ്പായ", "വാങ്ങുക", "വിൽക്കുക",
]
_BANNED_RE = re.compile("|".join(f"(?:{p})" for p in BANNED_PATTERNS), re.IGNORECASE)

# Neutral replacements used when LLM *extracted details* quote a banned word from the tip.
_SCRUB = [
    (re.compile(r"\bguarantee(d|s)?\b|गारंटी|గ్యారెంటీ|గ్యారంటీ|ಖಚಿತ|உத்தரவாத|ഗ്യാരണ്ടി", re.I), "promised"),
    (re.compile(r"100\s*%"), "full"),
    (re.compile(r"\bsafe(ly)?\b|\bgenuine\b", re.I), "(claimed)"),
    (re.compile(r"\bbuy(ing)?\b", re.I), "get"),
    (re.compile(r"\bsell(ing)?\b", re.I), "exit"),
    (re.compile(r"\binvest(ing)? in\b", re.I), "put money in"),
]


def find_banned(text: str) -> list[str]:
    return [m.group(0) for m in _BANNED_RE.finditer(unicodedata.normalize("NFC", text or ""))]


def scrub_banned(text: str) -> str:
    """For short extracted facts: swap banned words for neutral ones; anything left is dropped."""
    text = unicodedata.normalize("NFC", text or "")
    for pattern, repl in _SCRUB:
        text = pattern.sub(repl, text)
    return _BANNED_RE.sub("", text).strip()
