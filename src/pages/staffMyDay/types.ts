export const STAFF_DAILY_URL = "https://functions.poehali.dev/be89689d-a156-4e0e-bf96-11e5e715f3c1";

export type DailyRole = "repair" | "sales" | "owner";

export type ChecklistTask = {
  key: string;
  label: string;
  is_done: boolean;
  note?: string | null;
  completed_at?: string | null;
};

export type Checklist = {
  done: number;
  total: number;
  tasks: ChecklistTask[];
};

export type StuckOrder = {
  id: number;
  name: string;
  model: string | null;
  status: string;
  frozen: number;
  parts_cost: number;
  advance: number;
  repair_amount: number;
  since: string | null;
  days: number;
};

export type RepairSignals = {
  stuck_orders: StuckOrder[];
  dead_money: number;
  ready_to_hand_off: { id: number; name: string; model: string | null; amount: number }[];
  count_stuck: number;
};

export type StaleAvitoItem = {
  id: number;
  title: string;
  price: number;
  updated: string | null;
};

export type SalesSignals = {
  showcase_count: number;
  on_avito_count: number;
  avito_index: number;
  avito_index_ok: boolean;
  stale_avito: StaleAvitoItem[];
  stale_avito_count: number;
  incomplete_items_count: number;
  today_buyouts: number;
  today_gold: number;
};

export type TeamRow = {
  id: number;
  full_name: string;
  login: string;
  role: DailyRole;
  done: number;
  total: number;
};

export type MyDayResponse = {
  employee: { id: number; full_name: string; login: string; role: string };
  role: DailyRole;
  today: string;
  checklist: Checklist;
  signals: RepairSignals | SalesSignals | { repair: RepairSignals; sales: SalesSignals };
  team?: TeamRow[];
};
