UPDATE t_p31606708_tech_buying_service.repair_orders 
SET status = 'done', 
    status_updated_at = NOW(), 
    picked_up_at = NOW() 
WHERE status = 'ready';