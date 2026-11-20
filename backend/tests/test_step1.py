import re

from core import seed
from core.config import LANGUAGES
from core.store import MemoryStore


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["store"] == "memory"
    assert body["database"] == "ok"
    assert body["llm"] == "not_configured"
    assert body["seed_counts"] == {"scam_rules": 20, "companies": 20, "drills": 12, "lessons": 11, "alerts": 1,
                                   "sebi_entities": 0}
    assert body["prices"] == {"rows": 0, "last_fetched": None}


def test_cors_allows_vercel_origin(client):
    r = client.options("/health", headers={
        "Origin": "https://trusttrade.vercel.app", "Access-Control-Request-Method": "GET"})
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "https://trusttrade.vercel.app"


def test_cors_blocks_unknown_origin(client):
    r = client.options("/health", headers={
        "Origin": "https://evil.example.com", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in r.headers


def test_scam_rules_seed_matches_prd():
    rules = seed.scam_rules()
    assert len(rules) == 20
    assert sum(r["is_always_scam"] for r in rules) == 4  # 16 signs + 4 always-a-scam
    assert {r["weight"] for r in rules} <= {2.0, 1.0, 0.5}
    for r in rules:
        if r["pattern"]:
            re.compile(r["pattern"], re.IGNORECASE)  # every pattern must be a valid regex


def test_companies_seed():
    rows = seed.companies()
    assert len(rows) == 20
    for c in rows:
        assert c["ticker"].endswith(".NS")
        assert re.fullmatch(r"#[0-9A-F]{6}", c["tile_colour"])
        assert set(c["translations"]["description"]) == set(LANGUAGES)


def test_drills_seed():
    rows = seed.drills()
    assert len(rows) == 12
    assert sum(d["is_scam"] for d in rows) == 8
    for d in rows:
        assert set(d["translations"]["message"]) == set(LANGUAGES)
        assert len(d["translations"]["tricks"]) >= 1


def test_badges_seed_has_8_and_no_user_state():
    badges = seed.badge_definitions()
    assert len(badges) == 8
    assert all("unlocked" not in b for b in badges)


def test_memory_store_crud():
    s = MemoryStore(load_seed=False)
    row = s.insert("reports", {"reason": "x", "status": "open"})
    assert row["id"] and row["created_at"]
    assert s.update("reports", {"id": row["id"]}, {"status": "dismissed"}) == 1
    assert s.select("reports", {"status": "dismissed"})[0]["reason"] == "x"
    assert s.delete("reports", {"id": row["id"]}) == 1
    assert s.count("reports") == 0
