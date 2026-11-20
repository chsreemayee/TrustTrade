# TrustTrade backend

FastAPI + LangGraph + Gemini Flash + Supabase. See PRD v2 §6–11 and Datasets v2 §4–5.

**Deploying:** see [DEPLOY.md](DEPLOY.md).

## Run locally

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # fill in keys; without Supabase keys the in-memory seed store is used
.venv/bin/uvicorn main:app --reload --port 8000
.venv/bin/python -m pytest -q
```

## Supabase setup

1. Supabase → SQL Editor → run `supabase/schema.sql`.
2. Put `SUPABASE_URL` and the **service_role** key in `SUPABASE_KEY` in `.env`.
3. `.venv/bin/python -m scripts.seed_supabase`
4. Load the real SEBI list: `.venv/bin/python -m scripts.load_sebi_csv path/to/sebi.csv`

## Layout

| Path | What |
|---|---|
| `main.py` | App, CORS, routers |
| `core/config.py` | Settings from `.env` |
| `core/store.py` | Supabase store + in-memory fallback |
| `core/seed.py` | Builds seed rows from `seed/` |
| `seed/` | Scam rules, companies (Datasets doc) + drills, alerts, badges, company text (front-end mocks) |
| `agents/scam_investigator/` | Scam Check pipeline (LangGraph) + deterministic detectors |
| `agents/orchestrator.py` | Big mic routing (LangGraph): Scam Investigator, Tutor or fixed reply |
| `agents/tutor.py`, `drill_master.py`, `practice_coach.py` | The other three agents (PRD §9) |
| `agents/prompts/` | One prompt file per agent (PRD §9) |
| `routers/` | HTTP endpoints; shapes match frontend/mocks exactly |
| `core/auth.py` | Admin login + signed admin tokens |
| `core/bootstrap.py` | Startup: seed empty tables, create admin, warm prices, 30-day purge |
| `supabase/schema.sql` | The 15 tables (PRD §10), RLS on |
| `tests/` | Pytest; `tests/data/` holds the 5 demo tips |

## Scam Check (`POST /scam-check`)

Body is `api.checkScamTip()`'s input: `{type, text?, urlOrUpi?, imageData?}`; optional `X-User-Id` header.
Response is exactly `ScamCheckVerdict` (frontend/mocks/scam_checks.ts).

Pipeline (`agents/scam_investigator/pipeline.py`, LangGraph): read → run_checks → decide → explain → save.

- **Verdict is code-only** (`decide`): sum of rule weights; always-a-scam or ≥3 → scam; below 3 with the
  message unread or SEBI unchecked → could_not_check; >0 → careful; 0 → no_signs.
- **LLM only extracts and words** the explanation. Every LLM explanation is dropped (stored wording used
  instead) if it contains a banned word, is over 45 words or has a link. Extracted details are scrubbed.
- **Failures**: no key / timeout / bad output → "Reading the message: could_not_check", rules still run.
- **Images** are decoded in memory, sent to Gemini, then dropped; only extracted text is saved (30 days).
- **SEBI list** is empty until loaded; a SEBI claim then gives could_not_check, never a guess.

Tests: `.venv/bin/python -m pytest -q`. Live Gemini check (needs key in .env):
`RUN_LIVE=1 .venv/bin/python -m pytest tests/test_live_gemini.py -v`
