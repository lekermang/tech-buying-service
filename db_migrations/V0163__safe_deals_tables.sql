-- Безопасные сделки: продавец привозит товар в офис (Кирова, 11),
-- мы выступаем гарантом, передаём покупателю, фиксируем сделку по QR.
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.safe_deals (
  id SERIAL PRIMARY KEY,
  deal_number TEXT UNIQUE NOT NULL,
  seller_token TEXT UNIQUE NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  -- submitted -> review -> on_shelf -> reserved -> completed | cancelled | returned
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  seller_email TEXT NULL,
  product_title TEXT NOT NULL,
  product_brand TEXT NULL,
  product_model TEXT NULL,
  product_category TEXT NULL,
  product_condition TEXT NULL,
  product_description TEXT NULL,
  product_serial TEXT NULL,
  price NUMERIC(12,2) NOT NULL,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  seller_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payout_method TEXT NOT NULL DEFAULT 'cash',
  payout_details TEXT NULL,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  office_check_notes TEXT NULL,
  office_checked_by TEXT NULL,
  office_checked_at TIMESTAMPTZ NULL,
  buyer_name TEXT NULL,
  buyer_phone TEXT NULL,
  reservation_until TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  cancel_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.safe_deal_events (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB NULL,
  actor TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safe_deals_token ON t_p31606708_tech_buying_service.safe_deals(seller_token);
CREATE INDEX IF NOT EXISTS idx_safe_deals_qr ON t_p31606708_tech_buying_service.safe_deals(qr_code);
CREATE INDEX IF NOT EXISTS idx_safe_deals_status ON t_p31606708_tech_buying_service.safe_deals(status);
CREATE INDEX IF NOT EXISTS idx_safe_deals_created ON t_p31606708_tech_buying_service.safe_deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safe_deal_events_deal ON t_p31606708_tech_buying_service.safe_deal_events(deal_id);