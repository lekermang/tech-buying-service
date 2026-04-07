CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.dzchat_push_subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.dzchat_users(id),
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);