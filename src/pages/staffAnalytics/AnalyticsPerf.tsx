/** Производительность — Core Web Vitals: LCP, FCP, TTFB, CLS. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type Avg = { avg_lcp: number | null; avg_fcp: number | null; avg_ttfb: number | null; avg_cls: number | null; samples: number };
type Period = "today" | "7d" | "30d";

async function fetchPerf(token: string, period: Period) {
  const r = await fetch(`${ANALYTICS_URL}?action=perf_stats&period=${period}`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return d.avg as Avg | null;
}

type MetricStatus = "good" | "needs-improvement" | "poor" | "unknown";

function lcpStatus(v: number | null): MetricStatus {
  if (v === null) return "unknown";
  if (v <= 2500) return "good";
  if (v <= 4000) return "needs-improvement";
  return "poor";
}
function fcpStatus(v: number | null): MetricStatus {
  if (v === null) return "unknown";
  if (v <= 1800) return "good";
  if (v <= 3000) return "needs-improvement";
  return "poor";
}
function ttfbStatus(v: number | null): MetricStatus {
  if (v === null) return "unknown";
  if (v <= 800) return "good";
  if (v <= 1800) return "needs-improvement";
  return "poor";
}
function clsStatus(v: number | null): MetricStatus {
  if (v === null) return "unknown";
  if (v <= 0.1) return "good";
  if (v <= 0.25) return "needs-improvement";
  return "poor";
}

const STATUS_STYLE: Record<MetricStatus, { color: string; label: string; bg: string }> = {
  "good":             { color: "#22c55e", label: "Хорошо",   bg: "rgba(34,197,94,0.12)" },
  "needs-improvement":{ color: "#f59e0b", label: "Улучшить", bg: "rgba(245,158,11,0.12)" },
  "poor":             { color: "#ef4444", label: "Плохо",    bg: "rgba(239,68,68,0.12)" },
  "unknown":          { color: "#6b7280", label: "—",        bg: "rgba(107,114,128,0.08)" },
};

function Metric({ label, value, unit, status, desc }: {
  label: string; value: number | null; unit: string; status: MetricStatus; desc: string;
}) {
  const s = STATUS_STYLE[status];
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${s.color}20`, color: s.color }}>
          {s.label}
        </span>
      </div>
      <div className="font-oswald font-black text-2xl leading-none" style={{ color: s.color }}>
        {value !== null ? `${value}` : "—"}
        {value !== null && <span className="text-sm font-normal text-white/30 ml-1">{unit}</span>}
      </div>
      <div className="text-[10px] text-white/30">{desc}</div>
    </div>
  );
}

export default function AnalyticsPerf({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("7d");
  const [avg, setAvg] = useState<Avg | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPerf(token, period).then(d => { setAvg(d); setLoading(false); });
  }, [token, period]);

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Icon name="Gauge" size={14} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <span className="font-oswald uppercase font-bold text-[13px] tracking-wide">Core Web Vitals</span>
          {avg && <span className="ml-2 text-[10px] text-white/30">{avg.samples} замеров</span>}
        </div>
        <div className="flex rounded overflow-hidden border border-[#2A2A2A] text-[10px]">
          {(["today", "7d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 font-bold uppercase transition-all ${period === p ? "bg-blue-500/20 text-blue-300" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"}`}>
              {p === "today" ? "Сег." : p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={18} className="text-white/30 animate-spin" />
          </div>
        ) : !avg || avg.samples === 0 ? (
          <div className="text-center text-white/25 text-xs py-6">
            Нет данных — трекер должен отправлять события типа «performance»
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Metric label="LCP" value={avg.avg_lcp} unit="мс" status={lcpStatus(avg.avg_lcp)}
              desc="Largest Contentful Paint · ≤ 2500 мс" />
            <Metric label="FCP" value={avg.avg_fcp} unit="мс" status={fcpStatus(avg.avg_fcp)}
              desc="First Contentful Paint · ≤ 1800 мс" />
            <Metric label="TTFB" value={avg.avg_ttfb} unit="мс" status={ttfbStatus(avg.avg_ttfb)}
              desc="Time to First Byte · ≤ 800 мс" />
            <Metric label="CLS" value={avg.avg_cls} unit="" status={clsStatus(avg.avg_cls)}
              desc="Cumulative Layout Shift · ≤ 0.1" />
          </div>
        )}
      </div>
    </div>
  );
}
