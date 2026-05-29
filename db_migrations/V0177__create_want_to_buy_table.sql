CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.want_to_buy (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    item_name TEXT NOT NULL,
    category VARCHAR(100),
    budget VARCHAR(100),
    condition VARCHAR(50),
    comment TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    staff_note TEXT,
    staff_name VARCHAR(100),
    found_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_want_to_buy_status ON t_p31606708_tech_buying_service.want_to_buy(status);
CREATE INDEX IF NOT EXISTS idx_want_to_buy_created ON t_p31606708_tech_buying_service.want_to_buy(created_at DESC);
