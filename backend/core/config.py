"""Settings. Secrets are read only from backend/.env (or the host's env vars on Render)."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
LANGUAGES = ("te", "hi", "en", "kn", "ta", "ml")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    supabase_url: str = ""
    supabase_key: str = ""  # service-role key: backend only, never sent to the browser

    # Comma-separated exact origins, e.g. "https://trusttrade.vercel.app,http://localhost:3000"
    cors_origins: str = "http://localhost:3000"
    # Optional regex for Vercel preview URLs, e.g. r"https://trusttrade-[a-z0-9-]+\.vercel\.app"
    cors_origin_regex: str = ""

    # "auto" = Supabase when SUPABASE_URL/KEY are set, else in-memory seed data
    store_backend: str = "auto"
    # Seed empty tables (rules, drills, lessons, alerts, companies) and the admin account on startup
    auto_seed: bool = True

    # Practice (PRD 7.2): "yfinance" or "none"; new wallets start this many trading days back so
    # "Fast-forward a week" can replay real history (0 = start at today's prices)
    price_source: str = "yfinance"
    practice_start_offset_days: int = 20

    # Admin (PRD 8). With Supabase: a Supabase Auth user whose app_metadata.role is "admin"
    # (created on startup from these). Without Supabase (local dev only): checked against these.
    admin_email: str = ""
    admin_password: str = ""
    admin_token_secret: str = ""   # signs admin session tokens; set a long random value in production

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
