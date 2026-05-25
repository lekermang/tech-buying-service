-- Деактивируем iPhone 15
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'iPhone 15/+/PRO/MAX';

INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, region, availability, price, has_photo, sim_type, is_active) VALUES
-- iPhone 15 US
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Black', '128GB', 'US', 'on_order', 44200, false, 'eSIM', true),
-- iPhone 15 EU
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Black', '128GB', 'EU', 'in_stock', 48000, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Pink', '128GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Blue', '128GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Green', '128GB', 'EU', 'on_order', 49900, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Black', '256GB', 'EU', 'in_stock', 55000, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Blue', '256GB', 'EU', 'on_order', 56300, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Yellow', '256GB', 'EU', 'on_order', 54500, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Green', '512GB', 'EU', 'on_order', 62500, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Black', '512GB', 'EU', 'on_order', 68800, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Blue', '512GB', 'EU', 'on_order', 70900, false, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15', 'Blue', '512GB', 'US', 'on_order', 54000, false, 'eSIM', true),

-- iPhone 15 Plus EU
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Green', '128GB', 'EU', 'on_order', 50800, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Pink', '128GB', 'EU', 'on_order', 51400, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Blue', '128GB', 'EU', 'on_order', 51400, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Yellow', '128GB', 'EU', 'on_order', 50100, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Pink', '512GB', 'EU', 'on_order', 59000, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Green', '512GB', 'EU', 'on_order', 58800, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Yellow', '512GB', 'EU', 'on_order', 54100, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Black', '512GB', 'EU', 'on_order', 64500, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Plus', 'Blue', '512GB', 'EU', 'on_order', 58700, false, 'nanoSIM+eSIM', true),

-- iPhone 15 Pro EU
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'White', '128GB', 'EU', 'on_order', 76300, false, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'White', '128GB', 'US', 'on_order', 66500, false, 'eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'Blue', '128GB', 'EU', 'on_order', 71100, false, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'Blue', '128GB', 'CN', 'on_order', 66900, false, 'nanoSIM+nanoSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'Natural', '1TB', 'EU', 'on_order', 97400, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro', 'Blue', '1TB', 'EU', 'on_order', 97400, true, 'nanoSIM+eSIM', true),

-- iPhone 15 Pro Max EU
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro Max', 'Blue', '256GB', 'EU', 'on_order', 80700, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro Max', 'Natural', '256GB', 'EU', 'on_order', 80700, true, 'nanoSIM+eSIM', true),
('iPhone 15/+/PRO/MAX', 'Apple', 'iPhone 15 Pro Max', 'Black', '512GB', 'EU', 'on_order', 109000, true, 'nanoSIM+eSIM', true);
