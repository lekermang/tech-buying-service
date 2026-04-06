/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  YM_ID,
  MOCK_STATS, MOCK_GOALS, MOCK_SOURCES, MOCK_DEVICES, MOCK_GEO, MOCK_PAGES,
  YmStat, YmGoalStat, YmSource, YmDevice, YmGeo, YmPage,
  fmtDur,
} from "./analytics.shared";
import { OverviewSection, GoalsSection, SourcesSection, BehaviorSection } from "./AnalyticsSections";
import { GeoSection, WebvisorSection, HeatmapSection, SeoSection } from "./AnalyticsIframeSections";

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
  const [stats] = useState<YmStat[]>(MOCK_STATS);
  const [goals] = useState<YmGoalStat[]>(MOCK_GOALS);
  const [sources] = useState<YmSource[]>(MOCK_SOURCES);
  const [devices] = useState<YmDevice[]>(MOCK_DEVICES);
  const [geo] = useState<YmGeo[]>(MOCK_GEO);
  const [pages] = useState<YmPage[]>(MOCK_PAGES);
  const [period, setPeriod] = useState<7 | 14 | 30>(14);

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
        <div className="p-3 border-t border-[#222]">
          <a href={`https://metrika.yandex.ru/dashboard?id=${YM_ID}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-[#FFD700] transition-colors">
            <Icon name="ExternalLink" size={10} /> Открыть Метрику
          </a>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalyticsTab;
