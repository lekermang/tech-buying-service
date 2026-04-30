import { SL_API_URL, SL_IMPORT_EXPORT_URL } from "../staff.types";

export type SLCategory = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
};

export type SLClient = {
  id: number;
  full_name: string;
  phone?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  passport_issued_by?: string | null;
  passport_issued_date?: string | null;
  passport_address?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type SLItem = {
  id: number;
  category_id?: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_icon?: string | null;
  title: string;
  brand?: string | null;
  model?: string | null;
  specs?: string | null;
  condition?: string | null;
  color?: string | null;
  storage?: string | null;
  imei?: string | null;
  serial_number?: string | null;
  description?: string | null;
  photos?: string[];
  purchase_price: number | string;
  sell_price: number | string;
  status: string;
  location: string;
  source?: string | null;
  purchase_date?: string | null;
  sell_date?: string | null;
  purchase_employee?: string | null;
  sell_employee?: string | null;
  purchase_client_name?: string | null;
  sell_client_name?: string | null;
};

export type SLOperation = {
  id: number;
  op_type: string;
  amount: number | string;
  payment_method?: string;
  contract_number?: string | null;
  employee?: string | null;
  notes?: string | null;
  created_at: string;
  item_id?: number | null;
  client_id?: number | null;
  item_title?: string | null;
  brand?: string | null;
  model?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
};

export type SLStats = {
  period: string;
  by_type: Record<string, { count: number; total: number }>;
  by_status: Record<string, { count: number; total: number }>;
  by_location: Record<string, number>;
  profit_period: number;
  sold_in_period: number;
  top_categories: { name: string; count: number; total: number }[];
  daily: { day: string; buyout_total: number; buyout_count: number; sale_total: number; sale_count: number }[];
};

export type SLSpecsTemplate = {
  id: number;
  brand?: string | null;
  model?: string | null;
  title_pattern?: string | null;
  specs: string;
  use_count: number;
  is_builtin: boolean;
};

export type SLFormat = {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
  show_specs: boolean;
  show_barcode: boolean;
  show_logo: boolean;
  font_family: string;
  is_default: boolean;
  is_thermal: boolean;
  sort_order: number;
};

export const STATUS_LABELS: Record<string, string> = {
  in_stock: "В наличии",
  sold: "Продано",
  returned: "Возврат",
  reserved: "Резерв",
  hidden: "Скрыто",
};

export const LOCATION_LABELS: Record<string, string> = {
  showcase: "На витрине",
  storage: "На складе",
  reserved: "Резерв",
  service: "В сервисе",
};

export const CONDITIONS = ["новое", "отличное", "хорошее", "удовлетворительное"];

export const PAYMENT_METHODS = [
  { v: "cash", l: "Наличные" },
  { v: "card", l: "Карта" },
  { v: "transfer", l: "Перевод" },
];

export const OP_LABELS: Record<string, { l: string; color: string; icon: string }> = {
  buyout: { l: "Скупка", color: "text-blue-400", icon: "ShoppingCart" },
  sale: { l: "Продажа", color: "text-green-400", icon: "Banknote" },
  return: { l: "Возврат", color: "text-orange-400", icon: "Undo2" },
  price_change: { l: "Переоценка", color: "text-yellow-400", icon: "Pencil" },
  writeoff: { l: "Списание", color: "text-red-400", icon: "Trash2" },
};

export function fmtMoney(n: number | string | undefined | null): string {
  const v = Number(n || 0);
  return new Intl.NumberFormat("ru-RU").format(Math.round(v)) + " ₽";
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return s;
  }
}

export async function slGet<T = unknown>(token: string, action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  const res = await fetch(`${SL_API_URL}?${qs}`, { headers: { "X-Employee-Token": token } });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export async function slPost<T = unknown>(token: string, action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SL_API_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export async function slIeGet<T = unknown>(token: string, action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, String(v)); });
  const res = await fetch(`${SL_IMPORT_EXPORT_URL}?${qs}`, { headers: { "X-Employee-Token": token } });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export async function slIePost<T = unknown>(token: string, action: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SL_IMPORT_EXPORT_URL}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}
