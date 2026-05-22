import Icon from "@/components/ui/icon";
import { PROBES_DISPLAY, type MarketStatus } from "./goldTickerUtils";

interface GoldTickerRatesRowProps {
  goldPrice: { buy: number; buy_usd?: number; xau_usd?: number; usd_rub?: number; date: string } | null;
  priceRetail999: number | null;
  market: MarketStatus;
  updatedAgo: string;
  flash: "up" | "down" | null;
  compact: boolean;
}

/**
 * Строка 1 — Курсы (компакт-премиум).
 * Высота h-7, тонкие 1px-рамки, монохром, аккуратные разделители.
 */
const GoldTickerRatesRow = ({
  goldPrice,
  priceRetail999,
  market,
  updatedAgo,
  flash,
  compact,
}: GoldTickerRatesRowProps) => {
  return (
    <div className={`relative max-w-7xl mx-auto px-3 sm:px-5 flex items-center gap-2 transition-[padding] duration-300 ${compact ? "py-1" : "py-1.5"}`}>
      {/* Медальон */}
      {!compact && (
        <div
          className="relative shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                     bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                     shadow-[0_0_8px_rgba(255,215,0,0.3)]"
          title={market.label}
        >
          <span className="text-[11px] drop-shadow-sm">🥇</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${
            market.fixing
              ? "bg-[#FFD700] shadow-[0_0_6px_rgba(255,215,0,0.9)] animate-pulse"
              : market.open
              ? "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.7)] animate-pulse"
              : "bg-gray-500"
          }`} />
        </div>
      )}

      {/* Золото 999 ₽/г */}
      <div
        className={`relative flex items-center h-7 bg-black/70 border px-2.5 rounded-md group/probes cursor-help transition-all duration-500 ${
          flash === "up"
            ? "border-emerald-400/70 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
            : flash === "down"
            ? "border-red-400/70 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
            : "border-[#FFD700]/40"
        }`}
      >
        {flash && (
          <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#0A0A0A] ${
            flash === "up" ? "bg-emerald-400 text-black" : "bg-red-400 text-black"
          }`}>
            {flash === "up" ? "▲" : "▼"}
          </span>
        )}

        <span className="font-oswald font-bold text-[9px] uppercase tracking-[0.18em] text-[#FFD700]/60 whitespace-nowrap mr-2">999</span>
        {goldPrice?.buy ? (
          <span className={`font-oswald font-bold text-[14px] sm:text-[15px] tracking-tight whitespace-nowrap leading-none transition-colors duration-500 ${
            flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : "text-[#FFD700]"
          }`}>
            {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
            <span className={`text-[9px] font-bold ml-0.5 ${
              flash === "up" ? "text-emerald-300/60" : flash === "down" ? "text-red-300/60" : "text-[#FFD700]/55"
            }`}>₽/г</span>
          </span>
        ) : (
          <span className="text-white/40 font-roboto text-xs">—</span>
        )}

        {/* Поповер: раскладка по пробам */}
        {goldPrice?.buy && priceRetail999 && (
          <div className="pointer-events-none absolute top-full left-0 mt-1.5 z-50 opacity-0 translate-y-1 group-hover/probes:opacity-100 group-hover/probes:translate-y-0 transition-all duration-200 w-64">
            <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-2.5">
              <div className="absolute -top-1.5 left-5 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
              <div className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2 flex items-center gap-1.5">
                <Icon name="Scale" size={10} />
                Цены покупки по пробам
              </div>
              <div className="grid grid-cols-2 gap-1">
                {PROBES_DISPLAY.map(p => {
                  const price = Math.round((priceRetail999 / 0.999) * p.coeff);
                  return (
                    <div key={p.value} className="flex items-center justify-between bg-black/40 border border-[#FFD700]/15 rounded px-1.5 py-1">
                      <span className="font-oswald font-bold text-[#FFD700]/70 text-[9px] uppercase">{p.label}</span>
                      <span className="font-oswald font-bold text-[#FFD700] text-[10px] whitespace-nowrap">
                        {price.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* XAU/USD */}
      {goldPrice?.xau_usd && (
        <div className="hidden sm:flex items-center h-7 px-2.5 rounded-md bg-black/50 border border-white/10">
          <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap mr-1.5">XAU</span>
          <span className="font-oswald font-semibold text-white/85 text-[12px] whitespace-nowrap leading-none">
            ${goldPrice.xau_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span className="text-white/35 text-[9px] font-bold ml-0.5">/oz</span>
          </span>
        </div>
      )}

      {/* USD/RUB */}
      {goldPrice?.usd_rub && (
        <div className="hidden md:flex items-center h-7 px-2.5 rounded-md bg-black/50 border border-white/10">
          <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap mr-1.5">USD</span>
          <span className="font-oswald font-semibold text-white/85 text-[12px] whitespace-nowrap leading-none">
            {goldPrice.usd_rub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
            <span className="text-white/35 text-[9px] font-bold ml-0.5">₽</span>
          </span>
        </div>
      )}

      {/* Статус биржи (справа) */}
      <div className="ml-auto flex items-center gap-2">
        <div className="group/market relative">
          <div
            className={`hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md border transition-colors ${
              market.fixing
                ? "bg-[#FFD700]/10 border-[#FFD700]/40"
                : market.open
                ? "bg-emerald-500/8 border-emerald-400/25"
                : "bg-black/40 border-white/10"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              market.fixing
                ? "bg-[#FFD700] shadow-[0_0_6px_rgba(255,215,0,0.9)] animate-pulse"
                : market.open
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"
                : "bg-gray-500"
            }`} />
            <span className={`text-[10px] uppercase tracking-wider font-oswald font-bold whitespace-nowrap ${
              market.fixing ? "text-[#FFD700]" : market.open ? "text-emerald-300" : "text-white/55"
            }`}>
              {market.fixing ? "Фиксинг" : market.open ? "Торги" : "Закрыто"}
            </span>
            {updatedAgo && (
              <span className="hidden lg:inline text-[9px] text-white/40 font-roboto whitespace-nowrap border-l border-white/10 pl-1.5 ml-1">
                {updatedAgo}
              </span>
            )}
          </div>

          {/* Tooltip с расписанием */}
          <div className="pointer-events-none absolute top-full right-0 mt-1.5 z-50 opacity-0 translate-y-1 group-hover/market:opacity-100 group-hover/market:translate-y-0 transition-all duration-200 w-64">
            <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-2.5">
              <div className="absolute -top-1.5 right-5 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
              <div className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2 flex items-center gap-1.5">
                <Icon name="Clock" size={10} />
                Рынок золота
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-black/40 rounded px-2 py-1">
                  <span className="text-[9px] text-white/55 font-roboto">Статус:</span>
                  <span className={`text-[10px] font-oswald font-bold ${
                    market.fixing ? "text-[#FFD700]" : market.open ? "text-emerald-300" : "text-white/60"
                  }`}>
                    {market.label}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-black/40 rounded px-2 py-1">
                  <span className="text-[9px] text-white/55 font-roboto">Площадка:</span>
                  <span className="text-[10px] font-oswald font-bold text-white/85">{market.sublabel}</span>
                </div>
                {market.nextChange && (
                  <div className="flex items-center justify-between bg-[#FFD700]/5 border border-[#FFD700]/15 rounded px-2 py-1">
                    <span className="text-[9px] text-[#FFD700]/70 font-roboto">Далее:</span>
                    <span className="text-[10px] font-oswald font-bold text-[#FFD700]">{market.nextChange}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-1.5 border-t border-white/10 text-[8px] text-white/35 font-roboto leading-relaxed">
                CME COMEX: Вс 23:00 → Пт 22:00 GMT<br />
                LBMA фиксинг: 10:30 · 15:00 GMT (Пн–Пт)
              </div>
            </div>
          </div>
        </div>

        {/* Мобилка: компактный значок */}
        <div className={`sm:hidden flex items-center gap-1 h-7 px-2 rounded-md border ${
          market.fixing ? "bg-[#FFD700]/10 border-[#FFD700]/40"
            : market.open ? "bg-emerald-500/8 border-emerald-400/25"
            : "bg-black/40 border-white/10"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            market.fixing ? "bg-[#FFD700] animate-pulse"
              : market.open ? "bg-emerald-400 animate-pulse"
              : "bg-gray-500"
          }`} />
          <span className={`text-[9px] uppercase font-oswald font-bold tracking-wider ${
            market.fixing ? "text-[#FFD700]"
              : market.open ? "text-emerald-300/85"
              : "text-white/50"
          }`}>
            {market.fixing ? "фикс" : market.open ? "торги" : "закр"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoldTickerRatesRow;
