/** История посетителей: фильтры по дате / источнику / конверсии, таблица, мини-график, KPI */
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  getVisitors, getStatsRange,
  SOURCE_LABEL,
  type VisitorRow, type VisitorsResult, type StatsRange,
} from "./api";

const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");
const fmtDate = (s: string) => new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const fmtDuration = (sec: number) => sec < 60 ? `${sec}с` : sec < 3600 ? `${Math.floor(sec / 60)}м` : `${Math.floor(sec / 3600)}ч ${Math.floor((sec % 3600) / 60)}м`;

const PAGE_SIZE = 50;

const TODAY = new Date().toISOString().slice(0, 10);
const WEEK_AGO = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

const PRESETS = [
  { label: "Сегодня", from: TODAY, to: TODAY },
  { label: "7 дней", from: WEEK_AGO, to: TODAY },
  { label: "30 дней", from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), to: TODAY },
  { label: "Всё время", from: "2024-01-01", to: TODAY },
];

interface Props { token: string }

export default function VisitorsHistory({ token }: Props) {
  const [dateFrom, setDateFrom] = useState(WEEK_AGO);
  const [dateTo, setDateTo] = useState(TODAY);
  const [source, setSource] = useState("");
  const [converted, setConverted] = useState("");
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<VisitorsResult | null>(null);
  const [stats, setStats] = useState<StatsRange | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [vr, sr] = await Promise.all([
      getVisitors(token, { date_from: dateFrom, date_to: dateTo, source: source || undefined, converted: converted || undefined, limit: PAGE_SIZE, offset }),
      getStatsRange(token, dateFrom, dateTo),
    ]);
    setLoading(false);
    if (vr.ok && vr.data) setData(vr.data);
    if (sr.ok && sr.data) setStats(sr.data);
  }, [token, dateFrom, dateTo, source, converted, offset]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (from: string, to: string) => {
    setDateFrom(from); setDateTo(to); setOffset(0);
  };

  const total = data?.total || 0;
  const pages = Math.ceil(total / PAGE_SIZE);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  // Мини-бар-чарт
  const daily = data?.daily || [];
  const maxVal = Math.max(...daily.map(d => d.visitors), 1);

  const sources = data?.sources || [];

  return (
    <div className="space-y-3">
      {/* Фильтры */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-3 space-y-2.5">
        {/* Пресеты */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.from, p.to)}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                dateFrom === p.from && dateTo === p.to
                  ? "bg-[#FFD700]/15 border border-[#FFD700]/50 text-[#FFD700]"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-white/50 hover:text-white/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Дата + фильтры */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/35 mb-1">От</label>
            <input type="date" value={dateFrom} max={dateTo}
              onChange={e => { setDateFrom(e.target.value); setOffset(0); }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white/80 text-xs px-2 py-1.5 rounded outline-none focus:border-[#FFD700]/50"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/35 mb-1">До</label>
            <input type="date" value={dateTo} min={dateFrom}
              onChange={e => { setDateTo(e.target.value); setOffset(0); }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white/80 text-xs px-2 py-1.5 rounded outline-none focus:border-[#FFD700]/50"
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/35 mb-1">Источник</label>
            <select value={source} onChange={e => { setSource(e.target.value); setOffset(0); }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white/80 text-xs px-2 py-1.5 rounded outline-none focus:border-[#FFD700]/50">
              <option value="">Все</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-white/35 mb-1">Конверсия</label>
            <select value={converted} onChange={e => { setConverted(e.target.value); setOffset(0); }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white/80 text-xs px-2 py-1.5 rounded outline-none focus:border-[#FFD700]/50">
              <option value="">Все</option>
              <option value="1">Только клиенты</option>
              <option value="0">Без заявки</option>
            </select>
          </div>
          <button onClick={() => load()}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[11px] font-bold uppercase rounded hover:bg-[#FFD700]/20 transition-all">
            <Icon name="RefreshCw" size={11} className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>
      </div>

      {/* KPI за период */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Уник. посетителей", value: fmt(stats.uniq_visitors), color: "text-[#FFD700]" },
            { label: "Сессий", value: fmt(stats.total_sessions), color: "text-blue-400" },
            { label: "Заявок", value: fmt(stats.total_conv), color: "text-orange-400" },
            { label: "Конверсия", value: `${stats.conversion_rate}%`, color: "text-emerald-400" },
            { label: "Сумма заявок", value: `${fmt(stats.total_amount)} ₽`, color: "text-emerald-400" },
          ].map(k => (
            <div key={k.label} className="rounded-lg bg-[#101010] border border-[#1A1A1A] px-3 py-2.5 text-center">
              <div className="text-[9px] uppercase tracking-widest text-white/35 mb-1">{k.label}</div>
              <div className={`text-lg font-extrabold font-oswald ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_220px] gap-3">
        {/* График по дням */}
        <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
            <Icon name="BarChart2" size={12} className="text-[#FFD700]" />
            Посетители по дням
          </div>
          {daily.length === 0 ? (
            <div className="text-white/30 text-xs text-center py-4">Нет данных</div>
          ) : (
            <div className="flex items-end gap-0.5 h-24 overflow-x-auto pb-1">
              {daily.map(d => {
                const h = Math.max(4, Math.round((d.visitors / maxVal) * 88));
                return (
                  <div key={d.day} className="flex flex-col items-center gap-0.5 group min-w-[18px] flex-1">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-[#FFD700]/50 group-hover:bg-[#FFD700] transition-colors rounded-sm"
                        style={{ height: h }}
                        title={`${d.day}: ${d.visitors} уник., ${d.sessions} сессий`}
                      />
                    </div>
                    <span className="text-[7px] text-white/25 rotate-[-45deg] origin-left mt-1 whitespace-nowrap hidden sm:block">
                      {d.day.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Топ источников */}
        <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
            <Icon name="PieChart" size={12} className="text-[#FFD700]" />
            Источники
          </div>
          {sources.length === 0 ? (
            <div className="text-white/30 text-xs text-center py-4">Нет данных</div>
          ) : (
            <div className="space-y-1">
              {sources.map(s => {
                const lbl = SOURCE_LABEL[s.source || "direct"] || SOURCE_LABEL.direct;
                const pct = Math.round((s.visitors / (stats?.uniq_visitors || 1)) * 100);
                return (
                  <div key={s.source || "direct"} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase w-14 truncate" style={{ color: lbl.color }}>{lbl.label}</span>
                    <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: lbl.color + "99" }} />
                    </div>
                    <span className="text-[9px] text-white/45 w-6 text-right">{s.visitors}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Таблица посетителей */}
      <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1A1A1A]">
          <Icon name="Users" size={13} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-sm uppercase">Посетители</span>
          <span className="text-white/30 text-xs">({fmt(total)})</span>
          {loading && <Icon name="Loader2" size={12} className="animate-spin text-white/40 ml-auto" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1A1A1A] text-white/35 uppercase text-[9px] tracking-widest">
                <th className="text-left px-3 py-2">Посетитель</th>
                <th className="text-left px-2 py-2">Откуда</th>
                <th className="text-left px-2 py-2">Город</th>
                <th className="text-left px-2 py-2">Устройство</th>
                <th className="text-center px-2 py-2">Визиты</th>
                <th className="text-left px-2 py-2">Последний</th>
                <th className="text-center px-2 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.items.length === 0) && !loading && (
                <tr><td colSpan={7} className="text-center py-8 text-white/30">Нет данных за выбранный период</td></tr>
              )}
              {data?.items.map(v => (
                <VisitorRow key={v.visitor_id} v={v} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#1A1A1A]">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase text-white/50 hover:text-white disabled:opacity-30"
            >
              <Icon name="ChevronLeft" size={12} /> Назад
            </button>
            <span className="text-[10px] text-white/35">{page} / {pages}</span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase text-white/50 hover:text-white disabled:opacity-30"
            >
              Далее <Icon name="ChevronRight" size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VisitorRow({ v }: { v: VisitorRow }) {
  const src = SOURCE_LABEL[v.last_source || "direct"] || SOURCE_LABEL.direct;
  const deviceIcon = v.device_type === "mobile" ? "Smartphone" : v.device_type === "tablet" ? "Tablet" : "Monitor";

  return (
    <tr className="border-b border-[#111] hover:bg-white/[0.02] transition-colors group">
      <td className="px-3 py-2">
        <a
          href={`/staff/analytics/visitor/${v.visitor_id}`}
          className="flex items-center gap-1.5 group-hover:text-[#FFD700] transition-colors"
        >
          <span className="font-mono text-white/60 text-[10px]">{v.visitor_id.slice(0, 10)}</span>
          {v.phone && (
            <span className="text-emerald-400 text-[10px]">📞 {v.phone}</span>
          )}
        </a>
      </td>
      <td className="px-2 py-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: src.color, background: src.color + "18", border: `1px solid ${src.color}33` }}>
          <Icon name={src.icon as Parameters<typeof Icon>[0]["name"]} size={8} />
          {src.label}
        </span>
      </td>
      <td className="px-2 py-2 text-white/50">{v.city || "—"}</td>
      <td className="px-2 py-2">
        <span className="inline-flex items-center gap-1 text-white/45">
          <Icon name={deviceIcon} size={11} />
          <span className="hidden sm:inline text-[10px]">{v.browser}</span>
        </span>
      </td>
      <td className="px-2 py-2 text-center text-white/60">{v.visit_count}</td>
      <td className="px-2 py-2 text-white/40 whitespace-nowrap">
        {fmtDate(v.last_seen)} <span className="text-white/25">{fmtTime(v.last_seen)}</span>
      </td>
      <td className="px-2 py-2 text-center">
        {v.is_converted ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold">
            <Icon name="CheckCircle2" size={9} /> Клиент
          </span>
        ) : (
          <span className="text-white/20 text-[9px]">—</span>
        )}
      </td>
    </tr>
  );
}

 
const _unused = { fmtDuration };
