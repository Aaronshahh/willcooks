-- Email subscribers — visitors who want updates when Will posts a new recipe.
-- Run this in your Supabase SQL Editor.

create table if not exists public.subscribers (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Anyone can subscribe (insert their own email)
create policy "Anyone can subscribe"
  on public.subscribers for insert
  with check (true);

-- Only Will (authenticated) can view or delete subscribers
create policy "Authenticated users can view subscribers"
  on public.subscribers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete subscribers"
  on public.subscribers for delete
  using (auth.role() = 'authenticated');

-- Grant table-level permissions so the anon key can actually insert
grant usage on schema public to anon, authenticated;
grant insert on public.subscribers to anon;
grant select, delete on public.subscribers to authenticated;
