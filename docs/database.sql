create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('player', 'admin', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('hold', 'confirmed', 'cancelled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'approved', 'rejected', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type challenge_status as enum ('pending', 'accepted', 'declined', 'reported', 'confirmed', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tournament_status as enum ('draft', 'open', 'closed', 'in_progress', 'finished');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  google_sub text unique,
  first_name text not null,
  last_name text not null,
  phone text not null default '',
  category text not null check (category in ('1ra','2da','3ra','4ta','5ta','6ta','7ma','8va')),
  role user_role not null default 'player',
  elo integer not null default 1000,
  created_at timestamptz not null default now()
);

create table if not exists courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  slot_minutes integer not null default 90,
  price_cents integer not null default 1200000,
  deposit_cents integer not null default 300000,
  created_at timestamptz not null default now()
);

create table if not exists court_schedules (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references courts(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  active boolean not null default true
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references courts(id),
  user_id uuid not null references profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status reservation_status not null default 'hold',
  hold_expires_at timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text,
  amount_cents integer not null,
  status payment_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists challenge_matches (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id),
  opponent_id uuid not null references profiles(id),
  category text not null,
  status challenge_status not null default 'pending',
  winner_id uuid references profiles(id),
  score text,
  reported_by uuid references profiles(id),
  played_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists elo_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  challenge_id uuid references challenge_matches(id),
  previous_elo integer not null,
  next_elo integer not null,
  created_at timestamptz not null default now()
);

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  starts_at timestamptz not null,
  status tournament_status not null default 'open',
  max_teams integer not null default 16,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(tournament_id, user_id)
);

create table if not exists tournament_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  player_ids uuid[] not null default '{}'
);

create table if not exists tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  stage text not null,
  group_index integer,
  round integer,
  match_index integer,
  player_a_id uuid references profiles(id),
  player_b_id uuid references profiles(id),
  winner_id uuid references profiles(id),
  score text,
  played_at timestamptz
);

create index if not exists reservations_slot_idx on reservations(court_id, starts_at, ends_at);
create index if not exists profiles_category_elo_idx on profiles(category, elo desc);

create or replace view available_slots as
with generated as (
  select
    c.id as court_id,
    c.name as court_name,
    (d.day::date + s.opens_at + (step.n * (c.slot_minutes || ' minutes')::interval))::timestamptz as starts_at,
    (d.day::date + s.opens_at + ((step.n + 1) * (c.slot_minutes || ' minutes')::interval))::timestamptz as ends_at,
    c.price_cents,
    c.deposit_cents
  from courts c
  join court_schedules s on s.court_id = c.id and s.active = true
  cross join generate_series(current_date, current_date + interval '14 days', interval '1 day') d(day)
  cross join generate_series(0, 20) step(n)
  where c.active = true
    and extract(dow from d.day)::integer = s.weekday
    and (d.day::date + s.opens_at + ((step.n + 1) * (c.slot_minutes || ' minutes')::interval))::time <= s.closes_at
)
select g.*
from generated g
where g.starts_at > now()
  and not exists (
    select 1
    from reservations r
    where r.court_id = g.court_id
      and r.starts_at < g.ends_at
      and r.ends_at > g.starts_at
      and (
        r.status = 'confirmed'
        or (r.status = 'hold' and r.hold_expires_at > now())
      )
  );

insert into courts (name, active, slot_minutes, price_cents, deposit_cents)
values
  ('Cancha 1', true, 90, 1200000, 300000),
  ('Cancha 2', true, 90, 1200000, 300000),
  ('Cancha 3', true, 90, 1200000, 300000)
on conflict do nothing;

insert into court_schedules (court_id, weekday, opens_at, closes_at)
select c.id, day.weekday, '08:00'::time, '23:00'::time
from courts c
cross join (values (0),(1),(2),(3),(4),(5),(6)) as day(weekday)
where not exists (
  select 1 from court_schedules s where s.court_id = c.id and s.weekday = day.weekday
);
