ALTER TABLE t_p31606708_tech_buying_service.catalog
  ADD COLUMN IF NOT EXISTS description text NULL,
  ADD COLUMN IF NOT EXISTS specs jsonb NULL;
