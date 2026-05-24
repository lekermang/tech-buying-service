import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import type { Period } from "./goldTickerUtils";

interface GoldTickerPricesRowProps {
  goldPrice: { buy: number; date: string } | null;
  priceRetail999: number | null;
  priceWholesale999: number | null;
  filteredHistory: { date: string; price: number }[];
  period: Period;
  setPeriod: (p: Period) => void;
}

/**
 * Строка 2 — Цены физлица/опт + график (компакт-премиум).
 * Поповер графика управляется через useState (надёжно на тач и десктопе).
 */
const GoldTickerPricesRow = ({
  goldPrice,
  priceRetail999,
  priceWholesale999,
  filteredHistory,
  period,
  setPeriod,
}: GoldTickerPricesRowProps) => {
  const [openChart, setOpenChart] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openChart) return;
    const onClick = (e: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
        setOpenChart(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openChart]);

  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-5 py-1.5 flex items-center gap-2 border-t border-[#FFD700]/10">
      {/* Физлица + Опт — единая капсула с разделителем */}
      <div className="inline-flex h-7 rounded-md border border-[#FFD700]/20 bg-black/60 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5">
          <Icon name="User" size={11} className="text-[#FFD700]/55" />
          <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-wider font-oswald font-bold">Физ</span>
          <span className="text-[#FFD700] font-oswald font-bold text-[12px] whitespace-nowrap leading-none">
            {priceRetail999?.toLocaleString('ru-RU')} <span className="text-[9px] text-[#FFD700]/55">₽/г</span>
          </span>
        </div>
        <span className="w-px self-stretch bg-[#FFD700]/15" aria-hidden />
        <div className="flex items-center gap-1.5 px-2.5">
          <Icon name="Package" size={11} className="text-[#FFD700]/55" />
          <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-wider font-oswald font-bold">Опт</span>
          <span className="text-[#FFD700] font-oswald font-bold text-[12px] whitespace-nowrap leading-none">
            {priceWholesale999?.toLocaleString('ru-RU')} <span className="text-[9px] text-[#FFD700]/55">₽/г</span>
          </span>
        </div>
      </div>

      {/* График + дельта + переключатель */}
      {filteredHistory.length >= 2 && (() => {
        const W = 64, H = 20, pad = 2;
        const prices = filteredHistory.map(h => h.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const xy = prices.map((p, i) => {
          const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
          const y = H - pad - ((p - min) / range) * (H - pad * 2);
          return { x, y };
        });
        const pts = xy.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const fill = `${xy[0].x.toFixed(1)},${H - pad} ${pts} ${xy[xy.length - 1].x.toFixed(1)},${H - pad}`;
        const last = prices[prices.length - 1];
        const first = prices[0];
        const up = last >= first;
        const color = up ? '#22c55e' : '#ef4444';
        const fadeColor = up ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)';
        const lastPt = xy[xy.length - 1];
        const deltaPct = Math.abs(((last - first) / first) * 100).toFixed(1);
        const deltaRub = Math.abs(last - first);
        const lastDate = filteredHistory[filteredHistory.length - 1]?.date || goldPrice?.date;
        const firstDate = filteredHistory[0]?.date;
        const fmtDate = (s?: string) => {
          if (!s) return '';
          try { return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }); }
          catch { return s; }
        };
        return (
          <div ref={chartRef} className="relative">
            <button
              type="button"
              onMouseEnter={() => setOpenChart(true)}
              onMouseLeave={() => setOpenChart(false)}
              onClick={() => setOpenChart(o => !o)}
              className="hidden sm:flex items-center gap-1.5 h-7 bg-black/50 border border-white/10 px-2 rounded-md cursor-pointer"
            >
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                <defs>
                  <linearGradient id="gchart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fadeColor} />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </linearGradient>
                </defs>
                <polygon points={fill} fill="url(#gchart)" />
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={lastPt.x} cy={lastPt.y} r="1.8" fill={color} stroke="#0A0A0A" strokeWidth="0.8" />
              </svg>
              <span className="text-[10px] font-oswald font-bold whitespace-nowrap" style={{ color }}>
                {up ? '▲' : '▼'} {deltaPct}%
              </span>

              <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded p-0.5 ml-0.5">
                {([7, 30, 90] as Period[]).map(p => (
                  <span
                    key={p}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setPeriod(p); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setPeriod(p);
                      }
                    }}
                    className={`px-1 py-0 rounded-sm text-[8px] font-oswald font-bold uppercase tracking-wider transition-all leading-none h-4 inline-flex items-center cursor-pointer ${
                      period === p ? "bg-[#FFD700]/20 text-[#FFD700]" : "text-white/45 hover:text-[#FFD700]"
                    }`}
                  >
                    {p}д
                  </span>
                ))}
              </div>
            </button>

            {openChart && (
              <div className="absolute top-full left-0 mt-1.5 z-[60] w-64 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-2.5">
                  <div className="absolute -top-1.5 left-5 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
                  <div className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2">
                    Динамика · {period} дн
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                    <div className="flex flex-col leading-tight bg-emerald-500/10 border border-emerald-400/20 rounded px-1.5 py-1">
                      <span className="text-[8px] text-emerald-300/70 uppercase font-bold">Макс</span>
                      <span className="font-oswald font-bold text-emerald-300 text-[11px] mt-0.5 whitespace-nowrap">
                        {max.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </span>
                    </div>
                    <div className="flex flex-col leading-tight bg-red-500/10 border border-red-400/20 rounded px-1.5 py-1">
                      <span className="text-[8px] text-red-300/70 uppercase font-bold">Мин</span>
                      <span className="font-oswald font-bold text-red-300 text-[11px] mt-0.5 whitespace-nowrap">
                        {min.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded px-2 py-1 mb-1.5">
                    <span className="text-[9px] text-white/50 uppercase font-bold">Δ</span>
                    <span className="font-oswald font-bold text-[11px] flex items-center gap-1" style={{ color }}>
                      {up ? '▲' : '▼'} {deltaRub.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽ ({deltaPct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40 font-roboto">
                    <span>{fmtDate(firstDate)}</span>
                    <span className="text-white/30">→</span>
                    <span>{fmtDate(lastDate)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default GoldTickerPricesRow;