import { useEffect, useMemo, useState } from "react";
import GoldTickerMobile from "./GoldTickerMobile";
import GoldTickerDesktopCompact from "./GoldTickerDesktopCompact";
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

  // Подсветка-вспышка при изменении цены + дельта
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [prevBuy, setPrevBuy] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    if (!goldPrice?.buy) return;
    if (prevBuy !== null && goldPrice.buy !== prevBuy) {
      const diff = goldPrice.buy - prevBuy;
      setFlash(diff > 0 ? "up" : "down");
      setDelta(diff);
      const t = setTimeout(() => { setFlash(null); setDelta(null); }, 3000);
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
    <div className="relative bg-[#080604] border-b border-[#FFD700]/18">
      {/* Фоновое золотое свечение — НЕ overflow-hidden, чтобы dropdown дочерних не обрезался */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: [
          "radial-gradient(1px 1px at 15% 40%, rgba(255,215,0,0.55) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 42% 20%, rgba(255,215,0,0.4) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 68% 65%, rgba(255,215,0,0.5) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 85% 30%, rgba(255,215,0,0.35) 0%, transparent 100%)",
          "radial-gradient(1px 1px at 25% 75%, rgba(255,215,0,0.45) 0%, transparent 100%)",
        ].join(", "),
      }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.05) 100%)" }} />
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.06)" }} />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.05)" }} />
      </div>
      {/* Нижняя анимированная gold-линия */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none" style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.15) 20%, rgba(255,215,0,0.8) 50%, rgba(255,215,0,0.15) 80%, transparent 100%)",
        animation: "shimmer 4s linear infinite",
        backgroundSize: "200% auto",
      }} />

      {/* ═══════ МОБ + ПЛАНШЕТ + ДЕСКТОП (<xl) — компактная 1-строка с раскрывающейся панелью ═══════ */}
      <div className="xl:hidden">
        <GoldTickerMobile
          goldPrice={goldPrice}
          priceRetail999={priceRetail999}
          priceWholesale999={priceWholesale999}
          market={market}
          updatedAgo={updatedAgo}
          flash={flash}
          onSellClick={onSellClick}
        />
      </div>

      {/* ═══════ БОЛЬШОЙ ПК xl+ : ОДНА компактная строка + раскрывающаяся панель ═══════ */}
      <GoldTickerDesktopCompact
        goldPrice={goldPrice}
        priceRetail999={priceRetail999}
        priceWholesale999={priceWholesale999}
        filteredHistory={filteredHistory}
        period={period}
        setPeriod={setPeriod}
        market={market}
        updatedAgo={updatedAgo}
        flash={flash}
        delta={delta}
        onSellClick={onSellClick}
        compact={compact}
      />
    </div>
  );
};

export default GoldTicker;