CREATE TABLE t_p31606708_tech_buying_service.news_post_log (
  id SERIAL PRIMARY KEY,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  topic TEXT,
  message_id INTEGER,
  error TEXT
);
