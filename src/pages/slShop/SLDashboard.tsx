import Icon from "@/components/ui/icon";
import { useSharedPeriod } from "./useSharedPeriod";
import { SLTabs } from "./slUI";
import EmployeeShiftMiniWidget from "@/pages/staffSalary/EmployeeShiftMiniWidget";
import { useSLDashboardData } from "./SLDashboardData";
import { StatCardsGrid, StatusCardsRow, DirectionCards } from "./SLDashboardCards";
import { SoldSection, BoughtSection, QuickActions } from "./SLDashboardItems";

const PERIODS = [
  { v: "today",     l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "7d",        l: "7 дн." },
  { v: "30d",       l: "30 дн." },
  { v: "year",      l: "Год" },
  { v: "all",       l: "Все время" },
];

export default function SLDashboard({ token, onNav, empName: _empName }: {
  token: string; onNav: (k: string) => void; empName?: string;
}) {
  const [period, setPeriod] = useSharedPeriod();
  const { data, sold, bought, loading, err, load } = useSLDashboardData(token, period);

  return (
    <div className="px-3 pb-4 space-y-0">
      {/* Виджет смены */}
      <EmployeeShiftMiniWidget token={token} />

      {/* Период */}
      <div className="mb-3">
        <SLTabs
          size="sm"
          items={PERIODS.map(p => ({ v: p.v, l: p.l }))}
          value={period}
          onChange={setPeriod}
          right={
            <button onClick={load} disabled={loading}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: loading ? "rgba(255,215,0,0.4)" : "rgba(255,215,0,0.6)" }}>
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
            </button>
          }
        />
      </div>

      {err && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-xs font-roboto"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <Icon name="AlertTriangle" size={13} className="shrink-0" />
          {err}
        </div>
      )}

      {/* ── 4 главные карточки ── */}
      <StatCardsGrid data={data} onNav={onNav} />

      {/* ── Разбивка по статусам склада ── */}
      <StatusCardsRow data={data} onNav={onNav} />

      {/* ── Детализация направлений ── */}
      <DirectionCards data={data} />

      {/* ── Что продано ── */}
      <SoldSection sold={sold} onNav={onNav} />

      {/* ── Что куплено ── */}
      <BoughtSection bought={bought} onNav={onNav} />

      {/* ── Быстрые действия ── */}
      <QuickActions onNav={onNav} />
    </div>
  );
}
