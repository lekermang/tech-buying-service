INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description)
VALUES ('parts_markup', '0', 'Наценка на запчасти для ремонта (руб, прибавляется к цене запчасти)')
ON CONFLICT (key) DO NOTHING;