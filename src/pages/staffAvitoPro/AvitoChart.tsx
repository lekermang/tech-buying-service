import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { ChartPoint, formatNum } from "./types";

type Props = { chart: ChartPoint[] };
type Range = 7 | 30;
type Metric = "views" | "contacts" | "favorites";

const METRIC_CONFIG: Record<Metric, { label: string; color: string; icon: string }> = {
  views: { label: "Просмотры", color: "#60a5fa", icon: "Eye" },
  contacts: { label: "Контакты", color: "#a78bfa", icon: "Phone" },
  favorites: { label: "Избранное", color: "#f472b6", icon: "Heart" },
};

export default function AvitoChart({ chart }: Props) {
  const [range, setRange] = useState<Range>(7);
  const [metric, setMetric] = useState<Metric>("views");

  const data = useMemo(() => {
    const cut = chart.slice(-range);
    return cut;
  }, [chart, range]);

  const max = useMemo(() => {
    let m = 0;
    for (const p of data) {
      const v = p[metric];
      if (v > m) m = v;
    }
    return m || 1;
  }, [data, metric]);

  const total = useMemo(() => data.reduce((s, p) => s + p[metric], 0), [data, metric]);
  const config = METRIC_CONFIG[metric];

  return (
    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 p-3">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon name="TrendingUp" size={14} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
            График активности
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(Object.keys(METRIC_CONFIG) as Metric[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                style={metric === m ? { color: METRIC_CONFIG[m].color, borderColor: METRIC_CONFIG[m].color + "50" } : undefined}
                className={`flex items-center gap-1 text-[10px] font-roboto px-2 py-1 rounded transition-all uppercase tracking-wide border ${
                  metric === m
                    ? "bg-white/5 font-semibold"
                    : "text-white/50 border-white/10 hover:text-white"
                }`}
              >
                <Icon name={METRIC_CONFIG[m].icon} size={10} />
                {METRIC_CONFIG[m].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex gap-1">
            {([7, 30] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-[10px] font-roboto px-2 py-1 rounded transition-all uppercase tracking-wide ${
                  range === r
                    ? "bg-[#FFD700] text-black font-semibold"
                    : "text-white/50 hover:text-white border border-white/10"
                }`}
              >
                {r} дн
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-white/40 mb-2">
        Всего за {range} дн:{" "}
        <span className="font-oswald font-bold text-base" style={{ color: config.color }}>
          {formatNum(total)}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-10 text-white/40 text-xs">
          <Icon name="BarChart2" size={28} className="mx-auto mb-2 opacity-40" />
          Данных пока нет — нажмите «Обновить статистику», чтобы загрузить с Авито
        </div>
      ) : (
        <div className="flex items-end gap-1 h-32 mt-2">
          {data.map((p, i) => {
            const v = p[metric];
            const h = max > 0 ? (v / max) * 100 : 0;
            const d = new Date(p.date);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 group cursor-default"
                title={`${p.date}: ${formatNum(v)}`}
              >
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t transition-all group-hover:opacity-80"
                    style={{
                      height: `${Math.max(h, 2)}%`,
                      background: `linear-gradient(to top, ${config.color}, ${config.color}90)`,
                      boxShadow: `0 0 8px ${config.color}40`,
                    }}
                  />
                </div>
                <div className="text-[8px] text-white/40 font-roboto">
                  {d.getDate()}.{String(d.getMonth() + 1).padStart(2, "0")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
