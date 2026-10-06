CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.error_reports (
  id SERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  employee TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_error_reports_last_seen ON t_p31606708_tech_buying_service.error_reports(last_seen DESC);