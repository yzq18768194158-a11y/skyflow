create extension if not exists pgcrypto;

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journeys drop constraint if exists journeys_slug_key;
alter table public.journeys add constraint journeys_user_slug_key unique (user_id, slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journeys_set_updated_at on public.journeys;

create trigger journeys_set_updated_at
before update on public.journeys
for each row
execute function public.set_updated_at();

alter table public.journeys enable row level security;

create policy "Users can read their own journeys"
on public.journeys
for select
using (auth.uid() = user_id);

create policy "Users can insert their own journeys"
on public.journeys
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own journeys"
on public.journeys
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
