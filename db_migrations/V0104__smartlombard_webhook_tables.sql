CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.sl_merchants (
    workplace BIGINT PRIMARY KEY,
    shortlink TEXT,
    city TEXT,
    name TEXT,
    address TEXT,
    phone TEXT,
    image_src TEXT,
    image_preview TEXT,
    description TEXT,
    raw JSONB,
    removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.sl_goods (
    article BIGINT NOT NULL,
    item_type SMALLINT NOT NULL DEFAULT 1,
    organization BIGINT,
    workplace BIGINT,
    name TEXT,
    price NUMERIC(14, 2),
    size TEXT,
    open_date TEXT,
    city TEXT,
    features TEXT,
    specifications TEXT,
    category TEXT,
    subcategory TEXT,
    metal_name TEXT,
    metal_standart_name TEXT,
    scrap_product TEXT,
    currency TEXT,
    images JSONB,
    cover_url TEXT,
    sold SMALLINT DEFAULT 0,
    withdrawn SMALLINT DEFAULT 0,
    hidden SMALLINT DEFAULT 0,
    hidden_reason SMALLINT,
    removed BOOLEAN DEFAULT FALSE,
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (article, item_type)
);

CREATE INDEX IF NOT EXISTS idx_sl_goods_workplace ON t_p31606708_tech_buying_service.sl_goods(workplace);
CREATE INDEX IF NOT EXISTS idx_sl_goods_category ON t_p31606708_tech_buying_service.sl_goods(category);
CREATE INDEX IF NOT EXISTS idx_sl_goods_visible ON t_p31606708_tech_buying_service.sl_goods(removed, sold, withdrawn, hidden);
CREATE INDEX IF NOT EXISTS idx_sl_goods_updated ON t_p31606708_tech_buying_service.sl_goods(updated_at DESC);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.sl_webhook_log (
    id BIGSERIAL PRIMARY KEY,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    auth_ok BOOLEAN,
    auth_header TEXT,
    raw_data TEXT,
    parsed JSONB,
    response JSONB,
    items_count INT,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sl_webhook_log_received ON t_p31606708_tech_buying_service.sl_webhook_log(received_at DESC);