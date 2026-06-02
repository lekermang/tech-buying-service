-- Заявки на разблокировку FRP (Google account lock) — для сотрудников Staff.
-- status: new (новая) → in_progress (в работе) → done (разблокировано) → failed (не удалось)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.frp_requests (
  id serial PRIMARY KEY,
  device_model text NOT NULL,
  imei text NULL,
  client_name text NULL,
  client_phone text NULL,
  account_email text NULL,
  note text NULL,
  status text NOT NULL DEFAULT 'new',
  price integer NULL,
  created_by text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  done_at timestamp with time zone NULL
);

CREATE INDEX IF NOT EXISTS idx_frp_requests_status ON t_p31606708_tech_buying_service.frp_requests (status);
CREATE INDEX IF NOT EXISTS idx_frp_requests_created_at ON t_p31606708_tech_buying_service.frp_requests (created_at DESC);
