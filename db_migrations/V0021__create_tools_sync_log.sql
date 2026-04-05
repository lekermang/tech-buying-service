CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.tools_sync_log (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running',
  imported INT,
  error TEXT
);