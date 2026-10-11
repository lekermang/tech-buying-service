import { useMemo, useRef, useState, useId } from "react";
import Icon from "@/components/ui/icon";
import type { Period } from "./goldTickerUtils";

export type GoldPoint = { date: string; price: number; min?: number; max?: number };

const PERIODS: { v: Period; l: string }[] = [
  { v: 7, l: "7д" },
  { v: 30, l: "30д" },
  { v: 90, l: "90д" },
];

const fmtRub = (n: number) => Math.round(n).toLocaleString("ru-RU");
const fmtDate = (iso: string, long = false) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("ru-RU", long ? { day: "numeric", month: "long", weekday: "short" } : { day: "numeric", month: "short" });
};

type Props = {
  history: GoldPoint[];
  current?: number | null;
  height?: number;
  defaultPeriod?: Period;
  className?: string;
};

export default function GoldChart({ history, current, height = 150, defaultPeriod = 30, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const all = history.filter(h => h.price > 1000);
    if (!all.length) return [];
    const last = new Date(all[all.length - 1].date + "T12:00:00").getTime();
    const from = last - (period - 1) * 86400000;
    const cut = all.filter(h => new Date(h.date + "T12:00:00").getTime() >= from);
    if (current && cut.length) {
      const copy = cut.slice();
      copy[copy.length - 1] = { ...copy[copy.length - 1], price: current };
      return copy;
    }
    return cut;
  }, [history, period, current]);

  const stats = useMemo(() => {
    if (data.length < 2) return null;
    const prices = data.map(d => d.price);
    const first = prices[0];
    const lastP = prices[prices.length - 1];
    const lo = Math.min(...data.map(d => d.min ?? d.price));
    const hi = Math.max(...data.map(d => d.max ?? d.price));
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const iMin = prices.indexOf(Math.min(...prices));
    const iMax = prices.indexOf(Math.max(...prices));
    return { first, last: lastP, lo, hi, avg, iMin, iMax, diff: lastP - first, pct: ((lastP - first) / first) * 100, up: lastP >= first };
  }, [data]);

  const W = 600, H = height, padL = 6, padR = 6, padT = 14, padB = 20;
  const geo = useMemo(() => {
    if (!stats) return null;
    const prices = data.map(d => d.price);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    const span = hi - lo || 1;
    const yMin = lo - span * 0.12, yMax = hi + span * 0.12;
    const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
    const y = (p: number) => padT + (1 - (p - yMin) / (yMax - yMin)) * (H - padT - padB);
    const pts = data.map((d, i) => ({ x: x(i), y: y(d.price) }));
    let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const cx = (p0.x + p1.x) / 2;
      line += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - padB} L ${pts[0].x.toFixed(1)} ${H - padB} Z`;
    const grid = [0, 1, 2, 3].map(k => {
      const val = yMax - ((yMax - yMin) * k) / 3;
      return { y: y(val), val };
    });
    const avgY = y(stats.avg);
    return { pts, line, area, grid, avgY };
  }, [data, stats, H]);

  if (!stats || !geo) {
    return <div className={`text-center text-white/40 text-[11px] py-6 ${className}`}>Недостаточно данных для графика</div>;
  }

  const col = stats.up ? "#34d399" : "#f87171";
  const colSoft = stats.up ? "rgba(52,211,153," : "rgba(248,113,113,";
  const idx = hover ?? data.length - 1;
  const pt = geo.pts[idx];
  const cur = data[idx];
  const prev = idx > 0 ? data[idx - 1].price : null;
  const dayDiff = prev ? cur.price - prev : null;

  const onMove = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const rel = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setHover(Math.round(rel * (data.length - 1)));
  };

  const tipLeft = Math.min(88, Math.max(12, (pt.x / W) * 100));
  const labelIdx = data.length <= 8 ? data.map((_, i) => i) : [0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1];

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-oswald text-[9px] uppercase tracking-[0.2em] text-white/40">
            {hover !== null ? fmtDate(cur.date, true) : `За ${period} дн.`}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-oswald font-bold text-[20px] leading-none text-white">{fmtRub(cur.price)}<span className="text-[10px] text-white/45 ml-0.5">₽/г</span></span>
            {hover !== null && dayDiff !== null ? (
              <span className="font-oswald font-bold text-[11px]" style={{ color: dayDiff >= 0 ? "#34d399" : "#f87171" }}>
                {dayDiff >= 0 ? "+" : "−"}{fmtRub(Math.abs(dayDiff))} ₽ к пред. дню
              </span>
            ) : (
              <span className="font-oswald font-bold text-[11px]" style={{ color: col }}>
                {stats.up ? "▲" : "▼"} {Math.abs(stats.pct).toFixed(1)}% · {stats.diff >= 0 ? "+" : "−"}{fmtRub(Math.abs(stats.diff))} ₽
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-black/50 border border-white/10 rounded-lg p-0.5 shrink-0">
          {PERIODS.map(p => (
            <button key={p.v} type="button" onClick={() => { setPeriod(p.v); setHover(null); }}
              className={`px-2 py-1 rounded-md text-[10px] font-oswald font-bold uppercase tracking-wide transition ${
                period === p.v ? "bg-[#FFD700] text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]" : "text-white/50 hover:text-white"
              }`}>{p.l}</button>
          ))}
        </div>
      </div>

      <div
        ref={boxRef}
        className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden touch-pan-y select-none cursor-crosshair"
        style={{ height: H }}
        onMouseMove={e => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={e => onMove(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
          <defs>
            <linearGradient id={`a${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`${colSoft}0.38)`} />
              <stop offset="100%" stopColor={`${colSoft}0)`} />
            </linearGradient>
            <filter id={`g${uid}`} x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {geo.grid.map((g, i) => (
            <line key={i} x1={padL} x2={W - padR} y1={g.y} y2={g.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
          ))}
          <line x1={padL} x2={W - padR} y1={geo.avgY} y2={geo.avgY} stroke="rgba(255,215,0,0.35)" strokeDasharray="2 4" />
          <path d={geo.area} fill={`url(#a${uid})`} />
          <path d={geo.line} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter={`url(#g${uid})`} vectorEffect="non-scaling-stroke" />
          <line x1={pt.x} x2={pt.x} y1={padT - 6} y2={H - padB} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        </svg>

        {geo.grid.map((g, i) => (
          <span key={i} className="absolute left-1.5 text-[8px] font-oswald text-white/30 leading-none pointer-events-none" style={{ top: `${(g.y / H) * 100}%`, transform: "translateY(-120%)" }}>
            {fmtRub(g.val)}
          </span>
        ))}
        <span className="absolute right-1.5 text-[8px] font-oswald text-[#FFD700]/60 leading-none pointer-events-none" style={{ top: `${(geo.avgY / H) * 100}%`, transform: "translateY(-120%)" }}>
          среднее {fmtRub(stats.avg)}
        </span>

        <span
          className="absolute w-3 h-3 rounded-full border-2 border-black pointer-events-none"
          style={{ left: `${(pt.x / W) * 100}%`, top: `${(pt.y / H) * 100}%`, background: col, transform: "translate(-50%,-50%)", boxShadow: `0 0 12px ${col}` }}
        />
        {hover === null && <span className="absolute w-3 h-3 rounded-full animate-ping pointer-events-none" style={{ left: `${(pt.x / W) * 100}%`, top: `${(pt.y / H) * 100}%`, background: col, opacity: 0.5, transform: "translate(-50%,-50%)" }} />}

        {hover !== null && (
          <div className="absolute pointer-events-none px-2 py-1 rounded-md bg-black/90 border border-[#FFD700]/40 text-center whitespace-nowrap"
            style={{ left: `${tipLeft}%`, top: 4, transform: "translateX(-50%)" }}>
            <div className="text-[9px] text-white/50">{fmtDate(cur.date)}</div>
            <div className="font-oswald font-bold text-[12px] text-[#FFD700]">{fmtRub(cur.price)} ₽</div>
            {cur.min !== undefined && cur.max !== undefined && cur.max - cur.min > 1 && (
              <div className="text-[8px] text-white/40">{fmtRub(cur.min)} – {fmtRub(cur.max)}</div>
            )}
          </div>
        )}

        <div className="absolute left-0 right-0 bottom-1 h-3 pointer-events-none">
          {labelIdx.map(i => (
            <span key={i} className="absolute text-[8px] font-oswald text-white/35" style={{
              left: `${(geo.pts[i].x / W) * 100}%`,
              transform: i === 0 ? "translateX(2px)" : i === data.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
            }}>{fmtDate(data[i].date)}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mt-2">
        <Stat icon="ArrowDownToLine" label="Мин." value={fmtRub(stats.lo)} sub={fmtDate(data[stats.iMin].date)} color="#f87171" />
        <Stat icon="ArrowUpFromLine" label="Макс." value={fmtRub(stats.hi)} sub={fmtDate(data[stats.iMax].date)} color="#34d399" />
        <Stat icon="Minus" label="Среднее" value={fmtRub(stats.avg)} sub={`${data.length} дн.`} color="#FFD700" />
        <Stat icon="Activity" label="Разброс" value={fmtRub(stats.hi - stats.lo)} sub={`${(((stats.hi - stats.lo) / stats.avg) * 100).toFixed(1)}%`} color="#93c5fd" />
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-[9px] text-white/35">
        <Icon name="MousePointerClick" size={10} />
        Проведите по графику, чтобы увидеть цену за любой день
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg bg-black/40 border border-white/10 px-1.5 py-1 text-center min-w-0">
      <div className="flex items-center justify-center gap-0.5 text-[8px] uppercase tracking-wider text-white/40 font-oswald font-bold">
        <Icon name={icon} size={8} style={{ color }} />{label}
      </div>
      <div className="font-oswald font-bold text-[11px] leading-tight mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[8px] text-white/30 truncate">{sub}</div>
    </div>
  );
}
