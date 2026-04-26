import Icon from "@/components/ui/icon";
import { type Analytics } from "../staff.types";

type RepairAnalytics = {
  total: number; done: number; revenue: number; costs: number;
  profit: number; master_total: number;
  daily: { day: string; revenue: number; costs: number; profit: number; done: number }[];
};

type Props = {
  data: Analytics | null;
  repairData: RepairAnalytics | null;
  TYPE_LABELS: Record<string, string>;
};

export default function AnalyticsRepairAndStaff({ data, repairData, TYPE_LABELS }: Props) {
  const dailyRepair = repairData?.daily || [];
  const maxRevRepair = dailyRepair.length > 0 ? Math.max(...dailyRepair.map(d => d.revenue), 1) : 1;

  return (
    <>
      {/* Ремонт: статусы — premium */}
      {repairData && (
        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
          <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Icon name="Wrench" size={11} className="text-[#FFD700]/60" />
            Ремонт за период
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Всего", value: repairData.total, color: "text-white", bg: "bg-white/5" },
              { label: "Выдано", value: repairData.done, color: "text-green-400", bg: "bg-green-500/5" },
              { label: "Выручка", value: (repairData.revenue || 0).toLocaleString("ru-RU"), color: "text-[#FFD700]", bg: "bg-[#FFD700]/5" },
              { label: "Закупка", value: (repairData.costs || 0).toLocaleString("ru-RU"), color: "text-orange-400", bg: "bg-orange-500/5" },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border border-[#1F1F1F] rounded-md p-2 text-center`}>
                <div className={`font-oswald font-bold text-sm ${c.color} tabular-nums`}>{c.value}</div>
                <div className="font-roboto text-white/40 text-[9px] mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Мини-график ремонта по дням */}
          {dailyRepair.length > 1 && (
            <div className="space-y-1 mt-3 pt-3 border-t border-[#1F1F1F]">
              <div className="font-roboto text-white/30 text-[9px] uppercase tracking-wide mb-1">Динамика (7 дней)</div>
              {dailyRepair.slice().reverse().slice(0, 7).map(d => {
                const barW = Math.round((d.revenue / maxRevRepair) * 100);
                const profitBarW = Math.round((Math.max(0, d.profit) / maxRevRepair) * 100);
                return (
                  <div key={d.day} className="flex items-center gap-2">
                    <span className="font-roboto text-[9px] text-white/40 w-10 shrink-0 tabular-nums">
                      {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <div className="flex-1 h-4 bg-[#0A0A0A] rounded-sm relative overflow-hidden border border-[#1A1A1A]">
                      <div className="h-full bg-gradient-to-r from-[#FFD700]/30 to-[#FFD700]/10 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                      <div className="h-full bg-gradient-to-r from-green-500/40 to-green-500/20 absolute left-0 top-0 transition-all" style={{ width: profitBarW + "%" }} />
                    </div>
                    <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0 tabular-nums">
                      {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + "₽" : "—"}
                    </span>
                    <span className={`font-roboto text-[9px] w-14 text-right shrink-0 tabular-nums font-bold ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                      {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* По направлениям (продажи) */}
      {Object.entries(data?.by_type || {}).length > 0 && (
        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
          <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="PieChart" size={11} className="text-[#FFD700]/60" />
            По направлениям
          </div>
          {Object.entries(data!.by_type).map(([type, stat]) => (
            <div key={type} className="flex justify-between items-center py-2 border-b border-[#1A1A1A] last:border-0">
              <span className="font-roboto text-sm text-white/80">{TYPE_LABELS[type] || type}</span>
              <div className="text-right">
                <span className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums">{(stat.sum || 0).toLocaleString("ru-RU")} ₽</span>
                <span className="font-roboto text-white/40 text-[10px] ml-2 tabular-nums">· {stat.count} сд.</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Рейтинг сотрудников — premium */}
      {(data?.staff_stats?.length || 0) > 0 && (
        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3">
          <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Icon name="Trophy" size={11} className="text-[#FFD700]/60" />
            Рейтинг сотрудников
          </div>
          {data!.staff_stats.map((s, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={i} className={`flex items-center justify-between py-2.5 px-2 rounded-md border-b border-[#1A1A1A] last:border-0 ${
                i === 0 ? "bg-gradient-to-r from-[#FFD700]/10 to-transparent" : ""
              }`}>
                <div className="flex items-center gap-2.5">
                  {i < 3 ? (
                    <span className="text-lg">{medals[i]}</span>
                  ) : (
                    <span className="font-oswald font-bold text-white/30 text-sm w-6 text-center tabular-nums">{i + 1}</span>
                  )}
                  <span className={`font-roboto text-sm ${i === 0 ? "text-white font-bold" : "text-white/80"}`}>{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums">{(s.revenue || 0).toLocaleString("ru-RU")} ₽</div>
                  <div className="font-roboto text-white/40 text-[10px] tabular-nums">{s.deals} сделок</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
