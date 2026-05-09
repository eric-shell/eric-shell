-- eric.sh CRM schema
-- Apply once via the Neon SQL editor or `psql $POSTGRES_URL -f db/schema.sql`.

create table if not exists visitors (
  id            uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  user_agent    text,
  country       text,
  city          text,
  referrer      text,
  notes         text
);

-- Run these if the table already exists:
-- alter table visitors add column if not exists country  text;
-- alter table visitors add column if not exists city     text;
-- alter table visitors add column if not exists referrer text;
-- alter table visitors add column if not exists notes    text;

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

create table if not exists visitor_events (
  id          bigserial primary key,
  visitor_id  uuid not null references visitors(id) on delete cascade,
  type        text not null check (type in ('ada_toggle', 'chat_cleared')),
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists visitor_events_visitor_created_idx
  on visitor_events (visitor_id, created_at desc);
