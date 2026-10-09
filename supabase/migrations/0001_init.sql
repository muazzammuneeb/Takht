-- Takht schema. Ranking is computed in the app (src/lib/ranking.ts); the DB just stores rows.

create extension if not exists pgcrypto;

create table if not exists listings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  website     text not null,
  category    text not null check (category in (
                'Food','Fashion','Tech','Startups','Services','Health & Fitness',
                'Education','Ecommerce','Local','Other')),
  city        text not null,
  tagline     text not null default '' check (char_length(tagline) <= 90),
  logo_path   text,
  contact     text,
  status      text not null default 'pending' check (status in ('pending','live','rejected','hidden')),
  created_at  timestamptz not null default now()
);

create table if not exists bids (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  amount          bigint not null check (amount > 0),
  status          text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at      timestamptz not null default now(),
  paid_at         timestamptz,
  payment_method  text,
  payment_ref     text,
  proof_path      text,
  check ((status = 'paid') = (paid_at is not null))
);

create index if not exists bids_listing_idx on bids (listing_id);
create index if not exists bids_status_paid_idx on bids (status, paid_at);
create index if not exists listings_status_idx on listings (status);

-- The app talks to Postgres only with the service-role key (server-side), so lock the tables
-- down for anon/authenticated clients.
alter table listings enable row level security;
alter table bids enable row level security;

-- Private bucket for logos and payment proofs; files are served through the app.
insert into storage.buckets (id, name, public)
values ('takht', 'takht', false)
on conflict (id) do nothing;
