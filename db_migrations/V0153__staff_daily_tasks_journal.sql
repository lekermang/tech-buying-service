-- Журнал выполнения ежедневных задач сотрудниками
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.staff_daily_tasks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    task_key VARCHAR(80) NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    note TEXT,
    completed_at TIMESTAMPTZ,
    UNIQUE (employee_id, task_date, task_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_daily_tasks_date
    ON t_p31606708_tech_buying_service.staff_daily_tasks (task_date, employee_id);
