ALTER TABLE t_p31606708_tech_buying_service.gold_orders
  ADD COLUMN IF NOT EXISTS is_investor_money BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS investor_profit_per_gram NUMERIC(10,2) NOT NULL DEFAULT 200;

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.gold_investor_settings (
  id SERIAL PRIMARY KEY,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  investor_name TEXT NOT NULL DEFAULT 'Инвестор',
  money_in_safe NUMERIC(14,2) NOT NULL DEFAULT 0,
  default_profit_per_gram NUMERIC(10,2) NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO t_p31606708_tech_buying_service.gold_investor_settings (share_token, investor_name)
SELECT
  md5(random()::text || clock_timestamp()::text) || md5(random()::text),
  'Инвестор'
WHERE NOT EXISTS (SELECT 1 FROM t_p31606708_tech_buying_service.gold_investor_settings);

CREATE INDEX IF NOT EXISTS idx_gold_orders_investor
  ON t_p31606708_tech_buying_service.gold_orders (is_investor_money)
  WHERE is_investor_money = TRUE;