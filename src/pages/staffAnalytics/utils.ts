/** Утилиты и константы для раздела аналитики /staff/analytics. */
import { toast } from "sonner";
import { SOURCE_LABEL, type RecentEvent } from "./api";

export const POLL_ONLINE_MS = 15000;
export const POLL_STATS_MS = 60000;
export const POLL_EVENTS_MS = 30000;

export const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");

export const fmtRub = (n: number | null | undefined) =>
  (Number(n) || 0).toLocaleString("ru-RU") + " ₽";

export const fmtAgo = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} сек назад`;
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  return `${Math.floor(s / 86400)} дн назад`;
};

export const fmtDuration = (sec: number) => {
  if (sec < 60) return `${sec}с`;
  if (sec < 3600) return `${Math.floor(sec / 60)}м ${sec % 60}с`;
  return `${Math.floor(sec / 3600)}ч ${Math.floor((sec % 3600) / 60)}м`;
};

export function urlPath(u?: string | null) {
  if (!u) return "";
  try {
    const x = new URL(u, "https://x");
    return x.pathname === "/" ? "Главная" : x.pathname;
  } catch {
    return u;
  }
}

export function hotLabel(a: string | null) {
  switch (a) {
    case "phone_click": return "Звонок";
    case "whatsapp_click": return "WhatsApp";
    case "telegram_click": return "Telegram";
    case "form_start": return "Форма";
    case "form_submit": return "Отправил";
    default: return a || "";
  }
}

// ─── Звуковой сигнал и тосты ───
let beepCtx: AudioContext | null = null;

export function beep() {
  try {
    if (!beepCtx) beepCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const ctx = beepCtx;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.05;
    o.start(); setTimeout(() => { o.stop(); }, 180);
  } catch {/* ignore */}
}

export function toastForEvent(e: RecentEvent, muted: boolean) {
  const srcLbl = e.source ? (SOURCE_LABEL[e.source]?.label || e.source) : "прямой";
  const city = e.city ? ` · ${e.city}` : "";
  switch (e.event_type) {
    case "session_start":
      toast(`👤 Новый посетитель из ${srcLbl}${city}`, { description: e.page_url || "" });
      break;
    case "phone_click":
      toast.success("🔥 Кликнул на телефон!", { description: `Источник: ${srcLbl}${city}` });
      if (!muted) beep();
      break;
    case "whatsapp_click":
      toast.success("💬 Кликнул на WhatsApp", { description: srcLbl + city });
      if (!muted) beep();
      break;
    case "telegram_click":
      toast.success("✈️ Кликнул на Telegram", { description: srcLbl + city });
      if (!muted) beep();
      break;
    case "form_submit":
    case "conversion": {
      const amt = (e.event_data && (e.event_data as Record<string, unknown>).amount) as number | undefined;
      toast.success(`✅ Новая заявка${amt ? ` на ${amt.toLocaleString("ru-RU")} ₽` : ""}`,
        { description: `${srcLbl}${city}${e.phone ? " · " + e.phone : ""}` });
      if (!muted) { beep(); setTimeout(beep, 250); }
      break;
    }
    default: break;
  }
}