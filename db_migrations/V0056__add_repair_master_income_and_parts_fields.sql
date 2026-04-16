ALTER TABLE t_p31606708_tech_buying_service.repair_orders
  ADD COLUMN IF NOT EXISTS master_income integer NULL,
  ADD COLUMN IF NOT EXISTS parts_name text NULL;

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.repair_daily_master_income (
  id serial PRIMARY KEY,
  report_date date NOT NULL,
  total_revenue integer NOT NULL DEFAULT 0,
  total_costs integer NOT NULL DEFAULT 0,
  profit integer NOT NULL DEFAULT 0,
  master_income integer NOT NULL DEFAULT 0,
  orders_done integer NOT NULL DEFAULT 0,
  sent_at timestamp with time zone DEFAULT now(),
  UNIQUE(report_date)
);