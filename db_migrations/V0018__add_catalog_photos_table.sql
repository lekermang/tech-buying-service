CREATE TABLE t_p31606708_tech_buying_service.catalog_photos (
    id SERIAL PRIMARY KEY,
    catalog_item_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.catalog(id),
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    photo_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_valid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_catalog_photos_item_id ON t_p31606708_tech_buying_service.catalog_photos(catalog_item_id);
CREATE INDEX idx_catalog_photos_sku ON t_p31606708_tech_buying_service.catalog_photos(sku);

ALTER TABLE t_p31606708_tech_buying_service.catalog ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE t_p31606708_tech_buying_service.catalog ADD COLUMN IF NOT EXISTS photos_count INTEGER DEFAULT 0;
