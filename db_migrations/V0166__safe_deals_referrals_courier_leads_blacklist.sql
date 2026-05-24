-- Реферальная программа
ALTER TABLE t_p31606708_tech_buying_service.safe_deals
  ADD COLUMN IF NOT EXISTS referral_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS referrer_token TEXT NULL,
  ADD COLUMN IF NOT EXISTS courier_pickup BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS courier_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS courier_fee NUMERIC(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS courier_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS warranty_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS warranty_until TIMESTAMPTZ NULL;

-- Подписки на чек-лист (для лидов)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.safe_deals_leads (
  id SERIAL PRIMARY KEY,
  contact TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'checklist',
  utm TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_safe_leads_contact ON t_p31606708_tech_buying_service.safe_deals_leads(contact);

-- Расширим чёрный список — поля для публичного отображения
ALTER TABLE t_p31606708_tech_buying_service.safe_deals_blacklist
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS incidents_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'seller';