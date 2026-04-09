CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description) VALUES
  ('price_markup', '5500', 'Наценка к ценам каталога (руб)')
ON CONFLICT (key) DO NOTHING;
