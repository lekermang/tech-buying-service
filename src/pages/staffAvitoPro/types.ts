export const SYNC_URL = "https://functions.poehali.dev/49e23745-1449-4e4c-80c2-e7967f3c5584";

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
