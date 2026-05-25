-- Деактивируем Apple Watch
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'Apple Watch';

INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, region, availability, price, has_photo, is_active) VALUES
-- SE2 40mm
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'in_stock', 20200, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Midnight Sport Loop', NULL, 'US', 'on_order', 20200, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Silver Sport Band (S/M)', NULL, 'US', 'in_stock', NULL, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Silver Sport Loop', NULL, 'US', 'on_order', 21200, false, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Starlight Sport Band (S/M)', NULL, 'US', 'in_stock', NULL, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 40mm', 'Starlight Sport Loop', NULL, 'US', 'in_stock', 21800, true, true),

-- SE2 44mm
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Midnight Sport Band (M/L)', NULL, 'US', 'in_stock', 17500, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'on_order', 18000, false, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Midnight Sport Loop', NULL, 'US', 'on_order', 18000, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Silver Sport Band (M/L)', NULL, 'US', 'in_stock', 22300, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Starlight Sport Band (M/L)', NULL, 'US', 'in_stock', NULL, true, true),
('Apple Watch', 'Apple', 'Watch SE2 2024 44mm', 'Starlight Sport Loop', NULL, 'US', 'on_order', 23400, true, true),

-- SE3 2025
('Apple Watch', 'Apple', 'Watch SE3 40mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'in_stock', 20400, false, true),
('Apple Watch', 'Apple', 'Watch SE3 40mm', 'Starlight Sport Band (S/M)', NULL, 'US', 'on_order', 22300, false, true),
('Apple Watch', 'Apple', 'Watch SE3 44mm', 'Midnight Sport Band (M/L)', NULL, 'US', 'in_stock', 22800, false, true),
('Apple Watch', 'Apple', 'Watch SE3 44mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'on_order', 23500, false, true),
('Apple Watch', 'Apple', 'Watch SE3 44mm', 'Starlight Sport Band (M/L)', NULL, 'US', 'in_stock', 22900, false, true),

-- Series 9
('Apple Watch', 'Apple', 'Watch S9 41mm', 'Midnight Sport Band (M/L)', NULL, 'US', 'on_order', 27200, false, true),
('Apple Watch', 'Apple', 'Watch S9 41mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'on_order', 27200, false, true),
('Apple Watch', 'Apple', 'Watch S9 45mm', 'Midnight Sport Band (S/M)', NULL, 'US', 'on_order', 21900, false, true),
('Apple Watch', 'Apple', 'Watch S9 45mm', 'Silver Sport Band (S/M)', NULL, 'US', 'on_order', 48400, false, true),
('Apple Watch', 'Apple', 'Watch S9 45mm', 'Silver Sport Loop', NULL, 'US', 'on_order', 48600, false, true),

-- Series 10
('Apple Watch', 'Apple', 'Watch S10 42mm', 'Jet Black Sport Band (S/M)', NULL, 'US', 'on_order', 27200, true, true),
('Apple Watch', 'Apple', 'Watch S10 42mm', 'Rose Gold Sport Loop', NULL, 'US', 'on_order', 27700, false, true),
('Apple Watch', 'Apple', 'Watch S10 42mm', 'Gold Milanese Loop', NULL, 'US', 'on_order', 61600, true, true),
('Apple Watch', 'Apple', 'Watch S10 46mm', 'Jet Black Sport Loop', NULL, 'US', 'on_order', 25100, true, true),
('Apple Watch', 'Apple', 'Watch S10 46mm', 'Rose Gold Sport Band (M/L)', NULL, 'US', 'on_order', 28200, true, true),
('Apple Watch', 'Apple', 'Watch S10 46mm', 'Rose Gold Sport Loop', NULL, 'US', 'on_order', 27200, false, true),
('Apple Watch', 'Apple', 'Watch S10 46mm', 'Silver Sport Band (M/L)', NULL, 'US', 'in_stock', 27200, true, true),

-- Series 11
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Jet Black Sport Band (S/M)', NULL, 'US', 'in_stock', 27700, true, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Jet Black Sport Band (M/L)', NULL, 'US', 'on_order', 28000, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Rose Gold Sport Band (S/M)', NULL, 'US', 'in_stock', 27800, true, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Rose Gold Sport Band (M/L)', NULL, 'US', 'on_order', 30300, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Space Gray Sport Band (S/M)', NULL, 'US', 'in_stock', 27700, true, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Space Gray Sport Band (M/L)', NULL, 'US', 'on_order', 28200, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Silver Sport Band (S/M)', NULL, 'US', 'in_stock', 28800, true, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Jet Black Sport Band (M/L)', NULL, 'US', 'in_stock', 30800, true, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Rose Gold Sport Band (M/L)', NULL, 'US', 'on_order', 29700, true, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Rose Gold Sport Band (S/M)', NULL, 'US', 'on_order', 30000, false, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Space Gray Sport Band (M/L)', NULL, 'US', 'in_stock', 29700, true, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Space Gray Sport Band (S/M)', NULL, 'US', 'on_order', 29800, false, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Silver Sport Band (M/L)', NULL, 'US', 'on_order', 30200, true, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Silver Sport Band (S/M)', NULL, 'US', 'on_order', 31300, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Gold Ti Milanese Loop', NULL, 'US', 'on_order', 60600, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Natural Ti Milanese Loop', NULL, 'US', 'on_order', 58500, false, true),
('Apple Watch', 'Apple', 'Watch S11 42mm', 'Slate Ti Milanese Loop', NULL, 'US', 'on_order', 58400, false, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Gold Ti Milanese Loop (M/L)', NULL, 'US', 'on_order', 62100, false, true),
('Apple Watch', 'Apple', 'Watch S11 46mm', 'Slate Ti Milanese Loop (M/L)', NULL, 'US', 'on_order', 62100, false, true),

-- Ultra 2
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Dark Green Alpine Loop Medium', NULL, 'US', 'on_order', 49400, true, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Black Trail Loop S/M', NULL, 'US', 'on_order', 49200, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Black Milanese Loop Large', NULL, 'US', 'on_order', 54100, true, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Black Milanese Loop Medium', NULL, 'US', 'on_order', 54100, true, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Black Milanese Loop Small', NULL, 'US', 'on_order', 63700, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Black Ti Blue Alpine Loop Large', NULL, 'US', 'on_order', 53500, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Natural Ti Blue Trail Loop M/L', NULL, 'US', 'on_order', 52500, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 2 49mm', 'Natural Ti Tan Alpine Loop Medium', NULL, 'US', 'on_order', 52500, false, true),

-- Ultra 3
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Natural Ti Natural Milanese Loop Medium', NULL, 'US', 'on_order', 69600, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Natural Ti Blue Alpine Loop Large', NULL, 'US', 'on_order', 59600, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Natural Ti Blue Trail Loop S/M', NULL, 'US', 'on_order', 59600, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Natural Ti Blue Trail Loop M/L', NULL, 'US', 'on_order', 59600, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Natural Ti Blue Ocean Band', NULL, 'US', 'on_order', 64700, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Black Ti Black Milanese Loop Large', NULL, 'US', 'on_order', 68800, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Black Ti Blue Alpine Loop Small', NULL, 'US', 'on_order', 63200, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Black Ti Black Trail Loop M/L', NULL, 'US', 'on_order', 58000, false, true),
('Apple Watch', 'Apple', 'Watch Ultra 3 49mm', 'Black Ti Black Ocean Band', NULL, 'US', 'on_order', 59600, false, true);
