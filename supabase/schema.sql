-- Will Cooks – Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Recipes table
create table if not exists public.recipes (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  location_name text not null default '',
  city          text,
  country       text,
  lat           double precision,
  lng           double precision,
  video_url     text,
  description   text,
  body          text,
  cover_image_path text,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

-- 4. Row Level Security
alter table public.recipes enable row level security;

-- Public: read published recipes
create policy "Public can read published recipes"
  on public.recipes for select
  using (published = true);

-- Admin: full access when authenticated
create policy "Authenticated users have full access"
  on public.recipes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Countries table (Will's hand-written cuisine descriptions per country)
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

create policy "Public can read countries"
  on public.countries for select
  using (true);

create policy "Authenticated users can manage countries"
  on public.countries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 6. Storage bucket (run in SQL or create via Dashboard → Storage)
-- Dashboard: Storage → New bucket → name: "recipe-covers" → Public: true
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('recipe-covers', 'recipe-covers', true)
on conflict (id) do nothing;

-- Storage policy: anyone can read
create policy "Public can read recipe covers"
  on storage.objects for select
  using (bucket_id = 'recipe-covers');

-- Storage policy: only authenticated users can upload/delete
create policy "Authenticated users can upload recipe covers"
  on storage.objects for insert
  with check (bucket_id = 'recipe-covers' and auth.role() = 'authenticated');

create policy "Authenticated users can delete recipe covers"
  on storage.objects for delete
  using (bucket_id = 'recipe-covers' and auth.role() = 'authenticated');

create policy "Authenticated users can update recipe covers"
  on storage.objects for update
  using (bucket_id = 'recipe-covers' and auth.role() = 'authenticated');
