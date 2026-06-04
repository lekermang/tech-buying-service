/** Главный дашборд аналитики посетителей. Содержит:
 * - Polling: /online, /stats_today + /conversions, /recent_events
 * - Шапку модуля с переключателем звука и индикатором Live
 * - KPI карточки
 * - Левую (OnlineList + SourcesBlock) и правую (PhoneSearch + ConversionsBlock) колонки
 *
 * ЛОГИКА И СТРУКТУРА — 1:1 как было в StaffAnalytics.tsx, изменений нет.
 */
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  getOnline, getStatsToday, getConversions, getRecentEvents,
  type OnlineSession, type StatsToday, type Conversion,
} from "./api";
import { fmt, POLL_ONLINE_MS, POLL_STATS_MS, POLL_EVENTS_MS, toastForEvent } from "./utils";
import { Kpi, OnlineList } from "./VisitorCard";
import { SourcesBlock, ConversionsBlock, PhoneSearch } from "./AnalyticsBlocks";
import VisitorsHistory from "./VisitorsHistory";

export default function AnalyticsDashboard({ token }: { token: string }) {
  const [tab, setTab] = useState<"live" | "history">(() =>
    (localStorage.getItem("sk_an_tab") as "live" | "history") || "live"
  );
  const [online, setOnline] = useState<OnlineSession[]>([]);
  const [stats, setStats] = useState<StatsToday | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [pulse, setPulse] = useState(0);
  const lastEventIdRef = useRef<number>(0);
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem("sk_an_muted") === "1");
  // Авто-обновление: по умолчанию выключено — экономит вызовы функции analytics.
  // Владелец сам включает «живой» режим когда нужно следить онлайн.
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => localStorage.getItem("sk_an_auto") === "1");
  const [refreshing, setRefreshing] = useState(false);

  // ─── Ручная загрузка всех данных ───
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      const [o, s, c] = await Promise.all([
        getOnline(token), getStatsToday(token), getConversions(token),
      ]);
      if (o.ok && o.data) { setOnline(o.data.items); setPulse(p => p + 1); }
      if (s.ok && s.data) setStats(s.data);
      if (c.ok && c.data) setConversions(c.data.items);
    } finally {
      setRefreshing(false);
    }
  };

  // Первая загрузка при открытии вкладки (один раз)
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── Polling онлайна (только если включено авто-обновление) ───
  useEffect(() => {
    if (!autoRefresh) return;
    let alive = true;
    const tickOnline = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await getOnline(token);
      if (!alive) return;
      if (r.ok && r.data) {
        setOnline(r.data.items);
        setPulse(p => p + 1);
      }
    };
    const timer = window.setInterval(tickOnline, POLL_ONLINE_MS);
    return () => { alive = false; window.clearInterval(timer); };
  }, [token, autoRefresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const [s, c] = await Promise.all([getStatsToday(token), getConversions(token)]);
      if (!alive) return;
      if (s.ok && s.data) setStats(s.data);
      if (c.ok && c.data) setConversions(c.data.items);
    };
    const timer = window.setInterval(tick, POLL_STATS_MS);
    return () => { alive = false; window.clearInterval(timer); };
  }, [token, autoRefresh]);

  // ─── Уведомления о новых событиях (только при авто-обновлении) ───
  useEffect(() => {
    if (!autoRefresh) return;
    let alive = true;
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
    const timer = window.setInterval(tick, POLL_EVENTS_MS);
    return () => { alive = false; window.clearInterval(timer); };
  }, [token, muted, autoRefresh]);

  const toggleAuto = () => {
    setAutoRefresh(a => {
      const next = !a;
      try { localStorage.setItem("sk_an_auto", next ? "1" : "0"); } catch {/* ignore */}
      return next;
    });
  };

  const toggleMute = () => {
    setMuted(m => {
      const next = !m;
      try { localStorage.setItem("sk_an_muted", next ? "1" : "0"); } catch {/* ignore */}
      return next;
    });
  };

  const switchTab = (t: "live" | "history") => {
    setTab(t);
    try { localStorage.setItem("sk_an_tab", t); } catch {/* */}
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
          <div className="text-[10px] text-white/45">
            {tab === "live"
              ? (autoRefresh ? "Реальное время · авто-обновление вкл." : "Ручной режим · нажмите «Обновить»")
              : "История · фильтры по дате и источнику"}
          </div>
        </div>

        {/* Переключатель Live / История */}
        <div className="flex rounded overflow-hidden border border-[#2A2A2A]">
          <button
            onClick={() => switchTab("live")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === "live" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${tab === "live" && pulse % 2 ? "animate-pulse" : ""}`} />
            Live
          </button>
          <button
            onClick={() => switchTab("history")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-l border-[#2A2A2A] ${
              tab === "history" ? "bg-[#FFD700]/15 text-[#FFD700]" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"
            }`}
          >
            <Icon name="CalendarDays" size={11} />
            История
          </button>
        </div>

        {tab === "live" && (
          <>
            <button onClick={refreshAll} disabled={refreshing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 disabled:opacity-50">
              <Icon name="RefreshCw" size={12} className={refreshing ? "animate-spin" : ""} /> Обновить
            </button>
            <button onClick={toggleAuto}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                autoRefresh ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-[#2A2A2A] text-white/55"
              }`}>
              <Icon name={autoRefresh ? "Pause" : "Play"} size={12} /> {autoRefresh ? "Авто вкл." : "Авто выкл."}
            </button>
            <button onClick={toggleMute}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                muted ? "bg-[#2A2A2A] text-white/55" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              }`}>
              <Icon name={muted ? "BellOff" : "BellRing"} size={12} /> {muted ? "Звук вкл." : "Звук выкл."}
            </button>
          </>
        )}
      </div>

      {/* === Вкладка Live === */}
      {tab === "live" && (
        <>
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
            <div className="space-y-3">
              <OnlineList items={online} />
              <SourcesBlock sources={stats?.top_sources || []} />
            </div>
            <div className="space-y-3">
              <PhoneSearch token={token} />
              <ConversionsBlock items={conversions} />
            </div>
          </div>
        </>
      )}

      {/* === Вкладка История === */}
      {tab === "history" && <VisitorsHistory token={token} />}
    </div>
  );
}