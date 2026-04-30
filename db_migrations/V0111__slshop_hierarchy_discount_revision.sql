-- Иерархия категорий: parent_id, глубина, активность для сезонности
ALTER TABLE slshop_categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES slshop_categories(id);
ALTER TABLE slshop_categories ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;
ALTER TABLE slshop_categories ADD COLUMN IF NOT EXISTS path TEXT;
CREATE INDEX IF NOT EXISTS idx_slshop_categories_parent ON slshop_categories(parent_id);

-- Правила уценки
CREATE TABLE IF NOT EXISTS slshop_discount_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INTEGER REFERENCES slshop_categories(id),
  apply_to_all BOOLEAN DEFAULT FALSE,
  period_days INTEGER NOT NULL DEFAULT 30,
  percent NUMERIC(6,2) NOT NULL DEFAULT 5,
  use_market_price BOOLEAN DEFAULT FALSE,
  use_duplicates_dependency BOOLEAN DEFAULT FALSE,
  rounding VARCHAR(20) DEFAULT 'one_decimal',
  is_active BOOLEAN DEFAULT TRUE,
  max_discount_percent NUMERIC(6,2),
  min_price NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_discount_rules_cat ON slshop_discount_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_slshop_discount_rules_active ON slshop_discount_rules(is_active);

-- История применения уценки к товарам
CREATE TABLE IF NOT EXISTS slshop_discount_log (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES slshop_items(id),
  rule_id INTEGER REFERENCES slshop_discount_rules(id),
  price_before NUMERIC(12,2),
  price_after NUMERIC(12,2),
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_discount_log_item ON slshop_discount_log(item_id);

-- В товаре — дата последней уценки и счётчик
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS last_discount_at TIMESTAMPTZ;
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS discount_count INTEGER DEFAULT 0;
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS original_sell_price NUMERIC(12,2);
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS external_id VARCHAR(40);
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS legal_entity VARCHAR(120);
CREATE INDEX IF NOT EXISTS idx_slshop_items_external ON slshop_items(external_id);

-- Ревизии (инвентаризация склада)
CREATE TABLE IF NOT EXISTS slshop_revisions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  category_id INTEGER REFERENCES slshop_categories(id),
  scope_status VARCHAR(20),
  started_by VARCHAR(150),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_expected INTEGER DEFAULT 0,
  total_found INTEGER DEFAULT 0,
  total_missing INTEGER DEFAULT 0,
  total_extra INTEGER DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS slshop_revision_items (
  id SERIAL PRIMARY KEY,
  revision_id INTEGER NOT NULL REFERENCES slshop_revisions(id),
  item_id INTEGER REFERENCES slshop_items(id),
  scanned_code VARCHAR(120),
  state VARCHAR(20) DEFAULT 'pending',
  scanned_at TIMESTAMPTZ,
  scanned_by VARCHAR(150),
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_slshop_revision_items_rev ON slshop_revision_items(revision_id);
CREATE INDEX IF NOT EXISTS idx_slshop_revision_items_state ON slshop_revision_items(state);
