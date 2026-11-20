"""Admin authentication (PRD 8, 11).

Login checks the email/password with Supabase Auth and requires app_metadata.role == "admin"
(app_metadata can only be set with the service key, not by users). Without Supabase (local dev)
it checks ADMIN_EMAIL / ADMIN_PASSWORD. Success returns a signed, expiring admin token that
every /admin route requires as "Authorization: Bearer <token>".
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import threading
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException

from core.config import get_settings

log = logging.getLogger("trusttrade.auth")
TOKEN_HOURS = 8
_MAX_ATTEMPTS, _WINDOW_S = 10, 300
_attempts: dict[str, deque] = defaultdict(deque)
_attempts_lock = threading.Lock()
_fallback_secret = secrets.token_bytes(32)


def _secret() -> bytes:
    s = get_settings().admin_token_secret
    if not s:
        # Tokens then die on restart; fine for dev. Production sets ADMIN_TOKEN_SECRET.
        return _fallback_secret
    return s.encode()


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def create_token(email: str, now: float | None = None) -> tuple[str, int]:
    exp = int((now or time.time()) + TOKEN_HOURS * 3600)
    body = _b64(json.dumps({"sub": email, "role": "admin", "exp": exp}, separators=(",", ":")).encode())
    sig = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"v1.{body}.{sig}", exp


def verify_token(token: str) -> str | None:
    try:
        version, body, sig = token.split(".")
        if version != "v1":
            return None
        good = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        payload = json.loads(_unb64(body))
        if payload.get("role") != "admin" or payload.get("exp", 0) < time.time():
            return None
        return payload.get("sub")
    except Exception:  # noqa: BLE001 - any malformed token is simply invalid
        return None


def rate_limited(key: str) -> bool:
    now = time.time()
    with _attempts_lock:
        q = _attempts[key]
        while q and now - q[0] > _WINDOW_S:
            q.popleft()
        if len(q) >= _MAX_ATTEMPTS:
            return True
        q.append(now)
        return False


def reset_rate_limits() -> None:
    with _attempts_lock:
        _attempts.clear()


def check_credentials(email: str, password: str) -> bool:
    s = get_settings()
    email = email.strip().lower()
    if s.supabase_configured:
        try:
            from supabase import create_client

            client = create_client(s.supabase_url, s.supabase_key)   # throwaway client: its session is discarded
            res = client.auth.sign_in_with_password({"email": email, "password": password})
            user = res.user
            return bool(user and (user.app_metadata or {}).get("role") == "admin")
        except Exception as e:  # noqa: BLE001 - wrong password raises too
            log.info("Admin login refused (%s)", type(e).__name__)
            return False
    if not (s.admin_email and s.admin_password):
        return False
    return hmac.compare_digest(email, s.admin_email.strip().lower()) and \
        hmac.compare_digest(password.encode(), s.admin_password.encode())


def require_admin(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency for every /admin route."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Admin login required", headers={"WWW-Authenticate": "Bearer"})
    email = verify_token(authorization.split(" ", 1)[1].strip())
    if not email:
        raise HTTPException(401, "Session expired or invalid. Please log in again.",
                            headers={"WWW-Authenticate": "Bearer"})
    return email
