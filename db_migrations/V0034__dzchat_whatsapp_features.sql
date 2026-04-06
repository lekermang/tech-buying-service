ALTER TABLE t_p31606708_tech_buying_service.dzchat_messages ADD COLUMN IF NOT EXISTS reply_to INTEGER REFERENCES t_p31606708_tech_buying_service.dzchat_messages(id);
ALTER TABLE t_p31606708_tech_buying_service.dzchat_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE t_p31606708_tech_buying_service.dzchat_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER DEFAULT 0;
ALTER TABLE t_p31606708_tech_buying_service.dzchat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.dzchat_reactions (
    id SERIAL PRIMARY KEY,
    msg_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.dzchat_messages(id),
    user_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.dzchat_users(id),
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(msg_id, user_id)
);

ALTER TABLE t_p31606708_tech_buying_service.dzchat_users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_dzchat_reactions_msg ON t_p31606708_tech_buying_service.dzchat_reactions(msg_id);
CREATE INDEX IF NOT EXISTS idx_dzchat_messages_reply ON t_p31606708_tech_buying_service.dzchat_messages(reply_to);
