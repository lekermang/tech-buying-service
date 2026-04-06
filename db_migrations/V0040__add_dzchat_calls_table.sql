CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.dzchat_calls (
  id          SERIAL PRIMARY KEY,
  chat_id     INTEGER NOT NULL,
  caller_id   INTEGER NOT NULL,
  callee_id   INTEGER NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'ringing',
  -- ringing | accepted | rejected | ended | missed | busy
  call_type   VARCHAR(10) NOT NULL DEFAULT 'audio',
  -- audio | video
  offer_sdp   TEXT,
  answer_sdp  TEXT,
  ice_caller  JSONB DEFAULT '[]'::jsonb,
  ice_callee  JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dzchat_calls_chat ON t_p31606708_tech_buying_service.dzchat_calls(chat_id);
CREATE INDEX IF NOT EXISTS idx_dzchat_calls_callee ON t_p31606708_tech_buying_service.dzchat_calls(callee_id, status);
CREATE INDEX IF NOT EXISTS idx_dzchat_calls_updated ON t_p31606708_tech_buying_service.dzchat_calls(updated_at);