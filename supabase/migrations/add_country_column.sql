-- Migration: add country column to recipes
-- Run this in Supabase SQL Editor if you already created the table with schema.sql

alter table public.recipes
  add column if not exists country text;
