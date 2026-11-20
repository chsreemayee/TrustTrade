"""Practice: companies, wallet, trades, fast-forward (PRD 7.2). Shapes match lib/api.ts + mocks/companies.ts."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from agents import practice_coach as coach
from core.store import get_store
from routers.deps import user_id

router = APIRouter(tags=["practice"])


def _need_user(uid: str | None) -> str:
    if not uid:
        raise HTTPException(400, "X-User-Id header required")
    return uid


async def _run(fn, *args):
    try:
        return await run_in_threadpool(fn, get_store(), *args)
    except coach.PracticeError as e:
        raise HTTPException(e.status, str(e))


@router.get("/companies")
async def get_companies(uid: str | None = Depends(user_id)) -> list[dict]:
    return await _run(coach.companies_for, uid)


@router.get("/companies/{key}")
async def get_company(key: str, uid: str | None = Depends(user_id)) -> dict:
    """By ticker (RELIANCE.NS) or id (reliance), like api.getCompanyByTicker()."""
    for c in await _run(coach.companies_for, uid):
        if key.lower() in (c["ticker"].lower(), c["id"].lower()):
            return c
    raise HTTPException(404, "Company not found")


@router.get("/wallet")
async def get_wallet(uid: str | None = Depends(user_id)) -> dict:
    return await _run(coach.wallet_out, _need_user(uid))


class BuyIn(BaseModel):
    ticker: str = Field(min_length=1, max_length=40)
    rupees: float = Field(gt=0, le=10_000_000)


class SellIn(BaseModel):
    ticker: str = Field(min_length=1, max_length=40)


@router.post("/wallet/buy")
async def buy(body: BuyIn, uid: str | None = Depends(user_id)) -> dict:
    return await _run(coach.buy, _need_user(uid), body.ticker, body.rupees)


@router.post("/wallet/sell")
async def sell(body: SellIn, uid: str | None = Depends(user_id)) -> dict:
    return await _run(coach.sell, _need_user(uid), body.ticker)


@router.post("/wallet/reset")
async def reset(uid: str | None = Depends(user_id)) -> dict:
    return await _run(coach.reset, _need_user(uid))


@router.post("/wallet/fast-forward")
async def fast_forward(uid: str | None = Depends(user_id)) -> dict:
    return await _run(coach.fast_forward, _need_user(uid))
