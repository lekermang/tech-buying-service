export const GOLD_URL = "https://functions.poehali.dev/c4424ec1-93d6-47d7-a71a-6eb30fa21246";

export const GOLD_STATUSES = [
  { key: "new",         label: "Закуплено",           color: "bg-white/10 text-white/70",        dot: "bg-white/40" },
  { key: "done",        label: "Продано",             color: "bg-green-500/20 text-green-400",   dot: "bg-green-400" },
  { key: "cancelled",   label: "Отменено",       color: "bg-red-500/20 text-red-400",       dot: "bg-red-400" },
];

export const PURITY_OPTIONS = [
  { v: "999", l: "999 (24K)" },
  { v: "958", l: "958 (23K)" },
  { v: "916", l: "916 (22K)" },
  { v: "875", l: "875 (21K)" },
  { v: "750", l: "750 (18K)" },
  { v: "585", l: "585 (14K)" },
  { v: "500", l: "500 (12K)" },
  { v: "375", l: "375 (9K)" },
];

export const PAYMENT_OPTIONS = [
  { v: "cash", l: "Наличные" },
  { v: "card", l: "Карта" },
  { v: "transfer", l: "Перевод" },
];

export type GoldOrder = {
  id: number;
  name: string;
  phone: string;
  item_name: string | null;
  weight: number | null;
  purity: string | null;
  buy_price: number | null;
  sell_price: number | null;
  sell_price_per_gram: number | null;
  profit: number | null;
  comment: string | null;
  status: string;
  status_updated_at: string | null;
  created_at: string;
  admin_note: string | null;
  completed_at: string | null;
  payment_method: string | null;
  is_investor_money?: boolean;
  investor_profit_per_gram?: number;
};

export type GoldInvestorSettings = {
  share_token: string;
  investor_name: string;
  money_in_safe: number;
  default_profit_per_gram: number;
};

export type GoldInvestorPublic = {
  settings: {
    investor_name: string;
    money_in_safe: number;
    default_profit_per_gram: number;
    share_token: string;
  };
  totals: {
    grams: number;
    spent: number;
    profit_total: number;
    profit_realized: number;
    in_safe: number;
    invested_now: number;
  };
  deals: {
    id: number;
    item_name: string | null;
    weight: number;
    purity: string | null;
    buy_price: number;
    sell_price: number | null;
    sell_price_per_gram: number | null;
    investor_profit_per_gram: number;
    profit: number;
    status: string;
    created_at: string | null;
    completed_at: string | null;
  }[];
  daily: { date: string; grams: number; spent: number; profit: number }[];
};

export type GoldDayStat = {
  day: string;
  total: number;
  done: number;
  buy: number;
  sell: number;
  profit: number;
  weight: number;
};

export type GoldAnalytics = {
  period: string;
  done: number;
  cancelled: number;
  in_progress: number;
  new: number;
  total: number;
  total_weight: number;
  total_weight_585?: number;
  total_buy: number;
  total_sell: number;
  total_profit: number;
  stock_weight?: number;
  stock_buy_sum?: number;
  stock_count?: number;
  stock_by_purity?: { purity: string; weight: number; buy_sum: number; count: number }[];
  period_buy_sum?: number;
  period_weight585?: number;
  period_buy_count?: number;
  daily: { day: string; done: number; buy: number; sell: number; profit: number; weight: number }[];
  sold_items?: {
    id: number;
    item_name: string;
    weight: number;
    purity: string;
    buy_price: number;
    sell_price: number;
    profit: number;
    sold_at: string | null;
    created_at: string | null;
    client_name: string;
  }[];
};

export const EMPTY_GOLD_FORM = {
  name: "", phone: "", item_name: "", weight: "", purity: "585",
  buy_price: "", sell_price: "", comment: "",
};

export const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

export const fmtDay = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
};