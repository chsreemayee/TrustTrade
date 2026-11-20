"""Badges and levels (PRD 7.4). Definitions are static; per-user state is badges_earned."""
from __future__ import annotations

import logging

from core import seed
from core.store import Store
from core.users import ensure_user

log = logging.getLogger("trusttrade.badges")
CODES = tuple(b["code"] for b in seed.badge_definitions())


def award(store: Store, user_id: str | None, code: str) -> bool:
    """Idempotent. Returns True if newly earned. Never raises (a badge must not break a feature)."""
    if not user_id or code not in CODES:
        return False
    try:
        if store.select("badges_earned", {"user_id": user_id, "badge_code": code}):
            return False
        ensure_user(store, user_id)
        store.insert("badges_earned", {"user_id": user_id, "badge_code": code})
        return True
    except Exception as e:  # noqa: BLE001
        log.warning("Could not award badge %s: %s", code, type(e).__name__)
        return False


def badges_for(store: Store, user_id: str | None) -> list[dict]:
    """→ Badge[] (mocks/badges.ts) with this user's unlocked state."""
    earned = {}
    if user_id:
        earned = {r["badge_code"]: str(r.get("earned_at") or "")[:10]
                  for r in store.select("badges_earned", {"user_id": user_id})}
    out = []
    for b in seed.badge_definitions():
        item = dict(b, unlocked=b["code"] in earned)
        if b["code"] in earned:
            item["earned_at"] = earned[b["code"]]
        out.append(item)
    return out
