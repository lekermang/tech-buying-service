-- Интеграция договоров 14 дней с кассой и поддержка start_date

-- В договоре фиксируем кассу выдачи и связанное движение
ALTER TABLE contracts_14d
  ADD COLUMN IF NOT EXISTS cash_account_id INTEGER REFERENCES slshop_cash_accounts(id),
  ADD COLUMN IF NOT EXISTS payout_movement_id INTEGER REFERENCES slshop_cash_movements(id);

-- В платежах фиксируем кассу прихода и связанное движение
ALTER TABLE contracts_14d_payments
  ADD COLUMN IF NOT EXISTS cash_account_id INTEGER REFERENCES slshop_cash_accounts(id),
  ADD COLUMN IF NOT EXISTS cash_movement_id INTEGER REFERENCES slshop_cash_movements(id),
  ADD COLUMN IF NOT EXISTS income_type VARCHAR(20) NOT NULL DEFAULT 'mixed';
-- income_type: principal | interest | penalty | mixed

-- Индексы для отчётов
CREATE INDEX IF NOT EXISTS idx_c14d_payments_paid_at ON contracts_14d_payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_c14d_start_date      ON contracts_14d(start_date);
