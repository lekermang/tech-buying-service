CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.tools_products (
  article VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  brand VARCHAR(128),
  category VARCHAR(256),
  updated_at TIMESTAMP DEFAULT NOW()
);