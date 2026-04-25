export const VIP_CHAT_URL = "https://functions.poehali.dev/f4a88e67-03e7-4387-a091-32588d90df73";
export const POLL_INTERVAL_MS = 4000;
export const ONLINE_THRESHOLD_MS = 90 * 1000; // 1.5 минуты — считаем онлайн

export type Member = {
  id: number;
  full_name: string;
  role: string;
  avatar_url: string | null;
  last_seen_at: string | null;
  is_active: boolean;
};

export type Message = {
  id: number;
  employee_id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  text: string | null;
  photo_url: string | null;
  created_at: string;
};

export type PollResp = {
  me?: { id: number; role: string; full_name: string };
  messages: Message[];
  members: Member[];
  unread: number;
  max_id: number;
  error?: string;
};

export const ROLE_BADGE: Record<string, string> = {
  owner: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black",
  admin: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30",
  staff: "bg-white/10 text-white/60",
};
export const ROLE_LABEL: Record<string, string> = { owner: "Владелец", admin: "Админ", staff: "Сотрудник" };

export const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

export const isOnline = (m: Member) => {
  if (!m.last_seen_at) return false;
  const last = new Date(m.last_seen_at).getTime();
  return Date.now() - last < ONLINE_THRESHOLD_MS;
};

export const lastSeenText = (m: Member) => {
  if (!m.last_seen_at) return "ещё не заходил";
  const ms = Date.now() - new Date(m.last_seen_at).getTime();
  if (ms < ONLINE_THRESHOLD_MS) return "сейчас в сети";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `был ${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `был ${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `был ${days} д назад`;
};

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
};
