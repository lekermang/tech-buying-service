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
 * Строка 2 шапки — Цены физлица/опт + график 7/30/90 с переключателем и поповером.
 * Рендерится только если есть текущая цена золота (родитель уже проверяет компактность).
 */
const GoldTickerPricesRow = ({
  goldPrice,
  priceRetail999,
  priceWholesale999,
  filteredHistory,
  period,
  setPeriod,
}: GoldTickerPricesRowProps) => {
  return (
    <div className="relative max-w-7xl mx-auto px-3 sm:px-5 py-2 flex items-center gap-2 sm:gap-3 flex-wrap border-t border-[#FFD700]/10">
      <div className="flex items-center gap-2 h-9 bg-black/60 border border-[#FFD700]/20 px-3 rounded-md">
        <Icon name="User" size={12} className="text-[#FFD700]/60" />
        <div className="flex flex-col leading-none justify-center">
          <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Физлица</span>
          <span className="text-[#FFD700] font-oswald font-bold text-sm mt-0.5 whitespace-nowrap">
            {priceRetail999?.toLocaleString('ru-RU')} ₽/г
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 h-9 bg-black/60 border border-[#FFD700]/20 px-3 rounded-md">
        <Icon name="Package" size={12} className="text-[#FFD700]/60" />
        <div className="flex flex-col leading-none justify-center">
          <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Опт 30г+</span>
          <span className="text-[#FFD700] font-oswald font-bold text-sm mt-0.5 whitespace-nowrap">
            {priceWholesale999?.toLocaleString('ru-RU')} ₽/г
          </span>
        </div>
      </div>

      {filteredHistory.length >= 2 && (() => {
        const W = 84, H = 26, pad = 2;
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
        const fadeColor = up ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
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
          <div className="relative hidden sm:flex items-center gap-2 h-9 bg-black/50 border border-white/10 px-3 rounded-md group/chart cursor-help">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
              <defs>
                <linearGradient id="gchart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fadeColor} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              <polygon points={fill} fill="url(#gchart)" />
              <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={lastPt.x} cy={lastPt.y} r="2.2" fill={color} stroke="#0A0A0A" strokeWidth="1" />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-oswald font-bold flex items-center gap-0.5" style={{ color }}>
                {up ? '▲' : '▼'} {deltaPct}%
              </span>
              <span className="text-[8px] text-white/35 mt-0.5 uppercase tracking-wider font-oswald font-bold">{period} {period === 7 ? "дней" : "дн"}</span>
            </div>

            <div className="flex items-center gap-0.5 ml-1 bg-black/50 border border-white/10 rounded-md p-0.5">
              {([7, 30, 90] as Period[]).map(p => {
                const active = period === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-oswald font-bold uppercase tracking-wider transition-all ${
                      active ? "bg-[#FFD700]/20 text-[#FFD700]" : "text-white/50 hover:text-[#FFD700] hover:bg-white/5"
                    }`}
                  >
                    {p}д
                  </button>
                );
              })}
            </div>

            <div className="pointer-events-none absolute top-full left-0 mt-2 z-50 opacity-0 translate-y-1 group-hover/chart:opacity-100 group-hover/chart:translate-y-0 transition-all duration-200 w-64">
              <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3">
                <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
                <div className="font-oswald font-bold text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2">
                  Динамика · {period} дн
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex flex-col leading-tight bg-emerald-500/10 border border-emerald-400/20 rounded-md px-2 py-1.5">
                    <span className="text-[8px] text-emerald-300/70 uppercase tracking-wider font-bold">Макс</span>
                    <span className="font-oswald font-bold text-emerald-300 text-[12px] mt-0.5 whitespace-nowrap">
                      {max.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight bg-red-500/10 border border-red-400/20 rounded-md px-2 py-1.5">
                    <span className="text-[8px] text-red-300/70 uppercase tracking-wider font-bold">Мин</span>
                    <span className="font-oswald font-bold text-red-300 text-[12px] mt-0.5 whitespace-nowrap">
                      {min.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-md px-2 py-1.5 mb-2">
                  <span className="text-[9px] text-white/50 uppercase tracking-wider font-bold">Изменение</span>
                  <span className="font-oswald font-bold text-[12px] flex items-center gap-1" style={{ color }}>
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
          </div>
        );
      })()}
    </div>
  );
};

export default GoldTickerPricesRow;
