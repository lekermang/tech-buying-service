export interface CatalogItem {
  id: number;
  category: string;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  region: string | null;
  availability: "in_stock" | "on_order";
  price: number | null;
  has_photo: boolean;
  photo_url: string | null;
  description?: string | null;
  specs?: Record<string, string> | null;
  sim_type?: string | null;
}

export const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
export const PRICE_MARKUP = 3500; // fallback — реальное значение приходит из API в поле markup
export const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";

export const REGION_FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳", RU: "🇷🇺", HK: "🇭🇰", JP: "🇯🇵", KR: "🇰🇷", AE: "🇦🇪",
};

const C = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/";

export const MODEL_PHOTOS: Record<string, string> = {
  // ── iPhone 17 ──
  "iPhone 17 Pro Max":  C + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
  "iPhone 17 Pro":      C + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg",
  "iPhone Air":         C + "e6aa3820-f781-4ada-9357-e7acfc5c3fcf.jpg",
  "iPhone 17e":         C + "30662849-ec57-4e90-bef5-0db49aaff776.jpg",
  "iPhone 17":          C + "131a730c-2663-4bdb-a35e-37578a43613f.jpg",
  // ── iPhone 16 ──
  "iPhone 16 Pro Max":  C + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg",
  "iPhone 16 Pro":      C + "0e432e39-7b12-4765-9e27-18b6e82b33d0.jpg",
  "iPhone 16 Plus":     C + "3bcf5e16-855e-472d-90cf-7c9abf4e038d.jpg",
  "iPhone 16e":         C + "5a0bf47e-cd30-4139-a0e3-362ef1a64e36.jpg",
  "iPhone 16":          C + "e0b9b9b3-9005-4055-a889-3fbed49f7f23.jpg",
  // ── iPhone 15 ──
  "iPhone 15 Pro Max":  C + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg",
  "iPhone 15 Pro":      C + "e04dbcf8-eeee-4f3d-815d-740c4479c56b.jpg",
  "iPhone 15 Plus":     C + "b56187c5-c19e-416e-9d69-a8f08ecb4289.jpg",
  "iPhone 15":          C + "31fef314-f9c9-4ba2-be86-30f847c077df.jpg",
  // ── iPhone 14 ──
  "iPhone 14 Pro Max":  C + "87f75c7b-2c6b-4b0b-b114-3058aefb8683.jpg",
  "iPhone 14 Pro":      C + "b3fee514-be59-49ee-85e2-34e78a65dcb7.jpg",
  "iPhone 14 Plus":     C + "24c6defa-e26a-4204-a35e-1769ebff6687.jpg",
  "iPhone 14":          C + "93e202ea-d4e4-4bc3-b61d-041962d233a9.jpg",
  // ── iPhone 13/12/11 ──
  "iPhone 13":          C + "3fb09238-18c7-4aaf-ab71-726cd9e599a1.jpg",
  "iPhone 12":          C + "f61afe22-626b-4087-a269-8706f3e167bb.jpg",
  "iPhone 11":          C + "e95240c3-14e5-4fc7-baea-72211d4a1d8e.jpg",
  // ── MacBook ──
  "MacBook Air M4 13 (2025)":     C + "5a481fe7-4c63-497b-affd-333a782d9ccd.jpg",
  "MacBook Air M4 15 (2025)":     C + "bb055955-d50d-431a-9ea1-6e5edbc023d4.jpg",
  "MacBook Air M5 13 (2026)":     C + "936ae34c-c395-44de-903d-d6f6ed9325db.jpg",
  "MacBook Air M5 15 (2026)":     C + "8b0878cc-bfd3-48cd-a985-9c2a1245cd0e.jpg",
  "MacBook Neo 13 (2026)":        C + "936ae34c-c395-44de-903d-d6f6ed9325db.jpg",
  "MacBook Pro 14 M5 Pro (2026)": C + "67a42aeb-524f-4ec4-910a-8bbdbb8141d8.jpg",
  "MacBook Pro 14 M5 Max (2026)": C + "352faf41-f202-4823-8509-a91f1a460029.jpg",
  "MacBook Pro 14 M5 (2025)":     C + "67a42aeb-524f-4ec4-910a-8bbdbb8141d8.jpg",
  "MacBook Pro 14 M4 (2024)":     C + "2c1271d7-61c3-44c3-a21c-4da86b3c0061.jpg",
  "iMac 24 M4 (2024)":            C + "15e471fd-9b61-437f-88a9-6b1b656aafcf.jpg",
  "Mac mini M4 (2024)":           C + "09c8d648-2dbd-435f-af0d-1a885f816c9f.jpg",
  "Magic Mouse Black USB-C":          C + "ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "Magic Mouse White USB-C":          C + "ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "Magic Mouse 3 Black Lightning":    C + "ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "iPad Air 11 M4 128GB Blue Wi-Fi":  C + "1443d700-d05c-496a-a826-bc02a80c70f8.jpg",
  "iPad Air 11 M4 256GB Blue Wi-Fi":  C + "1443d700-d05c-496a-a826-bc02a80c70f8.jpg",
  "iPad Air 13 M4 128GB Blue Wi-Fi":  C + "1443d700-d05c-496a-a826-bc02a80c70f8.jpg",
  "AirPods Pro 3":        C + "52692f65-09b8-42db-b15c-c3a42cb901b3.jpg",
  "AirPods Pro 2 Type-C": C + "52692f65-09b8-42db-b15c-c3a42cb901b3.jpg",
  "AirPods 4":            C + "b928293b-5974-444f-bfe1-6ac746dd4f17.jpg",
  "AirPods 4 ANC":        C + "b928293b-5974-444f-bfe1-6ac746dd4f17.jpg",
  "AirPods Max 2":        C + "21671892-7620-474e-ba8a-afa23f8fad98.jpg",
  // ── Apple Watch ──
  "Watch Ultra 3 49mm": C + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg",
  "Watch Ultra 2 49mm": C + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg",
  "Watch S11 42mm":     C + "d1ad184a-9472-4bf6-873e-2c262556d33c.jpg",
  "Watch S11 46mm":     C + "d1ad184a-9472-4bf6-873e-2c262556d33c.jpg",
  "Watch SE3 40mm":     C + "1fd66317-c0f7-47f1-85f7-bcf2c9f5437c.jpg",
  "Watch SE3 44mm":     C + "1fd66317-c0f7-47f1-85f7-bcf2c9f5437c.jpg",
  // ── Samsung ──
  "Galaxy S26 Ultra":   C + "aea356f9-c478-40d9-bb00-0456fe539f13.jpg",
  "Galaxy S26 Plus":    C + "8be392e5-b022-47df-abad-eb33de6e91c9.jpg",
  "Galaxy S26":         C + "4b7b924a-4a47-496b-8547-f86dbe73e60d.jpg",
  "Galaxy S25 Ultra":   C + "7defae11-2097-4874-838f-fa97ff851e43.jpg",
  "Galaxy S25 Plus":    C + "c653491a-833d-420d-8dc5-9e623c3bd240.jpg",
  "Galaxy S25":         C + "dd18a5c5-b230-4940-ab72-05494db58d19.jpg",
  "Flip 7":             C + "5d724999-d92e-448b-9b98-e965c9b19ff4.jpg",
  "Galaxy A56":         C + "309163b7-e435-45fe-81ad-dcd31dd6fc16.jpg",
  "Galaxy A36":         C + "adfba235-6f93-41b4-9c4b-f9562ba81462.jpg",
  "Galaxy A17":         C + "16dcef45-ec4b-4e0a-9173-befd21c9fa89.jpg",
  "Galaxy Buds 4 Pro":  C + "329b638a-eb99-47a2-9539-e86be11e24c4.jpg",
  // ── Xiaomi / POCO ──
  "Xiaomi 17 Ultra":    C + "597ec7d3-31f9-4090-b635-e740cbc0e6e5.jpg",
  "Xiaomi 15T Pro":     C + "92646e7e-2280-4516-9485-824fe08a5fbe.jpg",
  "Xiaomi 15T":         C + "92646e7e-2280-4516-9485-824fe08a5fbe.jpg",
  "Xiaomi 15":          C + "597ec7d3-31f9-4090-b635-e740cbc0e6e5.jpg",
  "Poco X7 Pro":        C + "07346504-b593-420f-828b-bd9f28f07c2d.jpg",
  "Poco F8 Ultra":      C + "69fcd5e7-ca52-47af-99f3-68769ad62ae9.jpg",
  "Poco F8 Pro":        C + "07346504-b593-420f-828b-bd9f28f07c2d.jpg",
  "Poco M8 Pro":        C + "07346504-b593-420f-828b-bd9f28f07c2d.jpg",
  // ── Honor / Pixel ──
  "Honor 200":          C + "14f97803-35c8-4511-8f19-ac6372381269.jpg",
  "Honor 400 Pro":      C + "1d98a5d0-cce9-44b1-bade-5b6728807f88.jpg",
  "Pixel 10 Pro XL":    C + "40aa0f88-8776-491d-982e-916ee91ed913.jpg",
  "Pixel 10":           C + "a1359d7e-f19c-485d-8be1-5ed428092554.jpg",
  "Pixel 10A":          C + "6f7ee06e-8991-42c2-9788-e7e03d8c4f55.jpg",
  // ── OnePlus / Nothing / Realme ──
  "OnePlus 15":         C + "57779c23-6238-44df-a9a5-e71f68ae21e0.jpg",
  "OnePlus 13S":        C + "57779c23-6238-44df-a9a5-e71f68ae21e0.jpg",
  "Nothing Phone (3)":  C + "5b6248b6-0aa2-468a-8b5a-bd853b38ae39.jpg",
  // ── JBL / Marshall / Sony ──
  "Charge 6":           C + "42629f0e-709f-4d14-aaf7-07485feb10df.jpg",
  "Major 5":            C + "14bdd48a-ce14-4011-aa24-f27dfd16f1f8.jpg",
  // ── PlayStation ──
  "PS5 Slim 1TB Disc Edition":      C + "323f0a69-fee5-4dd7-a2fc-367d9b77c9c9.jpg",
  "PS5 Slim 1TB Digital Edition":   C + "323f0a69-fee5-4dd7-a2fc-367d9b77c9c9.jpg",
  "PS5 DualSense Cosmic Red":       C + "e36fd006-6bc5-4a3c-aabb-eb6cf1b1db98.jpg",
  "PS5 DualSense Midnight Black":   C + "0d41f169-3375-4f41-aa79-67720bf69603.jpg",
  "PS5 DualSense Sterling Silver":  C + "38ae688e-872e-431f-8fe7-cde3debeefc8.jpg",
  // ── Dyson ──
  "V15 SV47 Detect Absolute":       C + "bb8a642c-7c98-435a-a8c0-e56c7bd5389a.jpg",
  "HD16 Vinca Blue (с кейсом)":     C + "dfd5d392-51e7-4d80-8515-42edef332263.jpg",
  "HS08 Long Vinca Blue":           C + "dfd5d392-51e7-4d80-8515-42edef332263.jpg",
  "HS08 Long Ceramic Pink":         C + "9a0a2ee0-076f-4e96-b046-86b6154ea48d.jpg",
  "HT01 Blue/Copper (без кейса)":   C + "bb8a642c-7c98-435a-a8c0-e56c7bd5389a.jpg",
  // ── Яндекс / GoPro ──
  "Станция 3":      C + "3cc430b0-7670-4973-92dd-249b6a92dd2e.jpg",
  "Станция Лайт 2": C + "3cc430b0-7670-4973-92dd-249b6a92dd2e.jpg",
};

export const MODEL_PHOTOS_EXTRA: Record<string, string[]> = {
  // Вторые ракурсы — AI-фото других цветов как дополнительные ракурсы
  "iPhone 17 Pro Max":  [C + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg", C + "158f4e3f-53e9-44cb-8330-c3f9fe6f55b1.jpg"],
  "iPhone 17 Pro":      [C + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg", C + "b8122bc2-ef4d-4eac-9387-55505a1d07b7.jpg"],
  "iPhone Air":         [C + "131a730c-2663-4bdb-a35e-37578a43613f.jpg"],
  "iPhone 16 Pro":      [C + "843dfdbf-93f1-4cf4-9c7e-4c600f239410.jpg", C + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg"],
  "iPhone 16 Pro Max":  [C + "843dfdbf-93f1-4cf4-9c7e-4c600f239410.jpg", C + "0e432e39-7b12-4765-9e27-18b6e82b33d0.jpg"],
  "iPhone 16":          [C + "f6abe891-ef01-4006-a1c3-cb2c86a8e8b5.jpg", C + "74e8355f-fd4c-4224-b0cc-ff6964c11eec.jpg"],
  "iPhone 15 Pro":      [C + "e04dbcf8-eeee-4f3d-815d-740c4479c56b.jpg"],
  "iPhone 15 Pro Max":  [C + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg"],
  "iPhone 15":          [C + "639e2418-ed2a-4db5-8b32-460d6fd54454.jpg"],
  "iPhone 13":          [C + "3fb09238-18c7-4aaf-ab71-726cd9e599a1.jpg"],
  "iPhone 12":          [C + "f61afe22-626b-4087-a269-8706f3e167bb.jpg"],
  // MacBook — второй ракурс
  "MacBook Air M4 13 (2025)": [C + "bb055955-d50d-431a-9ea1-6e5edbc023d4.jpg", C + "936ae34c-c395-44de-903d-d6f6ed9325db.jpg"],
  "MacBook Air M4 15 (2025)": [C + "5a481fe7-4c63-497b-affd-333a782d9ccd.jpg", C + "8b0878cc-bfd3-48cd-a985-9c2a1245cd0e.jpg"],
  "MacBook Pro 14 M5 (2025)":     [C + "352faf41-f202-4823-8509-a91f1a460029.jpg"],
  "MacBook Pro 14 M5 Pro (2026)": [C + "2c1271d7-61c3-44c3-a21c-4da86b3c0061.jpg"],
  "MacBook Pro 14 M5 Max (2026)": [C + "67a42aeb-524f-4ec4-910a-8bbdbb8141d8.jpg"],
  // Apple Watch — второй ракурс
  "Watch Ultra 3 49mm": [C + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg", C + "d1ad184a-9472-4bf6-873e-2c262556d33c.jpg"],
  "Watch S11 42mm":     [C + "1fd66317-c0f7-47f1-85f7-bcf2c9f5437c.jpg"],
  "Watch SE3 40mm":     [C + "d1ad184a-9472-4bf6-873e-2c262556d33c.jpg"],
  "Watch SE3 44mm":     [C + "d1ad184a-9472-4bf6-873e-2c262556d33c.jpg"],
  // Samsung — второй ракурс
  "Galaxy S26 Ultra":   [C + "8be392e5-b022-47df-abad-eb33de6e91c9.jpg", C + "4b7b924a-4a47-496b-8547-f86dbe73e60d.jpg"],
  "Galaxy S26 Plus":    [C + "4b7b924a-4a47-496b-8547-f86dbe73e60d.jpg"],
  "Galaxy S26":         [C + "8be392e5-b022-47df-abad-eb33de6e91c9.jpg"],
  "Galaxy S25 Ultra":   [C + "588f10d4-2413-409f-b21c-9080196025d5.jpg", C + "c653491a-833d-420d-8dc5-9e623c3bd240.jpg"],
  "Galaxy S25 Plus":    [C + "dd18a5c5-b230-4940-ab72-05494db58d19.jpg"],
  "Galaxy S25":         [C + "4c94c4b8-e6de-4a21-97e0-4233919fe7e5.jpg"],
  "Flip 7":             [C + "5d724999-d92e-448b-9b98-e965c9b19ff4.jpg"],
  "Galaxy A56":         [C + "adfba235-6f93-41b4-9c4b-f9562ba81462.jpg"],
  "Galaxy A36":         [C + "309163b7-e435-45fe-81ad-dcd31dd6fc16.jpg"],
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  "iPhone 17/AIR/PRO/MAX":      C + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
  "iPhone 16/e/+/PRO/MAX":      C + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg",
  "iPhone 15/+/PRO/MAX":        C + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg",
  "iPhone 11/12/13/14":         C + "3fb09238-18c7-4aaf-ab71-726cd9e599a1.jpg",
  "MacBook":                    C + "5a481fe7-4c63-497b-affd-333a782d9ccd.jpg",
  "Apple Watch":                C + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg",
  "Samsung S-Z":                C + "aea356f9-c478-40d9-bb00-0456fe539f13.jpg",
  "Samsung A-M":                C + "309163b7-e435-45fe-81ad-dcd31dd6fc16.jpg",
  "Dyson / Garmin":             C + "bb8a642c-7c98-435a-a8c0-e56c7bd5389a.jpg",
  "Яндекс / JBL / Marshall":    C + "42629f0e-709f-4d14-aaf7-07485feb10df.jpg",
  "AirPods":                    C + "52692f65-09b8-42db-b15c-c3a42cb901b3.jpg",
  "Apple iPad":                 C + "1443d700-d05c-496a-a826-bc02a80c70f8.jpg",
  "Honor / PIXEL":              C + "ca4d0f84-81d9-4923-9c2b-42b15b714eed.jpg",
  "POCO M-X-F":                 C + "32e4fae9-41cb-49e3-b926-27fa64206f57.jpg",
  "Xiaomi/Redmi/Pad":           C + "597ec7d3-31f9-4090-b635-e740cbc0e6e5.jpg",
  "Sony / XBOX / GoPro":        C + "323f0a69-fee5-4dd7-a2fc-367d9b77c9c9.jpg",
  "Realme / OnePlus / Nothing": C + "10bcbd91-c6fb-44ec-b3a0-9e50a6810166.jpg",
  "SKY":                        C + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
};

const CDN = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/";

// Фото по модели + цвету (сгенерированы AI, строго по цвету)
export const MODEL_COLOR_PHOTOS: Record<string, string> = {
  // iPhone 17 Pro Max
  "iPhone 17 Pro Max::natural titanium":   CDN + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
  "iPhone 17 Pro Max::black titanium":     CDN + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg",
  "iPhone 17 Pro Max::white titanium":     CDN + "158f4e3f-53e9-44cb-8330-c3f9fe6f55b1.jpg",
  "iPhone 17 Pro Max::desert titanium":    CDN + "b8122bc2-ef4d-4eac-9387-55505a1d07b7.jpg",
  "iPhone 17 Pro Max::natural":            CDN + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
  "iPhone 17 Pro Max::black":              CDN + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg",
  "iPhone 17 Pro Max::white":              CDN + "158f4e3f-53e9-44cb-8330-c3f9fe6f55b1.jpg",
  "iPhone 17 Pro Max::desert":             CDN + "b8122bc2-ef4d-4eac-9387-55505a1d07b7.jpg",
  // iPhone 17 Pro
  "iPhone 17 Pro::natural titanium":       CDN + "1f9762ed-f76c-4460-823f-56fffef437ba.jpg",
  "iPhone 17 Pro::black titanium":         CDN + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg",
  "iPhone 17 Pro::white titanium":         CDN + "158f4e3f-53e9-44cb-8330-c3f9fe6f55b1.jpg",
  "iPhone 17 Pro::desert titanium":        CDN + "b8122bc2-ef4d-4eac-9387-55505a1d07b7.jpg",
  // iPhone 16 Pro Max
  "iPhone 16 Pro Max::desert titanium":    CDN + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg",
  "iPhone 16 Pro Max::black titanium":     CDN + "843dfdbf-93f1-4cf4-9c7e-4c600f239410.jpg",
  "iPhone 16 Pro Max::desert":             CDN + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg",
  "iPhone 16 Pro Max::black":              CDN + "843dfdbf-93f1-4cf4-9c7e-4c600f239410.jpg",
  // iPhone 16 Pro
  "iPhone 16 Pro::white titanium":         CDN + "0e432e39-7b12-4765-9e27-18b6e82b33d0.jpg",
  "iPhone 16 Pro::black titanium":         CDN + "843dfdbf-93f1-4cf4-9c7e-4c600f239410.jpg",
  "iPhone 16 Pro::desert titanium":        CDN + "2c599457-8ae2-4c16-b5fc-80683e390d82.jpg",
  // iPhone 16
  "iPhone 16::ultramarine":                CDN + "e0b9b9b3-9005-4055-a889-3fbed49f7f23.jpg",
  "iPhone 16::blue":                       CDN + "e0b9b9b3-9005-4055-a889-3fbed49f7f23.jpg",
  "iPhone 16::pink":                       CDN + "f6abe891-ef01-4006-a1c3-cb2c86a8e8b5.jpg",
  "iPhone 16::teal":                       CDN + "74e8355f-fd4c-4224-b0cc-ff6964c11eec.jpg",
  "iPhone 16::black":                      CDN + "5c3fb7c4-72ae-4a8d-8bef-79b34ce97fd7.jpg",
  // iPhone 16 Plus — те же цвета
  "iPhone 16 Plus::ultramarine":           CDN + "e0b9b9b3-9005-4055-a889-3fbed49f7f23.jpg",
  "iPhone 16 Plus::pink":                  CDN + "f6abe891-ef01-4006-a1c3-cb2c86a8e8b5.jpg",
  "iPhone 16 Plus::teal":                  CDN + "74e8355f-fd4c-4224-b0cc-ff6964c11eec.jpg",
  // iPhone 15 Pro
  "iPhone 15 Pro::natural titanium":       CDN + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg",
  "iPhone 15 Pro::blue titanium":          CDN + "e04dbcf8-eeee-4f3d-815d-740c4479c56b.jpg",
  "iPhone 15 Pro::natural":                CDN + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg",
  "iPhone 15 Pro::blue":                   CDN + "e04dbcf8-eeee-4f3d-815d-740c4479c56b.jpg",
  // iPhone 15 Pro Max
  "iPhone 15 Pro Max::natural titanium":   CDN + "a3cce28e-e548-4464-afc7-964ae59f636a.jpg",
  "iPhone 15 Pro Max::blue titanium":      CDN + "e04dbcf8-eeee-4f3d-815d-740c4479c56b.jpg",
  // iPhone 15
  "iPhone 15::black":                      CDN + "31fef314-f9c9-4ba2-be86-30f847c077df.jpg",
  "iPhone 15::yellow":                     CDN + "639e2418-ed2a-4db5-8b32-460d6fd54454.jpg",
  // iPhone 15 Plus — те же цвета
  "iPhone 15 Plus::black":                 CDN + "31fef314-f9c9-4ba2-be86-30f847c077df.jpg",
  "iPhone 15 Plus::yellow":                CDN + "639e2418-ed2a-4db5-8b32-460d6fd54454.jpg",
  // iPhone 14 Pro Max
  "iPhone 14 Pro Max::deep purple":        CDN + "ec640efc-34ec-4e0e-a164-6f0f3ddc006c.jpg",
  "iPhone 14 Pro Max::purple":             CDN + "ec640efc-34ec-4e0e-a164-6f0f3ddc006c.jpg",
  // Samsung Galaxy S25 Ultra
  "Galaxy S25 Ultra::titanium black":      CDN + "7defae11-2097-4874-838f-fa97ff851e43.jpg",
  "Galaxy S25 Ultra::black":               CDN + "7defae11-2097-4874-838f-fa97ff851e43.jpg",
  "Galaxy S25 Ultra::titanium silverblue": CDN + "588f10d4-2413-409f-b21c-9080196025d5.jpg",
  "Galaxy S25 Ultra::silver":              CDN + "588f10d4-2413-409f-b21c-9080196025d5.jpg",
  "Galaxy S25 Ultra::titanium blue":       CDN + "588f10d4-2413-409f-b21c-9080196025d5.jpg",
  // Samsung Galaxy S25
  "Galaxy S25::navy":                      CDN + "dd18a5c5-b230-4940-ab72-05494db58d19.jpg",
  "Galaxy S25::blue":                      CDN + "dd18a5c5-b230-4940-ab72-05494db58d19.jpg",
  "Galaxy S25::icy blue":                  CDN + "4c94c4b8-e6de-4a21-97e0-4233919fe7e5.jpg",
  // MacBook Air
  "MacBook Air M4 13 (2025)::midnight":    CDN + "5a481fe7-4c63-497b-affd-333a782d9ccd.jpg",
  "MacBook Air M4 15 (2025)::midnight":    CDN + "5a481fe7-4c63-497b-affd-333a782d9ccd.jpg",
  "MacBook Air M4 13 (2025)::starlight":   CDN + "bb055955-d50d-431a-9ea1-6e5edbc023d4.jpg",
  "MacBook Air M4 15 (2025)::starlight":   CDN + "bb055955-d50d-431a-9ea1-6e5edbc023d4.jpg",
  // MacBook Pro
  "MacBook Pro 14 M4 (2024)::space black": CDN + "2c1271d7-61c3-44c3-a21c-4da86b3c0061.jpg",
  "MacBook Pro 14 M5 (2025)::space black": CDN + "2c1271d7-61c3-44c3-a21c-4da86b3c0061.jpg",
  // AirPods Pro
  "AirPods Pro 2 Type-C::white":           CDN + "52692f65-09b8-42db-b15c-c3a42cb901b3.jpg",
  "AirPods Pro 3::white":                  CDN + "52692f65-09b8-42db-b15c-c3a42cb901b3.jpg",
  // Apple Watch
  "Watch S11 42mm::black":                 CDN + "f5153aab-a804-4cd3-a0b9-4498431a8ff2.jpg",
  "Watch S11 46mm::black":                 CDN + "f5153aab-a804-4cd3-a0b9-4498431a8ff2.jpg",
  "Watch Ultra 2 49mm::natural titanium":  CDN + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg",
  "Watch Ultra 3 49mm::natural titanium":  CDN + "c5f504a6-119c-41a4-89f3-2c6745b954ae.jpg",
  // iPad
  "iPad Pro 11 M4::space black":           CDN + "7c8a7c80-bce2-4dd9-a8d9-7e21cc523139.jpg",
  "iPad Pro 13 M4::space black":           CDN + "7c8a7c80-bce2-4dd9-a8d9-7e21cc523139.jpg",
  // Dyson
  "V15 SV47 Detect Absolute::nickel/copper": CDN + "bb8a642c-7c98-435a-a8c0-e56c7bd5389a.jpg",
  // Samsung A
  "Galaxy A55::navy":                      CDN + "5e811a34-754d-436d-be42-f7fb1fd204c4.jpg",
};

const COLOR_MAP: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", silver: "#c0c0c0", gold: "#ffd700",
  blue: "#3b82f6", midnight: "#1e293b", starlight: "#e8e4d9", pink: "#f9a8d4",
  green: "#22c55e", yellow: "#eab308", red: "#ef4444", orange: "#f97316",
  purple: "#a855f7", lavender: "#c4b5fd", sage: "#84a98c", teal: "#14b8a6",
  ultramarine: "#3730a3", natural: "#d4c5a9", desert: "#c2955a", titanium: "#8b8b8b",
  "space black": "#1a1a1a", "space gray": "#6b7280", "sky blue": "#38bdf8",
  indigo: "#4f46e5", citrus: "#a3e635", blush: "#fda4af", "jet black": "#111",
  "rose gold": "#b76e79", gray: "#6b7280", navy: "#1e3a5f", mint: "#a7f3d0",
  graphite: "#374151", olive: "#65a30d", "light gray": "#d1d5db", pinkgold: "#c9956c",
  cream: "#fdf6e3", brown: "#92400e", coral: "#f87171", violet: "#7c3aed",
  ceramic: "#e5e7eb", "vinca blue": "#4f46e5", copper: "#b87333", "red velvet": "#8b0000",
  "amber silk": "#f59e0b", jasper: "#6b4c3b", strawberry: "#dc2626",
  coralred: "#f43f5e", jadegreen: "#10b981", icyblue: "#bae6fd",
  whitesilver: "#e2e8f0", silverblue: "#93c5fd", jetblack: "#030712", lemongrass: "#d9f99d",
  moonstone: "#e2e8f0", porcelain: "#f8fafc", frost: "#e0f2fe", obsidian: "#1c1917",
};

export const getColorHex = (color: string | null): string | null => {
  if (!color) return null;
  return COLOR_MAP[color.toLowerCase()] || null;
};