CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.growth_roadmap_status (
  task_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'todo',
  note TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.growth_roadmap_log (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_roadmap_log_created ON t_p31606708_tech_buying_service.growth_roadmap_log(created_at DESC);