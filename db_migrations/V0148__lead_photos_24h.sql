CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.lead_photos (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER,
  s3_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_purged BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_lead_photos_expires
  ON t_p31606708_tech_buying_service.lead_photos(expires_at) WHERE is_purged = FALSE;
CREATE INDEX IF NOT EXISTS idx_lead_photos_lead
  ON t_p31606708_tech_buying_service.lead_photos(lead_id);

ALTER TABLE t_p31606708_tech_buying_service.leads_tracking
  ADD COLUMN IF NOT EXISTS contact_channels TEXT,
  ADD COLUMN IF NOT EXISTS device TEXT;
