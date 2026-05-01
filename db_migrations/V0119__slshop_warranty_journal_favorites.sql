-- Привязка гарантии к товару (по умолчанию 365 дней, можно переопределять)
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS warranty_days INTEGER DEFAULT 365;
ALTER TABLE slshop_items ADD COLUMN IF NOT EXISTS warranty_until DATE;

-- Системный журнал событий (для раздела «Журнал»)
CREATE TABLE IF NOT EXISTS slshop_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40),
  entity_id INTEGER,
  title VARCHAR(255),
  description TEXT,
  amount NUMERIC(14,2),
  branch_id INTEGER,
  employee_name VARCHAR(150),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_events_date ON slshop_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slshop_events_type ON slshop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_slshop_events_entity ON slshop_events(entity_type, entity_id);

-- Избранное (быстрые ссылки сотрудника)
CREATE TABLE IF NOT EXISTS slshop_favorites (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  kind VARCHAR(40) NOT NULL,
  ref_id INTEGER,
  label VARCHAR(255),
  url TEXT,
  icon VARCHAR(40) DEFAULT 'Star',
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_favorites_emp ON slshop_favorites(employee_id);
