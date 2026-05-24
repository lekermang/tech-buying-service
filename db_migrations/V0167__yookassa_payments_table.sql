-- Платежи ЮKassa (для апгрейдов и курьера)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.yookassa_payments (
  id SERIAL PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  related_token TEXT NULL,
  related_id INTEGER NULL,
  metadata JSONB NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_yk_payments_token ON t_p31606708_tech_buying_service.yookassa_payments(related_token);
CREATE INDEX IF NOT EXISTS idx_yk_payments_status ON t_p31606708_tech_buying_service.yookassa_payments(status);

-- Учёт оплат на сделке
ALTER TABLE t_p31606708_tech_buying_service.safe_deals
  ADD COLUMN IF NOT EXISTS featured_paid_via TEXT NULL,
  ADD COLUMN IF NOT EXISTS courier_paid_via TEXT NULL,
  ADD COLUMN IF NOT EXISTS courier_paid_at TIMESTAMPTZ NULL;