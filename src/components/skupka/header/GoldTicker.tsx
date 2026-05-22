import { useEffect, useMemo, useState } from "react";
import GoldTickerRatesRow from "./GoldTickerRatesRow";
import GoldTickerPricesRow from "./GoldTickerPricesRow";
import GoldTickerActionsRow from "./GoldTickerActionsRow";
import GoldTickerMobile from "./GoldTickerMobile";
import { getMarketStatus, timeAgo, type Period } from "./goldTickerUtils";

interface GoldTickerProps {
  goldPrice: { buy: number; buy_usd?: number; xau_usd?: number; usd_rub?: number; date: string } | null;
  goldHistory: { date: string; price: number }[];
  priceRetail999: number | null;
  priceWholesale999: number | null;
  onSellClick: () => void;
  /** При скролле — компактная версия */
  compact?: boolean;
}

/**
 * Шапка главной — 3 строки на всех экранах, без наездов.
 *   Строка 1 (GoldTickerRatesRow):   Золото 999 + XAU/USD + USD/RUB + статус биржи
 *   Строка 2 (GoldTickerPricesRow):  Физлица/Опт + график 7/30/90 с переключателем
 *   Строка 3 (GoldTickerActionsRow): Клиент / Сотрудник / Windows / APK / телефон / Продать
 *
 * Логика состояния (период графика, тикер времени, flash при изменении цены)
 * остаётся в этом файле и пробрасывается в дочерние компоненты пропсами.
 */
const GoldTicker = ({
  goldPrice,
  goldHistory,
  priceRetail999,
  priceWholesale999,
  onSellClick,
  compact = false,
}: GoldTickerProps) => {
  const [period, setPeriod] = useState<Period>(7);

  // Обновляем статус биржи и "обновлено N мин назад" каждые 5 секунд в реалтайме
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const market = getMarketStatus();
  const updatedAgo = timeAgo(goldPrice?.date);

  // Подсветка-вспышка при изменении цены
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [prevBuy, setPrevBuy] = useState<number | null>(null);
  useEffect(() => {
    if (!goldPrice?.buy) return;
    if (prevBuy !== null && goldPrice.buy !== prevBuy) {
      setFlash(goldPrice.buy > prevBuy ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 1500);
      setPrevBuy(goldPrice.buy);
      return () => clearTimeout(t);
    }
    if (prevBuy === null) setPrevBuy(goldPrice.buy);
  }, [goldPrice?.buy, prevBuy]);

  const filteredHistory = useMemo(() => {
    if (!goldHistory.length) return [];
    return goldHistory.slice(-period);
  }, [goldHistory, period]);

  return (
    <div className="relative bg-[#0A0A0A] border-b border-[#FFD700]/20">
      {/* Фоновое золотое свечение (изолировано в overflow-hidden, чтобы не блюрить наружу) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.05) 100%)" }} />
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.06)" }} />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.05)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)] bg-[length:50%_100%] animate-gold-shimmer" />
      </div>

      {/* ═══════ МОБИЛЬНАЯ ВЕРСИЯ — 1 строка с раскрывающейся панелью ═══════ */}
      <GoldTickerMobile
        goldPrice={goldPrice}
        priceRetail999={priceRetail999}
        priceWholesale999={priceWholesale999}
        market={market}
        updatedAgo={updatedAgo}
        flash={flash}
        onSellClick={onSellClick}
      />

      {/* ═══════ ДЕСКТОП: СТРОКА 1 — Курсы ═══════ */}
      <div className="hidden md:block">
        <GoldTickerRatesRow
          goldPrice={goldPrice}
          priceRetail999={priceRetail999}
          market={market}
          updatedAgo={updatedAgo}
          flash={flash}
          compact={compact}
        />
      </div>

      {/* ═══════ ДЕСКТОП: СТРОКА 2 — Цены физлица/опт + график (скрывается при скролле) ═══════ */}
      {!compact && goldPrice?.buy && (
        <div className="hidden md:block">
          <GoldTickerPricesRow
            goldPrice={goldPrice}
            priceRetail999={priceRetail999}
            priceWholesale999={priceWholesale999}
            filteredHistory={filteredHistory}
            period={period}
            setPeriod={setPeriod}
          />
        </div>
      )}

      {/* ═══════ ДЕСКТОП: СТРОКА 3 — Действия ═══════ */}
      <div className="hidden md:block">
        <GoldTickerActionsRow
          onSellClick={onSellClick}
          compact={compact}
        />
      </div>
    </div>
  );
};

export default GoldTicker;