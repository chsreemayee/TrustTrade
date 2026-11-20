"""Step 4: Practice — companies, wallet, trades, fast-forward, price cache."""
import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from core import prices
from core.config import LANGUAGES
from tests.conftest import uid_headers

H = uid_headers()
TICKERS = [c["ticker"] for c in json.loads((Path(__file__).parents[1] / "seed" / "companies_content.json").read_text())]


def weekdays(n, end=date(2026, 11, 20)):
    out, d = [], end
    while len(out) < n:
        if d.weekday() < 5:
            out.append(d)
        d -= timedelta(days=1)
    return sorted(out)


class FakePrices:
    """30 weekdays; each ticker's close rises ₹1 a day from 100 (RELIANCE: 1000)."""
    def __init__(self, fail=False):
        self.calls, self.fail = [], fail

    def history(self, tickers, period):
        self.calls.append(period)
        if self.fail:
            raise ConnectionError("Yahoo blocked")
        base = {t: (1000 if t == "RELIANCE.NS" else 100) for t in tickers}
        return {t: [{"date": d.isoformat(), "open": base[t] + i, "high": base[t] + i, "low": base[t] + i,
                     "close": float(base[t] + i), "volume": 1000} for i, d in enumerate(weekdays(30))] for t in tickers}


@pytest.fixture
def px():
    src = FakePrices()
    prices.set_price_source(src)
    yield src
    prices.set_price_source(None)


def test_company_shape_matches_mock(client, px):
    mock_keys = {"id", "ticker", "name", "initials", "tile_colour", "sector", "current_price", "previous_close",
                 "price_change", "change_percent", "description", "job_example", "history"}
    cos = client.get("/companies").json()
    assert len(cos) == 20 and all(set(c) >= mock_keys for c in cos)
    rel = client.get("/companies/reliance").json()
    assert rel == client.get("/companies/RELIANCE.NS").json()
    assert rel["name"] == "Reliance Industries" and rel["tile_colour"] == "#005691"   # mock look
    assert rel["current_price"] == 1029 and rel["previous_close"] == 1028 and rel["price_change"] == 1
    assert len(rel["history"]) == 22 and rel["price_date"] == "2026-11-20"
    assert rel["notice"]["en"] == "Practice only. TrustTrade does not recommend any company."
    assert client.get("/companies/nope").status_code == 404


def test_new_wallet_and_user_clock(client, px):
    w = client.get("/wallet", headers=H).json()
    assert w["cash"] == 10000 and w["holdings"] == [] and w["sim_days_forwarded"] == 0
    assert w["sim_date"] == weekdays(30)[-21].isoformat() and w["can_fast_forward"]
    rel = client.get("/companies/reliance", headers=H).json()     # prices on the user's own date
    assert rel["current_price"] == 1009 and rel["price_date"] == w["sim_date"]
    assert client.get("/wallet").status_code == 400


def test_buy_rules(client, px):
    buy = lambda r, t="RELIANCE.NS": client.post("/wallet/buy", json={"ticker": t, "rupees": r}, headers=H)  # noqa: E731
    assert buy(150).status_code == 400 and buy(50).status_code == 400        # ₹100 steps, min ₹100
    assert buy(20000).json()["detail"] == "Insufficient cash balance"
    assert buy(500, "NOPE").status_code == 404
    w = buy(500).json()
    h = w["holdings"][0]
    assert w["cash"] == 9500 and h["shares"] == round(500 / 1009, 4) and h["invested_rupees"] == 500
    assert h["buy_price"] == 1009 and h["held_days"] == 0 and h["gain_loss_rupees"] == 0 and h["current_value"] == 500
    assert set(h) == {"ticker", "name", "shares", "invested_rupees", "current_value", "gain_loss_rupees",
                      "gain_loss_percent", "buy_price", "buy_date", "held_days"}
    assert set(w["summary"]) == set(LANGUAGES) and "Reliance" in w["summary"]["en"]
    w = buy(500).json()                                                      # adds to the same holding
    assert len(w["holdings"]) == 1 and w["holdings"][0]["invested_rupees"] == 1000
    assert next(b for b in client.get("/badges", headers=H).json() if b["code"] == "first_trade")["unlocked"]


def test_fast_forward_replays_history_and_patient_investor(client, px):
    client.post("/wallet/buy", json={"ticker": "RELIANCE.NS", "rupees": 1000}, headers=H)
    w = client.post("/wallet/fast-forward", headers=H).json()
    h = w["holdings"][0]
    assert w["sim_date"] == weekdays(30)[-16].isoformat() and w["sim_days_forwarded"] == 7
    assert h["held_days"] == 7 and h["current_value"] == round(1000 / 1009 * 1014, 2) and h["gain_loss_rupees"] > 0
    assert "patient_investor" in {b["code"] for b in client.get("/badges", headers=H).json() if b["unlocked"]}
    for _ in range(3):
        w = client.post("/wallet/fast-forward", headers=H).json()
    assert w["sim_date"] == "2026-11-20" and not w["can_fast_forward"]
    r = client.post("/wallet/fast-forward", headers=H)
    assert r.status_code == 409 and r.json()["detail"] == "You are already at today's prices."


def test_sell_and_reset(client, px):
    client.post("/wallet/buy", json={"ticker": "TCS.NS", "rupees": 1000}, headers=H)
    client.post("/wallet/fast-forward", headers=H)
    w = client.post("/wallet/sell", json={"ticker": "TCS.NS"}, headers=H).json()
    assert w["holdings"] == [] and w["cash"] > 10000                      # TCS rose ₹5 in 5 days
    assert client.post("/wallet/sell", json={"ticker": "TCS.NS"}, headers=H).status_code == 404
    client.post("/wallet/buy", json={"ticker": "ITC.NS", "rupees": 300}, headers=H)
    w = client.post("/wallet/reset", headers=H).json()
    assert w["cash"] == 10000 and w["holdings"] == [] and w["sim_days_forwarded"] == 0
    assert w["sim_date"] == weekdays(30)[-21].isoformat()


def test_price_cache_15_minutes(client, px, mem):
    client.get("/companies")
    client.get("/companies")
    assert px.calls == ["1y"]                                               # first fill, then cached


def test_stale_cache_refreshes_in_background(client, px, mem):
    client.get("/companies")
    old = "2020-01-01T00:00:00+00:00"
    for r in mem.select("price_cache"):
        mem.update("price_cache", {"ticker": r["ticker"], "date": r["date"]}, {"fetched_at": old})
    prices._last_attempt = None
    client.get("/companies")
    import time
    for _ in range(50):
        if len(px.calls) == 2:
            break
        time.sleep(0.02)
    assert px.calls == ["1y", "1mo"]


def test_no_prices_means_unavailable_not_fake(client):
    prices.set_price_source(FakePrices(fail=True))
    try:
        rel = client.get("/companies/reliance").json()
        assert rel["price_available"] is False and rel["current_price"] == 0 and rel["history"] == []
        r = client.post("/wallet/buy", json={"ticker": "RELIANCE.NS", "rupees": 500}, headers=H)
        assert r.status_code == 503
        assert client.post("/wallet/fast-forward", headers=H).status_code == 503
    finally:
        prices.set_price_source(None)


def test_yahoo_down_uses_last_cached_prices(client, px, mem):
    client.get("/companies")
    prices.set_price_source(FakePrices(fail=True))
    for r in mem.select("price_cache"):
        mem.update("price_cache", {"ticker": r["ticker"], "date": r["date"]}, {"fetched_at": "2020-01-01T00:00:00+00:00"})
    rel = client.get("/companies/reliance").json()
    assert rel["price_available"] and rel["current_price"] == 1029 and rel["price_date"] == "2026-11-20"
