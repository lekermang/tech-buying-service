-- Наценка по категории (в процентах) для прайса запчастей
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_parts_markup (
    category TEXT PRIMARY KEY,
    markup_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Партия загрузки прайса: id партии + время
ALTER TABLE t_p31606708_tech_buying_service.repair_parts
    ADD COLUMN IF NOT EXISTS price_batch_id TEXT,
    ADD COLUMN IF NOT EXISTS supplier_price NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_repair_parts_batch ON t_p31606708_tech_buying_service.repair_parts(price_batch_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_updated ON t_p31606708_tech_buying_service.repair_parts(updated_at DESC);