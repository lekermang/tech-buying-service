export type View = "list" | "analytics" | "labor_prices" | "import_parts";
export type Period = "day" | "yesterday" | "week" | "month";

export type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
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
