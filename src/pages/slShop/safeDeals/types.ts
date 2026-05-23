import { STATUS_LABEL as PUBLIC_STATUS_LABEL, type DealStatus } from "@/pages/safeDeals/api";

export const SAFE_DEALS_URL = "https://functions.poehali.dev/00eed6a0-e6ef-4615-bc13-1d9879dc1c68";
export { STATUS_LABEL } from "@/pages/safeDeals/api";
export type { DealStatus };

export const STATUS_OPTIONS: { value: DealStatus | "all"; label: string }[] = [
  { value: "all",        label: "Все статусы" },
  { value: "submitted",  label: "Заявка подана" },
  { value: "review",     label: "На проверке" },
  { value: "on_shelf",   label: "На витрине" },
  { value: "reserved",   label: "Зарезервировано" },
  { value: "completed",  label: "Завершено" },
  { value: "cancelled",  label: "Отменено" },
  { value: "returned",   label: "Возврат" },
];

export type AdminListItem = {
  id: number;
  deal_number: string;
  qr_code: string;
  status: DealStatus;
  seller_name: string;
  seller_phone: string;
  product_title: string;
  product_brand?: string | null;
  product_model?: string | null;
  product_condition?: string | null;
  product_category?: string | null;
  price: number;
  commission_amount: number;
  seller_payout: number;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at?: string | null;
  photos_count: number;
};

export type AdminStats = {
  submitted_count: number;
  review_count: number;
  on_shelf_count: number;
  reserved_count: number;
  completed_count: number;
  cancelled_count: number;
  returned_count: number;
  commission_today: number;
  commission_month: number;
  commission_total: number;
  turnover_today: number;
  turnover_month: number;
  turnover_total: number;
  completed_today: number;
  completed_month: number;
  daily: { day: string; count: number; commission: number }[];
};

export type AdminDeal = AdminListItem & {
  seller_email?: string | null;
  product_description?: string | null;
  product_serial?: string | null;
  payment_method: string;
  payout_method: string;
  payout_details?: string | null;
  commission_pct: number;
  photos: { url: string }[];
  office_check_notes?: string | null;
  office_checked_by?: string | null;
  office_checked_at?: string | null;
  reservation_until?: string | null;
  cancel_reason?: string | null;
  events: { id: number; event_type: string; details: Record<string, unknown>; actor?: string | null; created_at: string }[];
};

export async function sdApi<T = unknown>(
  token: string,
  action: string,
  opts: { method?: "GET" | "POST"; params?: Record<string, string | number | undefined>; body?: unknown } = {},
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const method = opts.method || "GET";
  const url = new URL(SAFE_DEALS_URL);
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
    const r = await fetch(url.toString(), init);
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) return { ok: false, data: null, error: d.error || `HTTP ${r.status}` };
    return { ok: true, data: d as T };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export const fmtRub = (n: number | null | undefined): string =>
  (Number(n) || 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";

export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("ru-RU"); } catch { return s; }
};

// re-export for convenience
export { PUBLIC_STATUS_LABEL };
