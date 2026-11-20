from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, model_validator

from agents.scam_investigator.pipeline import CheckInput, run_scam_check
from core import badges
from core.store import get_store
from routers.deps import user_id

router = APIRouter(tags=["scam-check"])


class ScamCheckIn(BaseModel):
    """Same input as api.checkScamTip() in frontend/lib/api.ts."""
    type: Literal["voice", "text", "screenshot", "link"]
    text: str | None = Field(default=None, max_length=5000)
    urlOrUpi: str | None = Field(default=None, max_length=2000)
    imageData: str | None = Field(default=None, max_length=7_500_000)  # ≈5 MB image as base64

    @model_validator(mode="after")
    def _something_to_check(self):
        if not any(v and v.strip() for v in (self.text, self.urlOrUpi, self.imageData)):
            raise ValueError("Provide text, urlOrUpi or imageData")
        return self


@router.post("/scam-check")
async def scam_check(body: ScamCheckIn, uid: str | None = Depends(user_id)) -> dict:
    inp = CheckInput(input_type=body.type, text=body.text, url_or_upi=body.urlOrUpi,
                     image_data=body.imageData, user_id=uid)
    body.imageData = None  # keep no extra copy of the image around
    result = await run_in_threadpool(run_scam_check, inp)
    badges.award(get_store(), uid, "first_check")
    return result
