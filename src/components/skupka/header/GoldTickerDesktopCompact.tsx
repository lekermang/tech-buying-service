/**
 * Десктоп-версия GoldTicker (xl+) — ОДНА компактная строка.
 * По клику на «Подробнее» — раскрывается панель снизу с курсами / физ-опт / графиком /
 * кнопками (Клиент, Сотрудник, Windows, Android).
 *
 * Цель: не отвлекать пользователя на главной — все детали скрыты до клика.
 */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { APK_URL, EXE_URL, type MarketStatus, type Period, PROBES_DISPLAY } from "./goldTickerUtils";

interface Props {
  goldPrice: { buy: number; buy_usd?: number; xau_usd?: number; usd_rub?: number; date: string } | null;
  priceRetail999: number | null;
  priceWholesale999: number | null;
  filteredHistory: { date: string; price: number }[];
  period: Period;
  setPeriod: (p: Period) => void;
  market: MarketStatus;
  updatedAgo: string;
  flash: "up" | "down" | null;
  onSellClick: () => void;
  compact: boolean;
}

const GoldTickerDesktopCompact = ({
  goldPrice, priceRetail999, priceWholesale999,
  filteredHistory, period, setPeriod,
  market, updatedAgo, flash, onSellClick, compact,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Закрытие по Esc и по клику снаружи
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // График мини-полоской (SVG)
  const chart = (() => {
    if (filteredHistory.length < 2) return null;
    const W = 100, H = 24, pad = 2;
    const prices = filteredHistory.map(h => h.price);
    const min = Math.min(...prices); const max = Math.max(...prices); const range = max - min || 1;
    const xy = prices.map((p, i) => ({
      x: pad + (i / (prices.length - 1)) * (W - pad * 2),
      y: H - pad - ((p - min) / range) * (H - pad * 2),
    }));
    const pts = xy.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const fill = `${xy[0].x},${H - pad} ${pts} ${xy[xy.length - 1].x},${H - pad}`;
    const last = prices[prices.length - 1]; const first = prices[0]; const up = last >= first;
    const color = up ? '#22c55e' : '#ef4444';
    const fadeColor = up ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)';
    const deltaPct = Math.abs(((last - first) / first) * 100).toFixed(1);
    return { W, H, pts, fill, color, fadeColor, up, deltaPct };
  })();

  return (
    <div ref={rootRef} className="hidden xl:block relative">
      {/* ─── ОДНА КОМПАКТНАЯ СТРОКА ─── */}
      <div className={`relative max-w-7xl mx-auto px-5 flex items-center gap-2.5 transition-[padding] duration-300 ${compact ? "py-1" : "py-1.5"}`}>
        {/* Медальон + статус биржи */}
        <div
          className="relative shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                     bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                     shadow-[0_0_8px_rgba(255,215,0,0.3)]"
          title={market.label}
        >
          <span className="text-[11px] drop-shadow-sm">🥇</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${
            market.fixing ? "bg-[#FFD700] shadow-[0_0_6px_rgba(255,215,0,0.9)] animate-pulse"
            : market.open ? "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.7)] animate-pulse"
            : "bg-gray-500"
          }`} />
        </div>

        {/* Главная цена 999 */}
        <div className={`flex items-center h-7 px-2.5 rounded-md bg-black/70 border transition-all duration-500 ${
          flash === "up" ? "border-emerald-400/70 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
          : flash === "down" ? "border-red-400/70 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
          : "border-[#FFD700]/40"
        }`}>
          <span className="font-oswald font-bold text-[9px] uppercase tracking-[0.18em] text-[#FFD700]/60 mr-2">999</span>
          {goldPrice?.buy ? (
            <span className={`font-oswald font-bold text-[15px] tracking-tight whitespace-nowrap leading-none transition-colors duration-500 ${
              flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : "text-[#FFD700]"
            }`}>
              {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
              <span className="text-[9px] font-bold ml-0.5 text-[#FFD700]/55">₽/г</span>
            </span>
          ) : <span className="text-white/40 text-xs">—</span>}
        </div>

        {/* Мини-стрелка с %-изменением (если есть) */}
        {chart && (
          <span className="hidden md:flex items-center gap-1 h-7 px-2 rounded-md bg-black/40 border border-white/10 text-[10px] font-oswald font-bold" style={{ color: chart.color }}>
            {chart.up ? '▲' : '▼'} {chart.deltaPct}%
          </span>
        )}

        {/* Кнопка «Подробнее» — раскрывает панель */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border bg-black/50 text-[10px] uppercase font-oswald font-bold tracking-wider transition-all ${
            open ? "border-[#FFD700]/55 text-[#FFD700] bg-[#FFD700]/10" : "border-white/15 text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40"
          }`}
        >
          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={12} />
          <span>{open ? "Свернуть" : "Подробнее"}</span>
        </button>

        {/* Справа: телефон + Продать */}
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-[#FFD700]/30 bg-black/60 hover:bg-black/80 hover:border-[#FFD700]/60 active:scale-95 transition"
          >
            <Icon name="Phone" size={12} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-[#FFD700] text-[11px] tracking-wide whitespace-nowrap">
              8 800 600-68-33
            </span>
          </a>

          <button
            onClick={onSellClick}
            className="relative overflow-hidden h-7 px-3 rounded-md font-oswald font-bold text-black text-[11px] uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1 shrink-0
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_2px_8px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_4px_14px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]
                       group"
          >
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Icon name="Zap" size={11} className="relative" />
            <span className="relative">Продать</span>
          </button>
        </div>
      </div>

      {/* ─── РАСКРЫВАЮЩАЯСЯ ПАНЕЛЬ С ДЕТАЛЯМИ ─── */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 bg-[#0F0F0F] border-y border-[#FFD700]/25 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-w-7xl mx-auto px-5 py-4 grid grid-cols-12 gap-4">
            {/* Колонка 1: Курсы биржи */}
            <div className="col-span-3 space-y-2">
              <div className="font-oswald font-bold text-[10px] uppercase tracking-wider text-[#FFD700]/70">Курсы биржи</div>
              {goldPrice?.xau_usd && (
                <Row k="XAU / oz" v={`$${goldPrice.xau_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
              )}
              {goldPrice?.usd_rub && (
                <Row k="USD / ₽" v={`${goldPrice.usd_rub.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`} />
              )}
              <Row
                k="Биржа"
                v={market.fixing ? "Фиксинг" : market.open ? "Торги" : "Закрыто"}
                vClass={market.fixing ? "text-[#FFD700]" : market.open ? "text-emerald-300" : "text-white/55"}
              />
              {updatedAgo && <Row k="Обновлено" v={updatedAgo} vClass="text-white/55" />}
            </div>

            {/* Колонка 2: Цены физ/опт */}
            <div className="col-span-3 space-y-2">
              <div className="font-oswald font-bold text-[10px] uppercase tracking-wider text-[#FFD700]/70">Цены покупки 999</div>
              <Row k="Физлица" v={`${priceRetail999?.toLocaleString('ru-RU') || '—'} ₽/г`} vClass="text-[#FFD700]" />
              <Row k="Опт" v={`${priceWholesale999?.toLocaleString('ru-RU') || '—'} ₽/г`} vClass="text-[#FFD700]" />
              {priceRetail999 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="text-[9px] uppercase text-white/40 mb-1">По пробам</div>
                  <div className="grid grid-cols-2 gap-1">
                    {PROBES_DISPLAY.slice(0, 4).map(p => {
                      const price = Math.round((priceRetail999 / 0.999) * p.coeff);
                      return (
                        <div key={p.value} className="flex items-center justify-between bg-black/40 border border-[#FFD700]/10 rounded px-1.5 py-0.5">
                          <span className="font-oswald font-bold text-[#FFD700]/60 text-[9px]">{p.label}</span>
                          <span className="font-oswald font-bold text-[#FFD700] text-[10px]">{price.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Колонка 3: График */}
            {chart && (
              <div className="col-span-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-oswald font-bold text-[10px] uppercase tracking-wider text-[#FFD700]/70">Динамика</div>
                  <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded p-0.5">
                    {([7, 30, 90] as Period[]).map(p => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={`px-1.5 py-0.5 rounded-sm text-[9px] font-oswald font-bold uppercase tracking-wide transition ${
                          period === p ? "bg-[#FFD700]/20 text-[#FFD700]" : "text-white/45 hover:text-white"
                        }`}
                      >{p}д</button>
                    ))}
                  </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-md p-2">
                  <svg width="100%" height="50" viewBox={`0 0 ${chart.W} ${chart.H + 26}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gchart-full" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chart.fadeColor} />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <polygon points={chart.fill} fill="url(#gchart-full)" />
                    <polyline points={chart.pts} fill="none" stroke={chart.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-white/40">за {period} дн.</span>
                    <span className="font-oswald font-bold" style={{ color: chart.color }}>
                      {chart.up ? '▲' : '▼'} {chart.deltaPct}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Колонка 4: Кабинеты + приложения */}
            <div className="col-span-3 space-y-2">
              <div className="font-oswald font-bold text-[10px] uppercase tracking-wider text-[#FFD700]/70">Быстрый доступ</div>
              <div className="grid grid-cols-2 gap-1.5">
                <DetailBtn href="/cabinet" icon="User" label="Клиент" color="gold" />
                <DetailBtn href="/staff" icon="ShieldCheck" label="Сотрудник" color="gold" />
                <DetailBtn href={EXE_URL} icon="Monitor" label="Windows" color="gold" download="Skupka24-Setup.exe" />
                <DetailBtn href={APK_URL} icon="Smartphone" label="Android" color="emerald" download="Skupka24.apk" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({ k, v, vClass = "text-white/85" }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/45 font-roboto">{k}</span>
      <span className={`font-oswald font-bold ${vClass}`}>{v}</span>
    </div>
  );
}

function DetailBtn({ href, icon, label, color, download }: { href: string; icon: string; label: string; color: "gold" | "emerald"; download?: string }) {
  const cls = color === "gold"
    ? "border-[#FFD700]/25 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]/50"
    : "border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/10 hover:border-emerald-400/50";
  return (
    <a
      href={href}
      download={download}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md bg-black/60 border ${cls} text-[10px] font-oswald font-bold uppercase tracking-wider active:scale-95 transition`}
    >
      <Icon name={icon} size={12} />
      <span>{label}</span>
    </a>
  );
}

export default GoldTickerDesktopCompact;
