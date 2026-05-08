-- Расписание автопродвижения объявлений
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_bump_schedule (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    weekdays TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
    hour INT NOT NULL DEFAULT 10,
    vas_type TEXT NOT NULL DEFAULT 'xl',
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP,
    last_run_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Лог продвижений
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_bump_log (
    id SERIAL PRIMARY KEY,
    avito_id BIGINT NOT NULL,
    vas_type TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    schedule_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bump_log_avito_id ON t_p31606708_tech_buying_service.avito_bump_log(avito_id);
CREATE INDEX IF NOT EXISTS idx_bump_log_created ON t_p31606708_tech_buying_service.avito_bump_log(created_at DESC);

-- Настройки autoload
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_autoload_config (
    id SERIAL PRIMARY KEY,
    feed_url TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    last_generated_at TIMESTAMP,
    last_items_count INT DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p31606708_tech_buying_service.avito_autoload_config (id, is_enabled)
VALUES (1, FALSE)
ON CONFLICT DO NOTHING;
