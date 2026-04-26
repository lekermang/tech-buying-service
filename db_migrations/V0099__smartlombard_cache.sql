CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.smartlombard_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
