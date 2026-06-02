export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

export function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  return {
    from: new Date(y, m, 1).toISOString().slice(0, 10),
    to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
  };
}

export type TodayState = {
  config: { daily_rate: number; bonus_percent: number };
  today_total: number | null;
  total_earned: number;
  total_paid: number;
  remaining: number;
  is_repair_master: boolean;
};

export type DayRow = { shift_date: string; hours_worked: number; base_rate?: number; bonus_amount?: number; total: number };
export type PayoutRow = { id: number; payout_date: string; amount: number; note: string | null };

export type SaleRow = {
  id: number; time: string; item_title: string; item_category: string | null;
  sell_price: number; buy_price: number; profit: number; bonus_from_sale: number;
};
export type GoldRow = { id: number; time: string; description: string; total_price: number };
export type RepairShopRow = { id: number; time: string; device: string; repair_type: string; amount: number; parts_cost: number; profit: number };
export type ContractRow = { id: number; time: string; item_name: string; loan_amount: number; profit: number };
export type Breakdown = {
  goods: { count: number; revenue: number; profit: number };
  gold: { count: number; revenue: number };
  repairs: { count: number; revenue: number; profit: number };
  contracts: { count: number; revenue: number; profit: number };
};

export type DayDetail = {
  date: string; day_log: DayRow | null;
  config: { daily_rate: number; bonus_percent: number };
  sales: SaleRow[];
  gold?: GoldRow[];
  repairs?: RepairShopRow[];
  contracts?: ContractRow[];
  breakdown?: Breakdown;
};

export type RepairDayRow = {
  repair_date: string; orders_count: number;
  total_revenue: number; total_costs: number; profit: number; master_income: number;
};
export type RepairOrderRow = {
  id: number; time: string; model: string; repair_type: string;
  repair_amount: number; purchase_amount: number; profit: number;
  master_income: number; parts_name: string | null; client_name: string;
};
export type RepairDayDetail = {
  date: string;
  orders: RepairOrderRow[];
  summary: { orders_count: number; total_revenue: number; total_costs: number; total_profit: number; total_master_income: number };
};
export type RepairHistory = {
  days: RepairDayRow[]; payouts: PayoutRow[];
  total_earned: number; total_paid: number; remaining: number;
};