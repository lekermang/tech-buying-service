-- Push-подписки сотрудников для чата СКУПКА24Vip
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.vip_chat_push_subs (
  id           bigserial PRIMARY KEY,
  employee_id  integer NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  endpoint     text NOT NULL UNIQUE,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_push_employee ON t_p31606708_tech_buying_service.vip_chat_push_subs (employee_id);
