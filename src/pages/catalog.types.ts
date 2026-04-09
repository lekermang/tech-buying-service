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
export const PRICE_MARKUP = 3500;
export const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";

export const REGION_FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳", RU: "🇷🇺", HK: "🇭🇰", JP: "🇯🇵", KR: "🇰🇷", AE: "🇦🇪",
};

const LAB = "https://lab-store40.ru/upload/iblock/";

export const MODEL_PHOTOS: Record<string, string> = {
  // ── iPhone 17 ── реальные фото с lab-store40.ru
  "iPhone 17 Pro Max":  LAB + "2cf/o2qdv008u61ioutiva9zhf7e5nsmddb0.webp",
  "iPhone 17 Pro":      LAB + "6a6/v2mowf4hlwhx4ozb1b0nnt6two4d46ai.webp",
  "iPhone Air":         LAB + "5f2/lvcm2iwd38flks3rayk878o6t9vhyid5.webp",
  "iPhone 17e":         LAB + "63e/2snq76p0cmduaajhn9of7u4e8p25wo8a.webp",
  "iPhone 17":          LAB + "ff3/8xasgaci7klcjn47oq17ax566feurapl.webp",
  // ── iPhone 16 ──
  "iPhone 16 Pro Max":  LAB + "def/h77k70t9pt0b6maibq36pwcjt6es61og.webp",
  "iPhone 16 Pro":      LAB + "822/x72xmx9ggha10cyw111r359prp8fh2pa.webp",
  "iPhone 16 Plus":     LAB + "577/p7wcuzty1hr79si6wmtiuc495kae7vmg.webp",
  "iPhone 16e":         LAB + "8be/ebu3e124bo146qu9zdwhq9ymnckjvkgq.webp",
  "iPhone 16":          LAB + "a5e/i67zm8riu1xbgh3075fmtcsnzd2my7jy.webp",
  // ── iPhone 15 ──
  "iPhone 15 Pro Max":  LAB + "65f/w4aqj9drz9hyh5533r2i1glfjfvoeqk9.webp",
  "iPhone 15 Pro":      LAB + "58f/33s3dncidga2ht518s7kyoib8t3qrj0d.webp",
  "iPhone 15 Plus":     LAB + "fb2/ue7201us7cxkhku3oqcqmj1qk0q0ubph.webp",
  "iPhone 15":          LAB + "d0a/eykc20lqt6i5ljhbytaphdhsawvji3nb.webp",
  // ── iPhone 14 ──
  "iPhone 14 Pro Max":  LAB + "4c9/e5p1f50b1en3p8fk4hvgmnfizuovo1yv.webp",
  "iPhone 14 Pro":      LAB + "b9a/qb808n0o4ra72z53o6nr89qt7myoj9eh.webp",
  "iPhone 14 Plus":     LAB + "f6d/l8p0kinrbjhtvrkf33e13wvou96e34be.webp",
  "iPhone 14":          LAB + "d0e/lp6vue4trxrqvo4ncqd2y0tjfzxj8qmu.webp",
  // ── iPhone 13/12/11 ──
  "iPhone 13":          LAB + "8e1/7zhk17sklzt5oj7xzz3i2b1p6u9xadvt.webp",
  "iPhone 12":          LAB + "255/hxz5ljd3rstsw4cn3juv8w1ayezly4s0.webp",
  "iPhone 11":          LAB + "6f0/ten6l27b6jt36of71cfdjr0kip984mkg.webp",
  // ── MacBook ── реальные фото с lab-store40.ru (страница MacBook Air M4)
  "MacBook Air M4 13 (2025)":     LAB + "2f3/w5buzevpm08uutp7tf0q6d974h3g7uyi.webp",
  "MacBook Air M4 15 (2025)":     LAB + "6c2/rbjkn22kybgfzpmka6zmwbnsrxqzjbis.webp",
  "MacBook Air M5 13 (2026)":     LAB + "dec/g718p084gv7sglzrw4l4yvt0yo2kn4as.webp",
  "MacBook Air M5 15 (2026)":     LAB + "dec/g718p084gv7sglzrw4l4yvt0yo2kn4as.webp",
  "MacBook Neo 13 (2026)":        LAB + "dec/g718p084gv7sglzrw4l4yvt0yo2kn4as.webp",
  "MacBook Pro 14 M5 Pro (2026)": LAB + "a06/at6z2fno4l81bqm1z2q341hm8qkjxveu.webp",
  "MacBook Pro 14 M5 Max (2026)": LAB + "5f5/il5218nwl1077j7wqpmrvira2843de66.webp",
  "MacBook Pro 14 M5 (2025)":     LAB + "409/1gqdo6mmh1t2jvd60elqptlfqjgdmgkm.webp",
  "MacBook Pro 14 M4 (2024)":     LAB + "0db/5g1jny5delnf1nz1jkr920v1ixkafbmo.webp",
  "iMac 24 M4 (2024)":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc654588-0617-4a89-ae1c-3221feb23893.jpg",
  "Mac mini M4 (2024)":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/34cc3705-57f2-442e-a656-cad07cda34b5.jpg",
  "Magic Mouse Black USB-C":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "Magic Mouse White USB-C":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "Magic Mouse 3 Black Lightning":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ddf3436c-2192-4277-ab50-857d968ed22d.jpg",
  "iPad Air 11 M4 128GB Blue Wi-Fi":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/60726eff-8025-4afb-9719-f28d34bab93d.jpg",
  "iPad Air 11 M4 256GB Blue Wi-Fi":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/60726eff-8025-4afb-9719-f28d34bab93d.jpg",
  "iPad Air 13 M4 128GB Blue Wi-Fi":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/60726eff-8025-4afb-9719-f28d34bab93d.jpg",
  "AirPods Pro 3":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d33dcbdd-f3cf-45d7-8d8a-40d75aa6a5ef.jpg",
  "AirPods Pro 2 Type-C": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d33dcbdd-f3cf-45d7-8d8a-40d75aa6a5ef.jpg",
  "AirPods 4":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d50a94c-0493-4690-b2db-42038b4666b3.jpg",
  "AirPods 4 ANC":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d50a94c-0493-4690-b2db-42038b4666b3.jpg",
  "AirPods Max 2":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9750e875-39bf-4024-80a0-2ebbefe7ba9a.jpg",
  // ── Apple Watch ── реальные фото с lab-store40.ru
  "Watch Ultra 3 49mm": LAB + "1b4/8sjyh1qtjz72b9cftqcqwbjbgipvibk6.webp",
  "Watch Ultra 2 49mm": LAB + "823/s6gcr4g9dx4v9cm33lma2bxoym6iq2v7.webp",
  "Watch S11 42mm":     LAB + "14b/0jo96zg7prf0hw2m1ebvm2yepc9ap944.webp",
  "Watch S11 46mm":     LAB + "14b/0jo96zg7prf0hw2m1ebvm2yepc9ap944.webp",
  "Watch SE3 40mm":     LAB + "512/qusj8b6gajppzi1g41dkahrq8efprieq.webp",
  "Watch SE3 44mm":     LAB + "512/qusj8b6gajppzi1g41dkahrq8efprieq.webp",
  // ── Samsung ── реальные фото с Билайн CDN
  "Galaxy S26 Ultra":   "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/ebadf9cf-4655-47d1-8e60-58103e2934eb.jpg",
  "Galaxy S26 Plus":    "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/419247e8-c13a-4818-b351-7fad4e933dbd.jpg",
  "Galaxy S26":         "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/e224197b-b12f-46f8-9f41-2a6e222aadd6.jpg",
  "Galaxy S25 Ultra":   "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/887249ae-1efd-4d51-8f98-34d609c1afef.jpg",
  "Galaxy S25 Plus":    "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/e2b24c6d-b37b-4258-a72f-e1aee93ab3be.jpg",
  "Galaxy S25":         "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/7964b496-ba09-4b78-9fbe-bdc6b0bc9674.jpg",
  "Flip 7":             "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/7320c785-f0e9-48e3-8229-00dce0229cfb.jpg",
  "Galaxy A56":         "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/2e5d36dd-bb95-4f4e-8aae-60dcb4125c1f.jpg",
  "Galaxy A36":         "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/c6cf8334-500a-411e-95ab-6413fe563e1b.jpg",
  "Galaxy A17":         "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/a0f04acf-776a-4862-ba05-5046d040a5cc.jpg",
  "Galaxy Buds 4 Pro":  "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/db07d9aa-4579-47db-b296-69a10323e92d.jpg",
  "Xiaomi 17 Ultra":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bf1b1e1a-5e6e-4881-8f86-4e818e32a3b6.jpg",
  "Xiaomi 15T Pro":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/36e70db0-cffe-4d9f-8366-12b232516370.jpg",
  "Xiaomi 15T":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Xiaomi 15":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Poco X7 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Ultra":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco M8 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5adc6129-dfba-49bb-9c07-4d9ffda5a1c1.jpg",
  "Honor 200":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/faedf450-85b3-4c9d-b500-37979a432e2f.jpg",
  "Honor 400 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f87b25d7-654f-450e-9de9-59c25051e6fa.jpg",
  "Pixel 10 Pro XL":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d3061332-fe83-4171-a2f5-fb22c13ddb7a.jpg",
  "Pixel 10":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Pixel 10A":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/fcab8aff-513d-435b-beee-cb5e5c636bac.jpg",
  "OnePlus 15":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "OnePlus 13S":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b1b7c512-3f5b-43db-8e7f-3d6839c87b02.jpg",
  "Nothing Phone (3)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/57ac3a6d-ca16-460a-ac5b-eee1e59181e3.jpg",
  "Charge 6":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/da34e8da-9a69-41b9-8ecb-08580cc4be75.jpg",
  "Major 5":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f28c6afe-4ba3-424e-840c-a0bc4fcd369a.jpg",
  "PS5 Slim 1TB Disc Edition":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2492f572-6df4-4042-9356-d61f9e7db165.jpg",
  "PS5 Slim 1TB Digital Edition":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2492f572-6df4-4042-9356-d61f9e7db165.jpg",
  "PS5 DualSense Cosmic Red":       "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/c72b7d1d-f228-442b-b5a2-a73103d02d59.jpg",
  "PS5 DualSense Midnight Black":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d41f169-3375-4f41-aa79-67720bf69603.jpg",
  "PS5 DualSense Sterling Silver":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/38ae688e-872e-431f-8fe7-cde3debeefc8.jpg",
  // ── Dyson ── реальные фото с lab-store40.ru
  "V15 SV47 Detect Absolute":       LAB + "d8a/cjuatj6iy0zikrwy10ac2ybb5q8ti2vf.png",
  "HD16 Vinca Blue (с кейсом)":   LAB + "592/bmdemquopq6bbxr70od90xbkwsbwrgcb.webp",
  "HS08 Long Vinca Blue":         LAB + "c02/h31su0h6ggrpukdfuayzynhikot54u6e.webp",
  "HS08 Long Ceramic Pink":       LAB + "93a/urwoksf8v3xiff14tjlmj93v0x3fv3i6.png",
  "HT01 Blue/Copper (без кейса)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ed2312bd-e4cc-4f7c-9198-1f44f30c6b39.jpg",
  // ── Яндекс Станции ── реальные фото с lab-store40.ru
  "Станция 3":      LAB + "beb/p01r5ohj50a11u09677suml7h9cuvdi8.webp",
  "Станция Лайт 2": LAB + "fba/hizydkjn7d6ngmoe0s7qmewgzpq4wf9a.webp",
};

export const MODEL_PHOTOS_EXTRA: Record<string, string[]> = {
  // Вторые ракурсы — реальные фото с lab-store40.ru
  "iPhone 17 Pro Max":  [LAB + "8be/ebu3e124bo146qu9zdwhq9ymnckjvkgq.webp", LAB + "a5e/i67zm8riu1xbgh3075fmtcsnzd2my7jy.webp"],
  "iPhone 17 Pro":      [LAB + "65f/w4aqj9drz9hyh5533r2i1glfjfvoeqk9.webp", LAB + "58f/33s3dncidga2ht518s7kyoib8t3qrj0d.webp"],
  "iPhone Air":         [LAB + "fb2/ue7201us7cxkhku3oqcqmj1qk0q0ubph.webp", LAB + "d0a/eykc20lqt6i5ljhbytaphdhsawvji3nb.webp"],
  "iPhone 16 Pro":      [LAB + "4c9/e5p1f50b1en3p8fk4hvgmnfizuovo1yv.webp", LAB + "b9a/qb808n0o4ra72z53o6nr89qt7myoj9eh.webp"],
  "iPhone 16 Pro Max":  [LAB + "f6d/l8p0kinrbjhtvrkf33e13wvou96e34be.webp", LAB + "d0e/lp6vue4trxrqvo4ncqd2y0tjfzxj8qmu.webp"],
  "iPhone 16":          [LAB + "8e1/7zhk17sklzt5oj7xzz3i2b1p6u9xadvt.webp"],
  "iPhone 15 Pro":      [LAB + "255/hxz5ljd3rstsw4cn3juv8w1ayezly4s0.webp"],
  "iPhone 15 Pro Max":  [LAB + "6f0/ten6l27b6jt36of71cfdjr0kip984mkg.webp"],
  "iPhone 15":          [LAB + "a06/at6z2fno4l81bqm1z2q341hm8qkjxveu.webp"],
  "iPhone 13":          [LAB + "5f5/il5218nwl1077j7wqpmrvira2843de66.webp"],
  "iPhone 12":          [LAB + "409/1gqdo6mmh1t2jvd60elqptlfqjgdmgkm.webp"],
  // MacBook — второй ракурс (реальные фото)
  "MacBook Air M4 13 (2025)": [LAB + "6c2/rbjkn22kybgfzpmka6zmwbnsrxqzjbis.webp", LAB + "dec/g718p084gv7sglzrw4l4yvt0yo2kn4as.webp"],
  "MacBook Air M4 15 (2025)": [LAB + "dec/g718p084gv7sglzrw4l4yvt0yo2kn4as.webp", LAB + "2f3/w5buzevpm08uutp7tf0q6d974h3g7uyi.webp"],
  "MacBook Pro 14 M5 (2025)":     [LAB + "5f5/il5218nwl1077j7wqpmrvira2843de66.webp", LAB + "409/1gqdo6mmh1t2jvd60elqptlfqjgdmgkm.webp"],
  "MacBook Pro 14 M5 Pro (2026)": [LAB + "0db/5g1jny5delnf1nz1jkr920v1ixkafbmo.webp"],
  "MacBook Pro 14 M5 Max (2026)": [LAB + "0f4/7b7d2fvmzyeri3rjqmzk3k6464lej63z.webp"],
  // Apple Watch — второй ракурс (реальные фото)
  "Watch Ultra 3 49mm": [LAB + "823/s6gcr4g9dx4v9cm33lma2bxoym6iq2v7.webp", LAB + "2c8/s9jqibynwtyrr1npwiv9uqpquwbgvn32.png"],
  "Watch S11 42mm":     [LAB + "512/qusj8b6gajppzi1g41dkahrq8efprieq.webp"],
  "Watch SE3 40mm":     [LAB + "14b/0jo96zg7prf0hw2m1ebvm2yepc9ap944.webp"],
  "Watch SE3 44mm":     [LAB + "14b/0jo96zg7prf0hw2m1ebvm2yepc9ap944.webp"],
  // Dyson — второй ракурс (реальные фото)
  "V15 SV47 Detect Absolute": [LAB + "592/bmdemquopq6bbxr70od90xbkwsbwrgcb.webp"],
  "HS08 Long Vinca Blue":     [LAB + "93a/urwoksf8v3xiff14tjlmj93v0x3fv3i6.png"],
  // Samsung — второй ракурс (реальные фото Билайн CDN)
  "Galaxy S26 Ultra":   ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/80d16039-8842-4e08-bda3-ffae796f4c58.jpg", "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/05a6fe27-b107-4146-bcc6-c0645cd8bdcb.jpg"],
  "Galaxy S26 Plus":    ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/94597ccb-48c9-417c-a65d-e189cf31a84c.jpg"],
  "Galaxy S26":         ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/9e2d06be-2570-4767-87a1-23a8b7d8ff68.jpg"],
  "Galaxy S25 Ultra":   ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/952542a9-a75c-4933-87d8-42abfe974c40.jpg"],
  "Flip 7":             ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/51709169-ea69-46fe-9a09-cfdf11d9fc1d.jpg", "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/954d27c1-6e82-43fa-a843-7870fb8c9429.jpg"],
  "Galaxy A56":         ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/5843d1ef-940d-4d0c-bad3-498055228dcb.jpg"],
  "Galaxy A36":         ["https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/a6949339-647f-4e79-b975-9a88bbc06c1a.jpg"],
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  "iPhone 17/AIR/PRO/MAX":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8ee9456-ba97-4dc8-af93-5ee436332c5e.jpg",
  "iPhone 16/e/+/PRO/MAX":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2e6a9047-65e8-4c05-839d-bdab5bbdbcd3.jpg",
  "iPhone 15/+/PRO/MAX":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/16d49a33-5c15-4683-84e4-2b4c6ac8cb5d.jpg",
  "iPhone 11/12/13/14":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd9e4c92-3ff4-44d8-8519-ac68e4bb7033.jpg",
  "MacBook":                    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bc4bfd3e-97ae-454a-ae9e-c1e771178679.jpg",
  "Apple Watch":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/95cbb711-93b7-4b11-81a2-22ce587b23e8.jpg",
  "AirPods":                    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0b5f7d2e-3b4e-47db-b321-a81c62701e82.jpg",
  "Apple iPad":                 "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a256c099-f9fd-4b16-a8e3-2268ccfd3824.jpg",
  "Samsung S-Z":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/af80c041-d754-4c52-a6b8-d7d86e9579f6.jpg",
  "Samsung A-M":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f1460027-ebea-440c-8989-ccf7e3167ac2.jpg",
  "Dyson / Garmin":             "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bcfe8033-51c9-4eec-804b-58a3006ab48f.jpg",
  "Honor / PIXEL":              "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2227a12f-7615-4151-beaa-6d70debb35d2.jpg",
  "POCO M-X-F":                 "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e266bc31-56ed-4fda-958e-92cb59bf7492.jpg",
  "Xiaomi/Redmi/Pad":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e266bc31-56ed-4fda-958e-92cb59bf7492.jpg",
  "Sony / XBOX / GoPro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f16efab6-9d20-480a-8e49-9d8752825ca6.jpg",
  "Realme / OnePlus / Nothing": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ec500aee-01bb-4dba-8c6c-47b883bcd95c.jpg",
  "Яндекс / JBL / Marshall":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66af3c22-7013-4c51-b199-bfe11c4f179f.jpg",
  "SKY":                        "",
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