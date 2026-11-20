"""Startup jobs: seed empty tables, ensure the admin account, warm the price cache, and
delete Scam Check text older than 30 days (PRD 11) every 6 hours. Each job is fail-safe."""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone

from core import prices, seed
from core.config import get_settings
from core.store import Store, get_store

log = logging.getLogger("trusttrade.bootstrap")
PURGE_EVERY_S = 6 * 3600
_stop = threading.Event()


def seed_empty_tables(store: Store) -> dict[str, int]:
    """Only tables that are empty get seed rows, so admin edits are never overwritten."""
    done = {}
    for table, (_, build) in seed.SEEDED_TABLES.items():
        try:
            if store.count(table) == 0:
                done[table] = store.upsert(table, build())
        except Exception as e:  # noqa: BLE001
            log.warning("Seeding %s failed: %s (did you run supabase/schema.sql?)", table, type(e).__name__)
    if done:
        log.info("Seeded empty tables: %s", done)
    return done


def ensure_supabase_admin() -> str:
    """Create the one Content Admin (PRD 8) in Supabase Auth with app_metadata.role = admin."""
    s = get_settings()
    if not (s.supabase_configured and s.admin_email and s.admin_password):
        return "skipped"
    try:
        from supabase import create_client

        client = create_client(s.supabase_url, s.supabase_key)
        email = s.admin_email.strip().lower()
        page = 1
        while True:
            users = client.auth.admin.list_users(page=page, per_page=200)
            match = next((u for u in users if (u.email or "").lower() == email), None)
            if match or len(users) < 200:
                break
            page += 1
        if match:
            if (match.app_metadata or {}).get("role") != "admin":
                client.auth.admin.update_user_by_id(match.id, {"app_metadata": {"role": "admin"}})
                return "role_set"
            return "exists"
        client.auth.admin.create_user({"email": email, "password": s.admin_password, "email_confirm": True,
                                       "app_metadata": {"role": "admin"}})
        return "created"
    except Exception as e:  # noqa: BLE001
        log.warning("Could not ensure admin user: %s", type(e).__name__)
        return "failed"


def purge_expired(store: Store) -> int:
    try:
        n = store.delete_older("scam_checks", "delete_after", datetime.now(timezone.utc).isoformat())
        if n:
            log.info("Deleted %d scam checks older than 30 days", n)
        return n
    except Exception as e:  # noqa: BLE001
        log.warning("Purge failed: %s", type(e).__name__)
        return 0


def _background(store: Store) -> None:
    try:
        tickers = [c["ticker"] for c in store.select("companies")]
        if tickers:
            prices.ensure_fresh(store, tickers, background=False)
    except Exception as e:  # noqa: BLE001
        log.warning("Price warm-up failed: %s", type(e).__name__)
    while not _stop.is_set():
        purge_expired(store)
        _stop.wait(PURGE_EVERY_S)


def startup() -> None:
    s = get_settings()
    store = get_store()
    if s.auto_seed:
        seed_empty_tables(store)
        log.info("Admin account: %s", ensure_supabase_admin())
    threading.Thread(target=_background, args=(store,), daemon=True, name="trusttrade-bg").start()


def shutdown() -> None:
    _stop.set()
