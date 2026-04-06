
CREATE TABLE t_p31606708_tech_buying_service.dzchat_users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP,
  session_token VARCHAR(64),
  session_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p31606708_tech_buying_service.dzchat_chats (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) DEFAULT 'direct',
  name VARCHAR(100),
  avatar_url TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p31606708_tech_buying_service.dzchat_members (
  chat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE t_p31606708_tech_buying_service.dzchat_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  msg_text TEXT,
  photo_url TEXT,
  forwarded_from INTEGER,
  removed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dzchat_msg_chat ON t_p31606708_tech_buying_service.dzchat_messages(chat_id, created_at DESC);
CREATE INDEX idx_dzchat_mbr_user ON t_p31606708_tech_buying_service.dzchat_members(user_id);
