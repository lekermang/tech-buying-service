CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT
);
CREATE INDEX IF NOT EXISTS idx_repair_order_history_order_id ON t_p31606708_tech_buying_service.repair_order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_repair_order_history_changed_at ON t_p31606708_tech_buying_service.repair_order_history(changed_at DESC);