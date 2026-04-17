CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_parts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32),
    name TEXT NOT NULL,
    category TEXT,
    category_id VARCHAR(64),
    price NUMERIC(10,2),
    stock NUMERIC(10,2) DEFAULT 0,
    available BOOLEAN DEFAULT true,
    quality VARCHAR(8),
    part_type VARCHAR(64),
    model_keywords TEXT,
    labor_cost INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);