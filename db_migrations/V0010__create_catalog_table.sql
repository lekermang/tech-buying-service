CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.catalog (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT,
  storage TEXT,
  ram TEXT,
  region TEXT,
  availability TEXT NOT NULL DEFAULT 'in_stock', -- in_stock / on_order
  price INTEGER, -- NULL = "цену уточняйте"
  has_photo BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_category ON t_p31606708_tech_buying_service.catalog(category);
CREATE INDEX IF NOT EXISTS idx_catalog_availability ON t_p31606708_tech_buying_service.catalog(availability);
CREATE INDEX IF NOT EXISTS idx_catalog_brand ON t_p31606708_tech_buying_service.catalog(brand);
