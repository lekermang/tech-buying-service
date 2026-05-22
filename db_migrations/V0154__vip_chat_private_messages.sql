-- Личные сообщения: добавляем recipient_id
ALTER TABLE t_p31606708_tech_buying_service.vip_chat_messages
  ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES t_p31606708_tech_buying_service.employees(id);

-- Индекс для быстрого поиска диалогов
CREATE INDEX IF NOT EXISTS idx_vip_chat_dialog
  ON t_p31606708_tech_buying_service.vip_chat_messages (employee_id, recipient_id, id);

CREATE INDEX IF NOT EXISTS idx_vip_chat_recipient
  ON t_p31606708_tech_buying_service.vip_chat_messages (recipient_id, id);

-- Таблица для отслеживания прочитанного отдельно для каждого диалога
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.vip_chat_dialog_reads (
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  peer_id INTEGER NOT NULL,  -- 0 = общий чат, иначе ID собеседника
  last_read_msg_id BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (employee_id, peer_id)
);