"""Loads a SEBI registered-intermediaries CSV into sebi_entities.

    cd backend && python -m scripts.load_sebi_csv path/to/sebi.csv

Columns: registration_no,name,category,valid_from,valid_to (header names are matched
case-insensitively; spaces → underscores; extra columns are ignored). The admin Data screen
uses the same parser (POST /admin/sebi/upload).
"""
import csv
import io
import sys
from datetime import datetime, timezone
from pathlib import Path

REQUIRED = ("registration_no", "name")
ALIASES = {"registration_number": "registration_no", "reg_no": "registration_no", "registration no": "registration_no",
           "entity_name": "name", "intermediary_name": "name"}


def parse_text(text: str, source_file: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    cols = {}
    for c in reader.fieldnames or []:
        key = c.strip().lower()
        key = ALIASES.get(key, key).replace(" ", "_")
        cols[ALIASES.get(key, key)] = c
    missing = [c for c in REQUIRED if c not in cols]
    if missing:
        raise ValueError(f"CSV is missing columns: {', '.join(missing)}")
    rows, seen = [], set()
    for r in reader:
        def get(k):
            return (r.get(cols[k]) or "").strip() if k in cols else ""
        reg, name = get("registration_no").upper(), get("name")
        if not reg or not name or reg in seen:
            continue
        seen.add(reg)
        rows.append({"registration_no": reg, "name": name, "category": get("category") or None,
                     "valid_from": _date(get("valid_from")), "valid_to": _date(get("valid_to")),
                     "source_file": source_file})
    return rows


def _date(v: str) -> str | None:
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%b %d, %Y", "%d %b %Y"):
        try:
            return datetime.strptime(v, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    from core.store import get_store

    path = Path(sys.argv[1])
    rows = parse_text(path.read_text(encoding="utf-8-sig"), path.name)
    started = datetime.now(timezone.utc).isoformat()
    for r in rows:
        r["loaded_at"] = started
    store = get_store()
    store.upsert("sebi_entities", rows)
    removed = store.delete_older("sebi_entities", "loaded_at", started)
    print(f"Loaded {len(rows)} SEBI entities into the {store.name} store ({removed} old rows removed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
