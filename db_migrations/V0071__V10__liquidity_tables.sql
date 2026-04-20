
-- Таблица операций учёта ликвидности
CREATE TABLE t_p31606708_tech_buying_service.liquidity_entries (
    id          SERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    shop        TEXT NOT NULL DEFAULT 'kirova7',  -- 'kirova7' | 'kirova11'
    category    TEXT NOT NULL,  -- 'gold_buy' | 'gold_sell' | 'repair' | 'phone_sale' | 'rent' | 'other_expense'
    amount      NUMERIC(12,2) NOT NULL,  -- положительное = доход, отрицательное = расход
    comment     TEXT,
    -- для золота
    gold_grams  NUMERIC(10,3),
    gold_price_per_gram NUMERIC(10,2),
    -- метаданные
    source      TEXT DEFAULT 'manual'  -- 'manual' | 'auto_repair' | 'auto_rent'
);

-- Индексы
CREATE INDEX idx_liquidity_date ON t_p31606708_tech_buying_service.liquidity_entries(entry_date DESC);
CREATE INDEX idx_liquidity_shop ON t_p31606708_tech_buying_service.liquidity_entries(shop);
CREATE INDEX idx_liquidity_category ON t_p31606708_tech_buying_service.liquidity_entries(category);

-- Таблица настроек аренды
CREATE TABLE t_p31606708_tech_buying_service.liquidity_rent (
    id          SERIAL PRIMARY KEY,
    shop        TEXT NOT NULL UNIQUE,  -- 'kirova7' | 'kirova11'
    amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    day_of_month INTEGER NOT NULL,  -- 25 для kirova7, 10 для kirova11
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Начальные записи аренды
INSERT INTO t_p31606708_tech_buying_service.liquidity_rent (shop, amount, day_of_month)
VALUES ('kirova7', 0, 25), ('kirova11', 0, 10);

-- Таблица золота в наличии (накопленный остаток)
CREATE TABLE t_p31606708_tech_buying_service.liquidity_gold_stock (
    id          SERIAL PRIMARY KEY,
    grams       NUMERIC(10,3) NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT now()
);
INSERT INTO t_p31606708_tech_buying_service.liquidity_gold_stock (grams) VALUES (0);
