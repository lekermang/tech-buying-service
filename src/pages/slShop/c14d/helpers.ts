import type { C14dListItem } from "./types";

export type DueTone = "red" | "orange" | "yellow" | "green" | "gray";

export type DueState = { label: string; short: string; tone: DueTone };

export const TONE_CLS: Record<DueTone, string> = {
  red: "bg-red-500/15 border-red-500/40 text-red-300",
  orange: "bg-orange-500/15 border-orange-500/40 text-orange-300",
  yellow: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
  green: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  gray: "bg-white/5 border-white/15 text-white/50",
};

export const TONE_BAR: Record<DueTone, string> = {
  red: "bg-red-500",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  green: "bg-emerald-500",
  gray: "bg-white/15",
};

export function pluralDays(n: number): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b > 1 && b < 5) return "дня";
  if (b === 1) return "день";
  return "дней";
}

export function dueState(it: Pick<C14dListItem, "status" | "days_left" | "extended">): DueState {
  if (it.status !== "active") return { label: "Завершён", short: "—", tone: "gray" };
  const d = it.days_left;
  if (d === null || d === undefined) return { label: "Срок не указан", short: "—", tone: "gray" };
  if (d < 0) {
    const n = Math.abs(d);
    return it.extended
      ? { label: `Продление · ${n} ${pluralDays(n)} сверх срока`, short: `+${n} дн.`, tone: "orange" }
      : { label: `Просрочен на ${n} ${pluralDays(n)}`, short: `−${n} дн.`, tone: "red" };
  }
  if (d === 0) return { label: "Срок истекает сегодня", short: "Сегодня", tone: "orange" };
  if (d === 1) return { label: "Остался 1 день (до завтра)", short: "Завтра", tone: "yellow" };
  if (d <= 3) return { label: `Осталось ${d} ${pluralDays(d)}`, short: `${d} дн.`, tone: "yellow" };
  return { label: `Осталось ${d} ${pluralDays(d)}`, short: `${d} дн.`, tone: "green" };
}

export function cleanPhone(p?: string | null): string {
  if (!p) return "";
  let d = p.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  return d;
}

export function fmtPhone(p?: string | null): string {
  const d = cleanPhone(p);
  if (d.length !== 11) return p || "";
  return `+${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

export function clientMessage(it: Pick<C14dListItem, "contract_number" | "client_name" | "end_date" | "today_remaining" | "days_left" | "item_brand" | "item_model">, fmtD: (s: string) => string): string {
  const name = (it.client_name || "").split(" ").slice(1, 2).join(" ") || it.client_name || "";
  const device = [it.item_brand, it.item_model].filter(Boolean).join(" ");
  const sum = Math.round(Number(it.today_remaining || 0)).toLocaleString("ru-RU");
  const d = it.days_left;
  const when = d === null || d === undefined
    ? ""
    : d < 0 ? `Срок договора истёк ${fmtD(it.end_date)}.`
    : d === 0 ? "Срок договора истекает сегодня."
    : `Срок договора до ${fmtD(it.end_date)}.`;
  return `Здравствуйте, ${name}! Напоминаем по договору ${it.contract_number}${device ? ` (${device})` : ""}. ${when} Сумма к возврату на сегодня: ${sum} ₽. Если нужно продлить или выкупить, напишите нам.`.replace(/\s+/g, " ").trim();
}

export const LOG_LABELS: Record<string, { l: string; icon: string; tone: DueTone }> = {
  create: { l: "Договор оформлен", icon: "FilePlus", tone: "green" },
  add_late_contract: { l: "Оформлен задним числом", icon: "FileClock", tone: "yellow" },
  payment: { l: "Принят платёж", icon: "Wallet", tone: "green" },
  payment_cancel: { l: "Платёж отменён", icon: "Undo2", tone: "red" },
  payment_correction: { l: "Платёж исправлен", icon: "PencilLine", tone: "yellow" },
  terminate: { l: "Договор расторгнут", icon: "Ban", tone: "red" },
  close: { l: "Договор закрыт", icon: "CheckCircle2", tone: "green" },
  to_warehouse: { l: "Передан на склад", icon: "PackagePlus", tone: "orange" },
  extend_enable: { l: "Включено продление", icon: "Timer", tone: "orange" },
  extend_disable: { l: "Продление выключено", icon: "TimerOff", tone: "gray" },
};

export function logSummary(action: string, d: Record<string, unknown>, fmt: (n: number) => string): string {
  const n = (v: unknown) => Number(v || 0);
  switch (action) {
    case "create":
    case "add_late_contract":
      return d.amount ? `Выдано ${fmt(n(d.amount))} ₽` : "";
    case "payment": {
      const parts = [`${fmt(n(d.amount))} ₽`, d.payment_type === "full" ? "полный выкуп" : "частичный"];
      if (n(d.saving) > 0) parts.push(`экономия клиенту ${fmt(n(d.saving))} ₽`);
      if (d.auto_closed) parts.push("договор закрыт автоматически");
      return parts.join(" · ");
    }
    case "payment_cancel":
      return `Отменено ${fmt(n(d.amount))} ₽`;
    case "payment_correction":
      return `${fmt(n(d.old_amount))} → ${fmt(n(d.new_amount))} ₽${d.reason ? ` · ${String(d.reason)}` : ""}`;
    case "terminate":
      return d.reason && d.reason !== "..." ? String(d.reason) : "";
    case "to_warehouse":
      return `Закупка ${fmt(n(d.purchase_price))} ₽ → цена продажи ${fmt(n(d.sell_price))} ₽`;
    case "extend_enable":
      return d.note ? String(d.note) : "";
    default:
      return "";
  }
}
