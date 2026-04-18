-- Таблица доп. работ (настраиваемые цены)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_extra_works (
    id        SERIAL PRIMARY KEY,
    label     TEXT NOT NULL,
    price     INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO t_p31606708_tech_buying_service.repair_extra_works (label, price, sort_order) VALUES
    ('Восстановление влагозащиты', 700, 1),
    ('Чистка динамиков', 200, 2),
    ('Убрать окисления', 500, 3),
    ('Установка защитного стекла', 1000, 4)
ON CONFLICT DO NOTHING;

-- Таблица клиентов со скидками
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_clients (
    id           SERIAL PRIMARY KEY,
    full_name    TEXT NOT NULL,
    phone        TEXT NOT NULL UNIQUE,
    birth_date   DATE,
    referrer_id  INTEGER REFERENCES t_p31606708_tech_buying_service.repair_clients(id),
    discount_pct INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);