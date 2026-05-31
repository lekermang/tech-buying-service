CREATE TABLE t_p31606708_tech_buying_service.employee_sessions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_employee_sessions_employee_id ON t_p31606708_tech_buying_service.employee_sessions(employee_id);
CREATE INDEX idx_employee_sessions_login_at ON t_p31606708_tech_buying_service.employee_sessions(login_at DESC);