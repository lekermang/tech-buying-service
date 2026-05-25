/** Раздел аналитики посетителей в админке /staff/analytics.
 * Использует polling (Cloud Functions stateless, без WS/SSE):
 *  - /online каждые 5 сек (только при visible вкладке)
 *  - /stats_today, /conversions каждые 30 сек
 *  - /recent_events каждые 10 сек для toast-уведомлений
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  getOnline, getStatsToday, getConversions, getRecentEvents, searchByPhone,
  SOURCE_LABEL,
  type OnlineSession, type StatsToday, type Conversion, type RecentEvent,
} from "./staffAnalytics/api";

const POLL_ONLINE_MS = 5000;
const POLL_STATS_MS = 30000;
const POLL_EVENTS_MS = 10000;

const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");
const fmtRub = (n: number | null | undefined) => (Number(n) || 0).toLocaleString("ru-RU") + " ₽";
const fmtAgo = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} сек назад`;
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  return `${Math.floor(s / 86400)} дн назад`;
};
const fmtDuration = (sec: number) => {
  if (sec < 60) return `${sec}с`;
  if (sec < 3600) return `${Math.floor(sec / 60)}м ${sec % 60}с`;
  return `${Math.floor(sec / 3600)}ч ${Math.floor((sec % 3600) / 60)}м`;
};

export default function StaffAnalytics({ embedded, tokenProp }: { embedded?: boolean; tokenProp?: string } = {}) {
  const [token, setToken] = useState(tokenProp || "");
  const [authReady, setAuthReady] = useState(!!tokenProp);

  useEffect(() => {
    if (tokenProp) { setToken(tokenProp); setAuthReady(true); return; }
    const t = localStorage.getItem("employee_token") || "";
    setToken(t); setAuthReady(true);
    document.title = "Аналитика посетителей — Скупка24 / Админ";
  }, [tokenProp]);

  if (!authReady) return null;
  if (!token) {
    return (
      <div className={embedded ? "p-8 text-center" : "min-h-screen bg-[#0D0D0D] text-[#F0F0F0] flex items-center justify-center px-5"}
        style={embedded ? undefined : { fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
        <div className="max-w-md text-center mx-auto">
          <Icon name="Lock" size={36} className="text-[#FFD700] mx-auto mb-3" />
          <h1 className="text-xl font-extrabold mb-2">Нужна авторизация</h1>
          <p className="text-sm text-[#999] mb-5">Войдите как сотрудник, чтобы открыть аналитику.</p>
          {!embedded && (
            <a href="/staff" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm">
              <Icon name="LogIn" size={16} /> Войти как сотрудник
            </a>
          )}
        </div>
      </div>
    );
  }

  // Embedded режим — без TopBar (внутри StaffMainLayout)
  if (embedded) {
    return (
      <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
        <AnalyticsDashboard token={token} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
        <AnalyticsDashboard token={token} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
        <span className="text-xs text-[#777] hidden sm:inline">/ Админ / Аналитика</span>
      </a>
      <a href="/staff" className="text-xs text-[#FFD700] hover:underline">
        <Icon name="LayoutDashboard" size={12} className="inline mr-1" /> Все модули
      </a>
    </div>
  );
}

function AnalyticsDashboard({ token }: { token: string }) {
  const [online, setOnline] = useState<OnlineSession[]>([]);
  const [stats, setStats] = useState<StatsToday | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [pulse, setPulse] = useState(0);
  const lastEventIdRef = useRef<number>(0);
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem("sk_an_muted") === "1");

  // ─── Polling ───
  useEffect(() => {
    let alive = true;
    let timer: number | null = null;

    const tickOnline = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await getOnline(token);
      if (!alive) return;
      if (r.ok && r.data) {
        setOnline(r.data.items);
        setPulse(p => p + 1);
      }
    };
    tickOnline();
    timer = window.setInterval(tickOnline, POLL_ONLINE_MS);
    return () => { alive = false; if (timer) window.clearInterval(timer); };
  }, [token]);

  useEffect(() => {
    let alive = true; let timer: number | null = null;
    const tick = async () => {
      const [s, c] = await Promise.all([getStatsToday(token), getConversions(token)]);
      if (!alive) return;
      if (s.ok && s.data) setStats(s.data);
      if (c.ok && c.data) setConversions(c.data.items);
    };
    tick();
    timer = window.setInterval(tick, POLL_STATS_MS);
    return () => { alive = false; if (timer) window.clearInterval(timer); };
  }, [token]);

  // ─── Уведомления о новых событиях ───
  useEffect(() => {
    let alive = true; let timer: number | null = null;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await getRecentEvents(token, 15);
      if (!alive || !r.ok || !r.data) return;
      const items = r.data.items.slice().reverse(); // от старых к новым
      for (const e of items) {
        if (e.id <= lastEventIdRef.current) continue;
        lastEventIdRef.current = e.id;
        toastForEvent(e, muted);
      }
    };
    tick();
    timer = window.setInterval(tick, POLL_EVENTS_MS);
    return () => { alive = false; if (timer) window.clearInterval(timer); };
  }, [token, muted]);

  const toggleMute = () => {
    setMuted(m => {
      const next = !m;
      try { localStorage.setItem("sk_an_muted", next ? "1" : "0"); } catch {/* ignore */}
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Шапка модуля */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
          <Icon name="Activity" size={18} className="text-[#FFD700]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald uppercase font-bold text-[15px] tracking-wide">Аналитика посетителей</div>
          <div className="text-[10px] text-white/45">Реальное время · обновление каждые 5 сек</div>
        </div>
        <button onClick={toggleMute}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
            muted ? "bg-[#2A2A2A] text-white/55" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}>
          <Icon name={muted ? "BellOff" : "BellRing"} size={12} /> {muted ? "Звук вкл." : "Звук выкл."}
        </button>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/55">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${pulse % 2 ? "animate-pulse" : ""}`}></span>
          Live
        </span>
      </div>

      {/* KPI карточки */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Kpi label="Сейчас онлайн" value={fmt(stats.online_now)} color="green" icon="Users" big />
          <Kpi label="Уник. сегодня" value={fmt(stats.uniq_today)} color="gold" icon="User" />
          <Kpi label="Сессий" value={fmt(stats.sessions_today)} color="blue" icon="Activity" />
          <Kpi label="Заявок" value={fmt(stats.conv_today)} color="orange" icon="Inbox" />
          <Kpi label="Конверсия" value={`${stats.conversion_rate}%`} color="gold" icon="TrendingUp" />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-3">
        {/* Левая колонка */}
        <div className="space-y-3">
          <OnlineList items={online} />
          <SourcesBlock sources={stats?.top_sources || []} />
        </div>
        {/* Правая колонка */}
        <div className="space-y-3">
          <PhoneSearch token={token} />
          <ConversionsBlock items={conversions} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color, icon, big }: { label: string; value: string; color: "green" | "gold" | "blue" | "orange"; icon: string; big?: boolean }) {
  const colorMap = {
    green: "text-emerald-300 border-emerald-500/30 bg-emerald-500/[0.06]",
    gold: "text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/[0.06]",
    blue: "text-blue-300 border-blue-500/30 bg-blue-500/[0.06]",
    orange: "text-orange-300 border-orange-500/30 bg-orange-500/[0.06]",
  }[color];
  return (
    <div className={`rounded-xl border p-2.5 ${colorMap}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} />
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</span>
      </div>
      <div className={`font-oswald font-extrabold leading-none ${big ? "text-[28px]" : "text-[22px]"}`}>{value}</div>
    </div>
  );
}

function OnlineList({ items }: { items: OnlineSession[] }) {
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="Users" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">На сайте сейчас</span>
        <span className="text-[11px] text-white/50">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-center py-8 text-white/35 text-[12px]">
          <Icon name="UserX" size={20} className="inline mb-1 opacity-40" />
          <div>Никого онлайн</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(it => <VisitorCard key={it.session_id} v={it} />)}
        </div>
      )}
    </section>
  );
}

function VisitorCard({ v }: { v: OnlineSession }) {
  const src = SOURCE_LABEL[v.source || "direct"] || SOURCE_LABEL.direct;
  const isReturn = v.visit_count > 1;
  const path = (v.path || []).slice(-4);

  const cardCls = v.is_hot
    ? "bg-orange-500/[0.08] border-orange-500/40 hover:border-orange-500/60"
    : v.is_converted
    ? "bg-emerald-500/[0.06] border-emerald-500/30 hover:border-emerald-500/50"
    : "bg-[#0F0F0F] border-[#1F1F1F] hover:border-[#FFD700]/35";

  return (
    <a href={`/staff/analytics/visitor/${v.visitor_id}`}
      className={`block rounded-lg border px-2.5 py-2 transition active:scale-[0.99] ${cardCls}`}>
      <div className="flex items-start gap-2">
        {/* Иконка устройства */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
          <Icon name={v.device_type === "mobile" ? "Smartphone" : v.device_type === "tablet" ? "Tablet" : "Monitor"} size={12} className="text-white/60" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Шапка */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
              style={{ color: src.color, background: `${src.color}22`, border: `1px solid ${src.color}44` }}>
              <Icon name={src.icon} size={9} /> {src.label}
            </span>
            {v.search_query && (
              <span className="text-[10px] text-white/60 italic truncate max-w-[200px]" title={v.search_query}>
                «{v.search_query}»
              </span>
            )}
            {v.city && <span className="text-[10px] text-white/45">📍 {v.city}</span>}
            {isReturn && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-[#FFD700]/15 text-[#FFD700] text-[9px] font-bold uppercase">
                #{v.visit_count}
              </span>
            )}
            {v.is_converted && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold uppercase">
                <Icon name="CheckCircle2" size={9} /> Клиент
              </span>
            )}
            {v.is_hot && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-orange-500/30 text-orange-200 text-[9px] font-bold uppercase animate-pulse">
                🔥 {hotLabel(v.hot_action)}
              </span>
            )}
          </div>
          {/* Путь */}
          <div className="text-[11px] text-white/75 truncate">
            {path.length === 0 ? (v.current_title || v.current_page || "—") : (
              <span>
                {path.map((p, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-white/30 mx-1">→</span>}
                    <span title={p.url}>{p.title || urlPath(p.url) || "—"}</span>
                  </span>
                ))}
              </span>
            )}
          </div>
          {/* Метаданные */}
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40 flex-wrap">
            <span>⏱ {fmtDuration(v.time_on_site)}</span>
            <span>📄 {v.page_count}</span>
            {v.browser && <span>{v.browser}</span>}
            {v.os && <span>{v.os}</span>}
            <span className="ml-auto text-white/30 text-[9px]">ID {v.visitor_id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function urlPath(u?: string | null) {
  if (!u) return "";
  try { const x = new URL(u, "https://x"); return x.pathname === "/" ? "Главная" : x.pathname; } catch { return u; }
}

function hotLabel(a: string | null) {
  switch (a) {
    case "phone_click": return "Звонок";
    case "whatsapp_click": return "WhatsApp";
    case "telegram_click": return "Telegram";
    case "form_start": return "Форма";
    case "form_submit": return "Отправил";
    default: return a || "";
  }
}

function SourcesBlock({ sources }: { sources: { source: string; sessions: number; visitors: number }[] }) {
  const max = Math.max(1, ...sources.map(s => s.sessions));
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="PieChart" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Источники сегодня</span>
      </h3>
      {sources.length === 0 ? (
        <div className="text-[11px] text-white/40 text-center py-3">Данных ещё нет</div>
      ) : (
        <div className="space-y-1.5">
          {sources.map(s => {
            const lbl = SOURCE_LABEL[s.source || "direct"] || SOURCE_LABEL.direct;
            const pct = (s.sessions / max) * 100;
            return (
              <div key={s.source || "direct"} className="text-[11px]">
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ color: lbl.color }} className="flex items-center gap-1 font-bold">
                    <Icon name={lbl.icon} size={11} /> {lbl.label}
                  </span>
                  <span className="text-white/55">{s.visitors} чел · {s.sessions} сесс.</span>
                </div>
                <div className="h-1.5 rounded bg-white/5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: lbl.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ConversionsBlock({ items }: { items: Conversion[] }) {
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="Inbox" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Последние заявки</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-[11px] text-white/40 text-center py-3">Заявок ещё нет</div>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 12).map(c => (
            <a key={c.id} href={`/staff/analytics/visitor/${c.visitor_id}`}
              className="block bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded-lg px-2.5 py-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white/85 truncate">{c.type}</span>
                {c.amount ? <span className="text-[#FFD700] font-extrabold shrink-0">{fmtRub(c.amount)}</span> : null}
              </div>
              <div className="text-[10px] text-white/45 flex items-center gap-1.5 flex-wrap">
                {c.phone && <span>📞 {c.phone}</span>}
                {c.city && <span>📍 {c.city}</span>}
                {c.source && <span>← {(SOURCE_LABEL[c.source]?.label) || c.source}</span>}
                <span className="ml-auto">{fmtAgo(c.timestamp)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function PhoneSearch({ token }: { token: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof searchByPhone>>["data"] extends { items: infer T } | null ? T extends Array<infer I> ? I[] : never : never>([]);

  useEffect(() => {
    const digits = q.replace(/\D/g, "");
    if (digits.length < 3) { setItems([]); return; }
    const id = setTimeout(async () => {
      const r = await searchByPhone(token, q);
      if (r.ok && r.data) setItems(r.data.items);
    }, 300);
    return () => clearTimeout(id);
  }, [q, token]);

  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2">
        <Icon name="Search" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Поиск по телефону</span>
      </h3>
      <input
        value={q} onChange={e => setQ(e.target.value)}
        placeholder="+7 999 123 45 67"
        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-md px-3 py-2 text-[12px] focus:border-[#FFD700]/40 outline-none"
      />
      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.map(it => (
            <a key={it.visitor_id} href={`/staff/analytics/visitor/${it.visitor_id}`}
              className="block bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded px-2 py-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="font-bold text-white/85">{it.phone || "—"}</span>
                {it.is_converted && <Icon name="CheckCircle2" size={11} className="text-emerald-400" />}
              </div>
              <div className="text-[10px] text-white/45">
                {it.city || "—"} · визитов {it.visit_count} · {fmtAgo(it.last_seen)}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Звуковой сигнал и тосты ───
let beepCtx: AudioContext | null = null;
function beep() {
  try {
    if (!beepCtx) beepCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const ctx = beepCtx;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.05;
    o.start(); setTimeout(() => { o.stop(); }, 180);
  } catch {/* ignore */}
}

function toastForEvent(e: RecentEvent, muted: boolean) {
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