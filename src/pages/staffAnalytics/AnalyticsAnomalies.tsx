/** Аномалии и алерты — авто-обнаруженные отклонения трафика. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type Anomaly = {
  hour: number | null;
  type: "traffic_drop" | "traffic_spike" | "new_city";
  severity: "high" | "medium" | "info";
  today?: number;
  avg?: number;
  message: string;
};

async function fetchAnomalies(token: string): Promise<Anomaly[]> {
  const r = await fetch(`${ANALYTICS_URL}?action=anomalies`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return d.anomalies || [];
}

const SEV_STYLE: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  high:   { icon: "AlertTriangle", color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.3)",  label: "Критично" },
  medium: { icon: "AlertCircle",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.3)", label: "Важно" },
  info:   { icon: "Info",          color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)", label: "Инфо" },
};

export default function AnalyticsAnomalies({ token }: { token: string }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const load = () => {
    setLoading(true);
    fetchAnomalies(token).then(d => { setAnomalies(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [token]);

  const visible = anomalies.filter((_, i) => !dismissed.has(i));

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
          <Icon name="Siren" size={14} className="text-red-400" />
        </div>
        <span className="font-oswald uppercase font-bold text-[13px] tracking-wide flex-1">Аномалии</span>
        {visible.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {visible.length}
          </span>
        )}
        <button onClick={load} disabled={loading}
          className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
          <Icon name="RefreshCw" size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {loading && anomalies.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <Icon name="Loader2" size={18} className="text-white/30 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Icon name="CheckCircle2" size={18} className="text-emerald-400" />
            </div>
            <div className="text-sm text-white/40">Аномалий не обнаружено</div>
            <div className="text-[10px] text-white/20">Трафик в норме</div>
          </div>
        ) : (
          visible.map((a, i) => {
            const s = SEV_STYLE[a.severity];
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5 relative"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: `${s.color}20` }}>
                  <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={12} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                      style={{ background: `${s.color}20`, color: s.color }}>{s.label}</span>
                    {a.hour !== null && (
                      <span className="text-[9px] text-white/25">{a.hour?.toString().padStart(2, "0")}:00</span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-snug">{a.message}</p>
                </div>
                <button onClick={() => setDismissed(d => new Set([...d, i]))}
                  className="shrink-0 text-white/20 hover:text-white/50 transition-colors mt-0.5">
                  <Icon name="X" size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
