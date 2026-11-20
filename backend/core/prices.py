"""Daily prices for the 20 practice companies (PRD 7.2): yfinance (NSE .NS tickers), cached in
price_cache for 15 minutes. If Yahoo can't be reached the last cached prices are used, with their
date; if there are none, prices are reported as unavailable. Prices are never made up.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import Protocol

from core.config import get_settings
from core.store import Store

log = logging.getLogger("trusttrade.prices")
CACHE_MINUTES = 15


class PriceSource(Protocol):
    def history(self, tickers: list[str], period: str) -> dict[str, list[dict]]: ...


class YFinanceSource:
    def history(self, tickers, period):
        import yfinance as yf  # lazy: heavy import, and tests never need it

        df = yf.download(tickers, period=period, interval="1d", group_by="ticker", auto_adjust=False,
                         progress=False, threads=True, timeout=20)
        out: dict[str, list[dict]] = {}
        for t in tickers:
            try:
                sub = df[t] if len(tickers) > 1 else df
                sub = sub.dropna(subset=["Close"])
            except Exception:  # noqa: BLE001 - ticker missing from the download
                continue
            out[t] = [{"date": idx.date().isoformat(), "open": _f(r["Open"]), "high": _f(r["High"]),
                       "low": _f(r["Low"]), "close": _f(r["Close"]), "volume": int(r["Volume"] or 0)}
                      for idx, r in sub.iterrows()]
        return {t: rows for t, rows in out.items() if rows}


def _f(v) -> float:
    return round(float(v), 2)


_source: PriceSource | None = None
_source_set = False
_lock = threading.Lock()
_refreshing = threading.Event()
_last_attempt: datetime | None = None


def set_price_source(src: PriceSource | None) -> None:
    """Test hook."""
    global _source, _source_set, _last_attempt
    _source, _source_set, _last_attempt = src, True, None
    _series_memo.clear()


def get_price_source() -> PriceSource | None:
    if _source_set:
        return _source
    return YFinanceSource() if get_settings().price_source == "yfinance" else None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def last_fetched(store: Store) -> datetime | None:
    v = store.max_value("price_cache", "fetched_at")
    return datetime.fromisoformat(str(v).replace("Z", "+00:00")) if v else None


def refresh(store: Store, tickers: list[str], period: str = "1mo") -> int:
    """Fetch and upsert bars. Returns rows written; 0 on any failure (cache kept as is)."""
    src = get_price_source()
    if src is None:
        return 0
    try:
        data = src.history(tickers, period)
    except Exception as e:  # noqa: BLE001
        log.warning("Price fetch failed: %s", type(e).__name__)
        return 0
    now = _now().isoformat()
    rows = [{"ticker": t, **bar, "fetched_at": now} for t, bars in data.items() for bar in bars]
    if rows:
        store.upsert("price_cache", rows)
        _series_memo.clear()
    log.info("Price refresh (%s): %d bars for %d tickers", period, len(rows), len(data))
    return len(rows)


def ensure_fresh(store: Store, tickers: list[str], background: bool = True) -> None:
    """15-minute cache. Empty cache → fetch a year now. Stale → refresh in the background
    (serve cached prices meanwhile). Failed attempts are retried at most every 15 minutes."""
    global _last_attempt
    if get_price_source() is None:
        return
    now = _now()
    fetched = last_fetched(store)
    if fetched and now - fetched < timedelta(minutes=CACHE_MINUTES):
        return
    if _last_attempt and now - _last_attempt < timedelta(minutes=CACHE_MINUTES):
        return
    if fetched is None or not background:
        with _lock:
            _last_attempt = now
            refresh(store, tickers, "1y" if fetched is None else "1mo")
        return
    if _refreshing.is_set():
        return

    def run():
        global _last_attempt
        _refreshing.set()
        try:
            with _lock:
                _last_attempt = _now()
                refresh(store, tickers, "1mo")
        finally:
            _refreshing.clear()
    threading.Thread(target=run, daemon=True).start()


def series(store: Store, ticker: str) -> list[dict]:
    return sorted(store.select("price_cache", {"ticker": ticker}), key=lambda r: str(r["date"]))


_series_memo: dict[int, tuple[float, dict]] = {}
SERIES_MEMO_S = 60   # ~5,000 rows; don't re-read them from Supabase on every request


def all_series(store: Store) -> dict[str, list[dict]]:
    import time

    hit = _series_memo.get(id(store))
    if hit and time.monotonic() - hit[0] < SERIES_MEMO_S:
        return hit[1]
    out: dict[str, list[dict]] = {}
    for r in store.select("price_cache"):
        out.setdefault(r["ticker"], []).append(r)
    result = {t: sorted(v, key=lambda r: str(r["date"])) for t, v in out.items()}
    _series_memo[id(store)] = (time.monotonic(), result)
    return result
