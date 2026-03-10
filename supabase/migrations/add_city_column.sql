-- Migration: add city column to recipes
-- Run this in Supabase SQL Editor

alter table public.recipes
  add column if not exists city text;
