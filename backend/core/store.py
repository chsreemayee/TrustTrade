"""Data access. One small interface, two backends:

* SupabaseStore: Supabase Postgres (production), using the service-role key.
* MemoryStore: in-process copy of the seed data, used when Supabase isn't configured
  (local dev, tests). Writes are lost on restart.

Routers only call get_store(), so the backend in use is a config choice, not a code change.
"""
from __future__ import annotations

import copy
import logging
import threading
import uuid
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Protocol

from core import seed
from core.config import get_settings

log = logging.getLogger("trusttrade.store")

PRIMARY_KEYS: dict[str, tuple[str, ...]] = {
    "users": ("id",), "scam_checks": ("id",), "scam_rules": ("code",),
    "sebi_entities": ("registration_no",), "reports": ("id",), "lessons": ("id",),
    "lesson_progress": ("user_id", "lesson_id", "completed_at"), "drills": ("id",),
    "drill_attempts": ("id",), "companies": ("ticker",), "price_cache": ("ticker", "date"),
    "wallets": ("user_id",), "trades": ("id",), "badges_earned": ("user_id", "badge_code"),
    "alerts": ("id",),
}
TABLES = tuple(PRIMARY_KEYS)


class Store(Protocol):
    name: str

    def select(self, table: str, filters: dict[str, Any] | None = None) -> list[dict]: ...
    def insert(self, table: str, row: dict) -> dict: ...
    def upsert(self, table: str, rows: list[dict]) -> int: ...
    def update(self, table: str, filters: dict[str, Any], values: dict) -> int: ...
    def delete(self, table: str, filters: dict[str, Any]) -> int: ...
    def count(self, table: str) -> int: ...
    def select_ieq(self, table: str, column: str, value: str) -> list[dict]: ...
    def max_value(self, table: str, column: str) -> Any: ...
    def delete_older(self, table: str, column: str, before: str) -> int: ...
    def ping(self) -> bool: ...


class MemoryStore:
    name = "memory"

    def __init__(self, load_seed: bool = True):
        self._lock = threading.RLock()
        self._tables: dict[str, dict[tuple, dict]] = {t: {} for t in TABLES}
        if load_seed:
            for table, rows in seed.all_seed_rows().items():
                self.upsert(table, rows)

    def _key(self, table: str, row: dict) -> tuple:
        return tuple(row.get(k) for k in PRIMARY_KEYS[table])

    @staticmethod
    def _match(row: dict, filters: dict[str, Any] | None) -> bool:
        return all(row.get(k) == v for k, v in (filters or {}).items())

    def _with_defaults(self, table: str, row: dict) -> dict:
        row = dict(row)
        if PRIMARY_KEYS[table] == ("id",) and not row.get("id"):
            row["id"] = str(uuid.uuid4())
        for col, tables in _DEFAULT_TS.items():
            if table in tables and not row.get(col):
                row[col] = datetime.now(timezone.utc).isoformat()
        return row

    def select(self, table, filters=None):
        with self._lock:
            return [copy.deepcopy(r) for r in self._tables[table].values() if self._match(r, filters)]

    def insert(self, table, row):
        with self._lock:
            row = self._with_defaults(table, row)
            if table == "scam_checks" and not row.get("delete_after"):   # mirrors the SQL default
                row["delete_after"] = (datetime.fromisoformat(row["created_at"]) + timedelta(days=30)).isoformat()
            self._tables[table][self._key(table, row)] = copy.deepcopy(row)
            return copy.deepcopy(row)

    def upsert(self, table, rows):
        with self._lock:
            for row in rows:
                row = self._with_defaults(table, row)
                key = self._key(table, row)
                merged = {**self._tables[table].get(key, {}), **copy.deepcopy(row)}
                self._tables[table][key] = merged
            return len(rows)

    def update(self, table, filters, values):
        with self._lock:
            n = 0
            for r in self._tables[table].values():
                if self._match(r, filters):
                    r.update(copy.deepcopy(values))
                    n += 1
            return n

    def delete(self, table, filters):
        with self._lock:
            keys = [k for k, r in self._tables[table].items() if self._match(r, filters)]
            for k in keys:
                del self._tables[table][k]
            return len(keys)

    def count(self, table):
        with self._lock:
            return len(self._tables[table])

    def delete_older(self, table, column, before):
        """Delete rows whose `column` (ISO date/time string) is earlier than `before`."""
        with self._lock:
            keys = [k for k, r in self._tables[table].items() if r.get(column) and str(r[column]) < before]
            for k in keys:
                del self._tables[table][k]
            return len(keys)

    def max_value(self, table, column):
        with self._lock:
            vals = [r.get(column) for r in self._tables[table].values() if r.get(column) is not None]
            return max(vals) if vals else None

    def select_ieq(self, table, column, value):
        """Case-insensitive equality (used for SEBI name lookups)."""
        v = (value or "").strip().casefold()
        with self._lock:
            return [copy.deepcopy(r) for r in self._tables[table].values()
                    if str(r.get(column) or "").strip().casefold() == v]

    def ping(self):
        return True


_DEFAULT_TS = {
    "created_at": ("users", "scam_checks", "reports", "drill_attempts", "trades", "scam_rules"),
    "loaded_at": ("sebi_entities",),
    "fetched_at": ("price_cache",),
    "earned_at": ("badges_earned",),
    "completed_at": ("lesson_progress",),
}


class SupabaseStore:
    name = "supabase"

    def __init__(self, url: str, key: str):
        from supabase import create_client  # imported lazily so tests don't need network

        self._client = create_client(url, key)

    def _q(self, table: str):
        return self._client.table(table)

    @staticmethod
    def _apply(query, filters):
        for k, v in (filters or {}).items():
            query = query.is_(k, "null") if v is None else query.eq(k, v)
        return query

    def select(self, table, filters=None):
        rows: list[dict] = []
        page = 1000
        start = 0
        while True:  # PostgREST caps responses, so page through
            res = self._apply(self._q(table).select("*"), filters).range(start, start + page - 1).execute()
            rows.extend(res.data or [])
            if len(res.data or []) < page:
                return rows
            start += page

    def insert(self, table, row):
        res = self._q(table).insert(row).execute()
        return (res.data or [row])[0]

    def upsert(self, table, rows):
        if not rows:
            return 0
        on_conflict = ",".join(PRIMARY_KEYS[table])
        for i in range(0, len(rows), 500):
            self._q(table).upsert(rows[i:i + 500], on_conflict=on_conflict).execute()
        return len(rows)

    def update(self, table, filters, values):
        res = self._apply(self._q(table).update(values), filters).execute()
        return len(res.data or [])

    def delete(self, table, filters):
        res = self._apply(self._q(table).delete(), filters).execute()
        return len(res.data or [])

    def count(self, table):
        res = self._q(table).select("*", count="exact", head=True).execute()
        return res.count or 0

    def delete_older(self, table, column, before):
        res = self._q(table).delete().lt(column, before).execute()
        return len(res.data or [])

    def max_value(self, table, column):
        res = self._q(table).select(column).order(column, desc=True).limit(1).execute()
        return (res.data or [{}])[0].get(column)

    def select_ieq(self, table, column, value):
        # ilike without wildcards = case-insensitive equality; escape LIKE metacharacters.
        safe = (value or "").strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        return self._q(table).select("*").ilike(column, safe).limit(50).execute().data or []

    def ping(self):
        try:
            self._q("scam_rules").select("code").limit(1).execute()
            return True
        except Exception as e:  # noqa: BLE001 - health check must never raise
            log.warning("Supabase ping failed: %s", type(e).__name__)
            return False


@lru_cache
def get_store() -> Store:
    s = get_settings()
    mode = s.store_backend
    if mode == "supabase" or (mode == "auto" and s.supabase_configured):
        log.info("Using Supabase store")
        return SupabaseStore(s.supabase_url, s.supabase_key)
    log.info("Using in-memory store (Supabase not configured)")
    return MemoryStore()
