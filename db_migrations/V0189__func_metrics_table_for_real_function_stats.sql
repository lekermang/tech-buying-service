CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.func_metrics (
    id BIGSERIAL PRIMARY KEY,
    func_name VARCHAR(80) NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    is_error BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_func_metrics_name_time
    ON t_p31606708_tech_buying_service.func_metrics (func_name, created_at);

CREATE INDEX IF NOT EXISTS idx_func_metrics_time
    ON t_p31606708_tech_buying_service.func_metrics (created_at);