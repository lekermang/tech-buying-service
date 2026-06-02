-- Бонус приёмщика (Богдана) за принесённый и оформленный ремонт.
-- created_by      — login сотрудника, который оформил заявку (приёмщик)
-- acceptor_bonus  — сумма бонуса приёмщика (300/400/500/1000), выбирается при оформлении
-- acceptor_bonus_locked_at — когда бонус зафиксирован (при переводе ремонта в "готов")
-- acceptor_bonus_paid      — выплачен ли бонус приёмщику (учитывается как закупка/долг)

ALTER TABLE t_p31606708_tech_buying_service.repair_orders
  ADD COLUMN IF NOT EXISTS created_by text NULL,
  ADD COLUMN IF NOT EXISTS acceptor_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acceptor_bonus_locked_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS acceptor_bonus_paid boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_repair_orders_created_by
  ON t_p31606708_tech_buying_service.repair_orders (created_by);
