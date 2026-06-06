/** A/B тест — панель со статистической значимостью. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type GroupData = { users: number; sessions: number; cta_clicks: number; conversion: number };
type Significance = {
  sufficient_data: boolean; z?: number; confidence?: number; winner?: string | null; reason?: string;
};
type Period = "today" | "7d" | "30d";

async function fetchAB(token: string, period: Period) {
  const r = await fetch(`${ANALYTICS_URL}?action=ab_stats&period=${period}`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return { groups: d.groups as Record<string, GroupData>, significance: d.significance as Significance | null };
}

function StatBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] text-white/40 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-[10px] font-bold text-right shrink-0" style={{ color }}>{val.toLocaleString("ru")}</span>
    </div>
  );
}

export default function AnalyticsAB({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("7d");
  const [groups, setGroups] = useState<Record<string, GroupData>>({});
  const [sig, setSig] = useState<Significance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAB(token, period).then(d => { setGroups(d.groups || {}); setSig(d.significance); setLoading(false); });
  }, [token, period]);

  const A = groups["A"];
  const B = groups["B"];
  const maxSessions = Math.max(A?.sessions || 0, B?.sessions || 0, 1);

  const confColor = (c?: number) => {
    if (!c) return "text-white/30";
    if (c >= 95) return "text-emerald-400";
    if (c >= 80) return "text-yellow-400";
    return "text-white/50";
  };

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <Icon name="FlaskConical" size={14} className="text-purple-400" />
        </div>
        <span className="font-oswald uppercase font-bold text-[13px] tracking-wide flex-1">A/B Тест</span>
        <div className="flex rounded overflow-hidden border border-[#2A2A2A] text-[10px]">
          {(["today", "7d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 font-bold uppercase transition-all ${period === p ? "bg-purple-500/20 text-purple-300" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"}`}>
              {p === "today" ? "Сег." : p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Icon name="Loader2" size={18} className="text-white/30 animate-spin" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Две колонки A и B */}
          <div className="grid grid-cols-2 gap-3">
            {[{ key: "A", data: A, color: "#60a5fa" }, { key: "B", data: B, color: "#a78bfa" }].map(({ key, data, color }) => (
              <div key={key} className="rounded-xl p-3 relative overflow-hidden"
                style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                {sig?.winner === key && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}25`, color }}>
                      Победитель
                    </span>
                  </div>
                )}
                <div className="font-oswald font-black text-3xl mb-0.5" style={{ color }}>{key}</div>
                {data ? (
                  <div className="space-y-2">
                    <StatBar label="Сессий"     val={data.sessions}   max={maxSessions}       color={color} />
                    <StatBar label="CTA-клики"  val={data.cta_clicks} max={maxSessions}       color={color} />
                    <div className="pt-1 border-t border-white/5">
                      <div className="text-center font-oswald font-bold text-xl" style={{ color }}>
                        {data.conversion}%
                      </div>
                      <div className="text-center text-[10px] text-white/35">конверсия</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/25 text-xs">Нет данных</div>
                )}
              </div>
            ))}
          </div>

          {/* Результат статзначимости */}
          {sig && (
            <div className="rounded-xl px-4 py-3"
              style={{
                background: sig.sufficient_data && sig.winner ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                border: sig.sufficient_data && sig.winner ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.07)",
              }}>
              {sig.sufficient_data ? (
                <div className="flex items-start gap-3">
                  <Icon name={sig.winner ? "CheckCircle2" : "Info"} size={16}
                    className={sig.winner ? "text-emerald-400 shrink-0 mt-0.5" : "text-white/40 shrink-0 mt-0.5"} />
                  <div>
                    {sig.winner ? (
                      <p className="text-sm font-bold text-white">
                        Вариант <span style={{ color: sig.winner === "B" ? "#a78bfa" : "#60a5fa" }}>{sig.winner}</span> лучше с вероятностью{" "}
                        <span className={confColor(sig.confidence)}>{sig.confidence}%</span>
                      </p>
                    ) : (
                      <p className="text-sm text-white/60">Конверсии равны — продолжайте тест</p>
                    )}
                    {sig.z !== undefined && (
                      <p className="text-[11px] text-white/30 mt-0.5">Z-stat: {sig.z} · p-value: {sig.confidence !== undefined ? ((100 - sig.confidence) / 100).toFixed(3) : "—"}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <Icon name="AlertCircle" size={14} />
                  {sig.reason || "Недостаточно данных для анализа"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
