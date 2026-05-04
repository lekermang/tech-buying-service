import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLAnalytics } from "./types";
import { useSharedPeriod } from "./useSharedPeriod";
import { SLTabs } from "./slUI";

const PERIODS = [
  { v: "today", l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "7d", l: "7 дн." },
  { v: "30d", l: "30 дн." },
  { v: "year", l: "Год" },
  { v: "all", l: "Всё время" },
];

export default function SLAnalytics({ token }: { token: string }) {
  const [period, setPeriod] = useSharedPeriod();
  const [data, setData] = useState<SLAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLAnalytics>(token, "analytics_full", { params: { period } });
    if (r.ok && r.data) setData(r.data);
    setLoading(false);
  }, [token, period]);
  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="text-white/30 text-sm py-12 text-center">
        <Icon name={loading ? "Loader" : "BarChart3"} size={32} className={`mx-auto mb-2 opacity-30 ${loading ? "animate-spin" : ""}`} />
        Загрузка аналитики...
      </div>
    );
  }

  const totalRevenue = data.by_branch.reduce((s, b) => s + Number(b.sold_sum || 0), 0);
  const totalSpent = data.by_branch.reduce((s, b) => s + Number(b.bought_sum || 0), 0);
  const totalProfit = totalRevenue - totalSpent;
  const totalSoldCount = data.by_branch.reduce((s, b) => s + Number(b.sold_count || 0), 0);
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Период */}
      <SLTabs
        size="sm"
        items={PERIODS.map(p => ({ v: p.v, l: p.l }))}
        value={period}
        onChange={setPeriod}
        right={
          <button onClick={load} className="text-white/45 hover:text-[#FFD700] p-1.5 rounded-md hover:bg-white/5 transition">
            <Icon name={loading ? "Loader2" : "RefreshCw"} size={12} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      {/* Главные метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card title="Выручка" value={`${fmt(totalRevenue)} ₽`} sub={`${totalSoldCount} шт`} icon="HandCoins" color="blue" />
        <Card title="Затраты" value={`${fmt(totalSpent)} ₽`} sub={`скупка`} icon="ShoppingCart" color="orange" />
        <Card title="Прибыль" value={`${fmt(totalProfit)} ₽`} sub={`маржа ${margin}%`} icon="TrendingUp" color="emerald" />
        <Card title="Период" value={data.period} sub={`с ${data.date_from}`} icon="Calendar" color="red" />
      </div>

      {/* По филиалам */}
      <Section title="По филиалам" icon="MapPin">
        {data.by_branch.length === 0 ? <Empty /> : (
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-white/40 tracking-wide">
              <tr><th className="text-left py-1">Филиал</th><th className="text-right">Скупка</th><th className="text-right">Продано</th><th className="text-right">Выручка</th></tr>
            </thead>
            <tbody>
              {data.by_branch.map((b, i) => (
                <tr key={i} className="border-t border-[#1F1F1F]">
                  <td className="py-1.5 font-bold">{b.branch || "—"}</td>
                  <td className="text-right text-orange-300">{fmt(b.bought_sum)}₽</td>
                  <td className="text-right">{Number(b.sold_count) || 0}</td>
                  <td className="text-right text-[#FFD700] font-bold">{fmt(b.sold_sum)}₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* По сотрудникам */}
      <Section title="По сотрудникам" icon="Users">
        {data.by_employee.length === 0 ? <Empty /> : (
          <div className="space-y-1">
            {data.by_employee.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                <div className="flex-1 truncate">{e.employee || "—"}</div>
                <div className="text-white/40 text-[11px]">{e.sold_count} продаж</div>
                <div className="text-[#FFD700] font-bold w-24 text-right">{fmt(e.sold_sum)}₽</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* По категориям */}
      <Section title="По категориям" icon="Grid3x3">
        {data.by_category.length === 0 ? <Empty /> : (
          <div className="space-y-1">
            {data.by_category.map((c, i) => {
              const max = Number(data.by_category[0]?.sold_sum) || 1;
              const pct = (Number(c.sold_sum) / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[12px] mb-0.5">
                    <span className="truncate flex-1">{c.category || "Без категории"}</span>
                    <span className="text-white/40 mr-2">{c.sold_count}</span>
                    <span className="text-[#FFD700] font-bold">{fmt(c.sold_sum)}₽</span>
                  </div>
                  <div className="h-1.5 bg-[#141414] rounded">
                    <div className="h-full bg-gradient-to-r from-[#FFD700] to-yellow-600 rounded" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* По дням */}
      <Section title="По дням" icon="Calendar">
        {data.by_day.length === 0 ? <Empty /> : (
          <div className="space-y-1">
            {data.by_day.slice(-15).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <span className="w-20 text-white/50 shrink-0">{new Date(d.d).toLocaleDateString("ru-RU")}</span>
                <span className="flex-1 text-white/40">{d.sold_count} продаж</span>
                <span className="text-orange-300 text-[11px]">−{fmt(d.bought_sum)}₽</span>
                <span className="text-[#FFD700] font-bold w-20 text-right">+{fmt(d.sold_sum)}₽</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Card({ title, value, sub, icon, color }: { title: string; value: string; sub: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-300",
    orange: "from-orange-500/15 to-orange-500/5 border-orange-500/30 text-orange-300",
    red: "from-red-500/15 to-red-500/5 border-red-500/30 text-red-300",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
        <Icon name={icon} size={12} />{title}
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
      <div className="text-[11px] opacity-60">{sub}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">
        <Icon name={icon} size={12} />{title}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="text-white/30 text-xs text-center py-3">Нет данных</div>;
}