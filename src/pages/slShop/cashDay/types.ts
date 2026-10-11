export type CashCategoryRow = { category: string | null; direction: "in" | "out"; count: number; sum: number };

export type CashCount = {
  id: number;
  count_date: string;
  account_id: number | null;
  account_name?: string | null;
  cash_counted: number | string;
  safe_amount: number | string;
  cashless_counted: number | string | null;
  expected_cash: number | string;
  expected_cashless: number | string;
  diff_cash: number | string;
  diff_cashless: number | string | null;
  corrected: boolean;
  comment?: string | null;
  employee_name?: string | null;
  created_at: string;
};

export type CashDayAccount = {
  id: number;
  name: string;
  branch_name?: string | null;
  balance: number | string;
  expected_cash: number;
  opening_cash: number;
  day_in: number;
  day_out: number;
  categories: CashCategoryRow[];
  last_count: CashCount | null;
};

export type CashDayMovement = {
  id: number;
  account_id: number;
  account_name?: string | null;
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

export type CashlessRow = { kind: string; label: string; method: string; count: number; sum: number };

export type OwnerPeriod = {
  sales_count: number;
  sales_revenue: number;
  sales_profit: number;
  contracts_closed: number;
  contract_profit: number;
  expenses: number;
  net: number;
  taken: number;
  available: number;
  can_take_now: number;
};

export type CashDayData = {
  date: string;
  is_today: boolean;
  accounts: CashDayAccount[];
  movements: CashDayMovement[];
  cashless: { in: CashlessRow[]; out: CashlessRow[]; total_in: number; total_out: number };
  last_cashless_count: CashCount | null;
  counts_history: CashCount[];
  owner: { day: OwnerPeriod; month: OwnerPeriod; cash_total: number } | null;
  can_correct: boolean;
};

export const CATEGORY_LABEL: Record<string, string> = {
  contracts_14d_payout: "Выдача по договору (залог)",
  contracts_14d_payment: "Платёж по договору",
  contracts_14d_payment_cancel: "Отмена платежа по договору",
};

export const METHOD_LABEL: Record<string, string> = { cash: "Наличные", card: "Карта", transfer: "Перевод" };

export const catLabel = (c?: string | null, dir?: "in" | "out") =>
  (c && CATEGORY_LABEL[c]) || c || (dir === "in" ? "Поступление" : "Расход");
