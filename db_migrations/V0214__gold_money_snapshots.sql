CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.gold_money_snapshots (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cash_register NUMERIC(14,2) NOT NULL DEFAULT 0,
  safe_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  bank_account NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_money NUMERIC(14,2) NOT NULL DEFAULT 0,
  investor_money NUMERIC(14,2) NOT NULL DEFAULT 0,
  debts_owed_to_me NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_capital NUMERIC(14,2) NOT NULL DEFAULT 0,
  withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0,
  expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  gold_market_price_585 NUMERIC(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  author TEXT
);
CREATE INDEX IF NOT EXISTS idx_gold_money_snapshots_created ON t_p31606708_tech_buying_service.gold_money_snapshots(created_at DESC);