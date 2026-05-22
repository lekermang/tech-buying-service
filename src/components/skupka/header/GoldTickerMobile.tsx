import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { APK_URL, EXE_URL, PROBES_DISPLAY, type MarketStatus } from "./goldTickerUtils";

interface GoldTickerMobileProps {
  goldPrice: { buy: number; buy_usd?: number; xau_usd?: number; usd_rub?: number; date: string } | null;
  priceRetail999: number | null;
  priceWholesale999: number | null;
  market: MarketStatus;
  updatedAgo: string;
  flash: "up" | "down" | null;
  onSellClick: () => void;
}

/**
 * Мобильная шапка (одна строка): медальон 🥇 → Цена 999 → Продать.
 * По тапу на цене или на «···» открывается выпадающая панель с деталями:
 *   - XAU/USD + USD/RUB
 *   - Статус биржи
 *   - Цены физлица/опт
 *   - Раскладка по пробам
 *   - Кнопки Клиент / Сотрудник / Windows / APK / Телефон
 */
const GoldTickerMobile = ({
  goldPrice,
  priceRetail999,
  priceWholesale999,
  market,
  updatedAgo,
  flash,
  onSellClick,
}: GoldTickerMobileProps) => {
  const [openDetails, setOpenDetails] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDetails) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenDetails(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [openDetails]);

  return (
    <div ref={rootRef} className="md:hidden relative">
      {/* ── Одна строка ── */}
      <div className="relative max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-2">
        {/* Медальон со статусом */}
        <div
          className="relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                     bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                     shadow-[0_0_8px_rgba(255,215,0,0.3)]"
          title={market.label}
        >
          <span className="text-[13px] drop-shadow-sm">🥇</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${
            market.fixing
              ? "bg-[#FFD700] animate-pulse"
              : market.open
              ? "bg-emerald-400 animate-pulse"
              : "bg-gray-500"
          }`} />
        </div>

        {/* Цена 999 — крупная, тап открывает детали */}
        <button
          type="button"
          onClick={() => setOpenDetails(o => !o)}
          className={`flex-1 min-w-0 flex items-center justify-between h-9 px-3 rounded-md border transition-all duration-300 ${
            flash === "up"
              ? "bg-emerald-500/10 border-emerald-400/60"
              : flash === "down"
              ? "bg-red-500/10 border-red-400/60"
              : "bg-black/60 border-[#FFD700]/30"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-oswald font-bold text-[9px] uppercase tracking-[0.18em] text-[#FFD700]/60 shrink-0">999</span>
            {goldPrice?.buy ? (
              <span className={`font-oswald font-bold text-[16px] tracking-tight whitespace-nowrap leading-none transition-colors duration-500 ${
                flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : "text-[#FFD700]"
              }`}>
                {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                <span className="text-[10px] font-bold ml-0.5 opacity-60">₽/г</span>
              </span>
            ) : (
              <span className="text-white/40 font-roboto text-xs">загрузка...</span>
            )}
          </div>
          <Icon name={openDetails ? "ChevronUp" : "ChevronDown"} size={14} className="text-[#FFD700]/60 shrink-0 ml-2" />
        </button>

        {/* Продать — главный CTA */}
        <button
          onClick={onSellClick}
          className="relative overflow-hidden h-9 px-3.5 rounded-md font-oswald font-bold text-black text-[12px] uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shrink-0
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_2px_8px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]"
        >
          <Icon name="Zap" size={12} />
          <span>Продать</span>
        </button>
      </div>

      {/* ── Выпадающая панель деталей ── */}
      {openDetails && (
        <div className="absolute top-full left-0 right-0 z-[60] px-3 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#0F0F0F] border border-[#FFD700]/30 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.7)] p-3 space-y-2.5">

            {/* Цены физлица / опт */}
            {goldPrice?.buy && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/50 border border-[#FFD700]/20 rounded-md px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon name="User" size={10} className="text-[#FFD700]/55" />
                    <span className="font-oswald font-bold text-[#FFD700]/55 text-[9px] uppercase tracking-wider">Физлица</span>
                  </div>
                  <span className="font-oswald font-bold text-[#FFD700] text-[14px] whitespace-nowrap leading-none">
                    {priceRetail999?.toLocaleString('ru-RU')}
                    <span className="text-[9px] text-[#FFD700]/55 ml-0.5">₽/г</span>
                  </span>
                </div>
                <div className="bg-black/50 border border-[#FFD700]/20 rounded-md px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon name="Package" size={10} className="text-[#FFD700]/55" />
                    <span className="font-oswald font-bold text-[#FFD700]/55 text-[9px] uppercase tracking-wider">Опт 30г+</span>
                  </div>
                  <span className="font-oswald font-bold text-[#FFD700] text-[14px] whitespace-nowrap leading-none">
                    {priceWholesale999?.toLocaleString('ru-RU')}
                    <span className="text-[9px] text-[#FFD700]/55 ml-0.5">₽/г</span>
                  </span>
                </div>
              </div>
            )}

            {/* Биржевые курсы */}
            {(goldPrice?.xau_usd || goldPrice?.usd_rub) && (
              <div className="grid grid-cols-2 gap-2">
                {goldPrice?.xau_usd && (
                  <div className="bg-black/40 border border-white/10 rounded-md px-2.5 py-1.5">
                    <span className="font-oswald font-semibold text-[8px] uppercase tracking-wider text-white/40 block mb-0.5">XAU/USD</span>
                    <span className="font-oswald font-semibold text-white/85 text-[12px] whitespace-nowrap leading-none">
                      ${goldPrice.xau_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      <span className="text-white/35 text-[9px] ml-0.5">/oz</span>
                    </span>
                  </div>
                )}
                {goldPrice?.usd_rub && (
                  <div className="bg-black/40 border border-white/10 rounded-md px-2.5 py-1.5">
                    <span className="font-oswald font-semibold text-[8px] uppercase tracking-wider text-white/40 block mb-0.5">USD/RUB</span>
                    <span className="font-oswald font-semibold text-white/85 text-[12px] whitespace-nowrap leading-none">
                      {goldPrice.usd_rub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                      <span className="text-white/35 text-[9px] ml-0.5">₽</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Статус биржи */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${
              market.fixing ? "bg-[#FFD700]/10 border-[#FFD700]/30"
                : market.open ? "bg-emerald-500/10 border-emerald-400/25"
                : "bg-black/40 border-white/10"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                market.fixing ? "bg-[#FFD700] animate-pulse"
                  : market.open ? "bg-emerald-400 animate-pulse"
                  : "bg-gray-500"
              }`} />
              <span className={`text-[11px] font-oswald font-bold uppercase tracking-wider ${
                market.fixing ? "text-[#FFD700]"
                  : market.open ? "text-emerald-300"
                  : "text-white/60"
              }`}>
                {market.label}
              </span>
              {updatedAgo && (
                <span className="ml-auto text-[9px] text-white/40 font-roboto whitespace-nowrap">
                  {updatedAgo}
                </span>
              )}
            </div>

            {/* Раскладка по пробам */}
            {priceRetail999 && (
              <div>
                <div className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 mb-1.5 flex items-center gap-1.5">
                  <Icon name="Scale" size={10} />
                  Цены по пробам
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {PROBES_DISPLAY.map(p => {
                    const price = Math.round((priceRetail999 / 0.999) * p.coeff);
                    return (
                      <div key={p.value} className="bg-black/40 border border-[#FFD700]/15 rounded px-1.5 py-1 text-center">
                        <div className="font-oswald font-bold text-[#FFD700]/70 text-[9px] uppercase">{p.label}</div>
                        <div className="font-oswald font-bold text-[#FFD700] text-[10px] whitespace-nowrap mt-0.5">
                          {price.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Быстрые ссылки */}
            <div className="pt-1 border-t border-white/10">
              <div className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1.5">
                Быстрый доступ
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href="/cabinet"
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/25 text-[#FFD700] active:scale-95 transition-all"
                >
                  <Icon name="User" size={12} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">Клиент</span>
                </a>
                <a
                  href="/staff"
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/25 text-[#FFD700] active:scale-95 transition-all"
                >
                  <Icon name="ShieldCheck" size={12} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">Сотрудник</span>
                </a>
                <a
                  href="tel:88006006833"
                  onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker_mobile" })}
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/30 text-[#FFD700] active:scale-95 transition-all"
                >
                  <Icon name="Phone" size={12} />
                  <span className="font-oswald font-bold text-[10px] tracking-wide">8 800 600-68-33</span>
                </a>
                <a
                  href={APK_URL}
                  download="Skupka24.apk"
                  className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-emerald-400/30 text-emerald-300 active:scale-95 transition-all"
                >
                  <Icon name="Smartphone" size={12} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">APK</span>
                </a>
                <a
                  href={EXE_URL}
                  download="Skupka24-Setup.exe"
                  className="col-span-2 flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/30 text-[#FFD700] active:scale-95 transition-all"
                >
                  <Icon name="Monitor" size={12} />
                  <span className="font-oswald font-bold text-[10px] uppercase tracking-wider">Скачать для Windows</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldTickerMobile;
