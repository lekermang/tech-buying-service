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
 * Строка 1 шапки — Курсы:
 *   медальон 🥇 + цена «Золото 999» (flash + поповер по пробам)
 *   + XAU/USD + USD/RUB
 *   + плашка статуса биржи (десктоп с tooltip-расписанием / мобилка-компакт).
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
    <div className={`relative max-w-7xl mx-auto px-3 sm:px-5 flex items-center gap-2 sm:gap-3 flex-wrap transition-[padding] duration-300 ${compact ? "py-1" : "py-2"}`}>
      {!compact && (
        <div
          className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                     bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                     shadow-[0_0_12px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]"
          title={market.label}
        >
          <span className="text-sm drop-shadow-sm">🥇</span>
          {/* Статус-точка биржи: зелёная (open) / золотая (fixing) / серая */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
            market.fixing
              ? "bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.9)] animate-pulse"
              : market.open
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse"
              : "bg-gray-500"
          }`} />
        </div>
      )}

      {/* Золото 999 ₽/г — с flash-анимацией при обновлении и поповером по пробам */}
      <div
        className={`relative flex items-center gap-2 h-9 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border px-3 rounded-lg shadow-[inset_0_1px_0_rgba(255,215,0,0.12)] group/probes cursor-help transition-all duration-500 ${
          flash === "up"
            ? "border-emerald-400/80 shadow-[0_0_20px_rgba(34,197,94,0.45),inset_0_0_12px_rgba(34,197,94,0.2)]"
            : flash === "down"
            ? "border-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.45),inset_0_0_12px_rgba(239,68,68,0.2)]"
            : "border-[#FFD700]/30"
        }`}
      >
        {/* Бегущий блик при обновлении */}
        {flash && (
          <span className={`pointer-events-none absolute inset-0 rounded-lg overflow-hidden`}>
            <span className={`absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,${flash === "up" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}_50%,transparent_70%)] animate-[shimmer_1.2s_ease-out]`} style={{ backgroundSize: "200% 100%" }} />
          </span>
        )}
        {/* Стрелка направления при flash */}
        {flash && (
          <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0A0A0A] animate-bounce ${
            flash === "up" ? "bg-emerald-400 text-black" : "bg-red-400 text-black"
          }`}>
            {flash === "up" ? "▲" : "▼"}
          </span>
        )}

        <div className="flex flex-col leading-none justify-center">
          <span className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 whitespace-nowrap">Золото 999</span>
          {goldPrice?.buy ? (
            <span className={`font-oswald font-bold text-base sm:text-lg mt-0.5 tracking-tight whitespace-nowrap leading-none transition-all duration-500 ${
              flash === "up"
                ? "text-emerald-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                : flash === "down"
                ? "text-red-300 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                : "text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]"
            }`}>
              {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
              <span className={`text-[10px] font-bold ml-0.5 ${
                flash === "up" ? "text-emerald-300/70" : flash === "down" ? "text-red-300/70" : "text-[#FFD700]/60"
              }`}>₽/г</span>
            </span>
          ) : (
            <span className="text-white/40 font-roboto text-xs mt-0.5">загрузка...</span>
          )}
        </div>

        {goldPrice?.buy && priceRetail999 && (
          <div className="pointer-events-none absolute top-full left-0 mt-2 z-50 opacity-0 translate-y-1 group-hover/probes:opacity-100 group-hover/probes:translate-y-0 transition-all duration-200 w-64">
            <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3">
              <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
              <div className="font-oswald font-bold text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2 flex items-center gap-2">
                <Icon name="Scale" size={11} />
                Цена покупки по пробам
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PROBES_DISPLAY.map(p => {
                  const price = Math.round((priceRetail999 / 0.999) * p.coeff);
                  return (
                    <div key={p.value} className="flex items-center justify-between bg-black/40 border border-[#FFD700]/15 rounded-md px-2 py-1.5">
                      <span className="font-oswald font-bold text-[#FFD700]/70 text-[10px] uppercase tracking-wider">{p.label}</span>
                      <span className="font-oswald font-bold text-[#FFD700] text-[11px] whitespace-nowrap">
                        {price.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 font-roboto">
                Цены для физлиц · итого ₽/г
              </div>
            </div>
          </div>
        )}
      </div>

      {goldPrice?.xau_usd && (
        <div className="hidden sm:flex items-center h-9 px-3 rounded-md bg-black/50 border border-white/10">
          <div className="flex flex-col leading-none justify-center">
            <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap">XAU/USD</span>
            <span className="font-oswald font-semibold text-white/85 text-[12px] mt-0.5 whitespace-nowrap leading-none">
              ${goldPrice.xau_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              <span className="text-white/40 text-[9px] font-bold ml-0.5">/oz</span>
            </span>
          </div>
        </div>
      )}

      {goldPrice?.usd_rub && (
        <div className="hidden md:flex items-center h-9 px-3 rounded-md bg-black/50 border border-white/10">
          <div className="flex flex-col leading-none justify-center">
            <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap">USD/RUB</span>
            <span className="font-oswald font-semibold text-white/85 text-[12px] mt-0.5 whitespace-nowrap leading-none">
              {goldPrice.usd_rub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
              <span className="text-white/40 text-[9px] font-bold ml-0.5">₽</span>
            </span>
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Десктоп/планшет: расширенная плашка статуса биржи + tooltip с расписанием */}
        <div className="group/market relative">
          <div
            className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border transition-colors ${
              market.fixing
                ? "bg-[#FFD700]/15 border-[#FFD700]/45"
                : market.open
                ? "bg-emerald-500/10 border-emerald-400/30"
                : "bg-black/40 border-white/10"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              market.fixing
                ? "bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.9)] animate-pulse"
                : market.open
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
                : "bg-gray-500"
            }`} />
            <div className="flex flex-col leading-none">
              <span className={`text-[10px] uppercase tracking-wider font-oswald font-bold whitespace-nowrap ${
                market.fixing ? "text-[#FFD700]" : market.open ? "text-emerald-300" : "text-white/55"
              }`}>
                {market.label}
              </span>
              <span className="text-[9px] text-white/50 font-roboto mt-0.5 whitespace-nowrap">
                {updatedAgo ? `обновлено ${updatedAgo}` : market.sublabel}
              </span>
            </div>
          </div>

          {/* Tooltip с подробным расписанием */}
          <div className="pointer-events-none absolute top-full right-0 mt-2 z-50 opacity-0 translate-y-1 group-hover/market:opacity-100 group-hover/market:translate-y-0 transition-all duration-200 w-72">
            <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3">
              <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />
              <div className="font-oswald font-bold text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-2 flex items-center gap-2">
                <Icon name="Clock" size={11} />
                Рынок золота · реальное время
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-black/40 rounded-md px-2 py-1.5">
                  <span className="text-[10px] text-white/60 font-roboto">Сейчас:</span>
                  <span className={`text-[11px] font-oswald font-bold flex items-center gap-1 ${
                    market.fixing ? "text-[#FFD700]" : market.open ? "text-emerald-300" : "text-white/55"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      market.fixing ? "bg-[#FFD700]" : market.open ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                    }`} />
                    {market.label}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-black/40 rounded-md px-2 py-1.5">
                  <span className="text-[10px] text-white/60 font-roboto">Площадка:</span>
                  <span className="text-[11px] font-oswald font-bold text-white/85">{market.sublabel}</span>
                </div>
                {market.nextChange && (
                  <div className="flex items-center justify-between bg-[#FFD700]/5 border border-[#FFD700]/15 rounded-md px-2 py-1.5">
                    <span className="text-[10px] text-[#FFD700]/70 font-roboto">Далее:</span>
                    <span className="text-[11px] font-oswald font-bold text-[#FFD700]">{market.nextChange}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 font-roboto leading-relaxed">
                CME COMEX: Вс 23:00 → Пт 22:00 GMT<br />
                LBMA фиксинг: 10:30 и 15:00 GMT (Пн–Пт)
              </div>
            </div>
          </div>
        </div>

        {/* Мобилка: компактный значок */}
        <div className={`sm:hidden flex items-center gap-1 h-9 px-2 rounded-md border ${
          market.fixing ? "bg-[#FFD700]/15 border-[#FFD700]/40"
            : market.open ? "bg-emerald-500/10 border-emerald-400/25"
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
            {market.fixing ? "фиксинг" : market.open ? "торги" : "закрыто"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoldTickerRatesRow;
