"""Drills, lessons, badges, alerts (PRD 7.1, 7.3, 7.4). Shapes match frontend/mocks/*.ts."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from agents import drill_master, tutor
from core import badges
from core.content import alert_live, alert_out, lesson_out
from core.store import get_store
from routers.deps import user_id

router = APIRouter(tags=["learn"])


def _need_user(uid: str | None) -> str:
    if not uid:
        raise HTTPException(400, "X-User-Id header required")
    return uid


# ---------------------------------------------------------------- drills

@router.get("/drills")
def get_drills(uid: str | None = Depends(user_id)) -> list[dict]:
    """ScamDrill[]: unplayed first in random order, no repeats until all are played."""
    return drill_master.drills_for(get_store(), uid)


class DrillAnswerIn(BaseModel):
    answer: Literal["scam", "real"]


@router.post("/drills/{drill_id}/answer")
def answer_drill(drill_id: str, body: DrillAnswerIn, uid: str | None = Depends(user_id)) -> dict:
    try:
        return drill_master.answer(get_store(), uid, drill_id, body.answer)
    except KeyError:
        raise HTTPException(404, "Drill not found")


# ---------------------------------------------------------------- lessons

@router.get("/lessons")
def get_lessons() -> list[dict]:
    rows = [r for r in get_store().select("lessons") if r.get("status", "published") == "published"]
    return [lesson_out(r) for r in sorted(rows, key=lambda r: r["topic_no"])]


@router.get("/lessons/next")
def get_next_lesson(uid: str | None = Depends(user_id)) -> dict:
    """Today's lesson, picked by the Tutor rules (PRD 7.1)."""
    return tutor.next_lesson(get_store(), uid)


@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: str) -> dict:
    rows = get_store().select("lessons", {"id": lesson_id})
    if not rows or rows[0].get("status", "published") != "published":
        raise HTTPException(404, "Lesson not found")
    return lesson_out(rows[0])


class LessonDoneIn(BaseModel):
    quiz_score: int | None = Field(default=None, ge=0, le=20)


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: str, body: LessonDoneIn, uid: str | None = Depends(user_id)) -> dict:
    try:
        return tutor.complete_lesson(get_store(), _need_user(uid), lesson_id, body.quiz_score)
    except KeyError:
        raise HTTPException(404, "Lesson not found")


# ---------------------------------------------------------------- badges

@router.get("/badges")
def get_badges(uid: str | None = Depends(user_id)) -> list[dict]:
    return badges.badges_for(get_store(), uid)


@router.post("/badges/{code}/unlock")
def unlock_badge(code: str, uid: str | None = Depends(user_id)) -> list[dict]:
    """api.unlockBadge(): the app reports a milestone it tracked. Badges are motivation only
    (no money or access depends on them), so the 8 known codes are accepted as reported."""
    if code not in badges.CODES:
        raise HTTPException(404, "Unknown badge")
    store = get_store()
    badges.award(store, _need_user(uid), code)
    return badges.badges_for(store, uid)


# ---------------------------------------------------------------- alerts

@router.get("/alerts")
def get_alerts() -> list[dict]:
    """Active safety alerts within their start/end dates (shown on Home)."""
    return [alert_out(r) for r in sorted(get_store().select("alerts"), key=lambda r: r["id"]) if alert_live(r)]
