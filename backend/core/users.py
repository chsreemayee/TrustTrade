from core.store import Store


def ensure_user(store: Store, user_id: str) -> None:
    """Anonymous users exist as a row so foreign keys hold (PRD 10)."""
    if not store.select("users", {"id": user_id}):
        store.upsert("users", [{"id": user_id}])
