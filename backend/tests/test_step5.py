"""Step 5: admin endpoints — protected, mock shapes, rules applied at once, privacy."""
import json
import time
from pathlib import Path

import pytest

from core import auth, bootstrap, seed
from tests.conftest import uid_headers

ADMIN = {"email": "admin@test.local", "password": "correct horse battery staple"}
MOCK_RULE_KEYS = {"id", "code", "pattern", "languages", "weight", "is_always_scam", "lesson_id", "active"}


@pytest.fixture(autouse=True)
def _limits():
    auth.reset_rate_limits()


@pytest.fixture
def ah(client):
    r = client.post("/admin/login", json=ADMIN)
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------------------------------------------------------------- protection

def _admin_routes():
    import re
    from main import app
    for path, ops in app.openapi()["paths"].items():
        if path.startswith("/admin") and path != "/admin/login":
            for method in ops:
                yield method.upper(), re.sub(r"\{[^}]+\}", "X", path)


def test_every_admin_route_needs_a_valid_token(client):
    routes = list(_admin_routes())
    assert len(routes) >= 16
    forged, _ = auth.create_token("admin@test.local")
    body, sig = forged.split(".")[1:]
    tampered = f"v1.{body[:-2]}xx.{sig}"
    for method, path in routes:
        for headers in ({}, {"Authorization": "Bearer nonsense"}, {"Authorization": f"Bearer {tampered}"},
                        {"Authorization": "Basic YWRtaW46YWRtaW4="}):
            r = client.request(method, path, headers=headers, json={})
            assert r.status_code == 401, (method, path, headers, r.status_code)


def test_expired_token_rejected(client):
    old, _ = auth.create_token("admin@test.local", now=time.time() - 9 * 3600)
    assert client.get("/admin/stats", headers={"Authorization": f"Bearer {old}"}).status_code == 401


def test_login(client):
    assert client.post("/admin/login", json={**ADMIN, "password": "wrong"}).status_code == 401
    assert client.post("/admin/login", json={"email": "someone@else.com", "password": ADMIN["password"]}).status_code == 401
    r = client.post("/admin/login", json={**ADMIN, "email": "ADMIN@test.local"})
    assert r.status_code == 200 and r.json()["token"].startswith("v1.")
    assert client.get("/admin/me", headers={"Authorization": f"Bearer {r.json()['token']}"}).json()["email"] == "admin@test.local"


def test_login_rate_limited(client):
    for _ in range(10):
        client.post("/admin/login", json={**ADMIN, "password": "nope"})
    assert client.post("/admin/login", json=ADMIN).status_code == 429


def test_no_admin_configured_means_no_login(client, monkeypatch):
    from core.config import get_settings
    monkeypatch.setattr(get_settings(), "admin_password", "")
    assert client.post("/admin/login", json=ADMIN).status_code == 401


# ---------------------------------------------------------------- scam rules (the demo: admin adds a phrase)

def test_rules_shape(client, ah):
    rules = client.get("/admin/rules", headers=ah).json()
    assert len(rules) == 20 and all(set(r) == MOCK_RULE_KEYS for r in rules)


def test_admin_adds_phrase_and_same_tip_now_shows_it(client, ah):
    tip = {"type": "text", "text": "Exclusive pre-launch scheme for our SHG, join quickly"}
    before = client.post("/scam-check", json=tip).json()
    rule = {"code": "PRE_LAUNCH", "pattern": "pre-launch scheme|ప్రీ-లాంచ్", "languages": ["en", "te"], "weight": 2,
            "is_always_scam": False, "lesson_id": "scam_guaranteed_returns", "active": True}
    rules = client.post("/admin/rules", json=rule, headers=ah).json()
    assert rules[0]["code"] == "PRE_LAUNCH" and set(rules[0]) == MOCK_RULE_KEYS
    after = client.post("/scam-check", json=tip).json()
    assert "PRE_LAUNCH" not in {s["code"] for s in before["signs"]}
    assert "PRE_LAUNCH" in {s["code"] for s in after["signs"]} and after["score"] == before["score"] + 2


@pytest.mark.parametrize("bad,status", [
    ({"pattern": "(unclosed"}, 422), ({"pattern": "a|"}, 422), ({"pattern": ""}, 422),
    ({"weight": 3}, 422), ({"code": "lower"}, 422), ({"languages": ["fr"]}, 422),
    ({"lesson_id": "no_such_lesson"}, 422), ({"code": "GUARANTEED_RETURN"}, 409),
])
def test_rule_validation(client, ah, bad, status):
    rule = {"code": "NEW_RULE", "pattern": "free gift", "languages": ["en"], "weight": 1,
            "is_always_scam": False, "lesson_id": "", "active": True, **bad}
    assert client.post("/admin/rules", json=rule, headers=ah).status_code == status


def test_deactivate_rule_applies_at_once(client, ah):
    tip = {"type": "text", "text": "Only today, last chance to join"}
    assert "URGENCY" in {s["code"] for s in client.post("/scam-check", json=tip).json()["signs"]}
    rid = next(r["id"] for r in client.get("/admin/rules", headers=ah).json() if r["code"] == "URGENCY")
    rules = client.put(f"/admin/rules/{rid}", json={"active": False}, headers=ah).json()
    assert not next(r for r in rules if r["code"] == "URGENCY")["active"]
    assert "URGENCY" not in {s["code"] for s in client.post("/scam-check", json=tip).json()["signs"]}
    assert client.put(f"/admin/rules/{rid}", json={"weight": 5}, headers=ah).status_code == 422
    assert client.put("/admin/rules/nope", json={"active": True}, headers=ah).status_code == 404


# ---------------------------------------------------------------- reports + review queue

def test_report_and_review_queue(client, ah):
    H = uid_headers()
    chk = client.post("/scam-check", json={"type": "text", "text": "Assured 20% monthly"}, headers=H).json()
    assert client.post("/reports", json={"text": "Call Rahul on +91 98765 43210 or 9876543210, mail r@x.com",
                                         "reason": "This was wrong", "check_id": chk["check_id"]}, headers=H).json() is True
    q = client.get("/admin/reviews", headers=ah).json()
    item = q[0]
    assert set(item) == {"id", "check_id", "reported_text", "reason", "status", "timestamp"}
    assert item["check_id"] == chk["check_id"] and item["status"] == "open"
    assert "98765" not in item["reported_text"] and "9876543210" not in item["reported_text"]
    assert "r@x.com" not in item["reported_text"] and "[number hidden]" in item["reported_text"]
    q = client.patch(f"/admin/reviews/{item['id']}", json={"status": "approved"}, headers=ah).json()
    assert q[0]["status"] == "approved"
    assert client.patch("/admin/reviews/nope", json={"status": "approved"}, headers=ah).status_code == 404
    assert next(b for b in client.get("/badges", headers=H).json() if b["code"] == "protector")["unlocked"]


def test_report_with_unknown_check_id(client):
    assert client.post("/reports", json={"text": "x", "reason": "y", "check_id": "chk-user-123"}).json() is True


# ---------------------------------------------------------------- stats, export, SEBI

def test_stats_shape_and_counts(client, ah):
    H = uid_headers()
    client.post("/scam-check", json={"type": "text", "text": "Send ₹5,000 and get ₹10,000 back"}, headers=H)
    d = client.get("/drills").json()[0]
    client.post(f"/drills/{d['id']}/answer", json={"answer": "scam"}, headers=H)
    s = client.get("/admin/stats", headers=ah).json()
    assert set(s) == {"total_checks", "scams_caught", "active_learners", "drills_played", "sebi_records_count", "sebi_last_refresh"}
    assert (s["total_checks"], s["scams_caught"], s["active_learners"], s["drills_played"]) == (1, 1, 1, 1)
    assert s["sebi_records_count"] == 0 and s["sebi_last_refresh"] == "Never"


def test_export_has_no_personal_data(client, ah):
    client.post("/scam-check", json={"type": "text", "text": "pay rahulprofits@ybl"}, headers=uid_headers())
    r = client.get("/admin/export.csv", headers=ah)
    assert r.headers["content-type"].startswith("text/csv")
    assert "rahul" not in r.text and "anon_" not in r.text and r.text.startswith("date,checks")


def test_sebi_upload_then_lookup(client, ah):
    csv_text = "Registration No,Name,Category,Valid From,Valid To\nINA000012345,Test Adviser,IA,01-01-2024,31-12-2028\n"
    r = client.post("/admin/sebi/upload", content=csv_text.encode(), headers={**ah, "Content-Type": "text/csv"})
    assert r.status_code == 200 and r.json()["rows_loaded"] == 1 and r.json()["count"] == 1
    chk = client.post("/scam-check", json={"type": "text", "text": "We are SEBI registered, Reg No INA000012345"}).json()
    sebi = next(c for c in chk["checks"] if c["name"] == "SEBI registered intermediary")
    assert sebi["status"] == "found"
    # a new upload replaces the list
    client.post("/admin/sebi/upload", content=b"registration_no,name\nINH000000001,Other RA\n", headers={**ah, "Content-Type": "text/csv"})
    assert client.get("/admin/sebi", headers=ah).json()["count"] == 1
    bad = client.post("/admin/sebi/upload", content=b"foo,bar\n1,2\n", headers={**ah, "Content-Type": "text/csv"})
    assert bad.status_code == 422


# ---------------------------------------------------------------- alerts, drills, lessons

def test_alert_edit_and_schedule(client, ah):
    body = {"title": {"en": "New alert"}, "body": {"en": "Do not pay fees."}, "active": True}
    client.put("/admin/alerts/alert-2", json=body, headers=ah)
    assert "alert-2" in {a["id"] for a in client.get("/alerts").json()}
    client.put("/admin/alerts/alert-2", json={**body, "ends": "2020-01-01T00:00:00Z"}, headers=ah)
    assert "alert-2" not in {a["id"] for a in client.get("/alerts").json()}       # expired → hidden on Home
    assert client.put("/admin/alerts/x", json={"title": {}, "body": {}}, headers=ah).status_code == 422


def test_drill_edit_rules(client, ah):
    d = client.get("/drills").json()[0]
    assert client.put(f"/admin/drills/{d['id']}", json={**d, "tricks": []}, headers=ah).status_code == 422
    assert client.put(f"/admin/drills/{d['id']}", json={**d, "correct_answer": "maybe"}, headers=ah).status_code == 422
    client.put(f"/admin/drills/{d['id']}", json={**d, "status": "draft"}, headers=ah)
    assert d["id"] not in {x["id"] for x in client.get("/drills").json()}
    client.put(f"/admin/drills/{d['id']}", json={**d, "status": "published"}, headers=ah)
    assert client.get("/drills").json() and d in client.get("/drills").json()


def test_lesson_edit_and_draft(client, ah):
    l = client.get("/lessons/lesson_2").json()
    l["title"]["en"] = "What is a share?"
    client.put("/admin/lessons/lesson_2", json=l, headers=ah)
    assert client.get("/lessons/lesson_2").json()["title"]["en"] == "What is a share?"
    client.put("/admin/lessons/lesson_2", json={**l, "status": "draft"}, headers=ah)
    assert client.get("/lessons/lesson_2").status_code == 404
    lessons = client.get("/admin/lessons", headers=ah).json()
    assert next(x for x in lessons if x["id"] == "lesson_2")["status"] == "draft"


# ---------------------------------------------------------------- privacy jobs + seeding

def test_purge_deletes_checks_after_30_days(client, mem):
    client.post("/scam-check", json={"type": "text", "text": "Assured 20% monthly"})
    row = mem.select("scam_checks")[0]
    assert row["delete_after"] > row["created_at"]
    assert bootstrap.purge_expired(mem) == 0
    mem.update("scam_checks", {"id": row["id"]}, {"delete_after": "2020-01-01T00:00:00+00:00"})
    assert bootstrap.purge_expired(mem) == 1 and mem.count("scam_checks") == 0


def test_seed_never_overwrites_admin_edits(mem):
    mem.update("scam_rules", {"code": "URGENCY"}, {"weight": 0.5})
    assert bootstrap.seed_empty_tables(mem) == {}
    assert mem.select("scam_rules", {"code": "URGENCY"})[0]["weight"] == 0.5
    mem.delete("drills", {})
    assert bootstrap.seed_empty_tables(mem) == {"drills": 12}


# ---------------------------------------------------------------- Supabase login path (fake client)

class _User:
    def __init__(self, role):
        self.app_metadata = {"role": role} if role else {}


class _FakeAuth:
    def __init__(self, users):
        self.users = users

    def sign_in_with_password(self, creds):
        role = self.users.get((creds["email"], creds["password"]), "missing")
        if role == "missing":
            raise RuntimeError("Invalid login credentials")
        return type("R", (), {"user": _User(role)})()


@pytest.mark.parametrize("email,password,ok", [
    ("admin@trusttrade.in", "pw", True),          # Supabase user with app_metadata.role = admin
    ("learner@trusttrade.in", "pw", False),       # valid Supabase user, but not an admin
    ("admin@trusttrade.in", "wrong", False),      # wrong password
])
def test_supabase_login_requires_admin_role(client, monkeypatch, email, password, ok):
    import supabase
    from core.config import get_settings
    users = {("admin@trusttrade.in", "pw"): "admin", ("learner@trusttrade.in", "pw"): None}
    monkeypatch.setattr(get_settings(), "supabase_url", "https://x.supabase.co")
    monkeypatch.setattr(get_settings(), "supabase_key", "service-key")
    monkeypatch.setattr(supabase, "create_client", lambda url, key: type("C", (), {"auth": _FakeAuth(users)})())
    r = client.post("/admin/login", json={"email": email, "password": password})
    assert (r.status_code == 200) is ok
