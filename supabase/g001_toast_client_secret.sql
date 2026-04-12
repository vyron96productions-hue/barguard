-- g001_toast_client_secret.sql
-- Adds client_secret column to pos_connections so Toast tokens can be
-- auto-refreshed without the user having to reconnect manually.
-- Run once in Supabase SQL editor.

ALTER TABLE pos_connections
  ADD COLUMN IF NOT EXISTS client_secret text;
