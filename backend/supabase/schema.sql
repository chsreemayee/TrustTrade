-- TrustTrade schema (PRD v2, section 10). Run once in Supabase → SQL Editor.
-- User-facing text is stored per language in jsonb columns keyed by te, hi, en, kn, ta, ml.
-- The backend uses the service-role key; RLS is enabled on every table with no public
-- policies, so the anon key can read nothing directly (PRD 11: "users read only their own rows"
-- is enforced by the API, which always filters by the caller's user id).

create extension if not exists pgcrypto;

-- 1. users (anonymous users get a random id from the browser; phone is null until login)
create table if not exists users (
  id           text primary key,
  phone        text unique,
  name         text,
  job          text,
  language     text default 'te',
  voice_speed  real default 1.0,
  created_at   timestamptz not null default now()
);

-- 2. scam_checks (extracted text is kept 30 days, then removed by a daily job)
create table if not exists scam_checks (
  id              uuid primary key default gen_random_uuid(),
  user_id         text references users(id) on delete cascade,
  input_type      text not null check (input_type in ('voice','text','image','link','upi')),
  extracted_text  text,
  extracted_json  jsonb,
  verdict         text not null check (verdict in ('scam','careful','no_signs','could_not_check')),
  score           real not null default 0,
  signs_json      jsonb not null default '[]',
  checks_json     jsonb not null default '[]',
  language        text,
  created_at      timestamptz not null default now(),
  delete_after    timestamptz not null default (now() + interval '30 days')
);
create index if not exists scam_checks_delete_after on scam_checks (delete_after);

-- 3. scam_rules (warning-sign table, PRD 6.2; admin-editable, applies to new checks at once)
create table if not exists scam_rules (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  pattern         text,                      -- regex; null for code/extract-only signs
  languages       text[] not null default '{all}',
  weight          real not null check (weight in (2, 1, 0.5)),
  is_always_scam  boolean not null default false,
  lesson_id       text,
  detector        text not null default 'phrase',   -- phrase | code | extract | phase2 (combinable with +)
  label           jsonb not null default '{}',      -- per-language label shown on the verdict card
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4. sebi_entities (stored copy of the SEBI registered intermediaries list)
create table if not exists sebi_entities (
  registration_no  text primary key,
  name             text not null,
  category         text,
  valid_from       date,
  valid_to         date,
  source_file      text,
  loaded_at        timestamptz not null default now()
);
create index if not exists sebi_entities_name on sebi_entities (lower(name));

-- 5. reports (user reports + flagged verdicts → admin review queue; no phone numbers shown)
create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  check_id     uuid references scam_checks(id) on delete set null,
  user_id      text references users(id) on delete set null,
  reported_text text,
  reason       text,
  status       text not null default 'open' check (status in ('open','approved','dismissed')),
  reviewed_by  text,
  created_at   timestamptz not null default now()
);

-- 6. lessons (one row per topic × job, plus scam micro-lessons with job = 'all')
create table if not exists lessons (
  id            text primary key,
  topic_no      int,
  job           text not null default 'all',
  kind          text not null default 'topic' check (kind in ('topic','micro')),
  translations  jsonb not null default '{}',   -- title, core_idea, estimated_time, job_adaptation, scenes, quiz
  status        text not null default 'published' check (status in ('draft','published')),
  updated_at    timestamptz not null default now()
);

-- 7. lesson_progress
create table if not exists lesson_progress (
  user_id       text references users(id) on delete cascade,
  lesson_id     text references lessons(id) on delete cascade,
  quiz_score    int,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id, completed_at)
);

-- 8. drills
create table if not exists drills (
  id            text primary key,
  is_scam       boolean not null,
  scam_type     text,
  translations  jsonb not null default '{}',   -- sender_name, message, explanation, tricks
  status        text not null default 'published' check (status in ('draft','published'))
);

-- 9. drill_attempts
create table if not exists drill_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references users(id) on delete cascade,
  drill_id    text references drills(id) on delete cascade,
  answer      text not null check (answer in ('scam','real')),
  correct     boolean not null,
  created_at  timestamptz not null default now()
);

-- 10. companies
create table if not exists companies (
  ticker        text primary key,
  slug          text not null unique,          -- the "id" the front end uses, e.g. "reliance"
  name          text not null,
  initials      text not null,
  sector        text,
  tile_colour   text not null,
  translations  jsonb not null default '{}'    -- sector, description, job_example
);

-- 11. price_cache (daily bars; fetched_at drives the 15-minute cache)
create table if not exists price_cache (
  ticker      text references companies(ticker) on delete cascade,
  date        date not null,
  open        real, high real, low real, close real,
  volume      bigint,
  fetched_at  timestamptz not null default now(),
  primary key (ticker, date)
);

-- 12. wallets
create table if not exists wallets (
  user_id      text primary key references users(id) on delete cascade,
  cash         numeric(12,2) not null default 10000,
  sim_date     date,                            -- user's own clock for fast-forward
  sim_days_forwarded int not null default 0,
  reset_count  int not null default 0
);

-- 13. trades
create table if not exists trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references users(id) on delete cascade,
  ticker      text references companies(ticker),
  side        text not null check (side in ('buy','sell')),
  rupees      numeric(12,2) not null,
  shares      numeric(14,4) not null,
  price       numeric(12,2) not null,
  price_date  date not null,
  created_at  timestamptz not null default now()
);

-- 14. badges_earned
create table if not exists badges_earned (
  user_id     text references users(id) on delete cascade,
  badge_code  text not null,
  earned_at   timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- 15. alerts (one active alert per language is shown on Home)
create table if not exists alerts (
  id              text primary key,
  translations    jsonb not null default '{}',   -- tag, title, body, action_label
  sample_tip_key  text,
  active          boolean not null default true,
  starts          timestamptz,
  ends            timestamptz
);

-- Row-level security on, no public policies: only the backend (service role) can read/write.
do $$
declare t text;
begin
  foreach t in array array['users','scam_checks','scam_rules','sebi_entities','reports','lessons',
    'lesson_progress','drills','drill_attempts','companies','price_cache','wallets','trades',
    'badges_earned','alerts']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
