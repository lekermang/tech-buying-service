import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

interface GoldTickerProps {
  goldPrice: { buy: number; buy_usd?: number; date: string } | null;
  goldHistory: { date: string; price: number }[];
  priceRetail999: number | null;
  priceWholesale999: number | null;
  onSellClick: () => void;
}

const GoldTicker = ({
  goldPrice,
  goldHistory,
  priceRetail999,
  priceWholesale999,
  onSellClick,
}: GoldTickerProps) => {
  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] border-b border-[#FFD700]/20">
      {/* Мягкое золотое свечение по краям (как в Trade In) */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.05) 100%)" }} />
      <div className="pointer-events-none absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.06)" }} />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.05)" }} />
      {/* Анимированный переливающийся блик по нижней грани */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)] bg-[length:50%_100%] animate-gold-shimmer" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">

        {/* ── ЛЕВО: Золото 999 + цена + график ──────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Значок-медальон */}
          <div className="relative shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                          bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                          shadow-[0_0_12px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.3)]">
            <span className="text-sm sm:text-base drop-shadow-sm">🥇</span>
          </div>

          {/* Бейдж + цена в одной капсуле */}
          <div className="flex items-center gap-2 sm:gap-3 bg-black/60 border border-[#FFD700]/25 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-[inset_0_1px_0_rgba(255,215,0,0.08)]">
            <div className="flex flex-col leading-none">
              <span className="font-oswald font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70">
                Золото 999
              </span>
              {goldPrice?.buy ? (
                <>
                  <span className="font-oswald font-bold text-[#FFD700] text-base sm:text-xl mt-0.5 tracking-tight whitespace-nowrap leading-none">
                    {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                    <span className="text-[#FFD700]/60 text-[10px] sm:text-xs font-bold ml-0.5">₽/г</span>
                  </span>
                  {typeof goldPrice.buy_usd === 'number' && (
                    <span className="font-oswald font-semibold text-[#FFD700]/70 text-[10px] sm:text-[11px] mt-1 tracking-tight whitespace-nowrap leading-none">
                      ${goldPrice.buy_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      <span className="text-[#FFD700]/45 text-[9px] sm:text-[10px] font-bold ml-0.5">/г</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-white/40 font-roboto text-xs mt-0.5">загрузка...</span>
              )}
            </div>

            {/* Мини-график 7 дней — тонкий разделитель и компактная метрика */}
            {goldPrice?.buy && goldHistory.length >= 2 && (() => {
              const W = 48, H = 22, pad = 2;
              const prices = goldHistory.map(h => h.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const range = max - min || 1;
              const pts = prices.map((p, i) => {
                const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
                const y = H - pad - ((p - min) / range) * (H - pad * 2);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              const last = prices[prices.length - 1];
              const first = prices[0];
              const up = last >= first;
              const color = up ? '#22c55e' : '#ef4444';
              const lastX = pad + (W - pad * 2);
              const lastY = H - pad - ((last - min) / range) * (H - pad * 2);
              return (
                <div className="hidden sm:flex items-center gap-1.5 pl-2.5 border-l border-[#FFD700]/20" title="Изменение цены за 7 дней">
                  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={lastX} cy={lastY} r="2" fill={color} />
                  </svg>
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-oswald font-bold" style={{ color }}>
                      {up ? '▲' : '▼'}{Math.abs(((last - first) / first) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-white/35 mt-0.5 uppercase tracking-wide">7 дней</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── ЦЕНТР: цены покупки по типам клиента ────────────────────── */}
        {goldPrice?.buy && (
          <div className="hidden xl:flex items-center gap-2 font-roboto shrink-0">
            <div className="flex items-center gap-2 bg-black/60 border border-[#FFD700]/20 px-3 py-1.5 rounded-md hover:border-[#FFD700]/40 transition-colors">
              <Icon name="User" size={12} className="text-[#FFD700]/60" />
              <div className="flex flex-col leading-none">
                <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Физлица</span>
                <span className="text-[#FFD700] font-oswald font-bold text-sm mt-0.5 whitespace-nowrap">
                  {priceRetail999?.toLocaleString('ru-RU')} ₽/г
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/60 border border-[#FFD700]/20 px-3 py-1.5 rounded-md hover:border-[#FFD700]/40 transition-colors">
              <Icon name="Package" size={12} className="text-[#FFD700]/60" />
              <div className="flex flex-col leading-none">
                <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Опт 30г+</span>
                <span className="text-[#FFD700] font-oswald font-bold text-sm mt-0.5 whitespace-nowrap">
                  {priceWholesale999?.toLocaleString('ru-RU')} ₽/г
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── ПРАВО: телефон + Продать ────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Десктоп: большой телефон с подписью */}
          <a href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="hidden md:flex items-center gap-2 bg-black/60 hover:bg-black/80 border border-[#FFD700]/20 hover:border-[#FFD700]/50 active:scale-95 transition-all px-3 py-1.5 rounded-md group">
            <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors shrink-0">
              <Icon name="Phone" size={12} className="text-[#FFD700]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-oswald font-bold text-[#FFD700] text-[13px] tracking-wide whitespace-nowrap">8 800 600-68-33</span>
              <span className="font-roboto text-white/40 text-[9px] mt-0.5 uppercase tracking-wide">звонок бесплатный</span>
            </div>
          </a>
          {/* Мобилка: компактный */}
          <a href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="md:hidden flex items-center gap-1.5 bg-black/60 border border-[#FFD700]/25 hover:border-[#FFD700]/50 active:scale-95 transition-all px-2.5 py-1.5 rounded-md">
            <Icon name="Phone" size={13} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-[#FFD700] text-xs">8-800</span>
          </a>

          {/* Кнопка Продать — премиальная золотая с бликом */}
          <button
            onClick={onSellClick}
            className="relative overflow-hidden font-oswald font-bold text-black text-sm sm:text-[15px] px-4 sm:px-5 py-1.5 sm:py-2 uppercase tracking-wide active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-md
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_4px_14px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_4px_20px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]
                       group">
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Icon name="Zap" size={14} className="relative" />
            <span className="relative">Продать</span>
          </button>
        </div>
      </div>

      {/* Мобильная вторая строка с ценами физлица/опт — появляется ниже xl */}
      {goldPrice?.buy && (
        <div className="xl:hidden relative border-t border-[#FFD700]/10 bg-black/40 px-3 sm:px-5 py-1.5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Icon name="User" size={11} className="text-[#FFD700]/50" />
            <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Физлица</span>
            <span className="text-[#FFD700] font-oswald font-bold text-xs whitespace-nowrap">
              {priceRetail999?.toLocaleString('ru-RU')} ₽/г
            </span>
          </div>
          <div className="w-px h-3 bg-[#FFD700]/20" />
          <div className="flex items-center gap-1.5">
            <Icon name="Package" size={11} className="text-[#FFD700]/50" />
            <span className="text-[#FFD700]/55 text-[9px] uppercase tracking-[0.15em] font-oswald font-bold">Опт 30г+</span>
            <span className="text-[#FFD700] font-oswald font-bold text-xs whitespace-nowrap">
              {priceWholesale999?.toLocaleString('ru-RU')} ₽/г
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldTicker;