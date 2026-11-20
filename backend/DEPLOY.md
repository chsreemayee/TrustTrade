# Deploy TrustTrade: backend on Render (free), front end on Vercel

About 20 minutes. You need free accounts on **Supabase**, **Render** and **GitHub** (Vercel you already have).

> Written without live access to Render's docs: if a menu name has moved, the setting is the
> same; Render's own docs are at render.com/docs.

---

## 1. Supabase: create the database (5 min)

1. Go to **supabase.com → New project**. Pick a name, a strong database password and the
   region closest to your users (Mumbai). Wait for it to finish.
2. Open **SQL Editor → New query**. Paste the whole of `backend/supabase/schema.sql` and click **Run**.
   You should see "Success". This creates the 15 tables.
3. Open **Project Settings → API Keys** (older projects: **Settings → API**) and copy two values:
   - **Project URL**: looks like `https://abcdxyz.supabase.co`
   - The **service_role** key (or the new **secret** key, starting `sb_secret_`).
     This key is all-powerful: it only ever goes into Render, never into Vercel or the browser.

You do not need to load any data: the backend fills empty tables itself on first start.

## 2. GitHub: add the backend to your repo (3 min)

1. Unzip `trusttrade-backend.zip` so your repo looks like:
   ```
   your-repo/
     frontend/
     backend/        ← from the zip
     render.yaml     ← move it here from backend/render.yaml
   ```
2. Make sure no `.env` file is included (the zip has none; `backend/.gitignore` blocks it).
   Also add `.env` to your repo's root `.gitignore`.
3. Commit and push.

## 3. Render: start the backend (7 min)

1. Go to **dashboard.render.com → New → Blueprint**, connect GitHub and pick your repo.
   Render reads `render.yaml` and shows one service, **trusttrade-api** (Free).
2. It asks for the values marked secret. Fill in:

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL from step 1 |
   | `SUPABASE_KEY` | service_role / secret key from step 1 |
   | `GEMINI_API_KEY` | your Gemini key (aistudio.google.com → Get API key). Can be added later |
   | `CORS_ORIGINS` | your Vercel address, e.g. `https://trusttrade.vercel.app` (no `/` at the end; several separated by commas) |
   | `ADMIN_EMAIL` | the Content Admin's email |
   | `ADMIN_PASSWORD` | a strong password for that admin |

   `ADMIN_TOKEN_SECRET` is generated for you. Click **Apply**.
3. Wait for the build (2–4 min). Your address is shown at the top, e.g.
   `https://trusttrade-api.onrender.com`.
4. Open `https://trusttrade-api.onrender.com/health`. You should see:
   - `"store": "supabase"` and `"database": "ok"`
   - `seed_counts` with `scam_rules: 20, companies: 20, drills: 12, lessons: 11, alerts: 1`
   - `"llm": "configured"` once the Gemini key is set
   - `prices.rows` above 0 within a minute or two (a year of prices is fetched in the background)

**No Blueprint?** Use **New → Web Service** instead: pick the repo, then set
Root Directory `backend`, Runtime **Python 3**, Build Command `pip install -r requirements.txt`,
Start Command `uvicorn main:app --host 0.0.0.0 --port $PORT`, Instance Type **Free**,
Health Check Path `/health`, and add the environment variables above plus
`PYTHON_VERSION=3.13.1`, `STORE_BACKEND=supabase` and a long random `ADMIN_TOKEN_SECRET`.

**Adding the Gemini key later:** Render → trusttrade-api → **Environment** → add
`GEMINI_API_KEY` → **Save, rebuild and deploy**. Until then every Scam Check runs on rules
alone and says "could not check" for the message reading, as designed.

## 4. Vercel: connect the front end (3 min)

1. Replace `frontend/lib/api.ts` with the new `api.ts`, commit and push.
2. Vercel → your project → **Settings → Environment Variables → Add**:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://trusttrade-api.onrender.com` (your Render address, no `/` at the end)
   - Environments: **Production** (and **Preview** if you use preview links)
3. **Deployments → ⋯ on the latest → Redeploy.** This is required: `NEXT_PUBLIC_` values are
   baked in at build time, so the old build doesn't know the address.
4. Open the app and run the 5 demo tips on the Scam Check screen. Tips 1–3 show red straight away;
   tips 4 and 5 show amber and green once the Gemini key is set (without it they honestly say
   "could not fully check").

**Preview deployments** have different addresses (`trusttrade-git-branch-you.vercel.app`).
To allow them, add on Render: `CORS_ORIGIN_REGEX` = `https://trusttrade-[a-z0-9-]+\.vercel\.app`
(change `trusttrade` to your Vercel project name).

**To go back to mocks** at any time: delete `NEXT_PUBLIC_API_URL` in Vercel and redeploy.

## 5. Admin screens

`api.ts` now has `api.adminLogin(email, password)`. Your admin Login screen (A1) must call it
on submit; after that, the admin functions send the login token automatically (8-hour
sessions). Use the email and password you put in Render. Without login, admin calls fail with
"Admin login required".

The Data screen (A6) can upload the SEBI CSV with `api.uploadSebiCsv(file)`. Until a real list
is uploaded, SEBI claims are reported as "could not check" (never "not registered").

Upload from the command line instead (replace the token with the one `/admin/login` returns):
```bash
curl -X POST https://trusttrade-api.onrender.com/admin/sebi/upload -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: text/csv" --data-binary @sebi.csv
```

## 6. Free tier: what to expect

- **It sleeps after about 15 minutes with no visitors** and takes up to about a minute to wake.
  The new `api.ts` pings `/health` as soon as the app opens to start waking it. **Before a demo,
  open `/health` yourself 2 minutes early.**
- Free instance hours are limited per month (enough for one always-on demo service).
- No shell or disk on the free plan; that's fine, all data lives in Supabase.
- **Yahoo Finance sometimes blocks cloud servers.** If `/health` shows `prices.rows: 0` after
  a few minutes, load prices from your own computer (it writes straight to Supabase):
  ```bash
  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
  ```
  Create `backend/.env` with `SUPABASE_URL` and `SUPABASE_KEY`, then:
  ```bash
  .venv/bin/python -m scripts.load_prices
  ```
  The app then shows those prices with their date and never invents one.

## 7. After adding the Gemini key: run the live check once

On your computer, with `GEMINI_API_KEY` in `backend/.env`:
```bash
RUN_LIVE=1 .venv/bin/python -m pytest tests/test_live_gemini.py -v
```
This confirms real Gemini reads all 5 demo tips (English and Telugu) to the expected verdicts.

## Endpoints

| Front end (`api.`) | Endpoint |
|---|---|
| checkScamTip | `POST /scam-check` |
| getWallet / resetWallet | `GET /wallet` / `POST /wallet/reset` |
| buyStock / sellStock / fastForwardWeek | `POST /wallet/buy` / `/wallet/sell` / `/wallet/fast-forward` |
| getCompanies / getCompanyByTicker | `GET /companies` / `GET /companies/{ticker or id}` |
| getDrills / answerDrill | `GET /drills` / `POST /drills/{id}/answer` |
| getLessons / getLessonById / getNextLesson / completeLesson | `GET /lessons`, `/lessons/{id}`, `/lessons/next`, `POST /lessons/{id}/complete` |
| getBadges / unlockBadge | `GET /badges` / `POST /badges/{code}/unlock` |
| getAlerts | `GET /alerts` |
| ask (big mic) | `POST /ask` |
| reportScam | `POST /reports` |
| adminLogin | `POST /admin/login` |
| getAdminStats / getScamRules / addScamRule | `GET /admin/stats`, `GET /admin/rules`, `POST /admin/rules` |
| getReviewQueue / updateReviewStatus | `GET /admin/reviews`, `PATCH /admin/reviews/{id}` |
| uploadSebiCsv | `POST /admin/sebi/upload` |
| (admin forms) | `PUT /admin/rules/{id}`, `/admin/alerts/{id}`, `/admin/drills/{id}`, `/admin/lessons/{id}`; `GET /admin/export.csv` |

Interactive API docs: `https://trusttrade-api.onrender.com/docs`.
