from fastapi import APIRouter

from core.config import get_settings
from core.store import get_store

router = APIRouter(tags=["health"])
VERSION = "0.1.0"


@router.get("/health")
def health() -> dict:
    """Liveness + what is connected. Never raises; never reveals key values."""
    s = get_settings()
    store = get_store()
    try:
        db_ok = store.ping()
        counts = {t: store.count(t) for t in ("scam_rules", "companies", "drills", "lessons", "alerts", "sebi_entities")}
        price_rows = store.count("price_cache")
        price_fetched = store.max_value("price_cache", "fetched_at") if price_rows else None
    except Exception:  # noqa: BLE001
        db_ok, counts, price_rows, price_fetched = False, {}, 0, None
    return {
        "status": "ok",
        "version": VERSION,
        "store": store.name,
        "database": "ok" if db_ok else "unreachable",
        "llm": "configured" if s.gemini_configured else "not_configured",
        "seed_counts": counts,
        "prices": {"rows": price_rows, "last_fetched": price_fetched},
    }
