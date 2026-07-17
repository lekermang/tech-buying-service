CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.cash_balance_checks (
    id              SERIAL PRIMARY KEY,
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    slot            TEXT NOT NULL DEFAULT 'manual',
    cash_amount     NUMERIC(12,2) NOT NULL,
    gold_585_grams  NUMERIC(10,3) NOT NULL,
    comment         TEXT,
    employee_id     INTEGER,
    employee_name   TEXT
);