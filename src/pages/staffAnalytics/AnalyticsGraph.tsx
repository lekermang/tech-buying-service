/** График посещений — линейный, по часам или по дням. Рисуем через canvas вручную. */
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type Point = { label: string; visitors: number; sessions: number; cta: number };
type Period = "today" | "7d" | "30d";

async function fetchGraph(token: string, period: Period): Promise<Point[]> {
  const url = `${ANALYTICS_URL}?action=graph_hours&period=${period}`;
  const r = await fetch(url, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return d.points || [];
}

function GraphCanvas({ data, metric }: { data: Point[]; metric: "visitors" | "sessions" | "cta" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const values = data.map(d => d[metric]);
    const max = Math.max(...values, 1);
    const padL = 36, padR = 12, padT = 12, padB = 28;
    const gW = W - padL - padR;
    const gH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Сетка
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (gH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(max * (1 - i / 4))), padL - 4, y + 3);
    }

    if (values.length < 2) return;

    const step = gW / (values.length - 1);

    // Заливка градиентом
    const color = metric === "cta" ? "#22c55e" : metric === "visitors" ? "#FFD700" : "#60a5fa";
    const grad = ctx.createLinearGradient(0, padT, 0, padT + gH);
    grad.addColorStop(0, color + "40");
    grad.addColorStop(1, color + "00");

    ctx.beginPath();
    ctx.moveTo(padL, padT + gH);
    values.forEach((v, i) => {
      const x = padL + i * step;
      const y = padT + gH - (v / max) * gH;
      if (i === 0) ctx.lineTo(x, y);
      else {
        const px = padL + (i - 1) * step;
        const py = padT + gH - (values[i - 1] / max) * gH;
        const cpx = (px + x) / 2;
        ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
      }
    });
    ctx.lineTo(padL + (values.length - 1) * step, padT + gH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Линия
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    values.forEach((v, i) => {
      const x = padL + i * step;
      const y = padT + gH - (v / max) * gH;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const px = padL + (i - 1) * step;
        const py = padT + gH - (values[i - 1] / max) * gH;
        const cpx = (px + x) / 2;
        ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
      }
    });
    ctx.stroke();

    // Точки и метки по оси X
    const step_label = Math.max(1, Math.floor(values.length / 8));
    values.forEach((v, i) => {
      const x = padL + i * step;
      const y = padT + gH - (v / max) * gH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (i % step_label === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(data[i].label, x, H - padB + 12);
      }
    });
  }, [data, metric]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: 160 }} />;
}

export default function AnalyticsGraph({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<"visitors" | "sessions" | "cta">("visitors");

  useEffect(() => {
    setLoading(true);
    fetchGraph(token, period).then(d => { setData(d); setLoading(false); });
  }, [token, period]);

  const total_v = data.reduce((s, d) => s + d.visitors, 0);
  const total_s = data.reduce((s, d) => s + d.sessions, 0);
  const total_c = data.reduce((s, d) => s + d.cta, 0);
  const conv = total_v > 0 ? ((total_c / total_v) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      {/* Заголовок */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
          <Icon name="TrendingUp" size={14} className="text-[#FFD700]" />
        </div>
        <span className="font-oswald uppercase font-bold text-[13px] tracking-wide flex-1">График посещений</span>
        {/* Период */}
        <div className="flex rounded overflow-hidden border border-[#2A2A2A] text-[10px]">
          {(["today", "7d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 font-bold uppercase transition-all ${period === p ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"}`}>
              {p === "today" ? "Сегодня" : p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI строчка */}
      <div className="grid grid-cols-3 divide-x divide-[#1A1A1A] border-b border-[#1A1A1A]">
        {[
          { key: "visitors" as const, label: "Посетители", val: total_v, color: "#FFD700" },
          { key: "sessions" as const, label: "Сессии",     val: total_s, color: "#60a5fa" },
          { key: "cta" as const,      label: `CTA (${conv}%)`, val: total_c, color: "#22c55e" },
        ].map(item => (
          <button key={item.key} onClick={() => setMetric(item.key)}
            className={`py-2.5 px-3 text-left transition-all ${metric === item.key ? "bg-white/[0.04]" : ""}`}>
            <div className="font-oswald font-bold text-xl" style={{ color: metric === item.key ? item.color : "rgba(255,255,255,0.7)" }}>
              {item.val.toLocaleString("ru")}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="px-3 pt-3 pb-1">
        {loading ? (
          <div className="flex items-center justify-center h-[160px]">
            <Icon name="Loader2" size={20} className="text-white/30 animate-spin" />
          </div>
        ) : (
          <GraphCanvas data={data} metric={metric} />
        )}
      </div>
    </div>
  );
}
