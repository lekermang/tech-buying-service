import { SL_C14D_URL } from "../../staff.types";

export type C14dStatus = "active" | "closed" | "terminated" | "draft";
export type C14dPhotoType = "passport" | "device";

export type C14dPhoto = {
  id?: number;
  photo_type: C14dPhotoType;
  file_url: string;
  s3_key?: string | null;
  uploaded_at?: string;
};

export type C14dPayment = {
  id: number;
  amount: number | string;
  payment_type: "partial" | "full";
  comment?: string | null;
  paid_at: string;
  recorded_by?: string | null;
  income_type?: "principal" | "interest" | "mixed" | "penalty";
  cash_account_id?: number | null;
  cash_movement_id?: number | null;
};

export type C14dCashAccount = {
  id: number;
  name: string;
  kind: string;
  balance: number | string;
  is_default: boolean;
  is_active: boolean;
};

export type C14dIncomeReport = {
  period: { start_date: string; end_date: string };
  summary: {
    total_income: number;
    principal_income: number;
    interest_income: number;
    mixed_income: number;
    contract_count: number;
    payments_count: number;
    avg_income_per_contract: number;
  };
  daily: { date: string; amount: number }[];
  details: {
    id: number;
    paid_at: string;
    amount: number | string;
    payment_type: string;
    income_type: string;
    comment?: string | null;
    recorded_by?: string | null;
    contract_id: number;
    contract_number: string;
    contract_status: string;
    client_name: string;
  }[];
};

export type C14dLateItem = {
  id: number;
  contract_number: string;
  amount: number | string;
  start_date: string;
  end_date: string;
  status: C14dStatus;
  created_at: string;
  client_name: string;
  client_phone?: string | null;
  item_brand?: string | null;
  item_model?: string | null;
};

export type C14dListItem = {
  id: number;
  contract_number: string;
  amount: number | string;
  total_due: number | string;
  paid_total: number | string;
  remaining_debt: number | string;
  start_date: string;
  end_date: string;
  status: C14dStatus;
  created_at: string;
  created_by?: string | null;
  client_name: string;
  client_phone?: string | null;
  item_brand?: string | null;
  item_model?: string | null;
  item_type?: string | null;
  overdue?: boolean;
  overdue_days?: number;
};

export type C14dTodayCalc = {
  days_passed: number;
  days_passed_raw: number;
  is_early: boolean;
  interest_today: number;
  today_due_full: number;
  today_remaining: number;
  full_due: number;
  saving: number;
};

export type C14dDetail = C14dListItem & {
  client_id: number;
  item_id: number;
  client_birth_date?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  passport_issued_by?: string | null;
  passport_issue_date?: string | null;
  client_email?: string | null;
  serial_number?: string | null;
  condition?: string | null;
  accessories?: string[] | null;
  item_notes?: string | null;
  interest_rate: number | string;
  term_days: number;
  closed_at?: string | null;
  terminate_reason?: string | null;
  today_calc?: C14dTodayCalc;
  photos: C14dPhoto[];
  payments: C14dPayment[];
  log: { id: number; action: string; details: Record<string, unknown>; actor_name?: string | null; actor_role?: string | null; created_at: string }[];
};

export type C14dCalc = {
  principal: number;
  interest: number;
  total_due: number;
  daily_payment: number;
};

export type C14dStats = {
  active_count: number;
  overdue_count: number;
  archive_count: number;
  draft_count: number;
  total_active_debt: number;
  total_active_amount: number;
};

export const ITEM_TYPES = [
  "Смартфон",
  "Ноутбук",
  "Планшет",
  "Фотоаппарат",
  "Часы",
  "Игровая консоль",
  "Аудиотехника",
  "Ювелирка",
  "Другое",
];

export const ACCESSORIES_OPTIONS = [
  "Зарядное устройство",
  "Кабель",
  "Коробка",
  "Документы",
  "Чехол",
  "Защитное стекло",
  "Аксессуары",
];

export const CONDITION_OPTIONS = [
  "Отличное",
  "Хорошее",
  "Удовлетворительное",
  "Плохое",
];

export async function c14dApi<T = unknown>(
  token: string,
  action: string,
  opts: {
    method?: "GET" | "POST";
    params?: Record<string, string | number | undefined | null>;
    body?: unknown;
  } = {}
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const method = opts.method || "GET";
  const url = new URL(SL_C14D_URL);
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      return { ok: false, data: null, error: data?.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export const fmt = (n: number | string | undefined | null): string => {
  const v = Number(n) || 0;
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
};

export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("ru-RU");
  } catch {
    return s;
  }
};

export const STATUS_BADGE: Record<C14dStatus, { l: string; cls: string }> = {
  active: { l: "Активный", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  closed: { l: "Завершён", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  terminated: { l: "Расторгнут", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  draft: { l: "Черновик", cls: "bg-white/10 text-white/60 border-white/20" },
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });