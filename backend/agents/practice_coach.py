"""Practice Coach (PRD 7.2): ₹10,000 pretend wallet, buy in ₹100 steps, sell, reset, fast-forward.

Each wallet has its own clock (sim_date). Prices are the real daily close on that date. A new
wallet starts PRACTICE_START_OFFSET_DAYS trading days back so "Fast-forward a week" can replay
real history up to today. Holdings are derived from the trade log (one source of truth).
"""
from __future__ import annotations

import json
from datetime import date
from functools import lru_cache
from pathlib import Path

from core import badges
from core.config import LANGUAGES, get_settings
from core.prices import all_series, ensure_fresh
from core.store import Store
from core.users import ensure_user

START_CASH = 10000.0
STEP = 100
TRADING_DAYS_PER_WEEK = 5
HISTORY_POINTS = 22   # ≈ one month of trading days


class PracticeError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


@lru_cache(maxsize=1)
def _text() -> dict:
    return json.loads((Path(__file__).parents[1] / "seed" / "practice_text.json").read_text(encoding="utf-8"))


def _say(key: str, **kw) -> dict[str, str]:
    return {lang: _text()[key][lang].format(**kw) for lang in LANGUAGES}


def _companies(store: Store) -> list[dict]:
    return sorted(store.select("companies"), key=lambda c: c["ticker"])


def _load(store: Store) -> dict[str, list[dict]]:
    ensure_fresh(store, [c["ticker"] for c in _companies(store)])
    return all_series(store)


def trading_dates(series: dict[str, list[dict]]) -> list[str]:
    return sorted({str(b["date"]) for bars in series.values() for b in bars})


def _bar_on(bars: list[dict], day: str | None) -> tuple[dict | None, dict | None]:
    """Last bar on/before `day` and the one before it."""
    upto = [b for b in bars if day is None or str(b["date"]) <= day]
    if not upto:
        return None, None
    return upto[-1], (upto[-2] if len(upto) > 1 else None)


def _days(a: str, b: str) -> int:
    return (date.fromisoformat(str(b)[:10]) - date.fromisoformat(str(a)[:10])).days


# ------------------------------------------------------------------ companies

def company_out(row: dict, bars: list[dict], day: str | None) -> dict:
    """→ Company (mocks/companies.ts) + price_date / price_available / notice."""
    t = row.get("translations") or {}
    bar, prev = _bar_on(bars, day)
    price = float(bar["close"]) if bar else 0.0
    prev_close = float(prev["close"]) if prev else price
    upto = [b for b in bars if day is None or str(b["date"]) <= day][-HISTORY_POINTS:]
    change = round(price - prev_close, 2)
    return {
        "id": row["slug"], "ticker": row["ticker"], "name": row["name"], "initials": row["initials"],
        "tile_colour": row["tile_colour"], "sector": t.get("sector", {}),
        "current_price": round(price, 2), "previous_close": round(prev_close, 2), "price_change": change,
        "change_percent": round(change / prev_close * 100, 2) if prev_close else 0.0,
        "description": t.get("description", {}), "job_example": t.get("job_example", {}),
        "history": [round(float(b["close"]), 2) for b in upto],
        "price_date": str(bar["date"]) if bar else None,      # "Price from [date]"
        "price_available": bar is not None,
        "notice": _say("notice"),
    }


def companies_for(store: Store, user_id: str | None) -> list[dict]:
    series = _load(store)
    day = _wallet(store, user_id, series)["sim_date"] if user_id else None
    return [company_out(c, series.get(c["ticker"], []), day) for c in _companies(store)]


def find_company(store: Store, key: str) -> dict | None:
    k = key.strip().lower()
    return next((c for c in _companies(store) if c["ticker"].lower() == k or c["slug"].lower() == k), None)


# ------------------------------------------------------------------ wallet

def _start_date(series: dict[str, list[dict]]) -> str | None:
    dates = trading_dates(series)
    if not dates:
        return None
    offset = max(0, get_settings().practice_start_offset_days)
    return dates[max(0, len(dates) - 1 - offset)]


def _wallet(store: Store, user_id: str, series: dict[str, list[dict]]) -> dict:
    rows = store.select("wallets", {"user_id": user_id})
    if rows:
        w = rows[0]
        if not w.get("sim_date") and series:      # created before prices were available
            w["sim_date"] = _start_date(series)
            store.update("wallets", {"user_id": user_id}, {"sim_date": w["sim_date"]})
        return w
    ensure_user(store, user_id)
    w = {"user_id": user_id, "cash": START_CASH, "sim_date": _start_date(series), "sim_days_forwarded": 0,
         "reset_count": 0}
    store.upsert("wallets", [w])
    return w


def _positions(store: Store, user_id: str) -> dict[str, dict]:
    pos: dict[str, dict] = {}
    for t in sorted(store.select("trades", {"user_id": user_id}), key=lambda t: str(t.get("created_at"))):
        if t["side"] == "sell":
            pos.pop(t["ticker"], None)            # sellStock sells the whole holding
            continue
        p = pos.setdefault(t["ticker"], {"shares": 0.0, "exact": 0.0, "invested": 0.0, "buy_date": str(t["price_date"])})
        p["shares"] = round(p["shares"] + float(t["shares"]), 4)          # shown: 4 decimals (PRD 7.2)
        p["exact"] += float(t["rupees"]) / float(t["price"])              # used for value, so no rounding "loss"
        p["invested"] = round(p["invested"] + float(t["rupees"]), 2)
    return pos


def wallet_out(store: Store, user_id: str, series: dict[str, list[dict]] | None = None) -> dict:
    """→ UserWallet (lib/api.ts) + sim_date / can_fast_forward."""
    series = series if series is not None else _load(store)
    w = _wallet(store, user_id, series)
    day = w.get("sim_date")
    names = {c["ticker"]: c["name"] for c in _companies(store)}
    holdings = []
    for ticker, p in _positions(store, user_id).items():
        bar, _ = _bar_on(series.get(ticker, []), day)
        price = float(bar["close"]) if bar else p["invested"] / p["exact"]
        value = round(p["exact"] * price, 2)
        gain = round(value - p["invested"], 2)
        holdings.append({
            "ticker": ticker, "name": names.get(ticker, ticker), "shares": p["shares"],
            "invested_rupees": p["invested"], "current_value": value, "gain_loss_rupees": gain,
            "gain_loss_percent": round(gain / p["invested"] * 100, 2) if p["invested"] else 0.0,
            "buy_price": round(p["invested"] / p["exact"], 2), "buy_date": p["buy_date"],
            "held_days": _days(p["buy_date"], day) if day else 0,
        })
    dates = trading_dates(series)
    return {"cash": round(float(w["cash"]), 2), "holdings": holdings,
            "sim_days_forwarded": int(w.get("sim_days_forwarded") or 0),
            "sim_date": day, "can_fast_forward": bool(day and dates and day < dates[-1])}


def buy(store: Store, user_id: str, key: str, rupees: float) -> dict:
    if rupees < STEP or rupees % STEP:
        raise PracticeError(f"Amount must be in steps of ₹{STEP} (minimum ₹{STEP})")
    company = find_company(store, key)
    if not company:
        raise PracticeError("Company not found", 404)
    series = _load(store)
    w = _wallet(store, user_id, series)
    bar, _ = _bar_on(series.get(company["ticker"], []), w.get("sim_date"))
    if bar is None:
        raise PracticeError("Price not available right now. Please try again later.", 503)
    if float(w["cash"]) < rupees:
        raise PracticeError("Insufficient cash balance")
    price = float(bar["close"])
    shares = round(rupees / price, 4)
    store.insert("trades", {"user_id": user_id, "ticker": company["ticker"], "side": "buy", "rupees": rupees,
                            "shares": shares, "price": price, "price_date": str(bar["date"])})
    store.update("wallets", {"user_id": user_id}, {"cash": round(float(w["cash"]) - rupees, 2)})
    badges.award(store, user_id, "first_trade")
    out = wallet_out(store, user_id, series)
    held = next(h for h in out["holdings"] if h["ticker"] == company["ticker"])
    out["summary"] = _say("bought", amount=f"{rupees:,.0f}", name=company["name"], price=f"{price:,.2f}",
                          shares=f"{held['shares']:.4f}")
    return out


def sell(store: Store, user_id: str, key: str) -> dict:
    company = find_company(store, key)
    series = _load(store)
    before = wallet_out(store, user_id, series)
    ticker = company["ticker"] if company else key
    held = next((h for h in before["holdings"] if h["ticker"] == ticker), None)
    if held is None:
        raise PracticeError("Holding not found", 404)
    bar, _ = _bar_on(series.get(ticker, []), before["sim_date"])
    if bar is None:
        raise PracticeError("Price not available right now. Please try again later.", 503)
    store.insert("trades", {"user_id": user_id, "ticker": ticker, "side": "sell", "rupees": held["current_value"],
                            "shares": held["shares"], "price": float(bar["close"]), "price_date": str(bar["date"])})
    store.update("wallets", {"user_id": user_id}, {"cash": round(before["cash"] + held["current_value"], 2)})
    out = wallet_out(store, user_id, series)
    out["summary"] = _say("sold", amount=f"{held['current_value']:,.2f}", name=held["name"],
                          gain=f"{held['gain_loss_rupees']:+,.2f}")
    return out


def reset(store: Store, user_id: str) -> dict:
    """PRD 7.2: clears holdings and history."""
    series = _load(store)
    w = _wallet(store, user_id, series)
    store.delete("trades", {"user_id": user_id})
    store.update("wallets", {"user_id": user_id}, {"cash": START_CASH, "sim_date": _start_date(series),
                                                   "sim_days_forwarded": 0,
                                                   "reset_count": int(w.get("reset_count") or 0) + 1})
    return wallet_out(store, user_id, series)


def fast_forward(store: Store, user_id: str) -> dict:
    """Demo only: move this user's clock 5 trading days through real history."""
    series = _load(store)
    w = _wallet(store, user_id, series)
    dates = trading_dates(series)
    day = w.get("sim_date")
    if not dates or not day:
        raise PracticeError("Price history not available right now. Please try again later.", 503)
    i = max(k for k, d in enumerate(dates) if d <= day)
    if i >= len(dates) - 1:
        raise PracticeError("You are already at today's prices.", 409)
    new_day = dates[min(i + TRADING_DAYS_PER_WEEK, len(dates) - 1)]
    store.update("wallets", {"user_id": user_id}, {
        "sim_date": new_day, "sim_days_forwarded": int(w.get("sim_days_forwarded") or 0) + _days(day, new_day)})
    out = wallet_out(store, user_id, series)
    if any(h["held_days"] >= 7 for h in out["holdings"]):
        badges.award(store, user_id, "patient_investor")
    out["summary"] = _say("forwarded", date=date.fromisoformat(new_day).strftime("%-d %b %Y"))
    return out
