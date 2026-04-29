ALTER TABLE t_p31606708_tech_buying_service.sl_webhook_log
ADD COLUMN IF NOT EXISTS http_method TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS all_headers JSONB;