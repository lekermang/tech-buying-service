CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.cash_day_counts (
    id SERIAL PRIMARY KEY,
    count_date DATE NOT NULL,
    account_id INTEGER REFERENCES t_p31606708_tech_buying_service.slshop_cash_accounts(id),
    cash_counted NUMERIC(14,2) NOT NULL DEFAULT 0,
    safe_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    cashless_counted NUMERIC(14,2),
    expected_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
    expected_cashless NUMERIC(14,2) NOT NULL DEFAULT 0,
    diff_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
    diff_cashless NUMERIC(14,2),
    corrected BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT,
    employee_id INTEGER,
    employee_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cash_day_counts_date ON t_p31606708_tech_buying_service.cash_day_counts(count_date DESC, account_id);

ALTER TABLE t_p31606708_tech_buying_service.contracts_14d_payments
    ADD COLUMN IF NOT EXISTS pay_method VARCHAR(12) NOT NULL DEFAULT 'cash';
