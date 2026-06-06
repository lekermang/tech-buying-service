/** Воронка конверсии — вертикальная, с % отвала. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type Step = { label: string; value: number; pct: number };
type Period = "today" | "7d" | "30d";

async function fetchFunnel(token: string, period: Period): Promise<Step[]> {
  const r = await fetch(`${ANALYTICS_URL}?action=funnel&period=${period}`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return d.steps || [];
}

const STEP_COLORS = ["#FFD700", "#f59e0b", "#f97316", "#ef4444", "#dc2626"];
const STEP_ICONS = ["Users", "Eye", "MousePointerClick", "FileText", "CheckCircle2"];

export default function AnalyticsFunnel({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("today");
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchFunnel(token, period).then(d => { setSteps(d); setLoading(false); });
  }, [token, period]);

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <Icon name="Filter" size={14} className="text-orange-400" />
        </div>
        <span className="font-oswald uppercase font-bold text-[13px] tracking-wide flex-1">Воронка конверсии</span>
        <div className="flex rounded overflow-hidden border border-[#2A2A2A] text-[10px]">
          {(["today", "7d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 font-bold uppercase transition-all ${period === p ? "bg-orange-500/20 text-orange-300" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"}`}>
              {p === "today" ? "Сегодня" : p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Icon name="Loader2" size={20} className="text-white/30 animate-spin" />
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-8">Нет данных</div>
        ) : (
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => {
              const color = STEP_COLORS[i] || "#888";
              const icon = STEP_ICONS[i] || "Circle";
              const barW = Math.max(step.pct, 2);
              const dropPct = i < steps.length - 1 && steps[i].value > 0
                ? (((steps[i].value - steps[i + 1].value) / steps[i].value) * 100).toFixed(0)
                : null;

              return (
                <div key={i}>
                  {/* Шаг */}
                  <div className="relative rounded-lg overflow-hidden" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    {/* Прогресс-бар */}
                    <div className="absolute left-0 top-0 bottom-0 rounded-l-lg transition-all duration-700"
                      style={{ width: `${barW}%`, background: `${color}18` }} />
                    <div className="relative flex items-center gap-3 px-3 py-2.5">
                      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
                        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={13} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-roboto text-xs text-white/70 truncate">{step.label}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-oswald font-bold text-base leading-none" style={{ color }}>
                          {step.value.toLocaleString("ru")}
                        </div>
                        <div className="font-roboto text-[10px] text-white/35">{step.pct}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Отвал между шагами */}
                  {dropPct !== null && (
                    <div className="flex items-center gap-2 px-4 py-1">
                      <div className="flex-1 h-px bg-[#1A1A1A]" />
                      <div className="flex items-center gap-1 text-[10px]">
                        <Icon name="ArrowDown" size={10} className="text-red-400" />
                        <span className="text-red-400 font-bold">−{dropPct}%</span>
                        <span className="text-white/25">отвал</span>
                      </div>
                      <div className="flex-1 h-px bg-[#1A1A1A]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
