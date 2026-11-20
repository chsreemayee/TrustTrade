"""Upserts all seed data into Supabase (idempotent: safe to run again).

    cd backend && python -m scripts.seed_supabase

Run supabase/schema.sql in the Supabase SQL editor first.
"""
import sys

from core import seed
from core.config import get_settings
from core.store import SupabaseStore


def main() -> int:
    s = get_settings()
    if not s.supabase_configured:
        print("SUPABASE_URL and SUPABASE_KEY must be set in backend/.env")
        return 1
    store = SupabaseStore(s.supabase_url, s.supabase_key)
    for table, rows in seed.all_seed_rows().items():
        n = store.upsert(table, rows)
        print(f"{table:<14} {n:>4} rows upserted ({store.count(table)} in table)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
