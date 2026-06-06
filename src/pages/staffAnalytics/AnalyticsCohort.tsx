/** Когортный анализ — недели первого визита vs. возвраты. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type CohortRow = { week: string; size: number; w1_pct: number; w2_pct: number };

async function fetchCohort(token: string): Promise<CohortRow[]> {
  const r = await fetch(`${ANALYTICS_URL}?action=cohort`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return d.rows || [];
}

function pctColor(pct: number): string {
  if (pct === 0) return "rgba(255,255,255,0.04)";
  if (pct < 5)   return "rgba(239,68,68,0.15)";
  if (pct < 10)  return "rgba(249,115,22,0.18)";
  if (pct < 20)  return "rgba(234,179,8,0.20)";
  if (pct < 30)  return "rgba(34,197,94,0.22)";
  return "rgba(34,197,94,0.35)";
}

function pctTextColor(pct: number): string {
  if (pct === 0)  return "rgba(255,255,255,0.15)";
  if (pct < 5)    return "#ef4444";
  if (pct < 10)   return "#f97316";
  if (pct < 20)   return "#eab308";
  return "#22c55e";
}

function weekLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  } catch { return iso; }
}

export default function AnalyticsCohort({ token }: { token: string }) {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCohort(token).then(d => { setRows(d); setLoading(false); });
  }, [token]);

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Icon name="CalendarDays" size={14} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <span className="font-oswald uppercase font-bold text-[13px] tracking-wide">Когортный анализ</span>
          <span className="text-[10px] text-white/30 ml-2">возвраты по неделям</span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={18} className="text-white/30 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center text-white/25 text-xs py-6">Нет данных — нужно минимум 2 визита у посетителей</div>
        ) : (
          <>
            {/* Таблица */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-white/30 font-bold uppercase tracking-wider pb-2 pr-3 whitespace-nowrap">Неделя</th>
                    <th className="text-right text-white/30 font-bold uppercase tracking-wider pb-2 px-2 whitespace-nowrap">Новых</th>
                    <th className="text-center text-white/30 font-bold uppercase tracking-wider pb-2 px-2 whitespace-nowrap">Нед. 1</th>
                    <th className="text-center text-white/30 font-bold uppercase tracking-wider pb-2 px-2 whitespace-nowrap">Нед. 2+</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      <td className="py-1.5 pr-3 text-white/50 whitespace-nowrap font-mono text-[10px]">
                        {weekLabel(row.week)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-white/60 font-bold">
                        {row.size.toLocaleString("ru")}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex justify-center">
                          <span className="px-2 py-0.5 rounded text-center font-bold min-w-[44px]"
                            style={{ background: pctColor(row.w1_pct), color: pctTextColor(row.w1_pct) }}>
                            {row.w1_pct > 0 ? `${row.w1_pct}%` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex justify-center">
                          <span className="px-2 py-0.5 rounded text-center font-bold min-w-[44px]"
                            style={{ background: pctColor(row.w2_pct), color: pctTextColor(row.w2_pct) }}>
                            {row.w2_pct > 0 ? `${row.w2_pct}%` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Легенда */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              {[
                { label: "0%", bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.15)" },
                { label: "< 5%", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
                { label: "< 10%", bg: "rgba(249,115,22,0.18)", color: "#f97316" },
                { label: "< 20%", bg: "rgba(234,179,8,0.20)", color: "#eab308" },
                { label: "≥ 20%", bg: "rgba(34,197,94,0.30)", color: "#22c55e" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className="w-4 h-3 rounded" style={{ background: l.bg, border: `1px solid ${l.color}40` }} />
                  <span className="text-[9px]" style={{ color: l.color }}>{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
