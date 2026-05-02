-- Добавляем ОЗУ и память в ГБ как отдельные числовые поля для товаров
ALTER TABLE t_p31606708_tech_buying_service.slshop_items
  ADD COLUMN IF NOT EXISTS ram_gb INTEGER,
  ADD COLUMN IF NOT EXISTS storage_gb INTEGER;

-- Бэкфилл из существующего поля storage (форматы "4/128", "4/128GB")
UPDATE t_p31606708_tech_buying_service.slshop_items
SET ram_gb = COALESCE(ram_gb, NULLIF(SUBSTRING(storage FROM '^\s*(\d{1,3})\s*/'), '')::INTEGER),
    storage_gb = COALESCE(storage_gb, NULLIF(SUBSTRING(storage FROM '/\s*(\d{2,4})'), '')::INTEGER)
WHERE storage IS NOT NULL AND storage <> '';

-- Справочник характеристик смартфонов (smarfony.ru)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.phone_specs_catalog (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(160) NOT NULL,
  is_apple BOOLEAN DEFAULT FALSE,
  display VARCHAR(120),
  ram VARCHAR(60),
  battery VARCHAR(60),
  processor VARCHAR(120),
  camera VARCHAR(120),
  short_text VARCHAR(200),
  source_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (brand, model)
);

CREATE INDEX IF NOT EXISTS idx_phone_specs_brand ON t_p31606708_tech_buying_service.phone_specs_catalog (brand);
CREATE INDEX IF NOT EXISTS idx_phone_specs_model ON t_p31606708_tech_buying_service.phone_specs_catalog (model);