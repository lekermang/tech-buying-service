CREATE TABLE t_p31606708_tech_buying_service.repair_orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  model TEXT,
  repair_type TEXT,
  price INTEGER,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  admin_note TEXT
);
