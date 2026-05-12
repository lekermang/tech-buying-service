export const LEADS_URL = "https://functions.poehali.dev/cccc3788-d793-49a5-9254-f194e6d94e18";
export const PUBLIC_CHAT_URL = "https://functions.poehali.dev/81f2b98f-4c02-4f5a-afce-adf94d25dcac";
export const MAX_BOT_URL = "https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c";

export type LeadPhoto = {
  id: number;
  cdn_url: string;
  created_at?: string;
  expires_at?: string;
};

export type Lead = {
  id: number;
  source: string;
  client_name: string;
  client_phone: string;
  category: string | null;
  description: string | null;
  status: string;
  owner_name: string | null;
  age_minutes: number;
  created_at: string;
  contact_channels?: string | string[] | null;
  device?: string | null;
  photos?: LeadPhoto[];
};

export type Stats = {
  new_count: number;
  taken_count: number;
  overdue_count: number;
  answered_today: number;
  today_total: number;
};

export type Toast = {
  id: number;
  lead: Lead;
  level: "new" | "5min" | "15min" | "30min";
};

export const LS_SEEN_KEY = "leads_seen_v1";

export const fmtPhone = (p: string) => {
  const d = (p || "").replace(/\D/g, "");
  if (d.length !== 11) return p;
  return `+${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
};

export const sourceLabel: Record<string, string> = {
  lead: "Оценка",
  repair: "Ремонт",
  apple: "Apple",
  gold: "Золото",
  jobs: "Вакансия",
  catalog: "Каталог",
  tools: "Инструменты",
  avito: "Авито",
  exit_popup: "Поп-ап",
};

export const getSeenIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const saveSeenIds = (s: Set<number>) => {
  try {
    const arr = Array.from(s).slice(-200);
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify(arr));
  } catch { /* */ }
};

export const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.5);
  } catch { /* */ }
};