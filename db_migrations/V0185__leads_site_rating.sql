ALTER TABLE t_p31606708_tech_buying_service.leads_tracking
  ADD COLUMN IF NOT EXISTS site_rating INTEGER,
  ADD COLUMN IF NOT EXISTS site_liked TEXT,
  ADD COLUMN IF NOT EXISTS site_feedback TEXT,
  ADD COLUMN IF NOT EXISTS site_rated_at TIMESTAMP;