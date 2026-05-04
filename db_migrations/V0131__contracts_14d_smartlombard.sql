-- Договор продажи на 14 дней (СмартЛомбард)
-- Изолированные таблицы с префиксом contracts_14d_*

CREATE TABLE IF NOT EXISTS contracts_14d_clients (
    id              SERIAL PRIMARY KEY,
    full_name       TEXT NOT NULL,
    birth_date      DATE,
    passport_series TEXT,
    passport_number TEXT,
    passport_issued_by TEXT,
    passport_issue_date DATE,
    phone           TEXT,
    email           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_c14d_clients_phone ON contracts_14d_clients(phone);
CREATE INDEX IF NOT EXISTS idx_c14d_clients_name  ON contracts_14d_clients(full_name);

CREATE TABLE IF NOT EXISTS contracts_14d_items (
    id              SERIAL PRIMARY KEY,
    item_type       TEXT,
    brand           TEXT,
    model           TEXT,
    serial_number   TEXT,
    condition       TEXT,
    accessories     JSONB DEFAULT '[]'::jsonb,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts_14d (
    id              SERIAL PRIMARY KEY,
    contract_number TEXT UNIQUE NOT NULL,
    client_id       INTEGER NOT NULL REFERENCES contracts_14d_clients(id),
    item_id         INTEGER NOT NULL REFERENCES contracts_14d_items(id),
    amount          NUMERIC(12,2) NOT NULL,
    interest_rate   NUMERIC(6,3) NOT NULL DEFAULT 4.000,
    term_days       INTEGER NOT NULL DEFAULT 14,
    total_due       NUMERIC(12,2) NOT NULL,
    paid_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
    remaining_debt  NUMERIC(12,2) NOT NULL,
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    terminate_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_c14d_status      ON contracts_14d(status);
CREATE INDEX IF NOT EXISTS idx_c14d_end_date    ON contracts_14d(end_date);
CREATE INDEX IF NOT EXISTS idx_c14d_client_id   ON contracts_14d(client_id);
CREATE INDEX IF NOT EXISTS idx_c14d_number      ON contracts_14d(contract_number);

CREATE TABLE IF NOT EXISTS contracts_14d_payments (
    id              SERIAL PRIMARY KEY,
    contract_id     INTEGER NOT NULL REFERENCES contracts_14d(id),
    amount          NUMERIC(12,2) NOT NULL,
    payment_type    TEXT NOT NULL DEFAULT 'partial',
    comment         TEXT,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by     TEXT
);
CREATE INDEX IF NOT EXISTS idx_c14d_payments_contract ON contracts_14d_payments(contract_id);

CREATE TABLE IF NOT EXISTS contracts_14d_photos (
    id              SERIAL PRIMARY KEY,
    contract_id     INTEGER NOT NULL REFERENCES contracts_14d(id),
    photo_type      TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    s3_key          TEXT,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_c14d_photos_contract ON contracts_14d_photos(contract_id);

CREATE TABLE IF NOT EXISTS contracts_14d_log (
    id              SERIAL PRIMARY KEY,
    contract_id     INTEGER REFERENCES contracts_14d(id),
    action          TEXT NOT NULL,
    details         JSONB DEFAULT '{}'::jsonb,
    actor_name      TEXT,
    actor_role      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_c14d_log_contract ON contracts_14d_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_c14d_log_created  ON contracts_14d_log(created_at DESC);
