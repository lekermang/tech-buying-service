export const CATALOG_URL = "https://functions.poehali.dev/e0e6576c-f000-4288-86ef-1de08ad7bcc4";
export const PHOTOS_URL  = "https://functions.poehali.dev/06375f20-54a8-439c-921c-6cff0f1cecf2";
export const SYNC_URL    = "https://functions.poehali.dev/bc6598ed-2eb1-4f4f-9de6-7409ce74149e";
export const PRICE_URL   = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

export const MAX_PHOTOS = 5;

export const CATEGORIES = [
  "Смартфоны", "Планшеты", "Ноутбуки", "Наушники",
  "Умные часы", "Компьютеры", "Техника", "Игровые консоли", "Камеры", "Прочее",
];
export const REGIONS = ["RU", "EU", "US", "CN", "HK", "JP", "KR", "AE"];
export const AVAIL_OPTIONS = [
  { val: "in_stock", label: "В наличии" },
  { val: "on_order", label: "Под заказ" },
];

export type Item = {
  id: number; category: string; brand: string; model: string;
  color: string | null; storage: string | null; ram: string | null;
  region: string | null; availability: string; price: number | null;
  has_photo: boolean; photo_url: string | null;
};
export type Photo = { id: number; url: string; sort_order: number; };

export const EMPTY_FORM = {
  category: "Смартфоны", brand: "Apple", model: "", color: "",
  storage: "", ram: "", region: "EU", availability: "in_stock", price: "",
};

export const inp = [
  "w-full bg-[#0D0D0D] border border-[#333] text-white px-2.5 py-2",
  "font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20",
].join(" ");

export const lbl = "font-roboto text-white/30 text-[10px] block mb-1";
