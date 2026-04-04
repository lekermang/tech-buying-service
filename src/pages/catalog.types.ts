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
}

export const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
export const PRICE_MARKUP = 3500;
export const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";

export const REGION_FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳", RU: "🇷🇺", HK: "🇭🇰", JP: "🇯🇵", KR: "🇰🇷", AE: "🇦🇪",
};

export const MODEL_PHOTOS: Record<string, string> = {
  "iPhone Air":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ee5cf84c-2f78-4c4b-a877-6682553749a0.jpg",
  "iPhone 17 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a1b54388-ab9d-4405-a8c8-b18d58c90c50.jpg",
  "iPhone 17 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dcd4e449-6c29-4366-981a-a687c2bce539.jpg",
  "iPhone 17e":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6bae6054-510a-4df0-b0ff-f2f520174f62.jpg",
  "iPhone 17":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6bae6054-510a-4df0-b0ff-f2f520174f62.jpg",
  "iPhone 16 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f318fdfb-7618-4f90-9834-6b7cf4a6268b.jpg",
  "iPhone 16 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6135e15e-660a-4c36-9abc-6aa7e782a1f4.jpg",
  "iPhone 16 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  "iPhone 16e":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  "iPhone 16":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  "iPhone 15 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/03a10265-0fcf-45ea-a80f-7c3abf84ca43.jpg",
  "iPhone 15 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/03a10265-0fcf-45ea-a80f-7c3abf84ca43.jpg",
  "iPhone 15 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9c0f9d6a-8593-485e-ab8d-91ba2fe64674.jpg",
  "iPhone 15":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9c0f9d6a-8593-485e-ab8d-91ba2fe64674.jpg",
  "iPhone 14 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 13":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 12":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 11":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "MacBook Air M5 13 (2026)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M5 15 (2026)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M4 13 (2025)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M4 15 (2025)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Neo 13 (2026)":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Pro 14 M5 Pro (2026)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M5 Max (2026)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M5 (2025)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M4 (2024)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "Galaxy S26 Ultra":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Galaxy S25 Ultra":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Galaxy S26 Plus":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S26":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S25 Plus":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S25":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy A56":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "Galaxy A36":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "Galaxy A17":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "Xiaomi 15T Pro":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Xiaomi 15T":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Xiaomi 15":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Poco X7 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Ultra":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Pixel 10 Pro XL":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Pixel 10":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Pixel 10A":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "OnePlus 15":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "Nothing Phone (3)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "Watch S11 42mm":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch S11 46mm":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch Ultra 2 49mm": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch Ultra 3 49mm": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "PS5 Slim 1TB Disc Edition":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  "PS5 Slim 1TB Digital Edition": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  "HD16 Vinca Blue (с кейсом)":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
  "HS08 Long Vinca Blue":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
  "Станция 3":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
  "Станция Лайт 2": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  "iPhone 17/AIR/PRO/MAX":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 16/e/+/PRO/MAX":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 15/+/PRO/MAX":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 11/12/13/14":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "MacBook":                    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "AirPods":                    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3f012a5d-ae26-4bd6-8a5b-5c5d3a1e7a18.jpg",
  "Apple Watch":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Apple iPad":                 "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/896dabb5-966d-4f7e-bd17-092ba76dd743.jpg",
  "Samsung S-Z":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Samsung A-M":                "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "POCO M-X-F":                 "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Xiaomi/Redmi/Pad":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Honor / PIXEL":              "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Realme / OnePlus / Nothing": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "Sony / XBOX / GoPro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  "Яндекс / JBL / Marshall":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
  "Dyson / Garmin":             "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
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
