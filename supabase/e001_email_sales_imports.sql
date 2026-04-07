-- ============================================================
-- e001_email_sales_imports.sql
-- Email-to-Import MVP: email ingest pipeline + sales draft tables
-- Safe to run on existing databases (idempotent).
-- Run AFTER the base schema.sql.
-- ============================================================

-- ── email_import_rules ───────────────────────────────────────
-- Trusted sender → business routing rules. DB-managed only in MVP.
CREATE TABLE IF NOT EXISTS email_import_rules (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sender_email     text        NOT NULL,       -- stored and matched as lowercase
  recipient_alias  text,                       -- optional inbox alias for disambiguation
  is_active        boolean     NOT NULL DEFAULT true,
  notes            text,                       -- internal label e.g. "Friday POS export"
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_import_rules_business ON email_import_rules(business_id);
-- At most one active rule per (sender, alias) pair — prevents routing conflicts at insert time
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_import_rules_active
  ON email_import_rules (lower(sender_email), COALESCE(lower(recipient_alias), ''))
  WHERE is_active = true;


-- ── email_ingest_messages ────────────────────────────────────
-- One row per Gmail message seen by the poll service.
CREATE TABLE IF NOT EXISTS email_ingest_messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid        REFERENCES businesses(id) ON DELETE SET NULL,  -- null if unroutable
  rule_id          uuid        REFERENCES email_import_rules(id) ON DELETE SET NULL,
  gmail_message_id text        NOT NULL UNIQUE,  -- Gmail message id — dedup key
  sender_email     text        NOT NULL,
  recipient_email  text,
  subject          text,
  received_at      timestamptz,
  status           text        NOT NULL DEFAULT 'received',
    -- 'received' | 'staged' | 'failed' | 'duplicate' | 'unroutable' | 'routing_conflict'
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  processed_at     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ingest_messages_business ON email_ingest_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_ingest_messages_status   ON email_ingest_messages(status);


-- ── email_ingest_attachments ─────────────────────────────────
-- One row per candidate attachment processed from an email.
CREATE TABLE IF NOT EXISTS email_ingest_attachments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id          uuid        NOT NULL REFERENCES email_ingest_messages(id) ON DELETE CASCADE,
  business_id         uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  gmail_attachment_id text,                       -- Gmail part/attachment id (may be null if inline)
  filename            text        NOT NULL,
  content_type        text,
  size_bytes          integer,
  sha256              text,                       -- hex digest for duplicate detection
  raw_content         text,                       -- base64 UTF-8 CSV content; nulled out on cleanup
  status              text        NOT NULL DEFAULT 'accepted',
    -- 'accepted' | 'rejected' | 'duplicate' | 'invalid_template' | 'parse_error'
  rejection_reason    text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ingest_attachments_message  ON email_ingest_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_ingest_attachments_business ON email_ingest_attachments(business_id);
CREATE INDEX IF NOT EXISTS idx_ingest_attachments_sha256   ON email_ingest_attachments(business_id, sha256)
  WHERE sha256 IS NOT NULL;


-- ── sales_import_drafts ──────────────────────────────────────
-- One draft per accepted email attachment, pending merchant review.
CREATE TABLE IF NOT EXISTS sales_import_drafts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message_id          uuid        NOT NULL REFERENCES email_ingest_messages(id) ON DELETE CASCADE,
  attachment_id       uuid        NOT NULL REFERENCES email_ingest_attachments(id) ON DELETE CASCADE,
  filename            text        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending_review',
    -- 'pending_review' | 'imported' | 'cancelled' | 'expired'
  row_count           integer     NOT NULL DEFAULT 0,
  valid_row_count     integer     NOT NULL DEFAULT 0,
  invalid_row_count   integer     NOT NULL DEFAULT 0,
  has_duplicate_warning boolean   NOT NULL DEFAULT false,
  sales_upload_id     uuid        REFERENCES sales_uploads(id) ON DELETE SET NULL,
  expires_at          timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  cancelled_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sales_import_drafts_business ON sales_import_drafts(business_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_import_drafts_expires  ON sales_import_drafts(expires_at)
  WHERE status = 'pending_review';


-- ── sales_import_draft_rows ──────────────────────────────────
-- Pre-staged, pre-validated rows for merchant review before import.
CREATE TABLE IF NOT EXISTS sales_import_draft_rows (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id              uuid        NOT NULL REFERENCES sales_import_drafts(id) ON DELETE CASCADE,
  business_id           uuid        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sort_order            integer     NOT NULL DEFAULT 0,
  -- Raw parsed fields
  sale_date             date        NOT NULL,
  raw_item_name         text        NOT NULL,
  quantity_sold         numeric     NOT NULL,
  gross_sales           numeric,
  sale_timestamp        timestamptz,
  guest_count           integer,
  check_id              text,
  station               text,
  -- Pre-resolved (display only; re-resolved at confirm time)
  menu_item_id          uuid        REFERENCES menu_items(id) ON DELETE SET NULL,
  -- Validation / warning metadata
  validation_error      text,       -- non-null means row is invalid
  is_duplicate_warning  boolean     NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_draft_rows_draft    ON sales_import_draft_rows(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_rows_business ON sales_import_draft_rows(business_id);


-- ── email_poll_log ───────────────────────────────────────────
-- One row per cron poll run; provides queryable audit history.
CREATE TABLE IF NOT EXISTS email_poll_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at          timestamptz NOT NULL DEFAULT now(),
  messages_found  integer     NOT NULL DEFAULT 0,
  drafts_created  integer     NOT NULL DEFAULT 0,
  duration_ms     integer,
  errors          jsonb                             -- null if clean run
);


-- ── Traceability column on sales_uploads ─────────────────────
-- Links a completed sales upload back to the email draft it came from.
-- Nullable; existing manual uploads stay NULL with no behavior change.
ALTER TABLE sales_uploads
  ADD COLUMN IF NOT EXISTS email_import_draft_id uuid DEFAULT NULL;

-- Add FK separately (sales_import_drafts must exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sales_uploads_email_import_draft_id_fkey'
  ) THEN
    ALTER TABLE sales_uploads
      ADD CONSTRAINT sales_uploads_email_import_draft_id_fkey
      FOREIGN KEY (email_import_draft_id)
      REFERENCES sales_import_drafts(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE email_import_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ingest_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ingest_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_import_drafts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_import_draft_rows  ENABLE ROW LEVEL SECURITY;
-- email_poll_log is internal only; no merchant RLS needed (service role access only)

-- email_import_rules
DROP POLICY IF EXISTS "tenant_all" ON email_import_rules;
CREATE POLICY "tenant_all" ON email_import_rules
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- email_ingest_messages (only rows routed to the user's business)
DROP POLICY IF EXISTS "tenant_all" ON email_ingest_messages;
CREATE POLICY "tenant_all" ON email_ingest_messages
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- email_ingest_attachments (business_id denormalized — simple policy)
DROP POLICY IF EXISTS "tenant_all" ON email_ingest_attachments;
CREATE POLICY "tenant_all" ON email_ingest_attachments
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- sales_import_drafts
DROP POLICY IF EXISTS "tenant_all" ON sales_import_drafts;
CREATE POLICY "tenant_all" ON sales_import_drafts
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- sales_import_draft_rows (business_id denormalized — simple policy)
DROP POLICY IF EXISTS "tenant_all" ON sales_import_draft_rows;
CREATE POLICY "tenant_all" ON sales_import_draft_rows
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());
