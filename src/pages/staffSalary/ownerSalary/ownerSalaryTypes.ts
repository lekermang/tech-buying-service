import type { EmployeeOverview } from "@/pages/staff.types";

export type CalendarDay = { shift_date: string; status: "open" | "closed" | "dayoff" };

export type LogRow = {
  id: number;
  shift_date: string;
  hours_worked: number;
  base_rate: number;
  personal_profit: number;
  bonus_percent_at_time: number;
  bonus_amount: number;
  total: number;
  owner_set: boolean;
};

export type PayoutRow = {
  id: number;
  payout_date: string;
  amount: number;
  note: string | null;
};

export type DetailState = {
  history: LogRow[];
  calendar: CalendarDay[];
  payouts: PayoutRow[];
  summary: {
    total_all: number;
    total_paid: number;
    total_unpaid: number;
    total_bonus?: number;
    total_profit?: number;
  };
};

export const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
export const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

export const isoLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const statusDot = (s: EmployeeOverview["shift_status"]) => {
  if (s === "open") return { color: "bg-green-400", label: "В работе" };
  if (s === "closed") return { color: "bg-blue-400", label: "Закрыт" };
  if (s === "dayoff") return { color: "bg-white/30", label: "Выходной" };
  return { color: "bg-white/15", label: "Не отмечен" };
};