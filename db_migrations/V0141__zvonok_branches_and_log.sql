-- Филиалы (адреса для робота-звонка)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.zvonok_branches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    hours TEXT,
    specialization TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO t_p31606708_tech_buying_service.zvonok_branches (name, address, phone, hours, specialization, sort_order)
SELECT 'Кирова 7', 'улица Кирова 7', '+79929990333', '10:00-21:00', 'ремонт+скупка', 1
WHERE NOT EXISTS (SELECT 1 FROM t_p31606708_tech_buying_service.zvonok_branches WHERE address ILIKE '%Кирова 7%');

INSERT INTO t_p31606708_tech_buying_service.zvonok_branches (name, address, phone, hours, specialization, sort_order)
SELECT 'Кирова 11', 'улица Кирова 11', '+79929990333', '10:00-21:00', 'золото+скупка', 2
WHERE NOT EXISTS (SELECT 1 FROM t_p31606708_tech_buying_service.zvonok_branches WHERE address ILIKE '%Кирова 11%');

-- Лог звонков Zvonok (для аналитики и анти-дубль)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.zvonok_log (
    id SERIAL PRIMARY KEY,
    purpose TEXT NOT NULL,
    phone TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    related_type TEXT,
    related_id INTEGER,
    initiator_type TEXT,
    initiator_id INTEGER,
    api_response JSONB,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zvonok_log_phone ON t_p31606708_tech_buying_service.zvonok_log(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvonok_log_related ON t_p31606708_tech_buying_service.zvonok_log(related_type, related_id);
