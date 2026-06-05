-- Кэш услуг 3gsm
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.unlock_services_cache (
  id SERIAL PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  credits TEXT,
  time TEXT,
  category_group TEXT,
  raw_data JSONB,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Кэш баланса 3gsm
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.unlock_balance_cache (
  id SERIAL PRIMARY KEY,
  credits TEXT,
  currency TEXT DEFAULT 'USD',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
