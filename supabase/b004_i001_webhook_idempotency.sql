-- B-004 / I-001: Unified webhook idempotency table
--
-- Provides atomic deduplication for all webhook providers (stripe, square, clover).
-- Uses PRIMARY KEY (provider, event_id) so concurrent inserts on the same key produce
-- a unique-violation error (Postgres code 23505) — only one request wins, the loser
-- aborts safely without doing any work.
--
-- Note: pos_webhook_events (used by Square/Clover handlers before this migration) has
-- no schema-file definition and can be dropped from the live DB once this table is in
-- use. Dropping it is intentionally left out of this migration to avoid data loss on
-- any environments where it contains records.
--
-- Run once in the Supabase SQL editor. Safe to re-run (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS webhook_idempotency_keys (
  provider     TEXT        NOT NULL,
  event_id     TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);

-- Index for efficient lookups by provider when querying recent events (optional, PK covers exact lookups)
-- The PRIMARY KEY already creates a unique B-tree index on (provider, event_id).
