-- Аналитика посетителей: визиторы, сессии, события, конверсии, geo-кэш, rate-limit
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  city TEXT NULL,
  country TEXT NULL,
  device_type TEXT NULL,
  browser TEXT NULL,
  os TEXT NULL,
  is_converted BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_an_visitors_phone ON t_p31606708_tech_buying_service.an_visitors(phone);
CREATE INDEX IF NOT EXISTS idx_an_visitors_last_seen ON t_p31606708_tech_buying_service.an_visitors(last_seen DESC);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NULL,
  medium TEXT NULL,
  campaign TEXT NULL,
  referrer TEXT NULL,
  landing_page TEXT NULL,
  exit_page TEXT NULL,
  search_query TEXT NULL,
  current_page TEXT NULL,
  current_title TEXT NULL,
  path JSONB NOT NULL DEFAULT '[]'::jsonb,
  hot_action TEXT NULL,
  hot_action_at TIMESTAMPTZ NULL,
  city TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL
);

-- Критичные индексы
CREATE INDEX IF NOT EXISTS idx_an_sessions_heartbeat ON t_p31606708_tech_buying_service.an_sessions(last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_an_sessions_visitor ON t_p31606708_tech_buying_service.an_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_an_sessions_started ON t_p31606708_tech_buying_service.an_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_an_sessions_source ON t_p31606708_tech_buying_service.an_sessions(source);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT NULL,
  page_title TEXT NULL,
  event_data JSONB NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_events_session ON t_p31606708_tech_buying_service.an_events(session_id);
CREATE INDEX IF NOT EXISTS idx_an_events_visitor ON t_p31606708_tech_buying_service.an_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_an_events_timestamp ON t_p31606708_tech_buying_service.an_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_an_events_type ON t_p31606708_tech_buying_service.an_events(event_type);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_conversions (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NULL,
  type TEXT NOT NULL,
  form_data JSONB NULL,
  amount NUMERIC(12,2) NULL,
  phone TEXT NULL,
  city TEXT NULL,
  source TEXT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_an_conv_visitor ON t_p31606708_tech_buying_service.an_conversions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_an_conv_timestamp ON t_p31606708_tech_buying_service.an_conversions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_an_conv_phone ON t_p31606708_tech_buying_service.an_conversions(phone);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_ip_cache (
  ip TEXT PRIMARY KEY,
  city TEXT NULL,
  country TEXT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Простой rate-limit: окно 1 мин для каждого IP
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.an_rate_limit (
  ip TEXT NOT NULL,
  minute_bucket TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, minute_bucket)
);
CREATE INDEX IF NOT EXISTS idx_an_rate_bucket ON t_p31606708_tech_buying_service.an_rate_limit(minute_bucket);