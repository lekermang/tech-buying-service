export const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";

export type SubTab = "dashboard" | "chat" | "promote" | "autoload";

export type ChatItem = {
  chat_id: string;
  avito_id: number | null;
  item_title: string | null;
  user_name: string | null;
  user_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type ChatStats = {
  unread_chats: number;
  unread_total: number;
  total: number;
};

export type ChatMessage = {
  message_id: string;
  author_id: string;
  is_outgoing: boolean;
  text: string;
  type: string;
  created_at: string | null;
};

export type Schedule = {
  id?: number;
  name: string;
  category: string | null;
  weekdays: string;
  hour: number;
  vas_type: string;
  is_active: boolean;
  last_run_at?: string | null;
  last_run_count?: number;
};

export type AutoloadConfig = {
  id?: number;
  feed_url: string | null;
  is_enabled: boolean;
  last_generated_at: string | null;
  last_items_count: number;
};

export type AutoloadStatus = {
  config: AutoloadConfig | null;
  eligible: number;
  no_photo: number;
  active_visible: number;
};

export const VAS_TYPES = [
  { v: "xl", l: "XL-объявление", price: "≈399 ₽" },
  { v: "highlight", l: "Выделение цветом", price: "≈79 ₽" },
  { v: "premium", l: "Премиум", price: "≈1199 ₽" },
  { v: "vip", l: "VIP-блок", price: "≈499 ₽" },
];

export const WEEKDAYS = [
  { v: "1", l: "Пн" },
  { v: "2", l: "Вт" },
  { v: "3", l: "Ср" },
  { v: "4", l: "Чт" },
  { v: "5", l: "Пт" },
  { v: "6", l: "Сб" },
  { v: "7", l: "Вс" },
];

export type Totals = {
  active: number;
  archived: number;
  removed: number;
  moderation: number;
  rejected: number;
  no_photo: number;
  total: number;
  views_total: number;
  contacts_total: number;
  favorites_total: number;
};

export type TopItem = {
  id: number;
  avito_id: number;
  title: string;
  price: number | null;
  main_photo: string | null;
  url: string;
  views: number;
  contacts: number;
  favorites: number;
};

export type ChartPoint = {
  date: string;
  views: number;
  contacts: number;
  favorites: number;
};

export type Dashboard = {
  totals: Totals;
  top: TopItem[];
  chart: ChartPoint[];
  last_sync: string | null;
};

export const formatNum = (n: number) => n.toLocaleString("ru-RU");
export const formatPrice = (p: number | null | undefined) =>
  p ? p.toLocaleString("ru-RU") + " ₽" : "—";

export function formatDate(s: string | null): string {
  if (!s) return "никогда";
  try {
    const d = new Date(s);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "только что";
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч назад`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days} дн назад`;
    return d.toLocaleDateString("ru-RU");
  } catch {
    return s;
  }
}