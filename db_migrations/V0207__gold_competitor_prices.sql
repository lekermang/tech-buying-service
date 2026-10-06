CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.gold_competitor_prices (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    purity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gold_comp_prices_src_time
    ON t_p31606708_tech_buying_service.gold_competitor_prices (source, recorded_at DESC);