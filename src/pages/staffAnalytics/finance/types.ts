export const FINANCE_URL = "https://functions.poehali.dev/41aae5ce-14d4-4c12-8522-59fcf9ae1b6a";

export type FinanceMetrics = {
  period_days: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  opex: number;
  labor_direct: number;
  ebit: number;
  interest_paid: number;
  interest_received: number;
  ebt: number;
  tax: number;
  net_profit: number;
  variable_costs: number;
  fixed_costs: number;
  contribution: number;
  contribution_margin_pct: number;
  bep_money: number;
  safety_margin_pct: number;
  dol: number;
  fixed_coverage: number;
  gross_margin_pct: number;
  operating_margin_pct: number;
  net_margin_pct: number;
  roa_pct: number;
  roe_pct: number;
  roic_pct: number;
  wacc_pct: number;
  eps: number;
  retention_ratio_pct: number;
  cost_profitability_pct: number;
  invested_capital: number;
  equity: number;
  inventory_days: number;
  receivables_days: number;
  payables_days: number;
  operating_cycle: number;
  financial_cycle: number;
  quality_of_profit: number;
  breakdown: {
    repair: { revenue: number; cogs: number; labor: number; done: number; total: number };
    gold:   { revenue: number; cogs: number; weight: number; done: number; total: number };
    slshop: { revenue: number; cogs: number; count: number };
    pawn:   { revenue: number; principal: number; count: number };
    salary: { total: number; bonus: number; base: number };
    cash_out_by_cat: Record<string, number>;
  };
};

export type FinanceDay = {
  day: string;
  revenue: number;
  cogs: number;
  gross: number;
  profit: number;
  repair_rev: number;
  gold_rev: number;
  sl_rev: number;
  pawn_int: number;
};

export type FinanceResponse = {
  period: string;
  date_from: string;
  date_to: string;
  metrics: FinanceMetrics;
  daily: FinanceDay[];
  compare?: { date_from: string; date_to: string; metrics: FinanceMetrics };
};

export type FinanceParam = {
  key: string;
  value: number;
  description: string;
  updated_at?: string | null;
  updated_by?: string | null;
};

export const fmtMoney = (n: number) => {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} млн`;
  if (abs >= 10_000) return `${Math.round(n / 1000)} тыс`;
  return Math.round(n).toLocaleString("ru-RU");
};

export const fmtMoneyFull = (n: number) =>
  isFinite(n) ? Math.round(n).toLocaleString("ru-RU") + " ₽" : "—";

export const fmtPct = (n: number) => isFinite(n) ? `${n.toFixed(1)}%` : "—";

export const delta = (cur: number, prev: number) => {
  if (!isFinite(cur) || !isFinite(prev)) return null;
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / Math.abs(prev)) * 100;
};
