export const CHAT_URL = "https://functions.poehali.dev/60644856-ff88-4875-b2a9-97c87d32a630";
export const POLL_INTERVAL = 30000;

export const QUICK_REPLIES = [
  "Здравствуйте! Чем могу помочь?",
  "Принял, сейчас уточню и отвечу.",
  "Оценим в течение 15 минут, ожидайте.",
  "Позвоните нам: +7 (992) 999-03-33",
  "Приезжайте к нам: ул. Кирова, 11",
  "Спасибо за обращение! Удачного дня 🙂",
];

export const TAGS = ["VIP", "Срочно", "Закрыт", "Ждёт ответа"] as const;
export type Tag = typeof TAGS[number];
export const TAG_COLORS: Record<Tag, string> = {
  "VIP": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  "Срочно": "bg-red-500/20 text-red-400 border-red-500/40",
  "Закрыт": "bg-white/10 text-white/40 border-white/20",
  "Ждёт ответа": "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

export type Room = {
  id: number;
  title: string;
  client_phone: string;
  client_name: string;
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
  tag?: Tag;
  note?: string;
};

export type Message = {
  id: number;
  author_type: "client" | "staff" | "system";
  author_name: string;
  text: string | null;
  photo_url?: string;
  is_system: boolean;
  created_at: string;
  is_note?: boolean;
};

export type ClientHistory = {
  leads: { id: number; category: string; created_at: string; status: string }[];
  repairs: { id: number; model: string; status: string; repair_amount: number | null; created_at: string }[];
};

export const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
};

export const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* ignore */ }
};

export const sendBrowserPush = (title: string, body: string) => {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};