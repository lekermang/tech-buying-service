-- Таблица для сессий переноса данных
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.transfer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  has_contacts BOOLEAN NOT NULL DEFAULT FALSE,
  has_photos BOOLEAN NOT NULL DEFAULT FALSE,
  has_docs BOOLEAN NOT NULL DEFAULT FALSE,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  files_count INTEGER NOT NULL DEFAULT 0,
  receiver_connected BOOLEAN NOT NULL DEFAULT FALSE,
  download_started BOOLEAN NOT NULL DEFAULT FALSE,
  download_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  ip_sender TEXT NULL
);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.transfer_files (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  s3_key TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_sessions_code ON t_p31606708_tech_buying_service.transfer_sessions(code);
CREATE INDEX IF NOT EXISTS idx_transfer_sessions_expires ON t_p31606708_tech_buying_service.transfer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_transfer_files_session ON t_p31606708_tech_buying_service.transfer_files(session_id);