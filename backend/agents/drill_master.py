"""Drill Master (PRD 7.3): plays drills in random order without repeats, checks answers, awards badges."""
from __future__ import annotations

import random

from core import badges
from core.content import drill_out
from core.store import Store
from core.users import ensure_user


def drills_for(store: Store, user_id: str | None) -> list[dict]:
    rows = [r for r in store.select("drills") if r.get("status", "published") == "published"]
    rows.sort(key=lambda r: r["id"])
    if not user_id:
        return [drill_out(r) for r in rows]
    played = {a["drill_id"] for a in store.select("drill_attempts", {"user_id": user_id})}
    if played >= {r["id"] for r in rows}:     # everything played → start a new round
        played = set()
    fresh = [r for r in rows if r["id"] not in played]
    seen = [r for r in rows if r["id"] in played]
    random.shuffle(fresh)
    random.shuffle(seen)
    return [drill_out(r) for r in fresh + seen]


def answer(store: Store, user_id: str | None, drill_id: str, given: str) -> dict:
    rows = store.select("drills", {"id": drill_id})
    if not rows:
        raise KeyError(drill_id)
    d = drill_out(rows[0])
    correct = given == d["correct_answer"]
    new: list[str] = []
    if user_id:
        ensure_user(store, user_id)
        store.insert("drill_attempts", {"user_id": user_id, "drill_id": drill_id, "answer": given, "correct": correct})
        attempts = sorted(store.select("drill_attempts", {"user_id": user_id}), key=lambda a: str(a.get("created_at")))
        streak = 0
        for a in reversed(attempts):
            if not a["correct"]:
                break
            streak += 1
        if sum(1 for a in attempts if a["correct"]) >= 5 and badges.award(store, user_id, "scam_spotter"):
            new.append("scam_spotter")
        if streak >= 5 and badges.award(store, user_id, "sharp_eye"):
            new.append("sharp_eye")
    return {"drill_id": drill_id, "correct": correct, "correct_answer": d["correct_answer"],
            "tricks": d["tricks"], "explanation": d["explanation"], "badges_unlocked": new}
