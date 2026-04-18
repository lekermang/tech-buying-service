/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  YM_ID,
  MOCK_STATS, MOCK_GOALS, MOCK_SOURCES, MOCK_DEVICES, MOCK_GEO, MOCK_PAGES,
  YmStat, YmGoalStat, YmSource, YmDevice, YmGeo, YmPage,
  fmtDur,
} from "./analytics.shared";
import { OverviewSection, GoalsSection, SourcesSection, BehaviorSection } from "./AnalyticsSections";
import { GeoSection, WebvisorSection, HeatmapSection, SeoSection } from "./AnalyticsIframeSections";

const XLSX_URL = "https://functions.poehali.dev/13db4dbd-0d2b-47d4-8e09-c6f82483ffde";
const ADMIN_TOKEN = localStorage.getItem("adminToken") || "";

// ── Секции навигации ──────────────────────────────────────────────
type Section = "overview" | "goals" | "sources" | "behavior" | "geo" | "webvisor" | "heatmap" | "seo";

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "overview",  label: "Сводка",       icon: "LayoutDashboard" },
  { key: "goals",     label: "Конверсии",    icon: "Target" },
  { key: "sources",   label: "Источники",    icon: "Globe" },
  { key: "behavior",  label: "Поведение",    icon: "MousePointerClick" },
  { key: "geo",       label: "География",    icon: "MapPin" },
  { key: "webvisor",  label: "Вебвизор",     icon: "Play" },
  { key: "heatmap",   label: "Карта кликов", icon: "Flame" },
  { key: "seo",       label: "SEO & Топ",    icon: "TrendingUp" },
];

// ── Компонент ─────────────────────────────────────────────────────
const AnalyticsTab = () => {
  const [section, setSection] = useState<Section>("overview");
  const [stats, setStats] = useState<YmStat[]>(MOCK_STATS);
  const [goals] = useState<YmGoalStat[]>(MOCK_GOALS);
  const [sources, setSources] = useState<YmSource[]>(MOCK_SOURCES);
  const [devices, setDevices] = useState<YmDevice[]>(MOCK_DEVICES);
  const [geo, setGeo] = useState<YmGeo[]>(MOCK_GEO);
  const [pages, setPages] = useState<YmPage[]>(MOCK_PAGES);
  const [period, setPeriod] = useState<7 | 14 | 30>(14);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (days: 7 | 14 | 30) => {
    if (!XLSX_URL) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${XLSX_URL}?action=ym&days=${days}`, {
        headers: { "X-Admin-Token": ADMIN_TOKEN },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (d.error === "YM_TOKEN not configured") {
          setError("Токен Яндекс Метрики не настроен. Показаны тестовые данные.");
        } else {
          setError("Ошибка загрузки. Показаны тестовые данные.");
        }
        return;
      }
      const data = await res.json();
      if (data.stats?.length) { setStats(data.stats); setIsReal(true); }
      if (data.sources?.length) setSources(data.sources);
      if (data.devices?.length) setDevices(data.devices);
      if (data.geo?.length) setGeo(data.geo);
      if (data.pages?.length) setPages(data.pages);
    } catch {
      setError("Нет соединения. Показаны тестовые данные.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(period); }, [period, fetchStats]);

  // Суммы за период
  const slice = stats.slice(-period);
  const totalVisits  = slice.reduce((s, d) => s + d.visits, 0);
  const totalViews   = slice.reduce((s, d) => s + d.pageviews, 0);
  const totalUsers   = slice.reduce((s, d) => s + d.users, 0);
  const avgBounce    = Math.round(slice.reduce((s, d) => s + d.bounceRate, 0) / slice.length);
  const avgDuration  = Math.round(slice.reduce((s, d) => s + d.avgDuration, 0) / slice.length);

  const renderContent = () => {
    switch (section) {
      case "overview":
        return (
          <OverviewSection
            slice={slice} period={period} setPeriod={setPeriod}
            totalVisits={totalVisits} totalViews={totalViews} totalUsers={totalUsers}
            avgBounce={avgBounce} avgDuration={avgDuration}
            devices={devices}
          />
        );
      case "goals":
        return <GoalsSection goals={goals} totalVisits={totalVisits} />;
      case "sources":
        return <SourcesSection sources={sources} />;
      case "behavior":
        return <BehaviorSection pages={pages} fmtDur={fmtDur} />;
      case "geo":
        return <GeoSection geo={geo} />;
      case "webvisor":
        return <WebvisorSection />;
      case "heatmap":
        return <HeatmapSection />;
      case "seo":
        return <SeoSection />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Левая навигация */}
      <div className="w-44 shrink-0 border-r border-[#222] bg-[#0D0D0D] flex flex-col">
        <div className="px-3 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-red-600">
              <span className="text-white font-black text-[9px]">Я</span>
            </div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Аналитика</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors
                ${section === s.key
                  ? "bg-[#FFD700]/10 text-[#FFD700] border-r-2 border-[#FFD700]"
                  : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              <Icon name={s.icon as any} size={13} className="shrink-0" />
              <span className="text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#222] flex flex-col gap-2">
          {/* Статус данных */}
          <div className="flex items-center gap-1.5">
            {loading ? (
              <span className="text-[10px] text-white/30 animate-pulse">Загрузка...</span>
            ) : isReal ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-[10px] text-green-400">Реальные данные</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-[10px] text-yellow-400">Тестовые данные</span>
              </>
            )}
          </div>
          {error && <p className="text-[9px] text-red-400/70 leading-tight">{error}</p>}
          <a href={`https://metrika.yandex.ru/dashboard?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-[#FFD700] transition-colors">
            <Icon name="ExternalLink" size={10} /> Открыть Метрику
          </a>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto min-w-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Icon name="Loader" size={16} className="animate-spin" />
              Загрузка статистики...
            </div>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalyticsTab;