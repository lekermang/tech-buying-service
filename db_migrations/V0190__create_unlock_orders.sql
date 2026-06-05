CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.unlock_orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  gsm_order_id TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  imei TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_credits NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  gsm_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unlock_orders_client_id ON t_p31606708_tech_buying_service.unlock_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_unlock_orders_gsm_order_id ON t_p31606708_tech_buying_service.unlock_orders(gsm_order_id);
