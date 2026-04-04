import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const PRICE_MARKUP = 3500;

const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";

// Фото по конкретным моделям (приоритет над категорией)
const MODEL_PHOTOS: Record<string, string> = {
  // iPhone 17
  "iPhone Air":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ee5cf84c-2f78-4c4b-a877-6682553749a0.jpg",
  "iPhone 17 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a1b54388-ab9d-4405-a8c8-b18d58c90c50.jpg",
  "iPhone 17 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dcd4e449-6c29-4366-981a-a687c2bce539.jpg",
  "iPhone 17e":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6bae6054-510a-4df0-b0ff-f2f520174f62.jpg",
  "iPhone 17":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6bae6054-510a-4df0-b0ff-f2f520174f62.jpg",
  // iPhone 16
  "iPhone 16 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f318fdfb-7618-4f90-9834-6b7cf4a6268b.jpg",
  "iPhone 16 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6135e15e-660a-4c36-9abc-6aa7e782a1f4.jpg",
  "iPhone 16 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  "iPhone 16e":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  "iPhone 16":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/bd469a33-b639-45da-841c-4b458216ae92.jpg",
  // iPhone 15
  "iPhone 15 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/03a10265-0fcf-45ea-a80f-7c3abf84ca43.jpg",
  "iPhone 15 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/03a10265-0fcf-45ea-a80f-7c3abf84ca43.jpg",
  "iPhone 15 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9c0f9d6a-8593-485e-ab8d-91ba2fe64674.jpg",
  "iPhone 15":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9c0f9d6a-8593-485e-ab8d-91ba2fe64674.jpg",
  // iPhone 11-14
  "iPhone 14 Pro Max":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14 Pro":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14 Plus":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 14":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 13":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 12":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  "iPhone 11":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/5c273d76-ec56-41d7-bdf2-7e0d2bace32c.jpg",
  // MacBook
  "MacBook Air M5 13 (2026)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M5 15 (2026)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M4 13 (2025)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Air M4 15 (2025)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Neo 13 (2026)":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "MacBook Pro 14 M5 Pro (2026)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M5 Max (2026)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M5 (2025)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  "MacBook Pro 14 M4 (2024)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/22448f55-a72f-452d-a295-b38b61f79bb4.jpg",
  // Samsung
  "Galaxy S26 Ultra":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Galaxy S25 Ultra":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Galaxy S26 Plus":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S26":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S25 Plus":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy S25":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78d4ee-6f03-486c-a08f-27a2e33644dc.jpg",
  "Galaxy A56":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "Galaxy A36":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "Galaxy A17":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  // Xiaomi/POCO
  "Xiaomi 15T Pro":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Xiaomi 15T":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Xiaomi 15":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Poco X7 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Ultra":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Poco F8 Pro":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  // Google/OnePlus
  "Pixel 10 Pro XL":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Pixel 10":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Pixel 10A":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "OnePlus 15":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "Nothing Phone (3)":  "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  // Apple Watch / iPad
  "Watch S11 42mm":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch S11 46mm":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch Ultra 2 49mm": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Watch Ultra 3 49mm": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  // PS5
  "PS5 Slim 1TB Disc Edition":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  "PS5 Slim 1TB Digital Edition": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  // Dyson
  "HD16 Vinca Blue (с кейсом)": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
  "HS08 Long Vinca Blue":       "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
  // Яндекс
  "Станция 3":          "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
  "Станция Лайт 2":     "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
};

// Цвет → CSS hex (для кружка)
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
  "amber silk": "#f59e0b", jasper: "#6b4c3b", strawberry: "#dc2626", chartreuse: "#84cc16",
  "space black": "#111827", coralred: "#f43f5e", jadegreen: "#10b981", icyblue: "#bae6fd",
  whitesilver: "#e2e8f0", silverblue: "#93c5fd", jetblack: "#030712", lemongrass: "#d9f99d",
  moonstone: "#e2e8f0", porcelain: "#f8fafc", frost: "#e0f2fe", obsidian: "#1c1917",
};

const getColorHex = (color: string | null): string | null => {
  if (!color) return null;
  const key = color.toLowerCase();
  return COLOR_MAP[key] || null;
};

// Категорийные фото (запасные)
const CATEGORY_PHOTOS: Record<string, string> = {
  "iPhone 17/AIR/PRO/MAX": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 16/e/+/PRO/MAX": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 15/+/PRO/MAX":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "iPhone 11/12/13/14":    "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/1f1769fc-9b20-48ed-8861-8c1b04d23927.jpg",
  "MacBook":               "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/771da5f6-fd98-4cf0-b89c-4a8175acacac.jpg",
  "AirPods":               "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3f012a5d-ae26-4bd6-8a5b-5c5d3a1e7a18.jpg",
  "Apple Watch":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/27056d2b-9b9e-4006-8ddb-45490d4991a8.jpg",
  "Apple iPad":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/896dabb5-966d-4f7e-bd17-092ba76dd743.jpg",
  "Samsung S-Z":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/30cfdfc4-ad2f-47cc-8695-0b0d3316a917.jpg",
  "Samsung A-M":           "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cc5e8350-751b-4246-9d7e-d74f81dccf30.jpg",
  "POCO M-X-F":            "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/45fd73b7-f807-4af2-8f32-f237d85f193f.jpg",
  "Xiaomi/Redmi/Pad":      "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/9ac1ebb6-5c0e-4e3e-94d7-98f40d970baf.jpg",
  "Honor / PIXEL":         "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ff473081-dcc1-4139-abe1-832624431fed.jpg",
  "Realme / OnePlus / Nothing": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0e611ec0-09c6-4813-a64e-b64c60bf0a4c.jpg",
  "Sony / XBOX / GoPro":   "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b8718f70-347b-41e3-83b4-593eda29ef37.jpg",
  "Яндекс / JBL / Marshall": "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/f9a6510e-48b4-40bf-b204-e19d2e6667ea.jpg",
  "Dyson / Garmin":        "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/99f293d0-2e03-4172-8673-6925ca157715.jpg",
};

interface CatalogItem {
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

const REGION_FLAG: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳", RU: "🇷🇺", HK: "🇭🇰", JP: "🇯🇵", KR: "🇰🇷", AE: "🇦🇪",
};

const Catalog = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderItem, setOrderItem] = useState<CatalogItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = (cat: string, q: string, avail: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (q) params.set("search", q);
    if (avail) params.set("availability", avail);
    params.set("limit", "500");
    fetch(`${CATALOG_URL}?${params}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || []);
        if (d.categories?.length) setCategories(d.categories);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load("", "", ""); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeCategory, val, filterAvail), 400);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    load(cat, search, filterAvail);
  };

  const handleAvail = (avail: string) => {
    setFilterAvail(avail);
    load(activeCategory, search, avail);
  };

  // Группируем по категории если нет фильтра
  const grouped = activeCategory
    ? { [activeCategory]: items }
    : categories.reduce<Record<string, CatalogItem[]>>((acc, cat) => {
        acc[cat] = items.filter(i => i.category === cat);
        return acc;
      }, {});

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b border-[#FFD700]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <Icon name="ShoppingBag" size={16} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide hidden sm:block">КАТАЛОГ</span>
          </a>
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Icon name="Search" size={16} className="text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="iPhone 17, Samsung S25, MacBook..."
              className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-9 pr-4 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
            />
          </div>
          <a href="/" className="text-white/40 hover:text-white font-roboto text-xs transition-colors flex items-center gap-1">
            <Icon name="ArrowLeft" size={14} />На сайт
          </a>
        </div>

        {/* Filters row */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleAvail("")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${filterAvail === "" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            Все
          </button>
          <button
            onClick={() => handleAvail("in_stock")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 ${filterAvail === "in_stock" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            ✅ В наличии
          </button>
          <button
            onClick={() => handleAvail("on_order")}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors flex items-center gap-1 ${filterAvail === "on_order" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50 hover:border-white/30"}`}
          >
            🚗 Под заказ
          </button>
          <div className="text-white/20 text-xs font-roboto ml-2">Заказ до 17:00 — доставка завтра</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar categories */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-36 space-y-1">
            <button
              onClick={() => handleCategory("")}
              className={`w-full text-left font-roboto text-sm px-3 py-2 transition-colors ${activeCategory === "" ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/50 hover:text-white border-l-2 border-transparent"}`}
            >
              Все категории
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`w-full text-left font-roboto text-xs px-3 py-2 transition-colors ${activeCategory === cat ? "text-[#FFD700] border-l-2 border-[#FFD700] bg-[#1A1A1A]" : "text-white/40 hover:text-white border-l-2 border-transparent"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Mobile categories scroll */}
        <div className="lg:hidden w-full -mx-4 px-4 mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <button
              onClick={() => handleCategory("")}
              className={`font-roboto text-xs px-3 py-1.5 border whitespace-nowrap transition-colors ${activeCategory === "" ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}
            >
              Все
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`font-roboto text-xs px-3 py-1.5 border whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-[#FFD700] text-black border-[#FFD700]" : "border-[#333] text-white/50"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => catItems.length > 0 && (
              <div key={cat} className="mb-10">
                {!activeCategory && (
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#FFD700]/10">
                    <h2 className="font-oswald font-bold text-xl text-white uppercase">{cat}</h2>
                    <span className="font-roboto text-white/30 text-xs">{catItems.length} позиций</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {catItems.map(item => (
                    <ProductCard key={item.id} item={item} onBuy={setOrderItem} />
                  ))}
                </div>
              </div>
            ))
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-20">
              <Icon name="Search" size={40} className="text-white/10 mx-auto mb-4" />
              <p className="font-roboto text-white/30 text-sm">Ничего не найдено</p>
            </div>
          )}
        </main>
      </div>

      {/* Footer note */}
      <div className="border-t border-[#1A1A1A] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-roboto text-white/20 text-xs">
            Цены актуальны на сегодня · Гарантия 14 дней · Включает наценку за сервис
          </p>
          <p className="font-roboto text-white/20 text-xs mt-1">
            +7 (992) 999-03-33 · ул. Кирова, 11 и ул. Кирова, 7/47
          </p>
        </div>
      </div>

      {/* Order modal */}
      {orderItem && <OrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </div>
  );
};

const ProductCard = ({ item, onBuy }: { item: CatalogItem; onBuy: (item: CatalogItem) => void }) => {
  const flag = item.region ? (REGION_FLAG[item.region] || "") : "";
  const inStock = item.availability === "in_stock";

  const title = [item.brand, item.model].filter(Boolean).join(" ");
  const sub = [item.ram, item.storage].filter(Boolean).join(" · ");
  const photo = item.photo_url || MODEL_PHOTOS[item.model] || CATEGORY_PHOTOS[item.category] || null;
  const colorHex = getColorHex(item.color);

  return (
    <div className="bg-[#111] border border-[#222] hover:border-[#FFD700]/30 transition-colors group relative flex flex-col">
      {/* Image area */}
      <div className="h-44 bg-[#151515] relative overflow-hidden flex items-center justify-center">
        {photo ? (
          <img src={photo} alt={title}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <Icon name="Package" size={40} className="text-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />

        {/* Availability badge */}
        <div className={`absolute top-2 left-2 font-roboto text-[10px] px-2 py-1 backdrop-blur-sm ${inStock ? "bg-green-900/70 text-green-400" : "bg-black/70 text-white/60"}`}>
          {inStock ? "✅ В наличии" : "🚗 Завтра"}
        </div>

        {/* Region flag */}
        {flag && <div className="absolute top-2 right-2 text-base drop-shadow">{flag}</div>}

        {/* Color dot */}
        {colorHex && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-sm">
            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: colorHex }} />
            <span className="font-roboto text-white/70 text-[10px] capitalize">{item.color}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-oswald font-bold text-base uppercase leading-tight mb-0.5">{title}</div>
        {sub && <div className="font-roboto text-white/40 text-xs mb-1">{sub}</div>}
        {!inStock && (
          <div className="font-roboto text-white/25 text-[10px] mb-2">Доставка на следующий день (заказ до 17:00)</div>
        )}

        <div className="mt-auto">
          <div className="mb-3">
            {item.price ? (
              <span className="font-oswald font-bold text-xl text-[#FFD700]">
                {(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽
              </span>
            ) : (
              <span className="font-roboto text-white/30 text-sm italic">Цену уточняйте</span>
            )}
          </div>
          <button onClick={() => onBuy(item)}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
            <Icon name="ShoppingCart" size={14} />
            Купить
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderModal = ({ item, onClose }: { item: CatalogItem; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const title = [item.brand, item.model, item.storage, item.color].filter(Boolean).join(" ");
  const displayPrice = item.price ? (item.price + PRICE_MARKUP).toLocaleString("ru-RU") + " ₽" : "Цену уточняйте";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          category: item.category,
          desc: `Заявка на покупку: ${title}, цена: ${displayPrice}`,
        }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1A1A1A] border border-[#FFD700]/30 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#FFD700]/20">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#FFD700]" />
            <h3 className="font-oswald font-bold text-lg uppercase">Оформить заявку</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Товар */}
          <div className="bg-[#111] border border-[#333] p-3 mb-5">
            <div className="font-oswald font-bold text-sm uppercase">{title}</div>
            <div className="font-oswald text-[#FFD700] font-bold text-lg mt-1">{displayPrice}</div>
            {item.availability === "on_order" && (
              <div className="font-roboto text-white/30 text-xs mt-1">🚗 Под заказ — доставка на следующий день (заказ до 17:00)</div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#FFD700] flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={28} className="text-black" />
              </div>
              <h4 className="font-oswald font-bold text-xl text-[#FFD700] mb-1">ЗАЯВКА ОТПРАВЛЕНА</h4>
              <p className="font-roboto text-white/50 text-sm mb-4">Перезвоним в течение 15 минут</p>

              {/* СБП оплата */}
              <div className="bg-[#111] border border-[#FFD700]/20 p-4 text-left">
                <div className="font-roboto text-white/40 text-xs uppercase tracking-wider mb-2">Оплата переводом СБП</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-oswald font-bold text-lg text-white">8 992 999-03-33</div>
                    <div className="font-roboto text-white/30 text-xs mt-0.5">Банк получателя подберётся автоматически</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText("89929990333"); }}
                    className="shrink-0 border border-[#FFD700]/30 text-[#FFD700] font-roboto text-xs px-3 py-2 hover:border-[#FFD700] transition-colors flex items-center gap-1.5">
                    <Icon name="Copy" size={12} />
                    Копировать
                  </button>
                </div>
                {item.price && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="font-roboto text-white/40 text-xs">Сумма к оплате:</span>
                    <span className="font-oswald font-bold text-[#FFD700]">{(item.price + PRICE_MARKUP).toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
              </div>

              <a href="tel:+79929990333" className="flex items-center justify-center gap-2 mt-3 text-[#FFD700] font-oswald font-bold">
                <Icon name="Phone" size={16} />
                +7 (992) 999-03-33
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Иван"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <div>
                <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Icon name="Phone" size={16} />
                {loading ? "Отправляем..." : "Отправить заявку"}
              </button>
              {/* Быстрая оплата СБП */}
              <div className="border border-white/10 p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wider">Оплата СБП сразу</div>
                  <div className="font-oswald font-bold text-sm text-white">8 992 999-03-33</div>
                </div>
                <button type="button" onClick={() => { navigator.clipboard.writeText("89929990333"); }}
                  className="border border-[#FFD700]/20 text-[#FFD700]/60 hover:text-[#FFD700] hover:border-[#FFD700] font-roboto text-xs px-2 py-1.5 transition-colors flex items-center gap-1">
                  <Icon name="Copy" size={11} />
                  Копировать
                </button>
              </div>
              <p className="font-roboto text-white/20 text-[10px] text-center">
                Перезвоним в течение 15 минут и подтвердим заказ
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;