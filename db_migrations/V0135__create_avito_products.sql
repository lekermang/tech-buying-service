CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_products (
    id BIGSERIAL PRIMARY KEY,
    avito_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price BIGINT,
    old_price BIGINT,
    currency TEXT DEFAULT 'RUB',
    category TEXT,
    url TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    photos JSONB DEFAULT '[]'::jsonb,
    main_photo TEXT,
    avito_status TEXT,
    is_visible BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    raw_data JSONB,
    avito_created_at TIMESTAMP,
    avito_updated_at TIMESTAMP,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avito_products_status ON t_p31606708_tech_buying_service.avito_products(status);
CREATE INDEX IF NOT EXISTS idx_avito_products_visible ON t_p31606708_tech_buying_service.avito_products(is_visible);
CREATE INDEX IF NOT EXISTS idx_avito_products_category ON t_p31606708_tech_buying_service.avito_products(category);
CREATE INDEX IF NOT EXISTS idx_avito_products_synced ON t_p31606708_tech_buying_service.avito_products(synced_at);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_sync_log (
    id BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    status TEXT DEFAULT 'running',
    items_total INT DEFAULT 0,
    items_added INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_archived INT DEFAULT 0,
    photos_uploaded INT DEFAULT 0,
    error_message TEXT
);
