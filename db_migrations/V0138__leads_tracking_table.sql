-- Универсальная таблица трекинга заявок (лиды + ремонт)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.leads_tracking (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    external_id INTEGER,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    category TEXT,
    description TEXT,
    payload_json JSONB,
    status TEXT NOT NULL DEFAULT 'new',
    owner_chat_id TEXT,
    owner_name TEXT,
    taken_at TIMESTAMP,
    answered_at TIMESTAMP,
    closed_at TIMESTAMP,
    sla_minutes INTEGER NOT NULL DEFAULT 15,
    last_escalation_at TIMESTAMP,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    client_sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    client_warned_15 BOOLEAN NOT NULL DEFAULT FALSE,
    tg_message_ids JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_tracking_status ON t_p31606708_tech_buying_service.leads_tracking(status);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_created ON t_p31606708_tech_buying_service.leads_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_phone ON t_p31606708_tech_buying_service.leads_tracking(client_phone);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.leads_tracking_log (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.leads_tracking(id),
    action TEXT NOT NULL,
    actor_chat_id TEXT,
    actor_name TEXT,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_tracking_log_lead ON t_p31606708_tech_buying_service.leads_tracking_log(lead_id, created_at);
