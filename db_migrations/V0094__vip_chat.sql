-- Чат «СКУПКА24Vip» для сотрудников
-- 1. Расширяем employees: аватар + last_seen для онлайн-статуса
ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS avatar_url   text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. Сообщения общего чата (групповой)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.vip_chat_messages (
  id          bigserial PRIMARY KEY,
  employee_id integer NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  text        text,
  photo_url   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_chat_created  ON t_p31606708_tech_buying_service.vip_chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_chat_employee ON t_p31606708_tech_buying_service.vip_chat_messages (employee_id);

-- 3. Прочитанные сообщения (для счётчика непрочитанных)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.vip_chat_reads (
  employee_id      integer NOT NULL PRIMARY KEY REFERENCES t_p31606708_tech_buying_service.employees(id),
  last_read_msg_id bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);
