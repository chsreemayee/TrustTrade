from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from agents.orchestrator import ask
from routers.deps import user_id

router = APIRouter(tags=["big-mic"])


class AskIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    job: str | None = Field(default=None, max_length=40)
    lesson_id: str | None = Field(default=None, max_length=80)   # set when asked from the lesson player


@router.post("/ask")
async def ask_endpoint(body: AskIn, uid: str | None = Depends(user_id)) -> dict:
    """Big mic (PRD 7.5): money basics answered from lessons (≤40 words) + closest lesson;
    tips are routed to Scam Check; stock picks and off-topic get fixed replies."""
    return await run_in_threadpool(ask, body.text, uid, body.job, body.lesson_id)
