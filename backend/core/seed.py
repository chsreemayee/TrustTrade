"""Builds seed rows for every seeded table from backend/seed/ (Datasets doc §4–5 + front-end mocks)."""
import csv
import json
import uuid
from pathlib import Path

from core.config import BACKEND_DIR

SEED_DIR = BACKEND_DIR / "seed"


def _json(name: str):
    return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))


def _csv(name: str) -> list[dict]:
    with open(SEED_DIR / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def verdict_text() -> dict:
    """Fixed verdict wording in 6 languages (PRD 6.4)."""
    return _json("verdict_text.json")


def scam_rules() -> list[dict]:
    labels = verdict_text()["sign_labels"]
    rows = []
    for r in _csv("scam_rules.csv"):
        rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"trusttrade/scam_rules/{r['code']}")),
            "code": r["code"],
            "pattern": r["pattern"] or None,
            "languages": r["languages"].split("|"),
            "weight": float(r["weight"]),
            "is_always_scam": r["is_always_scam"].lower() == "true",
            "lesson_id": r["lesson_id"] or None,
            "detector": r["detector"],
            "label": labels.get(r["code"], {"en": r["label_en"]}),
            "active": True,
        })
    return rows


def companies() -> list[dict]:
    """Ticker list and English sector from Datasets §4.5; name, tile colour, slug, initials and
    translated text from the front-end mock so the app keeps its current look."""
    content = {c["ticker"]: c for c in _json("companies_content.json")}
    rows = []
    for r in _csv("companies.csv"):
        c = content[r["ticker"]]
        rows.append({
            "ticker": r["ticker"],
            "slug": c["id"],
            "name": c["name"],
            "initials": c["initials"],
            "sector": r["sector"],
            "tile_colour": c["tile_colour"],
            "translations": {
                "sector": c["sector"],
                "description": c["description"],
                "job_example": c["job_example"],
            },
        })
    return rows


def drills() -> list[dict]:
    return [{
        "id": d["id"],
        "is_scam": d["correct_answer"] == "scam",
        "scam_type": d.get("scam_type"),
        "translations": {
            "sender_name": d["sender_name"],
            "message": d["message"],
            "explanation": d["explanation"],
            "tricks": d["tricks"],
        },
        "status": "published",
    } for d in _json("drills.json")]


def alerts() -> list[dict]:
    return [{
        "id": a["id"],
        "translations": {k: a[k] for k in ("tag", "title", "body", "action_label")},
        "sample_tip_key": a["sample_tip_key"],
        "active": a["active"],
        "starts": None,
        "ends": None,
    } for a in _json("alerts.json")]


LESSON_FIELDS = ("title", "core_idea", "estimated_time", "job_adaptation", "scenes", "quiz")


def lessons() -> list[dict]:
    """Mock lessons (frontend/mocks/lessons.ts) + topics 3–5 and 2 micro-lessons (lessons_extra.json)."""
    rows = []
    for l in sorted(_json("lessons_mock.json") + _json("lessons_extra.json"), key=lambda x: x["topic_no"]):
        rows.append({
            "id": l["id"], "topic_no": l["topic_no"], "job": "all",
            "kind": "micro" if l["is_micro"] else "topic",
            "translations": {k: l[k] for k in LESSON_FIELDS if k in l},
            "status": "published",
        })
    return rows


def fixed_replies() -> dict:
    return _json("fixed_replies.json")


def badge_definitions() -> list[dict]:
    """The 8 badges (PRD 7.4). Static definitions; per-user state lives in badges_earned."""
    return _json("badges.json")


# Table name → (primary key columns, row builder).
SEEDED_TABLES = {
    "scam_rules": (("code",), scam_rules),
    "companies": (("ticker",), companies),
    "drills": (("id",), drills),
    "alerts": (("id",), alerts),
    "lessons": (("id",), lessons),
}


def all_seed_rows() -> dict[str, list[dict]]:
    return {table: build() for table, (_, build) in SEEDED_TABLES.items()}
