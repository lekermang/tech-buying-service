-- Цели накопления (копилки)
CREATE TABLE t_p31606708_tech_buying_service.savings_goals (
  id            SERIAL PRIMARY KEY,
  employee_id   INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  title         TEXT NOT NULL,
  description   TEXT,
  target_amount INTEGER NOT NULL,
  current_amount INTEGER NOT NULL DEFAULT 0,
  emoji         TEXT DEFAULT '🎯',
  color         TEXT DEFAULT '#FFD700',
  deadline      DATE,
  status        TEXT NOT NULL DEFAULT 'active',  -- active, done, paused, cancelled
  auto_save_percent INTEGER DEFAULT 0,           -- % от заработка автоматом
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Транзакции по накоплениям
CREATE TABLE t_p31606708_tech_buying_service.savings_log (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  goal_id     INTEGER REFERENCES t_p31606708_tech_buying_service.savings_goals(id),
  amount      INTEGER NOT NULL,           -- >0 пополнение, <0 снятие
  note        TEXT,
  source      TEXT DEFAULT 'manual',      -- manual, auto, withdraw
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_emp ON t_p31606708_tech_buying_service.savings_goals(employee_id);
CREATE INDEX idx_savings_log_emp ON t_p31606708_tech_buying_service.savings_log(employee_id, created_at DESC);
CREATE INDEX idx_savings_log_goal ON t_p31606708_tech_buying_service.savings_log(goal_id);
