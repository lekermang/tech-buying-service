export type View = "list" | "analytics" | "labor_prices" | "import_parts";
// Расширенный набор периодов:
//   day — текущий рабочий день, yesterday — вчерашний, week — 7 дней, month — 30 дней
//   quarter — 90 дней, year — 365 дней, custom — произвольный диапазон (date_from / date_to)
export type Period = "day" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

export type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  // Расширенные метрики (в backend появятся; на фронте могут отсутствовать у старых ответов)
  avg_check?: number;       // средний чек (revenue / done)
  avg_repair_hours?: number; // средняя длительность ремонта в часах (от created_at до status_updated_at для ready/done)
  conversion?: number;       // % выданных от всех принятых
  paid_count?: number;       // оплаченных (is_paid=true)
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

export const EMPTY_READY = { purchase_amount: "", repair_amount: "", parts_name: "", admin_note: "" };

export type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

export const VIEWS: { k: View; l: string; icon: string; ownerOnly?: boolean }[] = [
  { k: "list", l: "Заявки", icon: "ClipboardList" },
  { k: "analytics", l: "Аналитика", icon: "BarChart2" },
  { k: "labor_prices", l: "Цены", icon: "Tag", ownerOnly: true },
  { k: "import_parts", l: "Импорт", icon: "FileUp", ownerOnly: true },
];