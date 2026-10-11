ALTER TABLE t_p31606708_tech_buying_service.contracts_14d
    ADD COLUMN IF NOT EXISTS payout_method VARCHAR(12) NOT NULL DEFAULT 'cash';
