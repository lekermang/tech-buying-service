-- Финансовые параметры, которые нельзя получить из транзакций (ручной ввод владельцем)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.finance_params (
    id SERIAL PRIMARY KEY,
    key VARCHAR(64) NOT NULL UNIQUE,
    value NUMERIC(18, 4) NOT NULL DEFAULT 0,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(150)
);

-- Стартовые значения (нули — заполнит пользователь через UI)
INSERT INTO t_p31606708_tech_buying_service.finance_params (key, value, description) VALUES
    ('total_assets',           0, 'Активы всего (для ROA, инвестир. капитала)'),
    ('non_interest_liab',      0, 'Беспроцентные обязательства'),
    ('equity',                 0, 'Собственный капитал (для ROE)'),
    ('debt',                   0, 'Заёмный капитал (для WACC)'),
    ('cost_of_debt',           0, 'Стоимость долга, % годовых'),
    ('cost_of_equity',         0, 'Стоимость капитала, % годовых'),
    ('tax_rate',               6, 'Ставка налога, % (УСН-доходы=6)'),
    ('shares_outstanding',     0, 'Кол-во акций / долей (для EPS)'),
    ('dividends_paid',         0, 'Выплаченные дивиденды за период'),
    ('interest_paid',          0, 'Проценты к уплате за период'),
    ('interest_received',      0, 'Проценты к получению за период'),
    ('fixed_costs_monthly',    0, 'Постоянные расходы в месяц (аренда+оклады+прочее)'),
    ('avg_inventory',          0, 'Средние запасы (для оборачиваемости)'),
    ('avg_receivables',        0, 'Средняя дебиторка'),
    ('avg_payables',           0, 'Средняя кредиторка')
ON CONFLICT (key) DO NOTHING;
