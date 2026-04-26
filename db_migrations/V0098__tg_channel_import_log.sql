CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.tg_channel_import_log (
    id SERIAL PRIMARY KEY,
    channel TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ NULL,
    requested_limit INTEGER NOT NULL DEFAULT 0,
    offset_id BIGINT NOT NULL DEFAULT 0,
    matched INTEGER NOT NULL DEFAULT 0,
    no_match INTEGER NOT NULL DEFAULT 0,
    no_photo INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    last_id BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tg_import_started
    ON t_p31606708_tech_buying_service.tg_channel_import_log(started_at DESC);