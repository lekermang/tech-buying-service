CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.growth_roadmap_notes (
  id SERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_roadmap_notes_task ON t_p31606708_tech_buying_service.growth_roadmap_notes(task_id, created_at DESC);