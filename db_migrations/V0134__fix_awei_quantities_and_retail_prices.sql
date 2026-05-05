-- Корректировка партии AWEI/аксессуаров от 2026-05-05:
-- 1) Выставляем фактические количества по бумажной накладной.
-- 2) Пересчитываем sell_price по правилу: buy_price ≤ 500 → ×3, иначе ×2
--    (только для тех товаров, которые добавлены сегодня и не были проданы).

UPDATE t_p31606708_tech_buying_service.slshop_items
   SET quantity = CASE id
        WHEN 249 THEN 3   -- Travel Adapter international круглый
        WHEN 254 THEN 3   -- LDNIO A4406 Европереходник
        WHEN 255 THEN 3   -- LDNIO SC5415 Европереходник
        WHEN 256 THEN 3   -- JM600 Проводная мышь
        WHEN 257 THEN 3   -- JW219 Беспроводная мышь
        WHEN 258 THEN 3   -- Петличный микрофон К35
        WHEN 259 THEN 2   -- Awei ES70TY проводной наушник
        WHEN 264 THEN 2   -- Awei Y669 колонка
        WHEN 265 THEN 3   -- Awei KA10 колонка 60W
        WHEN 267 THEN 2   -- Awei KA29 колонка
        WHEN 268 THEN 2   -- Awei Y680 колонка
        ELSE quantity
       END,
       sell_price = CASE
        WHEN buy_price IS NULL OR buy_price = 0 THEN sell_price
        WHEN buy_price <= 500 THEN buy_price * 3
        ELSE buy_price * 2
       END,
       updated_at = NOW()
 WHERE id IN (249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
              260, 261, 262, 263, 264, 265, 266, 267, 268)
   AND status <> 'sold';
