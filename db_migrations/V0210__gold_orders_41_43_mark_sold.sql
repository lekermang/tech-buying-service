UPDATE t_p31606708_tech_buying_service.gold_orders
SET status = 'done',
    status_updated_at = created_at,
    completed_at = created_at
WHERE id IN (41, 42, 43) AND status = 'new';