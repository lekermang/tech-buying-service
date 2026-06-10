CREATE TABLE IF NOT EXISTS employee_debts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  comment TEXT,
  is_repaid BOOLEAN NOT NULL DEFAULT FALSE,
  repaid_at TIMESTAMPTZ,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_debts_employee_id ON employee_debts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_debts_is_repaid ON employee_debts(is_repaid);
