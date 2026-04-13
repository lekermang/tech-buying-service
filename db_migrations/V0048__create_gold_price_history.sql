CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.gold_price_history (
  id SERIAL PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  price_rub NUMERIC(12,2) NOT NULL,
  xau_usd NUMERIC(12,2),
  usd_rub NUMERIC(10,4)
);
CREATE INDEX IF NOT EXISTS idx_gold_price_history_recorded_at
  ON t_p31606708_tech_buying_service.gold_price_history (recorded_at DESC);
