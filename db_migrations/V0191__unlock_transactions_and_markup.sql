-- Таблица транзакций (пополнения баланса через ЮKassa)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.unlock_transactions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit',  -- deposit | order_payment | refund
  amount NUMERIC(10,2) NOT NULL,
  payment_id TEXT,                        -- ID платежа ЮKassa
  payment_status TEXT DEFAULT 'pending',  -- pending | succeeded | canceled
  order_id INTEGER,                       -- ссылка на unlock_orders.id
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_unlock_tx_client ON t_p31606708_tech_buying_service.unlock_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_unlock_tx_payment ON t_p31606708_tech_buying_service.unlock_transactions(payment_id);

-- Таблица настроек наценки по категориям услуг
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.unlock_markup_config (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'default',  -- default | icloud | frp | imei | server
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.40,  -- 1.40 = наценка 40%
  min_price NUMERIC(10,2) DEFAULT 0,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Дефолтные настройки наценки
INSERT INTO t_p31606708_tech_buying_service.unlock_markup_config (category, multiplier, note)
VALUES
  ('default', 1.40, 'Базовая наценка 40%'),
  ('icloud',  1.50, 'iCloud unlock — наценка 50%'),
  ('frp',     1.35, 'FRP/Google unlock — наценка 35%'),
  ('server',  1.30, 'Server unlock — наценка 30%'),
  ('imei',    1.45, 'IMEI check — наценка 45%')
ON CONFLICT DO NOTHING;
