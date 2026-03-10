-- Add a short dish description field (separate from the long-form blog post body).
-- Run this in your Supabase SQL Editor.
alter table public.recipes
  add column if not exists description text;
