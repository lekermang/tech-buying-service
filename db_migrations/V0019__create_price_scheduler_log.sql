CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.price_scheduler_log (
    id SERIAL PRIMARY KEY,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);