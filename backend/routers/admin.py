"""Admin (PRD 4.8, 5.3, 8). Every route except /admin/login requires an admin token.

Shapes for stats/rules/reviews match frontend/mocks/admin.ts. Admins see report text with
phone numbers and emails masked (PRD 11).
"""
from __future__ import annotations

import csv
import io
import re
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

from agents.scam_investigator.detectors import compile_pattern
from core import auth, badges
from core.config import LANGUAGES
from core.content import alert_out, drill_in, drill_out, lesson_in, lesson_out
from core.store import get_store
from core.users import ensure_user
from routers.deps import user_id
from scripts.load_sebi_csv import parse_text

router = APIRouter(tags=["admin"])
admin = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(auth.require_admin)])

_PHONE = re.compile(r"(?<!\w)(?:\+?91[\s-]?)?[6-9]\d(?:[\s-]?\d){8}(?!\w)|(?<!\w)\+?\d[\d\s-]{9,}\d(?!\w)")
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]+\b")


def mask(text: str | None) -> str:
    return _EMAIL.sub("[email hidden]", _PHONE.sub("[number hidden]", text or ""))


def _ts(v) -> str:
    return str(v or "")[:16].replace("T", " ")


# ---------------------------------------------------------------- login

class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)


@router.post("/admin/login")
def admin_login(body: LoginIn, request: Request) -> dict:
    key = f"{request.client.host if request.client else 'unknown'}:{body.email.lower()}"
    if auth.rate_limited(key):
        raise HTTPException(429, "Too many attempts. Try again in 5 minutes.")
    if not auth.check_credentials(body.email, body.password):
        raise HTTPException(401, "Wrong email or password, or not an admin")
    token, exp = auth.create_token(body.email.strip().lower())
    return {"token": token, "email": body.email.strip().lower(),
            "expires_at": datetime.fromtimestamp(exp, timezone.utc).isoformat()}


@admin.get("/me")
def me(email: str = Depends(auth.require_admin)) -> dict:
    return {"email": email, "role": "admin"}


# ---------------------------------------------------------------- reports (public) + review queue

class ReportIn(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    reason: str = Field(default="", max_length=1000)
    check_id: str | None = Field(default=None, max_length=64)


@router.post("/reports")
def report_scam(body: ReportIn, uid: str | None = Depends(user_id)) -> bool:
    """api.reportScam(text, reason) → true. Also used for "This was wrong" flags."""
    store = get_store()
    check_id = None
    try:
        check_id = str(uuid.UUID(body.check_id)) if body.check_id else None
        if check_id and not store.select("scam_checks", {"id": check_id}):
            check_id = None
    except ValueError:
        check_id = None
    if uid:
        ensure_user(store, uid)
    store.insert("reports", {"check_id": check_id, "user_id": uid, "reported_text": body.text,
                             "reason": body.reason, "status": "open"})
    badges.award(store, uid, "protector")
    return True


def _review_out(r: dict) -> dict:
    """→ ReviewItem (mocks/admin.ts). Phone numbers and emails are never shown."""
    return {"id": r["id"], "check_id": r.get("check_id") or "", "reported_text": mask(r.get("reported_text")),
            "reason": mask(r.get("reason")), "status": r["status"], "timestamp": _ts(r.get("created_at"))}


def _reviews() -> list[dict]:
    rows = sorted(get_store().select("reports"), key=lambda r: str(r.get("created_at")), reverse=True)
    return [_review_out(r) for r in rows]


@admin.get("/reviews")
def get_reviews() -> list[dict]:
    return _reviews()


class ReviewStatusIn(BaseModel):
    status: Literal["approved", "dismissed", "open"]


@admin.patch("/reviews/{review_id}")
def update_review(review_id: str, body: ReviewStatusIn, email: str = Depends(auth.require_admin)) -> list[dict]:
    if not get_store().update("reports", {"id": review_id}, {"status": body.status, "reviewed_by": email}):
        raise HTTPException(404, "Review item not found")
    return _reviews()


# ---------------------------------------------------------------- scam rules (applied to new checks at once)

def _rule_out(r: dict) -> dict:
    """→ ScamRule (mocks/admin.ts)."""
    return {"id": r.get("id") or r["code"], "code": r["code"], "pattern": r.get("pattern") or "",
            "languages": list(r.get("languages") or []), "weight": float(r["weight"]),
            "is_always_scam": bool(r.get("is_always_scam")), "lesson_id": r.get("lesson_id") or "",
            "active": bool(r.get("active", True))}


def _rules() -> list[dict]:
    rows = sorted(get_store().select("scam_rules"), key=lambda r: r["code"])
    rows.sort(key=lambda r: str(r.get("created_at") or ""), reverse=True)    # newest first, like the mock
    return [_rule_out(r) for r in rows]


class RuleIn(BaseModel):
    code: str = Field(pattern=r"^[A-Z][A-Z0-9_]{2,40}$")
    pattern: str = Field(default="", max_length=500)
    languages: list[str] = Field(default_factory=lambda: list(LANGUAGES))
    weight: float
    is_always_scam: bool = False
    lesson_id: str = ""
    active: bool = True

    @field_validator("weight")
    @classmethod
    def _weight(cls, v):
        return valid_weight(v)

    @field_validator("languages")
    @classmethod
    def _langs(cls, v):
        return valid_languages(v)


def valid_weight(v: float) -> float:
    if v not in (2, 1, 0.5):
        raise ValueError("weight must be 2, 1 or 0.5")
    return float(v)


def valid_languages(v: list[str]) -> list[str]:
    if not v or set(v) - set(LANGUAGES) - {"all"}:
        raise ValueError(f"languages must be from {', '.join(LANGUAGES)} or all")
    return v


def _check_pattern(pattern: str, required: bool) -> None:
    if not pattern:
        if required:
            raise HTTPException(422, "A phrase pattern is required for new rules")
        return
    rx = compile_pattern(pattern)
    if rx is None:
        raise HTTPException(422, "Pattern is not a valid regular expression")
    if rx.search("") is not None:
        raise HTTPException(422, "Pattern matches every message; make it more specific")


def _check_lesson(lesson_id: str) -> None:
    if lesson_id and not get_store().select("lessons", {"id": lesson_id}):
        raise HTTPException(422, f"Unknown lesson_id {lesson_id}")


@admin.get("/rules")
def get_rules() -> list[dict]:
    return _rules()


@admin.post("/rules")
def add_rule(body: RuleIn) -> list[dict]:
    """api.addScamRule(rule) → ScamRule[] (new rule first)."""
    store = get_store()
    if store.select("scam_rules", {"code": body.code}):
        raise HTTPException(409, f"A rule with code {body.code} already exists")
    _check_pattern(body.pattern, required=True)
    _check_lesson(body.lesson_id)
    store.insert("scam_rules", {"id": str(uuid.uuid4()), "code": body.code, "pattern": body.pattern,
                                "languages": body.languages, "weight": body.weight,
                                "is_always_scam": body.is_always_scam, "lesson_id": body.lesson_id or None,
                                "detector": "phrase", "label": {"en": body.code.replace("_", " ").lower()},
                                "active": body.active, "created_at": datetime.now(timezone.utc).isoformat()})
    return _rules()


class RulePatch(BaseModel):
    pattern: str | None = Field(default=None, max_length=500)
    languages: list[str] | None = None
    weight: float | None = None
    is_always_scam: bool | None = None
    lesson_id: str | None = None
    active: bool | None = None


@admin.put("/rules/{rule_id}")
def edit_rule(rule_id: str, body: RulePatch) -> list[dict]:
    store = get_store()
    row = next((r for r in store.select("scam_rules") if r.get("id") == rule_id or r["code"] == rule_id), None)
    if row is None:
        raise HTTPException(404, "Rule not found")
    changes = body.model_dump(exclude_none=True)
    try:
        if "weight" in changes:
            changes["weight"] = valid_weight(changes["weight"])
        if "languages" in changes:
            valid_languages(changes["languages"])
    except ValueError as e:
        raise HTTPException(422, str(e))
    if "pattern" in changes:
        # Phrase-only rules need a pattern; code/extract-detected signs may have none.
        _check_pattern(changes["pattern"], required=(row.get("detector") or "phrase") == "phrase")
    if "lesson_id" in changes:
        _check_lesson(changes["lesson_id"])
        changes["lesson_id"] = changes["lesson_id"] or None
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    store.update("scam_rules", {"code": row["code"]}, changes)
    return _rules()


# ---------------------------------------------------------------- stats + export (no personal data)

@admin.get("/stats")
def stats() -> dict:
    """→ AdminStats (mocks/admin.ts)."""
    store = get_store()
    checks = store.select("scam_checks")
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    active = set()
    for table in ("scam_checks", "drill_attempts", "lesson_progress", "trades"):
        col = "completed_at" if table == "lesson_progress" else "created_at"
        active |= {r["user_id"] for r in store.select(table) if r.get("user_id") and str(r.get(col)) >= since}
    last = store.max_value("sebi_entities", "loaded_at")
    return {"total_checks": len(checks), "scams_caught": sum(c["verdict"] == "scam" for c in checks),
            "active_learners": len(active), "drills_played": store.count("drill_attempts"),
            "sebi_records_count": store.count("sebi_entities"), "sebi_last_refresh": _ts(last) or "Never"}


@admin.get("/export.csv")
def export_csv() -> Response:
    """Counts per day (PRD 8 Reports). Aggregates only: no ids, phones, names or message text."""
    store = get_store()
    days: dict[str, Counter] = defaultdict(Counter)
    for c in store.select("scam_checks"):
        days[str(c["created_at"])[:10]]["checks"] += 1
        days[str(c["created_at"])[:10]][f"verdict_{c['verdict']}"] += 1
    for table, col, name in (("lesson_progress", "completed_at", "lessons"), ("drill_attempts", "created_at", "drills"),
                             ("trades", "created_at", "trades"), ("reports", "created_at", "flags")):
        for r in store.select(table):
            days[str(r.get(col))[:10]][name] += 1
    cols = ["checks", "verdict_scam", "verdict_careful", "verdict_no_signs", "verdict_could_not_check",
            "lessons", "drills", "trades", "flags"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["date", *cols])
    for day in sorted(days):
        w.writerow([day, *(days[day][c] for c in cols)])
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": 'attachment; filename="trusttrade_usage.csv"'})


# ---------------------------------------------------------------- SEBI list upload

@admin.get("/sebi")
def sebi_status() -> dict:
    store = get_store()
    return {"count": store.count("sebi_entities"), "last_refresh": _ts(store.max_value("sebi_entities", "loaded_at")) or "Never"}


@admin.post("/sebi/upload")
async def sebi_upload(request: Request, filename: str = "sebi_upload.csv") -> dict:
    """Body: the CSV file itself (Content-Type: text/csv). Replaces the stored list."""
    raw = await request.body()
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(413, "CSV larger than 25 MB")
    try:
        rows = parse_text(raw.decode("utf-8-sig"), filename[:120])
    except (UnicodeDecodeError, ValueError) as e:
        raise HTTPException(422, str(e))
    if not rows:
        raise HTTPException(422, "No rows with registration_no and name")
    store = get_store()
    started = datetime.now(timezone.utc).isoformat()
    for r in rows:
        r["loaded_at"] = started
    store.upsert("sebi_entities", rows)
    removed = store.delete_older("sebi_entities", "loaded_at", started)   # rows not in this upload
    return {"rows_loaded": len(rows), "removed": removed, **sebi_status()}


# ---------------------------------------------------------------- safety alerts

class AlertIn(BaseModel):
    tag: dict[str, str] = Field(default_factory=dict)
    title: dict[str, str]
    body: dict[str, str]
    action_label: dict[str, str] = Field(default_factory=dict)
    sample_tip_key: str = ""
    active: bool = True
    starts: datetime | None = None
    ends: datetime | None = None


def _alert_admin(r: dict) -> dict:
    return {**alert_out(r), "starts": r.get("starts"), "ends": r.get("ends")}


@admin.get("/alerts")
def admin_alerts() -> list[dict]:
    return [_alert_admin(r) for r in sorted(get_store().select("alerts"), key=lambda r: r["id"])]


@admin.put("/alerts/{alert_id}")
def save_alert(alert_id: str, body: AlertIn) -> list[dict]:
    if "en" not in body.title or "en" not in body.body:
        raise HTTPException(422, "English title and body are required (other languages fall back to English)")
    get_store().upsert("alerts", [{
        "id": alert_id, "translations": {"tag": body.tag, "title": body.title, "body": body.body,
                                         "action_label": body.action_label},
        "sample_tip_key": body.sample_tip_key, "active": body.active,
        "starts": body.starts.isoformat() if body.starts else None, "ends": body.ends.isoformat() if body.ends else None}])
    return admin_alerts()


# ---------------------------------------------------------------- drills + lessons (simple forms)

@admin.get("/drills")
def admin_drills() -> list[dict]:
    return [{**drill_out(r), "status": r.get("status", "published")}
            for r in sorted(get_store().select("drills"), key=lambda r: r["id"])]


@admin.put("/drills/{drill_id}")
def save_drill(drill_id: str, drill: dict = Body(...)) -> list[dict]:
    """Body: ScamDrill (+ optional status draft|published). PRD 8: correct answer + at least 1 trick."""
    drill = {**drill, "id": drill_id}
    if drill.get("correct_answer") not in ("scam", "real"):
        raise HTTPException(422, "correct_answer must be scam or real")
    if not drill.get("tricks"):
        raise HTTPException(422, "At least 1 trick is required")
    if not (drill.get("message") or {}).get("en"):
        raise HTTPException(422, "English message is required")
    if drill.get("status", "published") not in ("draft", "published"):
        raise HTTPException(422, "status must be draft or published")
    get_store().upsert("drills", [drill_in(drill)])
    return admin_drills()


@admin.get("/lessons")
def admin_lessons() -> list[dict]:
    rows = sorted(get_store().select("lessons"), key=lambda r: r["topic_no"])
    return [{**lesson_out(r), "status": r.get("status", "published"),
             "missing_languages": sorted(set(LANGUAGES) - set((r.get("translations") or {}).get("title", {})))}
            for r in rows]


@admin.put("/lessons/{lesson_id}")
def save_lesson(lesson_id: str, lesson: dict = Body(...)) -> list[dict]:
    """Body: Lesson (+ optional status). Missing languages fall back to English in the app (PRD 8)."""
    lesson = {**lesson, "id": lesson_id}
    for field in ("topic_no", "title", "scenes"):
        if field not in lesson:
            raise HTTPException(422, f"{field} is required")
    if not lesson["title"].get("en"):
        raise HTTPException(422, "English title is required")
    if lesson.get("status", "published") not in ("draft", "published"):
        raise HTTPException(422, "status must be draft or published")
    lesson.setdefault("core_idea", {}), lesson.setdefault("estimated_time", "2 min"), lesson.setdefault("job_adaptation", {})
    get_store().upsert("lessons", [lesson_in(lesson)])
    return admin_lessons()


router.include_router(admin)
