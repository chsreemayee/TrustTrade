"""TrustTrade backend. Run locally:  uvicorn main:app --reload --port 8000"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core import bootstrap
from core.config import get_settings
from routers import admin, ask, health, learn, practice, scam_check

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    bootstrap.startup()
    yield
    bootstrap.shutdown()


app = FastAPI(title="TrustTrade API", version=health.VERSION, lifespan=lifespan)

# The front end sends no cookies (admin auth is a Bearer token), so credentials stay off.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-User-Id", "X-Language"],
    max_age=600,
)

app.include_router(health.router)
app.include_router(scam_check.router)
app.include_router(learn.router)
app.include_router(ask.router)
app.include_router(practice.router)
app.include_router(admin.router)
