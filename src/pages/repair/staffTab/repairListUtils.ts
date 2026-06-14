import { Order } from "../types";

export type SortMode = "urgency" | "date_desc" | "date_asc" | "price_desc" | "price_asc";
export type GroupMode = "none" | "time" | "status" | "paid";
export type TimeGroup = "critical" | "today" | "yesterday" | "day2ago" | "week" | "older";

// Возраст заявки в часах
export function ageHoursAny(o: Order): number {
  if (!o.created_at) return -1;
  const t = new Date(o.created_at).getTime();
  if (!Number.isFinite(t)) return -1;
  return (Date.now() - t) / 3_600_000;
}

export function ageHours(o: Order): number {
  if (o.status !== "new" || !o.created_at) return -1;
  const t = new Date(o.created_at).getTime();
  if (!Number.isFinite(t)) return -1;
  return (Date.now() - t) / 3_600_000;
}

// Уровень срочности: 0..5 (5 — критично, 48ч+). Не-новые → -1.
export function urgencyLevel(o: Order): number {
  const h = ageHours(o);
  if (h < 0) return -1;
  if (h >= 48) return 5;
  if (h >= 24) return 4;
  if (h >= 12) return 3;
  if (h >= 6) return 2;
  if (h >= 3) return 1;
  return 0;
}

// Временная группа заявки — по дате создания (для основного списка)
export function getTimeGroup(o: Order): TimeGroup {
  const h = ageHoursAny(o);
  if (h < 0) return "older";
  if (h < 24) return "today";
  if (h < 48) return "yesterday";
  if (h < 72) return "day2ago";
  if (h < 168) return "week";
  return "older";
}

// Группа для urgentFilter (только критичные — выделяем их отдельно)
export function getUrgentTimeGroup(o: Order): TimeGroup {
  const h = ageHoursAny(o);
  if (h < 0) return "older";
  if (o.status === "new" && h >= 6) return "critical";
  if (h < 24) return "today";
  if (h < 48) return "yesterday";
  if (h < 72) return "day2ago";
  if (h < 168) return "week";
  return "older";
}

export const TIME_GROUP_META: Record<TimeGroup, { label: string; color: string; icon: string; desc?: string }> = {
  critical:  { label: "🚨 Срочные",    color: "#ef4444", icon: "AlertTriangle", desc: "Новые заявки > 6 часов без движения" },
  today:     { label: "Сегодня",       color: "#FFD700", icon: "Clock",         desc: undefined },
  yesterday: { label: "Вчера",         color: "#a78bfa", icon: "CalendarDays",  desc: undefined },
  day2ago:   { label: "Позавчера",     color: "#60a5fa", icon: "Calendar",      desc: undefined },
  week:      { label: "Эта неделя",    color: "#64748b", icon: "CalendarRange", desc: undefined },
  older:     { label: "Старше недели", color: "#475569", icon: "Archive",       desc: undefined },
};