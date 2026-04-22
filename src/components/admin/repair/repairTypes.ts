export const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

export const STATUSES = [
  { key: "new",           label: "Принята",         color: "bg-white/10 text-white/70",           dot: "bg-white/40" },
  { key: "accepted",      label: "Принят мастером", color: "bg-purple-500/20 text-purple-400",    dot: "bg-purple-400" },
  { key: "in_progress",   label: "В работе",        color: "bg-blue-500/20 text-blue-400",        dot: "bg-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть",   color: "bg-orange-500/20 text-orange-400",   dot: "bg-orange-400" },
  { key: "ready",         label: "Готово ✓",        color: "bg-yellow-500/20 text-[#FFD700]",     dot: "bg-[#FFD700]" },
  { key: "done",          label: "Выдано",          color: "bg-green-500/20 text-green-400",      dot: "bg-green-400" },
  { key: "warranty",      label: "На гарантии",     color: "bg-teal-500/20 text-teal-400",        dot: "bg-teal-400" },
  { key: "cancelled",     label: "Отменено",        color: "bg-red-500/20 text-red-400",          dot: "bg-red-400" },
];

export type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
  purchase_amount: number | null; repair_amount: number | null;
  completed_at: string | null; master_income: number | null; parts_name: string | null;
  picked_up_at: string | null;
};

export type Analytics = {
  period: string; total: number; done: number; cancelled: number;
  ready: number; in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

export type EditForm = {
  purchase_amount: string;
  repair_amount: string;
  parts_name: string;
  admin_note: string;
};

export const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "" };
export const EMPTY_READY: EditForm = { purchase_amount: "", repair_amount: "", parts_name: "", admin_note: "" };

export const statusInfo = (key: string) => STATUSES.find((s) => s.key === key) || STATUSES[0];

export const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

export const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
export const lbl = "font-roboto text-white/40 text-[10px] block mb-1";