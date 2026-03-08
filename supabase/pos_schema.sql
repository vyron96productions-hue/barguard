-- POS Connections: stores OAuth tokens per business + provider
CREATE TABLE IF NOT EXISTS pos_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  pos_type TEXT NOT NULL CHECK (pos_type IN ('square', 'toast', 'clover', 'lightspeed')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  merchant_id TEXT,
  location_id TEXT,
  location_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (business_id, pos_type)
);

-- POS Sync Logs: history of every sync run
CREATE TABLE IF NOT EXISTS pos_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  pos_type TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  transactions_imported INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT
);

-- Disable RLS for MVP
ALTER TABLE pos_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sync_logs DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos_connections_business ON pos_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_sync_logs_business ON pos_sync_logs(business_id, synced_at DESC);
