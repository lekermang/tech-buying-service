-- Журнал действий (audit log)
CREATE TABLE IF NOT EXISTS slshop_journal (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(40),
  entity_id INTEGER,
  employee_id INTEGER,
  employee_name VARCHAR(150),
  employee_role VARCHAR(40),
  branch_id INTEGER REFERENCES slshop_branches(id),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_journal_date ON slshop_journal(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slshop_journal_action ON slshop_journal(action);
CREATE INDEX IF NOT EXISTS idx_slshop_journal_employee ON slshop_journal(employee_id);
CREATE INDEX IF NOT EXISTS idx_slshop_journal_entity ON slshop_journal(entity_type, entity_id);

-- Избранное (товары/клиенты на быстрый доступ)
CREATE TABLE IF NOT EXISTS slshop_favorites (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_slshop_favorites_emp ON slshop_favorites(employee_id);
