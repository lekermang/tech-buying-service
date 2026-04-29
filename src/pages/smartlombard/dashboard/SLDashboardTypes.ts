export type Stats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
  sales_total?: number;
  sales_count?: number;
  pledge_total?: number;
  pledge_count?: number;
  buyout_total?: number;
  buyout_count?: number;
  kassa_income?: number;
  kassa_expense?: number;
  kassa_sales_total?: number;
  kassa_sales_count?: number;
  kassa_buyout_total?: number;
  kassa_buyout_count?: number;
  kassa_ok?: boolean;
  kassa_error?: string;
  operations_total: number;
  cached?: boolean;
  error?: string;
};

export const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");

// SmartLombard может вернуть error как строку, объект {message}, или массив [{field, message}].
// Превращаем что угодно в безопасную строку для рендера.
export function errToText(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return v.map(errToText).filter(Boolean).join('; ');
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') {
      return o.field ? `${o.field}: ${o.message}` : o.message;
    }
    if (typeof o.error === 'string') return o.error;
    try { return JSON.stringify(v); } catch { return '[object]'; }
  }
  return String(v);
}

export function todayDmy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function shiftDmy(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export const PRESETS: { k: string; l: string; from: () => string; to: () => string }[] = [
  { k: "today", l: "Сегодня", from: () => todayDmy(), to: () => todayDmy() },
  { k: "yest",  l: "Вчера",   from: () => shiftDmy(-1), to: () => shiftDmy(-1) },
  { k: "w7",    l: "7 дней",  from: () => shiftDmy(-6), to: () => todayDmy() },
  { k: "m30",   l: "30 дней", from: () => shiftDmy(-29), to: () => todayDmy() },
];

// dd.mm.yyyy ↔ yyyy-mm-dd для <input type="date">
export const dmyToIso = (s: string) => {
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
export const isoToDmy = (s: string) => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
