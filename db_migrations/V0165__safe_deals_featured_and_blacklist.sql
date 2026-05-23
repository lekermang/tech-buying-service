-- Премиум-карточки в топе и чёрный список
ALTER TABLE t_p31606708_tech_buying_service.safe_deals
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS featured_paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_price_hint JSONB NULL;

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.safe_deals_blacklist (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  reason TEXT NULL,
  added_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safe_blacklist_kind_value
  ON t_p31606708_tech_buying_service.safe_deals_blacklist(kind, value);
CREATE INDEX IF NOT EXISTS idx_safe_deals_featured
  ON t_p31606708_tech_buying_service.safe_deals(is_featured, featured_until);