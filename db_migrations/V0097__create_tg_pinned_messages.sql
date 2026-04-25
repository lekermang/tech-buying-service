CREATE TABLE IF NOT EXISTS tg_pinned_messages (
  id SERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  message_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tg_pinned_messages_uniq UNIQUE (chat_id, kind, category)
);

CREATE INDEX IF NOT EXISTS idx_tg_pinned_chat ON tg_pinned_messages(chat_id);
