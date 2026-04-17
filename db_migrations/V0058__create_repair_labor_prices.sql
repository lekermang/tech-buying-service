CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_labor_prices (
    part_type VARCHAR(32) PRIMARY KEY,
    label     TEXT NOT NULL,
    price     INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p31606708_tech_buying_service.repair_labor_prices (part_type, label, price) VALUES
    ('display',      'Дисплей',          2000),
    ('battery',      'Аккумулятор',      1000),
    ('glass',        'Стекло / тачскрин', 700),
    ('camera_glass', 'Стекло камеры',    1000),
    ('flex_board',   'Шлейф / плата',    1200),
    ('accessory',    'Задняя крышка',     500)
ON CONFLICT (part_type) DO NOTHING;