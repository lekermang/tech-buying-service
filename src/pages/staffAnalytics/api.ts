/** API-клиент для аналитики /staff/analytics. */
export const ANALYTICS_URL = "https://functions.poehali.dev/4a685ed3-dad8-47ee-be16-48c6db749fd2";

export type OnlineSession = {
  session_id: string;
  visitor_id: string;
  started_at: string;
  last_heartbeat: string;
  source: string | null;
  medium: string | null;
  search_query: string | null;
  current_page: string | null;
  current_title: string | null;
  path: { url: string; title: string; t: string }[] | null;
  hot_action: string | null;
  hot_action_at: string | null;
  city: string | null;
  duration_sec: number;
  page_count: number;
  visit_count: number;
  is_converted: boolean;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  phone: string | null;
  time_on_site: number;
  is_hot: boolean;
};

export type StatsToday = {
  online_now: number;
  uniq_today: number;
  sessions_today: number;
  conv_today: number;
  conv_amount_today: number;
  conversion_rate: number;
  top_sources: { source: string; sessions: number; visitors: number }[];
};

export type Conversion = {
  id: number;
  visitor_id: string;
  session_id: string | null;
  type: string;
  form_data: Record<string, unknown> | null;
  amount: number | null;
  phone: string | null;
  city: string | null;
  source: string | null;
  timestamp: string;
};

export type RecentEvent = {
  id: number;
  session_id: string;
  visitor_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  page_url: string | null;
  timestamp: string;
  source: string | null;
  city: string | null;
  phone: string | null;
  is_converted: boolean | null;
};

export type VisitorDetail = {
  visitor: {
    visitor_id: string; first_seen: string; last_seen: string; visit_count: number;
    city: string | null; country: string | null;
    device_type: string | null; browser: string | null; os: string | null;
    is_converted: boolean; phone: string | null;
  };
  sessions: Array<{
    session_id: string; started_at: string; ended_at: string | null;
    duration_sec: number; page_count: number;
    source: string | null; medium: string | null; referrer: string | null;
    landing_page: string | null; exit_page: string | null; search_query: string | null;
    city: string | null; current_page: string | null;
    hot_action: string | null; hot_action_at: string | null;
  }>;
  conversions: Array<{ id: number; type: string; amount: number | null; phone: string | null; source: string | null; timestamp: string; form_data: Record<string, unknown> | null }>;
};

export type SessionEvent = {
  id: number; event_type: string; page_url: string | null; page_title: string | null;
  event_data: Record<string, unknown> | null; timestamp: string;
};

async function call<T>(action: string, token: string, params?: Record<string, string | number>): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const url = new URL(ANALYTICS_URL);
  url.searchParams.set("action", action);
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== "") url.searchParams.set(k, String(v)); });
  try {
    const r = await fetch(url.toString(), { headers: { "X-Employee-Token": token } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) return { ok: false, data: null, error: d.error || `HTTP ${r.status}` };
    return { ok: true, data: d as T };
  } catch (e) {
    return { ok: false, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export const getOnline = (token: string) => call<{ items: OnlineSession[]; count: number }>("online", token);
export const getStatsToday = (token: string) => call<StatsToday>("stats_today", token);
export const getConversions = (token: string) => call<{ items: Conversion[] }>("conversions", token, { limit: 50 });
export const getRecentEvents = (token: string, seconds = 15) => call<{ items: RecentEvent[] }>("recent_events", token, { seconds });
export const getVisitor = (token: string, id: string) => call<VisitorDetail>("visitor", token, { id });
export const getSessionEvents = (token: string, id: string) => call<{ items: SessionEvent[] }>("session_events", token, { id });
export const searchByPhone = (token: string, phone: string) => call<{ items: Array<{ visitor_id: string; phone: string | null; city: string | null; last_seen: string; visit_count: number; is_converted: boolean }> }>("search", token, { phone });

export const SOURCE_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  direct: { label: "Прямой", color: "#999", icon: "Globe" },
  yandex: { label: "Яндекс", color: "#FF0000", icon: "Search" },
  google: { label: "Google", color: "#4285F4", icon: "Search" },
  "mail.ru": { label: "Mail.ru", color: "#0066D9", icon: "Search" },
  bing: { label: "Bing", color: "#008373", icon: "Search" },
  vk: { label: "ВКонтакте", color: "#0077FF", icon: "Users" },
  telegram: { label: "Telegram", color: "#0088CC", icon: "Send" },
  whatsapp: { label: "WhatsApp", color: "#25D366", icon: "MessageCircle" },
  instagram: { label: "Instagram", color: "#E4405F", icon: "Camera" },
  facebook: { label: "Facebook", color: "#1877F2", icon: "Facebook" },
  youtube: { label: "YouTube", color: "#FF0000", icon: "Video" },
  avito: { label: "Авито", color: "#97CF26", icon: "ShoppingBag" },
  "2gis": { label: "2ГИС", color: "#19AA1A", icon: "MapPin" },
  yandex_maps: { label: "Я.Карты", color: "#FFCC00", icon: "MapPin" },
  referral: { label: "Реферал", color: "#FFD700", icon: "ExternalLink" },
};
