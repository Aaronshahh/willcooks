-- Countries table — lets Will store hand-written cuisine descriptions per country.
-- Run this in your Supabase SQL Editor.

create table if not exists public.countries (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger countries_updated_at
  before update on public.countries
  for each row execute procedure public.set_updated_at();

alter table public.countries enable row level security;

-- Anyone can read country descriptions (used on the public map)
create policy "Public can read countries"
  on public.countries for select
  using (true);

-- Only authenticated users (Will) can add / edit / delete
create policy "Authenticated users can manage countries"
  on public.countries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
