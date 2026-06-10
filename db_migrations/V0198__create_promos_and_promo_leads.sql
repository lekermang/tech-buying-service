
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.promos (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    short_desc      VARCHAR(70)  NOT NULL DEFAULT '',
    full_desc       VARCHAR(500) NOT NULL DEFAULT '',
    image_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    show_on_main    BOOLEAN NOT NULL DEFAULT false,
    starts_at       TIMESTAMPTZ,
    ends_at         TIMESTAMPTZ,
    max_participants INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.promo_leads (
    id          SERIAL PRIMARY KEY,
    promo_id    INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.promos(id),
    name        VARCHAR(200) NOT NULL,
    phone       VARCHAR(30)  NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_leads_promo_id ON t_p31606708_tech_buying_service.promo_leads(promo_id);
CREATE INDEX IF NOT EXISTS idx_promos_slug ON t_p31606708_tech_buying_service.promos(slug);
