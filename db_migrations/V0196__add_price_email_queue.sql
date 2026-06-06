CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.price_email_queue (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  markup     INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending / sent / error
  error_msg  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at    TIMESTAMPTZ
);