-- eric.sh CRM schema
-- Apply once via the Neon SQL editor or `psql $POSTGRES_URL -f db/schema.sql`.

-- `country` / `city` / `region` / `timezone` are IP-derived (Vercel edge geo
-- headers) and therefore APPROXIMATE — carrier gateways, CGNAT, and VPNs
-- routinely place a visitor hundreds of miles from where they actually are.
-- `location_override` is the human-entered correction and always wins on display.
create table if not exists visitors (
  id                uuid primary key,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  user_agent        text,
  country           text,
  city              text,
  region            text,
  timezone          text,
  location_override text,
  -- Reported by the browser, not inferred from IP: `Intl...resolvedOptions()`
  -- and `navigator.language`. More trustworthy than the IP-derived columns.
  client_timezone   text,
  language          text,
  referrer          text,
  notes             text
);

-- Run these if the table already exists:
-- alter table visitors add column if not exists country           text;
-- alter table visitors add column if not exists city              text;
-- alter table visitors add column if not exists region            text;
-- alter table visitors add column if not exists timezone          text;
-- alter table visitors add column if not exists location_override text;
-- alter table visitors add column if not exists client_timezone   text;
-- alter table visitors add column if not exists language          text;
-- alter table visitors add column if not exists referrer          text;
-- alter table visitors add column if not exists notes             text;

create table if not exists chat_messages (
  id          bigserial primary key,
  visitor_id  uuid not null references visitors(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chat_messages_visitor_created_idx
  on chat_messages (visitor_id, created_at);

create table if not exists contact_submissions (
  id          bigserial primary key,
  visitor_id  uuid references visitors(id) on delete set null,
  name        text not null,
  email       text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists contact_submissions_created_idx
  on contact_submissions (created_at desc);

-- One row per visit, keyed by a client-generated session UUID. A session rolls
-- over after SESSION_TIMEOUT_MS of inactivity (see src/lib/telemetry.ts), so the
-- id is stable across route changes within a visit but not between visits.
--
-- `engaged_ms` and `max_scroll_pct` are monotonic: the client sends cumulative
-- totals and the server takes greatest(existing, incoming), so a late or
-- out-of-order heartbeat can never walk a session's numbers backwards.
--
-- "Cumulative" means FOR THE WHOLE SESSION, across every document load in it —
-- not for the page that happened to send the beat. Routing is MPA, so a visit
-- to `/` then `/resume` is two page loads sharing one session id; the client
-- carries the running engaged total forward in localStorage so greatest()
-- composes into a sum. Sending per-page totals instead makes this column store
-- the LONGEST page of a visit rather than the visit, which is what it did until
-- 2026-07. `engaged_ms` therefore counts only visible time and is not the same
-- thing as wall-clock session length (last_beat_at - started_at).
create table if not exists visitor_sessions (
  id             uuid primary key,
  visitor_id     uuid not null references visitors(id) on delete cascade,
  started_at     timestamptz not null default now(),
  last_beat_at   timestamptz not null default now(),
  engaged_ms     integer not null default 0,
  max_scroll_pct integer not null default 0,
  entry_path     text,
  referrer       text,
  viewport_w     integer,
  viewport_h     integer,
  screen_w       integer,
  screen_h       integer,
  -- Campaign tags read off the entry URL's query string. Backfilled with the
  -- same coalesce-never-overwrite rule as entry_path: they describe how the
  -- VISIT was acquired, so the first page of the session owns them and a later
  -- untagged page view must not blank them out.
  --
  -- Unlike `referrer`, these are self-reported by whoever built the link — i.e.
  -- by the site owner tagging their own outbound links. That makes them the
  -- only signal that can tell apart the channels which all arrive referrer-less
  -- (a DM, a PDF resume, an email), which is exactly why they exist here.
  utm_source     text,
  utm_medium     text,
  utm_campaign   text
);
create index if not exists visitor_sessions_visitor_started_idx
  on visitor_sessions (visitor_id, started_at desc);

-- Run these if the table already exists:
-- alter table visitor_sessions add column if not exists utm_source   text;
-- alter table visitor_sessions add column if not exists utm_medium   text;
-- alter table visitor_sessions add column if not exists utm_campaign text;

-- One row per document load. Routing is MPA (real <a href> + cross-document
-- view transitions), so every route change is a fresh load and lands here
-- without any SPA router involvement.
create table if not exists page_views (
  id         bigserial primary key,
  visitor_id uuid not null references visitors(id) on delete cascade,
  session_id uuid references visitor_sessions(id) on delete cascade,
  path       text not null,
  referrer   text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_visitor_created_idx
  on page_views (visitor_id, created_at desc);
create index if not exists page_views_session_idx
  on page_views (session_id);
-- The admin list aggregates count(*)/max(created_at) per visitor across the
-- whole table. Without this it plans a seq scan, which is fine at hundreds of
-- rows and not fine at hundreds of thousands — page_views grows one row per
-- document load, faster than anything else here.
create index if not exists page_views_visitor_idx
  on page_views (visitor_id);

-- RETENTION. Nothing reads page views older than a few months; the admin detail
-- view caps at 500 rows and the activity chart looks back 30 days. These keep
-- the table — and therefore the aggregate scans behind the visitor list —
-- bounded:
--
--   delete from page_views where created_at < now() - interval '6 months';
--   delete from visitor_sessions where last_beat_at < now() - interval '6 months';
--
-- Both are safe to run any time: sessions and page views are derived telemetry,
-- and deleting them never touches a visitor, chat transcript, or submission.
--
-- THIS NOW RUNS ITSELF, daily at 04:00 UTC — api/cron/prune.ts, scheduled by the
-- `crons` block in vercel.json, gated on CRON_SECRET. The statements above are
-- kept here as the canonical definition of the window; change RETENTION_MONTHS
-- in that file and this comment together, or run them by hand against a branch
-- the cron doesn't reach.

-- `outbound_click` records a click on a link that LEAVES this site (different
-- host, or a mailto:/tel: scheme). Internal navigation is deliberately absent —
-- it already lands in page_views, and duplicating it here would double-count
-- every route change. The metadata carries `{ href, host, label, context }`,
-- all of it describing the site's own markup rather than the visitor.
create table if not exists visitor_events (
  id          bigserial primary key,
  visitor_id  uuid not null references visitors(id) on delete cascade,
  type        text not null check (type in ('ada_toggle', 'chat_cleared', 'speech_input', 'outbound_click', 'chat_error', 'section_error')),
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists visitor_events_visitor_created_idx
  on visitor_events (visitor_id, created_at desc);
-- The insights aggregate scans one type across a 30-day window with no visitor
-- in the predicate, which the visitor-keyed index above cannot serve.
create index if not exists visitor_events_type_created_idx
  on visitor_events (type, created_at desc);

-- Run this if the table already exists — `create table if not exists` will not
-- widen a check constraint on a table that is already there, and `/api/events`
-- silently drops any type the constraint rejects:
-- alter table visitor_events drop constraint if exists visitor_events_type_check;
-- alter table visitor_events add constraint visitor_events_type_check
--   check (type in ('ada_toggle', 'chat_cleared', 'speech_input', 'outbound_click', 'chat_error', 'section_error'));
