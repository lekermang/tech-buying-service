-- Добавляем паспортные данные и связь с импортом Авито к safe_deals
ALTER TABLE t_p31606708_tech_buying_service.safe_deals
  ADD COLUMN IF NOT EXISTS seller_passport JSONB NULL,
  ADD COLUMN IF NOT EXISTS seller_passport_photo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS seller_yandex_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS avito_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS ai_check JSONB NULL,
  ADD COLUMN IF NOT EXISTS category_id INTEGER NULL;