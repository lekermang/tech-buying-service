/** Детальная карточка посетителя /staff/analytics/visitor/:id */
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  getVisitor, getSessionEvents, SOURCE_LABEL,
  type VisitorDetail, type SessionEvent,
} from "./staffAnalytics/api";

const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");
const fmtDate = (s: string | null | undefined) => s ? new Date(s).toLocaleString("ru-RU") : "—";
const fmtDuration = (sec: number) => sec < 60 ? `${sec}с` : sec < 3600 ? `${Math.floor(sec / 60)}м` : `${Math.floor(sec / 3600)}ч ${Math.floor((sec % 3600) / 60)}м`;

export default function StaffAnalyticsVisitor() {
  const { id = "" } = useParams<{ id: string }>();
  const [token] = useState(() => localStorage.getItem("employee_token") || "");
  const [data, setData] = useState<VisitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await getVisitor(token, id);
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Ошибка"); return; }
    setData(r.data); setErr(null);
  }, [token, id]);

  useEffect(() => { load(); }, [load]);

  if (!token) return (
    <Page><div className="text-center py-12"><a href="/staff" className="text-[#FFD700] hover:underline">Войти как сотрудник →</a></div></Page>
  );
  if (loading) return <Page><div className="text-center py-12"><Icon name="Loader2" size={24} className="animate-spin text-[#FFD700] inline" /></div></Page>;
  if (err || !data) return <Page><div className="text-center py-12 text-red-300">{err || "Не найдено"}</div></Page>;

  const v = data.visitor;

  return (
    <Page>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <a href="/staff/analytics" className="text-sm text-[#FFD700] inline-flex items-center gap-1 hover:underline">
          <Icon name="ChevronLeft" size={14} /> К списку посетителей
        </a>

        {/* Сводка */}
        <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/[0.08] to-transparent border border-[#FFD700]/25 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0">
              <Icon name={v.device_type === "mobile" ? "Smartphone" : v.device_type === "tablet" ? "Tablet" : "Monitor"} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Посетитель</div>
              <div className="text-base font-extrabold text-[#FFD700] font-mono">{v.visitor_id.slice(0, 16)}</div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-white/65 mt-0.5">
                {v.city && <span>📍 {v.city}</span>}
                {v.browser && <span>· {v.browser}</span>}
                {v.os && <span>· {v.os}</span>}
                {v.phone && <span>· 📞 {v.phone}</span>}
              </div>
            </div>
            {v.is_converted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <Icon name="CheckCircle2" size={12} /> Клиент
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat label="Всего визитов" value={fmt(v.visit_count)} />
            <Stat label="Первый визит" value={fmtDate(v.first_seen)} />
            <Stat label="Последний" value={fmtDate(v.last_seen)} />
          </div>
        </div>

        {/* Конверсии */}
        {data.conversions.length > 0 && (
          <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-3">
            <h3 className="font-oswald font-bold text-sm uppercase mb-2 text-emerald-300">
              <Icon name="Inbox" size={12} className="inline mr-1" /> Заявки ({data.conversions.length})
            </h3>
            <div className="space-y-1.5">
              {data.conversions.map(c => (
                <div key={c.id} className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded px-2 py-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{c.type}</span>
                    {c.amount ? <span className="text-[#FFD700] font-extrabold">{c.amount.toLocaleString("ru-RU")} ₽</span> : null}
                  </div>
                  <div className="text-[10px] text-white/45">{fmtDate(c.timestamp)} {c.phone ? `· ${c.phone}` : ""} {c.source ? `· ${SOURCE_LABEL[c.source]?.label || c.source}` : ""}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Сессии */}
        <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-3">
          <h3 className="font-oswald font-bold text-sm uppercase mb-2 text-[#FFD700]">
            <Icon name="Activity" size={12} className="inline mr-1" /> Сессии ({data.sessions.length})
          </h3>
          <div className="space-y-2">
            {data.sessions.map(s => <SessionItem key={s.session_id} s={s} token={token} />)}
          </div>
        </section>
      </div>
    </Page>
  );
}

function SessionItem({ s, token }: { s: VisitorDetail["sessions"][number]; token: string }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const src = SOURCE_LABEL[s.source || "direct"] || SOURCE_LABEL.direct;

  const toggle = async () => {
    if (!open && events.length === 0) {
      setLoading(true);
      const r = await getSessionEvents(token, s.session_id);
      setLoading(false);
      if (r.ok && r.data) setEvents(r.data.items);
    }
    setOpen(!open);
  };

  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2">
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        <span style={{ color: src.color, background: `${src.color}22`, border: `1px solid ${src.color}44` }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold uppercase">
          <Icon name={src.icon} size={10} /> {src.label}
        </span>
        {s.search_query && <span className="italic text-white/60">«{s.search_query}»</span>}
        {s.city && <span className="text-white/45">📍 {s.city}</span>}
        <span className="text-white/45">⏱ {fmtDuration(s.duration_sec || 0)}</span>
        <span className="text-white/45">📄 {s.page_count}</span>
        <span className="text-white/35 ml-auto">{fmtDate(s.started_at)}</span>
      </div>
      {s.landing_page && (
        <div className="text-[10px] text-white/45 mt-1 truncate">
          Вход: <span className="text-white/65">{s.landing_page}</span>
        </div>
      )}
      <button onClick={toggle} className="mt-1.5 text-[10px] text-[#FFD700]/80 hover:text-[#FFD700] uppercase tracking-wider font-bold">
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={10} className="inline mr-0.5" />
        {open ? "Скрыть события" : "Показать события"} ({events.length || "?"})
      </button>
      {open && (
        <div className="mt-2 space-y-0.5 max-h-[300px] overflow-y-auto">
          {loading && <div className="text-[10px] text-white/40">Загрузка...</div>}
          {!loading && events.length === 0 && <div className="text-[10px] text-white/40">Событий нет</div>}
          {events.map(e => (
            <div key={e.id} className="text-[10px] text-white/65 flex items-start gap-2 border-l-2 border-[#FFD700]/20 pl-2">
              <span className="text-white/40 shrink-0 w-12">{new Date(e.timestamp).toLocaleTimeString("ru-RU")}</span>
              <span className="font-bold text-white/85">{e.event_type}</span>
              <span className="truncate">{e.page_title || e.page_url || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/40 border border-[#1F1F1F] rounded-md px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-[11px] font-bold text-white/85 mt-0.5 truncate">{value}</div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#141414]">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
          <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
          <span className="text-xs text-[#777] hidden sm:inline">/ Админ / Аналитика / Посетитель</span>
        </a>
        <a href="/staff/analytics" className="text-xs text-[#FFD700] hover:underline">← К аналитике</a>
      </div>
      {children}
    </div>
  );
}
