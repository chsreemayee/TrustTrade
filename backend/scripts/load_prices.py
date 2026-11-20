"""Loads 1 year of daily prices for the 20 practice companies into price_cache.

    cd backend && python -m scripts.load_prices

Use this from your own computer if Yahoo Finance blocks the Render server: the backend then
serves these stored prices (with their date) and refreshes when Yahoo is reachable again.
"""
import sys

from core import prices
from core.store import get_store


def main() -> int:
    store = get_store()
    tickers = [c["ticker"] for c in store.select("companies")]
    if not tickers:
        print("No companies in the database yet: start the backend once so it seeds them.")
        return 1
    n = prices.refresh(store, tickers, "1y")
    print(f"Wrote {n} daily price rows for {len(tickers)} companies to the {store.name} store")
    return 0 if n else 1


if __name__ == "__main__":
    sys.exit(main())
