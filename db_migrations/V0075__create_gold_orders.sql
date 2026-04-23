CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.gold_orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  item_name TEXT,
  weight NUMERIC(10,2),
  purity TEXT,
  buy_price INTEGER,
  sell_price INTEGER,
  profit INTEGER,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_note TEXT,
  completed_at TIMESTAMPTZ,
  payment_method VARCHAR(20) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_gold_orders_status ON t_p31606708_tech_buying_service.gold_orders(status);
CREATE INDEX IF NOT EXISTS idx_gold_orders_created_at ON t_p31606708_tech_buying_service.gold_orders(created_at DESC);