import { CatalogItem } from "@/pages/catalog.types";

export const CATEGORY_ICONS: Record<string, string> = {
  "Смартфоны": "Smartphone",
  "Планшеты": "Tablet",
  "Ноутбуки": "Laptop",
  "Наушники": "Headphones",
  "Умные часы": "Watch",
  "Компьютеры": "Monitor",
  "Техника": "Zap",
  "Игровые консоли": "Gamepad2",
  "Камеры": "Camera",
  "Прочее": "Package",
};

export const BRAND_PRIORITY = ["Apple", "Samsung", "Xiaomi", "POCO", "Realme", "OnePlus", "Honor", "Google", "Dyson", "Sony"];
export const CAT_PRIORITY = ["Смартфоны", "Планшеты", "Ноутбуки", "Наушники", "Умные часы", "Компьютеры"];

const MODEL_SUFFIX_PRIORITY = ["Pro Max", "Pro", "Air", "Plus", "Ultra"];

function modelSortKey(model: string) {
  const m = model.match(/\b(\d{1,2})\b/);
  return m ? parseInt(m[1]) : 0;
}

function modelSuffixKey(model: string) {
  const lower = model.toLowerCase();
  for (let i = 0; i < MODEL_SUFFIX_PRIORITY.length; i++) {
    if (lower.includes(MODEL_SUFFIX_PRIORITY[i].toLowerCase())) return i;
  }
  return MODEL_SUFFIX_PRIORITY.length;
}

export function sortItems(raw: CatalogItem[]) {
  return [...raw].sort((a, b) => {
    const ai = BRAND_PRIORITY.indexOf(a.brand), bi = BRAND_PRIORITY.indexOf(b.brand);
    const av = ai === -1 ? 999 : ai, bv = bi === -1 ? 999 : bi;
    if (av !== bv) return av - bv;
    const numDiff = modelSortKey(b.model) - modelSortKey(a.model);
    if (numDiff !== 0) return numDiff;
    const suffixDiff = modelSuffixKey(a.model) - modelSuffixKey(b.model);
    if (suffixDiff !== 0) return suffixDiff;
    return a.model.localeCompare(b.model);
  });
}

export function sortCategories(cats: string[]) {
  return [...CAT_PRIORITY.filter(p => cats.includes(p)), ...cats.filter(c => !CAT_PRIORITY.includes(c))];
}
