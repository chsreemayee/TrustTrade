"""Database rows ↔ the exact JSON shapes in frontend/mocks/*.ts."""
from __future__ import annotations

from datetime import datetime, timezone

from core.seed import LESSON_FIELDS


def drill_out(row: dict) -> dict:
    """→ ScamDrill (mocks/drills.ts)."""
    t = row.get("translations") or {}
    out = {"id": row["id"], "type": "scam" if row["is_scam"] else "real"}
    if row.get("scam_type"):
        out["scam_type"] = row["scam_type"]
    out.update(sender_name=t.get("sender_name", {}), message=t.get("message", {}),
               correct_answer="scam" if row["is_scam"] else "real", tricks=t.get("tricks", []),
               explanation=t.get("explanation", {}))
    return out


def drill_in(d: dict) -> dict:
    return {"id": d["id"], "is_scam": d["correct_answer"] == "scam", "scam_type": d.get("scam_type"),
            "translations": {k: d.get(k) or ({} if k != "tricks" else []) for k in
                             ("sender_name", "message", "explanation", "tricks")},
            "status": d.get("status", "published")}


def lesson_out(row: dict) -> dict:
    """→ Lesson (mocks/lessons.ts)."""
    t = row.get("translations") or {}
    out = {"id": row["id"], "topic_no": row["topic_no"], "is_micro": row.get("kind") == "micro",
           "core_idea": t.get("core_idea", {}), "title": t.get("title", {}),
           "estimated_time": t.get("estimated_time", "2 min"), "job_adaptation": t.get("job_adaptation", {}),
           "scenes": t.get("scenes", [])}
    if t.get("quiz"):
        out["quiz"] = t["quiz"]
    return out


def lesson_in(l: dict) -> dict:
    return {"id": l["id"], "topic_no": l["topic_no"], "job": "all", "kind": "micro" if l.get("is_micro") else "topic",
            "translations": {k: l[k] for k in LESSON_FIELDS if k in l}, "status": l.get("status", "published"),
            "updated_at": datetime.now(timezone.utc).isoformat()}


def alert_out(row: dict) -> dict:
    """→ SafetyAlert (mocks/alerts.ts)."""
    t = row.get("translations") or {}
    return {"id": row["id"], "tag": t.get("tag", {}), "title": t.get("title", {}), "body": t.get("body", {}),
            "action_label": t.get("action_label", {}), "sample_tip_key": row.get("sample_tip_key") or "",
            "active": bool(row.get("active"))}


def alert_live(row: dict, now: datetime | None = None) -> bool:
    now = now or datetime.now(timezone.utc)

    def ts(v):
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")) if v else None
    s, e = ts(row.get("starts")), ts(row.get("ends"))
    return bool(row.get("active")) and (s is None or s <= now) and (e is None or now <= e)
