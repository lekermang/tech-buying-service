import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

interface GoldTickerProps {
  goldPrice: { buy: number; buy_usd?: number; xau_usd?: number; usd_rub?: number; date: string } | null;
  goldHistory: { date: string; price: number }[];
  priceRetail999: number | null;
  priceWholesale999: number | null;
  onSellClick: () => void;
  /** При скролле — компактная версия */
  compact?: boolean;
}

const APK_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk";
const EXE_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe";

type Period = 7 | 30 | 90;

const PROBES_DISPLAY: { label: string; value: number; coeff: number }[] = [
  { label: "375", value: 375, coeff: 0.375 },
  { label: "500", value: 500, coeff: 0.5 },
  { label: "585", value: 585, coeff: 0.585 },
  { label: "750", value: 750, coeff: 0.75 },
  { label: "916", value: 916, coeff: 0.916 },
  { label: "999", value: 999, coeff: 0.999 },
];

/** Лондонский биржевой фиксинг XAU работает Пн–Пт 10:30–15:00 GMT (упрощённо). */
function getMarketStatus(): { open: boolean; label: string; nextLabel: string } {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0=Вс, 6=Сб
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const isWeekday = utcDay >= 1 && utcDay <= 5;
  const open = isWeekday && utcMin >= 7 * 60 && utcMin < 21 * 60; // 07:00–21:00 GMT
  return {
    open,
    label: open ? "Биржа открыта" : "Биржа закрыта",
    nextLabel: open ? "торги идут" : "торги: Пн–Пт",
  };
}

/** Сколько минут / часов назад была дата */
function timeAgo(iso?: string): string {
  if (!iso) return "";
  try {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60000));
    if (diffMin < 1) return "только что";
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ч назад`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} дн назад`;
  } catch {
    return "";
  }
}

/**
 * Верхняя «золотая полоса» главной страницы.
 * Все 5 фич: курс $, время обновления, статус биржи, периоды графика, hover-раскладка по пробам.
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

  // Тикалка обновления — раз в минуту пересчитываем "X мин назад" и статус биржи
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const market = getMarketStatus();
  const updatedAgo = timeAgo(goldPrice?.date);

  // История с фильтром по периоду
  const filteredHistory = useMemo(() => {
    if (!goldHistory.length) return [];
    const slice = goldHistory.slice(-period);
    return slice;
  }, [goldHistory, period]);

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] border-b border-[#FFD700]/20">
      {/* Фоновое золотое свечение */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.05) 100%)" }} />
      <div className="pointer-events-none absolute -top-24 left-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.06)" }} />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.05)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)] bg-[length:50%_100%] animate-gold-shimmer" />

      {/* ─────────────  ПЕРВАЯ СТРОКА  ───────────── */}
      <div className={`relative max-w-7xl mx-auto px-3 sm:px-5 flex items-center justify-between gap-3 transition-[padding] duration-300 ${compact ? "py-1" : "py-2"}`}>
        {/* ЛЕВО — цена золота */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Медальон со статусом биржи — прячется при скролле */}
          {!compact && (
            <div className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                            bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                            shadow-[0_0_12px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]"
                 title={market.label}>
              <span className="text-sm drop-shadow-sm">🥇</span>
              {/* Точка статуса биржи */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
                market.open ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse" : "bg-gray-500"
              }`} />
            </div>
          )}

          {/* Цена + график — расширенная премиум-панель */}
          <div className="flex items-stretch gap-3 sm:gap-4 h-9 bg-gradient-to-br from-[#1A1A1A] via-[#0F0F0F] to-[#1A1A1A] border border-[#FFD700]/30 px-3 sm:px-4 rounded-lg shadow-[inset_0_1px_0_rgba(255,215,0,0.12),0_2px_8px_rgba(0,0,0,0.4)] relative overflow-visible">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,0,0.08),transparent_70%)] rounded-lg" />

            {/* Цена ₽/г — с hover-раскладкой по пробам */}
            <div className="relative flex flex-col leading-none justify-center group/probes cursor-help">
              <span className="font-oswald font-bold text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70 whitespace-nowrap">
                Золото 999
              </span>
              {goldPrice?.buy ? (
                <span className="font-oswald font-bold text-[#FFD700] text-base sm:text-lg mt-0.5 tracking-tight whitespace-nowrap leading-none drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]">
                  {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                  <span className="text-[#FFD700]/60 text-[10px] font-bold ml-0.5">₽/г</span>
                </span>
              ) : (
                <span className="text-white/40 font-roboto text-xs mt-0.5">загрузка...</span>
              )}

              {/* Поповер: раскладка по пробам */}
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

            {/* XAU/USD за унцию + USD/RUB — на sm+ */}
            {goldPrice?.xau_usd && (
              <div className="relative hidden sm:flex flex-col leading-none justify-center pl-3 sm:pl-4 border-l border-[#FFD700]/15">
                <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap">
                  XAU/USD
                </span>
                <span className="font-oswald font-semibold text-white/85 text-[12px] sm:text-[13px] mt-0.5 whitespace-nowrap leading-none">
                  ${goldPrice.xau_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  <span className="text-white/40 text-[9px] font-bold ml-0.5">/oz</span>
                </span>
              </div>
            )}

            {/* USD/RUB — на md+ */}
            {goldPrice?.usd_rub && (
              <div className="relative hidden md:flex flex-col leading-none justify-center pl-3 border-l border-[#FFD700]/15">
                <span className="font-oswald font-semibold text-[9px] uppercase tracking-[0.18em] text-white/40 whitespace-nowrap flex items-center gap-1">
                  <span className="text-[10px]">$</span>USD/RUB
                </span>
                <span className="font-oswald font-semibold text-white/85 text-[12px] sm:text-[13px] mt-0.5 whitespace-nowrap leading-none">
                  {goldPrice.usd_rub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                  <span className="text-white/40 text-[9px] font-bold ml-0.5">₽</span>
                </span>
              </div>
            )}

            {/* Мини-график с переключателем 7/30/90 + поповер — на md+ */}
            {goldPrice?.buy && filteredHistory.length >= 2 && (() => {
              const W = 72, H = 24, pad = 2;
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
              const lastDate = filteredHistory[filteredHistory.length - 1]?.date || goldPrice.date;
              const firstDate = filteredHistory[0]?.date;
              const fmtDate = (s?: string) => {
                if (!s) return '';
                try { return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }); }
                catch { return s; }
              };
              return (
                <div className="relative hidden md:flex items-center gap-2 pl-3 lg:pl-4 border-l border-[#FFD700]/15 group/chart cursor-help">
                  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                    <defs>
                      <linearGradient id="g7d" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={fadeColor} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </linearGradient>
                    </defs>
                    <polygon points={fill} fill="url(#g7d)" />
                    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={lastPt.x} cy={lastPt.y} r="2.2" fill={color} stroke="#0A0A0A" strokeWidth="1" />
                  </svg>
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-oswald font-bold flex items-center gap-0.5" style={{ color }}>
                      {up ? '▲' : '▼'} {deltaPct}%
                    </span>
                    <span className="text-[8px] text-white/35 mt-0.5 uppercase tracking-wider font-oswald font-bold">{period} {period === 7 ? "дней" : "дн"}</span>
                  </div>

                  {/* Поповер при наведении на график */}
                  <div className="pointer-events-auto absolute top-full right-0 mt-2 z-50 opacity-0 translate-y-1 group-hover/chart:opacity-100 group-hover/chart:translate-y-0 transition-all duration-200 w-64">
                    <div className="relative bg-[#0F0F0F] border border-[#FFD700]/30 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.6)] p-3">
                      <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-[#0F0F0F] border-l border-t border-[#FFD700]/30" />

                      {/* Переключатель периода */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-oswald font-bold text-[10px] uppercase tracking-[0.2em] text-[#FFD700]/70">
                          Динамика
                        </div>
                        <div className="flex items-center gap-0.5 bg-black/50 border border-white/10 rounded-md p-0.5">
                          {([7, 30, 90] as Period[]).map(p => {
                            const enough = goldHistory.length >= 2;
                            const active = period === p;
                            return (
                              <button
                                key={p}
                                onClick={(e) => { e.stopPropagation(); setPeriod(p); }}
                                disabled={!enough}
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-oswald font-bold uppercase tracking-wider transition-all ${
                                  active ? "bg-[#FFD700]/20 text-[#FFD700]" : "text-white/50 hover:text-[#FFD700] hover:bg-white/5"
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                {p}д
                              </button>
                            );
                          })}
                        </div>
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

          {/* Бейдж «Обновлено X мин назад» + статус биржи — на lg+ */}
          {!compact && updatedAgo && (
            <div className="hidden lg:flex items-center gap-2 ml-1">
              <div
                className={`flex items-center gap-1.5 h-9 px-2.5 rounded-md border ${
                  market.open
                    ? "bg-emerald-500/10 border-emerald-400/25"
                    : "bg-black/40 border-white/10"
                }`}
                title={market.label}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${market.open ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse" : "bg-gray-500"}`} />
                <div className="flex flex-col leading-none">
                  <span className={`text-[8px] uppercase tracking-wider font-oswald font-bold ${market.open ? "text-emerald-300/80" : "text-white/45"}`}>
                    {market.label}
                  </span>
                  <span className="text-[9px] text-white/45 font-roboto mt-0.5 whitespace-nowrap">
                    обновлено {updatedAgo}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ЦЕНТР — цены физлица/опт (только xl+) */}
        {goldPrice?.buy && (
          <div className="hidden xl:flex items-center gap-2 shrink-0">
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
          </div>
        )}

        {/* ПРАВО — действия (вход + телефон + Продать) */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/cabinet"
            title="Кабинет клиента"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-black/60 hover:bg-black/80 border border-[#FFD700]/25 hover:border-[#FFD700]/55 text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name="User" size={13} />
            <span className="font-oswald font-bold text-[11px] uppercase tracking-wide">Клиент</span>
          </a>
          <a
            href="/staff"
            title="Кабинет сотрудника"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-black/60 hover:bg-black/80 border border-[#FFD700]/25 hover:border-[#FFD700]/55 text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name="ShieldCheck" size={13} />
            <span className="font-oswald font-bold text-[11px] uppercase tracking-wide">Сотрудник</span>
          </a>

          <a
            href={EXE_URL}
            download="Skupka24-Setup.exe"
            title="Скачать для Windows"
            className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-black/60 hover:bg-black/80 border border-[#FFD700]/30 hover:border-[#FFD700]/60 text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name="Monitor" size={13} />
            <span className="font-oswald font-bold text-[11px] uppercase tracking-wide">Windows</span>
          </a>

          <a
            href={APK_URL}
            download="Skupka24.apk"
            title="Скачать APK"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-black/60 hover:bg-black/80 border border-emerald-400/30 hover:border-emerald-400/60 text-emerald-300 active:scale-95 transition-all"
          >
            <Icon name="Smartphone" size={13} />
            <span className="font-oswald font-bold text-[11px] uppercase tracking-wide">APK</span>
          </a>

          <a
            href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md bg-black/60 hover:bg-black/80 border border-[#FFD700]/25 hover:border-[#FFD700]/55 active:scale-95 transition-all"
          >
            <Icon name="Phone" size={13} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-[#FFD700] text-[12px] tracking-wide whitespace-nowrap">8 800 600-68-33</span>
          </a>
          <a
            href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            title="Позвонить"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md bg-black/60 border border-[#FFD700]/30 text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name="Phone" size={14} />
          </a>

          <button
            onClick={onSellClick}
            className="relative overflow-hidden h-9 px-3 sm:px-4 rounded-md font-oswald font-bold text-black text-[12px] sm:text-[13px] uppercase tracking-wide active:scale-95 transition-all flex items-center gap-1.5 shrink-0
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_4px_14px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_4px_20px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]
                       group"
          >
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Icon name="Zap" size={13} className="relative" />
            <span className="relative">Продать</span>
          </button>
        </div>
      </div>

      {/* ─────────────  ВТОРАЯ СТРОКА (только мобилка) ───────────── */}
      <div className={`md:hidden relative border-t border-[#FFD700]/10 bg-black/40 px-3 grid grid-cols-3 gap-1.5 overflow-hidden transition-[max-height,padding] duration-300 ${compact ? "max-h-0 py-0 border-t-0" : "max-h-20 py-1.5"}`}>
        <a
          href="/cabinet"
          className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/25 text-[#FFD700] active:scale-95 transition-all"
        >
          <Icon name="User" size={12} />
          <span className="font-oswald font-bold text-[10px] uppercase tracking-wide">Клиент</span>
        </a>
        <a
          href="/staff"
          className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-[#FFD700]/25 text-[#FFD700] active:scale-95 transition-all"
        >
          <Icon name="ShieldCheck" size={12} />
          <span className="font-oswald font-bold text-[10px] uppercase tracking-wide">Сотрудник</span>
        </a>
        <a
          href={APK_URL}
          download="Skupka24.apk"
          className="flex items-center justify-center gap-1.5 h-8 rounded-md bg-black/50 border border-emerald-400/30 text-emerald-300 active:scale-95 transition-all"
        >
          <Icon name="Smartphone" size={12} />
          <span className="font-oswald font-bold text-[10px] uppercase tracking-wide">APK</span>
        </a>
      </div>

      {/* Цены физлица/опт + статус биржи + время обновления — на sm-lg */}
      {goldPrice?.buy && (
        <div className={`xl:hidden relative border-t border-[#FFD700]/10 bg-black/40 px-3 sm:px-5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap overflow-hidden transition-[max-height,padding] duration-300 ${compact ? "max-h-0 py-0 border-t-0" : "max-h-16 py-1.5"}`}>
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
          {/* Статус биржи + время обновления на планшете/моб */}
          <div className="hidden sm:flex lg:hidden items-center gap-1.5 pl-2 border-l border-white/10">
            <span className={`w-1.5 h-1.5 rounded-full ${market.open ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            <span className={`text-[9px] uppercase tracking-wider font-oswald font-bold ${market.open ? "text-emerald-300/80" : "text-white/45"}`}>
              {market.open ? "торги идут" : "биржа закрыта"}
            </span>
            {updatedAgo && (
              <span className="text-[9px] text-white/40 font-roboto whitespace-nowrap">
                · {updatedAgo}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldTicker;
