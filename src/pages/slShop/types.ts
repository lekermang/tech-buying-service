import { SLSHOP_URL } from "../staff.types";

export { SLSHOP_URL };

export type SLPermissions = Record<string, boolean | undefined> & { all?: boolean };

export type SLRole = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: SLPermissions;
  sort_order: number;
};

export type SLMyPermissions = {
  role: string;
  name: string;
  permissions: SLPermissions;
  is_owner: boolean;
};

export type SLCashAccount = {
  id: number;
  branch_id?: number | null;
  branch_name?: string | null;
  name: string;
  kind: string;
  balance: number | string;
  is_default: boolean;
  is_active: boolean;
};

export type SLCashSummary = SLCashAccount & {
  today_in: number | string;
  today_out: number | string;
};

export type SLCashMovement = {
  id: number;
  account_id: number;
  account_name?: string | null;
  branch_name?: string | null;
  direction: "in" | "out";
  amount: number | string;
  balance_after?: number | string | null;
  category?: string | null;
  reason?: string | null;
  taken_by?: string | null;
  employee_name?: string | null;
  is_auto: boolean;
  created_at: string;
};

export type SLRequisite = {
  id: number;
  branch_id?: number | null;
  branch_name?: string | null;
  legal_name: string;
  short_name?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  kpp?: string | null;
  legal_address?: string | null;
  actual_address?: string | null;
  bank_name?: string | null;
  bank_bic?: string | null;
  bank_account?: string | null;
  corr_account?: string | null;
  phone?: string | null;
  email?: string | null;
  director_name?: string | null;
  director_position?: string | null;
  signatory_name?: string | null;
  warranty_days: number;
  is_default: boolean;
  is_active: boolean;
};

export type SLDocTemplate = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  op_types: string[];
  is_active: boolean;
  is_system: boolean;
  print_format: "a4" | "a5" | "thermal" | string;
  copies: number;
  sort_order: number;
};

export type SLDocContext = {
  item: Record<string, unknown> | null;
  operation: Record<string, unknown> | null;
  client: Record<string, unknown> | null;
  branch: Record<string, unknown> | null;
  requisites: Record<string, unknown> | null;
};

export type SLEvent = {
  id: number;
  event_type: string;
  entity_type?: string | null;
  entity_id?: number | null;
  title?: string | null;
  description?: string | null;
  amount?: number | string | null;
  branch_id?: number | null;
  branch_name?: string | null;
  employee_name?: string | null;
  created_at: string;
};

export type SLAnalytics = {
  period: string;
  date_from: string;
  by_employee: { employee: string; sold_count: number; sold_sum: number; bought_count: number; bought_sum: number }[];
  by_branch: { branch: string | null; sold_count: number; sold_sum: number; bought_sum: number }[];
  by_day: { d: string; sold_count: number; sold_sum: number; bought_sum: number }[];
  by_category: { category: string | null; sold_count: number; sold_sum: number }[];
};

export type SLAccounting = {
  period: string;
  date_from: string;
  revenue: number;
  spent: number;            // обратная совместимость: закупки + операционные
  purchases?: number;       // сколько потратили на закупку товаров за период
  cogs?: number;            // себестоимость проданных за период
  opex?: number;            // операционные расходы (касса out)
  gross_profit?: number;    // маржа = revenue - cogs
  profit: number;           // чистая прибыль = gross_profit - opex
  sales_count: number;
  buys_count: number;
  cash_by_branch: { branch: string | null; account: string; balance: number; in_sum: number; out_sum: number }[];
  expenses_by_category: { category: string | null; cnt: number; sum: number }[];
};

export type SLFavorite = {
  id: number;
  kind: string;
  ref_id?: number | null;
  label: string;
  url?: string | null;
  icon: string;
  sort_order: number;
};

export const OP_TYPE_LABELS: Record<string, string> = {
  buyout_individual: "Скупка (физлицо)",
  buyout_legal: "Скупка (юрлицо)",
  sell: "Продажа товара",
  sell_consignment: "Продажа (реализация)",
  return: "Возврат товара",
  return_consignment: "Возврат (реализация)",
  consignment_in: "Приём на реализацию",
  consignment_off: "Снятие с реализации",
  consignment_settle: "Расчёт с клиентом (реализация)",
  move_in: "Входящее перемещение",
  move_out: "Исходящее перемещение",
  writeoff: "Списание / изъятие",
};

export function can(perms: SLPermissions | null | undefined, key: string): boolean {
  if (!perms) return false;
  if (perms.all) return true;
  return perms[key] === true;
}

export type SLCategory = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  parent_id?: number | null;
  depth?: number;
  path?: string | null;
};

export type SLDiscountRule = {
  id: number;
  name: string;
  category_id?: number | null;
  category_name?: string | null;
  apply_to_all: boolean;
  period_days: number;
  percent: number | string;
  use_market_price: boolean;
  use_duplicates_dependency: boolean;
  rounding: string;
  is_active: boolean;
  max_discount_percent?: number | string | null;
  min_price?: number | string | null;
};

export type SLRevision = {
  id: number;
  name: string;
  status: string;
  category_id?: number | null;
  scope_status?: string | null;
  started_by?: string | null;
  started_at: string;
  finished_at?: string | null;
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_extra: number;
  note?: string | null;
};

export type SLRevisionItem = {
  id: number;
  revision_id: number;
  item_id?: number | null;
  scanned_code?: string | null;
  state: "pending" | "found" | "missing" | "extra";
  scanned_at?: string | null;
  scanned_by?: string | null;
  title?: string | null;
  imei?: string | null;
  sku?: string | null;
  sell_price?: number | string;
  note?: string | null;
};

export type SLClient = {
  id: number;
  full_name: string;
  phone?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  passport_issued_by?: string | null;
  passport_issued_date?: string | null;
  address?: string | null;
  birth_date?: string | null;
  notes?: string | null;
};

export type SLItemStatus = "stock" | "showcase" | "consignment" | "sold" | "returned" | "hidden";

export type SLItem = {
  id: number;
  sku?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_path?: string | null;
  title: string;
  brand?: string | null;
  model?: string | null;
  specs?: string | null;
  specs_short?: string | null;
  storage?: string | null;
  color?: string | null;
  condition?: string | null;
  imei?: string | null;
  serial_number?: string | null;
  battery_health?: number | null;
  has_box?: boolean;
  has_charger?: boolean;
  description?: string | null;
  images?: string[];
  buy_price?: number | string;
  sell_price?: number | string;
  min_price?: number | string;
  status: SLItemStatus;
  source?: string;
  consignment_percent?: number | string | null;
  consignment_owner_id?: number | null;
  buy_client_id?: number | null;
  buy_client_name?: string | null;
  buy_at?: string | null;
  sell_at?: string | null;
  created_at?: string;
  branch_id?: number | null;
  branch_name?: string | null;
  branch_address?: string | null;
};

export type SLBranch = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type SLSoldItem = {
  id: number;
  title: string;
  specs_short?: string | null;
  imei?: string | null;
  sku?: string | null;
  sell_price?: number | string;
  buy_price?: number | string;
  sell_at?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  category_path?: string | null;
  operation_id?: number;
  amount?: number | string;
  payment_method?: string;
  contract_number?: string | null;
  employee_name?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  client_phone?: string | null;
  branch_name?: string | null;
  branch_address?: string | null;
};

export type SLBoughtItem = {
  id: number;
  title: string;
  specs_short?: string | null;
  imei?: string | null;
  sku?: string | null;
  buy_price?: number | string;
  sell_price?: number | string;
  buy_at?: string | null;
  status?: string;
  category_id?: number | null;
  category_name?: string | null;
  category_path?: string | null;
  operation_id?: number;
  amount?: number | string;
  employee_name?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  client_phone?: string | null;
  branch_name?: string | null;
  branch_address?: string | null;
};

export type SLOperation = {
  id: number;
  op_type: "buy" | "sell" | "return" | "move" | "writeoff";
  item_id?: number | null;
  item_title?: string | null;
  item_imei?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  amount?: number | string;
  payment_method?: string;
  contract_number?: string | null;
  note?: string | null;
  employee_name?: string | null;
  status_from?: string | null;
  status_to?: string | null;
  created_at: string;
};

export type SLStats = {
  period: string;
  date_from: string;
  date_to: string;
  bought_count: number;
  spent: number;
  sold_count: number;
  revenue: number;
  profit: number;
  returns_count: number;
  by_status: Record<string, { count: number; sum: number }>;
  by_category: { name: string | null; cnt: number; s: number }[];
  top_models: { title: string; cnt: number; s: number }[];
  daily: { d: string; op_type: string; cnt: number; s: number }[];
};

export type SLSpecsTemplate = {
  id: number;
  match_key: string;
  brand?: string;
  model?: string;
  specs_short?: string;
  specs_full?: string;
  default_color?: string;
  default_storage?: string;
  popularity?: number;
  is_builtin?: boolean;
};

export type SLLabelTemplate = {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
  layout: "classic" | "detailed" | "compact" | string;
  show_brand: boolean;
  show_specs: boolean;
  show_imei: boolean;
  show_qr: boolean;
  show_barcode: boolean;
  font_family: string;
  is_default: boolean;
  is_thermal: boolean;
};

export const STATUS_LABEL: Record<string, { l: string; color: string }> = {
  stock: { l: "На складе", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  showcase: { l: "На витрине", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  consignment: { l: "На реализации", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  sold: { l: "Продан", color: "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30" },
  returned: { l: "Возврат", color: "bg-red-500/15 text-red-300 border-red-500/30" },
  hidden: { l: "Скрыт", color: "bg-white/10 text-white/40 border-white/20" },
};

export const CONDITION_OPTIONS = ["Новое", "Отличное", "Хорошее", "Удовлетворительное", "Уценка"];
export const PAYMENT_METHODS = [
  { v: "cash", l: "Наличные" },
  { v: "card", l: "Карта" },
  { v: "transfer", l: "Перевод" },
];

export async function slApi<T = unknown>(
  token: string,
  action: string,
  opts: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | undefined | null>;
    body?: unknown;
    rawText?: boolean;
  } = {}
): Promise<{ ok: boolean; data: T | null; raw?: string; error?: string }> {
  const method = opts.method || "GET";
  const url = new URL(SLSHOP_URL);
  url.searchParams.set("action", action);
  Object.entries(opts.params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  try {
    const init: RequestInit = {
      method,
      headers: {
        "X-Employee-Token": token,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
    };
    if (method === "POST") init.body = JSON.stringify(opts.body || {});
    const res = await fetch(url.toString(), init);
    if (opts.rawText) {
      const text = await res.text();
      return { ok: res.ok, data: null, raw: text };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      return { ok: false, data: null, error: data?.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function fmt(n: number | string | undefined | null): string {
  const v = Number(n) || 0;
  return v.toLocaleString("ru-RU");
}