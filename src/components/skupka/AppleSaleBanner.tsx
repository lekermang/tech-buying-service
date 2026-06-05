/**
 * Баннер акции: Техника Apple по оптовым ценам
 * 6–13 июня 2026 — скупка iPhone, MacBook, iPad по спец. ценам
 */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import ApplePriceEmailModal from "./ApplePriceEmailModal";

const SALE_END = new Date("2026-06-13T23:59:59");
const CATALOG_URL = "https://preview--tech-buying-service.poehali.dev/catalog";

function useCountdown() {
  const calc = () => {
    const diff = SALE_END.getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function Digit({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-oswald font-bold text-2xl sm:text-3xl leading-none text-black tabular-nums min-w-[2.2ch] text-center"
        style={{ textShadow: "0 1px 0 rgba(255,255,255,0.35)" }}>
        {String(v).padStart(2, "0")}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-black/60 font-roboto mt-0.5">{label}</div>
    </div>
  );
}

function Sep() {
  return <span className="font-oswald font-bold text-2xl sm:text-3xl text-black/50 leading-none mb-3.5">:</span>;
}

export default function AppleSaleBanner() {
  const time = useCountdown();
  const [priceOpen, setPriceOpen] = useState(false);
  if (!time) return null; // акция завершена — баннер скрывается автоматически

  return (
    <>
    {priceOpen && <ApplePriceEmailModal onClose={() => setPriceOpen(false)} />}
    <section className="relative overflow-hidden py-0">
      {/* Общий контейнер с золотым градиентом */}
      <div className="relative mx-4 sm:mx-8 my-4 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #fff3a0 0%, #FFD700 40%, #f5c400 70%, #d4a017 100%)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.9), 0 20px 60px rgba(255,215,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}>

        {/* Декоративный блик сверху */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)" }} />

        {/* Сетка-паттерн (как у главной) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.4) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Угловые засечки (как у splash) */}
        <span className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-black/20" />
        <span className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-black/20" />
        <span className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-black/20" />
        <span className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-black/20" />

        {/* Большое свечение справа */}
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: "rgba(255,255,255,0.6)" }} />

        <div className="relative px-5 sm:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">

            {/* Левая часть — бейдж + текст */}
            <div className="flex-1 min-w-0">
              {/* Бейдж */}
              <div className="inline-flex items-center gap-1.5 bg-black/15 border border-black/20 text-black px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-roboto font-semibold mb-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-black" />
                </span>
                Акция · 6–13 июня 2026
              </div>

              {/* Заголовок */}
              <h2 className="font-oswald font-bold text-black leading-[1.0] text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight mb-1.5"
                style={{ textShadow: "0 1px 0 rgba(255,255,255,0.3)" }}>
                Техника Apple
                <br />
                <span className="text-black/70">по оптовым ценам</span>
              </h2>
              <p className="font-roboto text-black/65 text-sm leading-snug max-w-xs">
                iPhone, MacBook, iPad — скупаем по специальным ценам в&nbsp;течение&nbsp;недели
              </p>
            </div>

            {/* Центр — иконки устройств */}
            <div className="hidden lg:flex items-center gap-4">
              {[
                { icon: "Smartphone", label: "iPhone" },
                { icon: "Laptop", label: "MacBook" },
                { icon: "Tablet", label: "iPad" },
              ].map(d => (
                <div key={d.label} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-black/10 border border-black/15 flex items-center justify-center backdrop-blur-sm">
                    <Icon name={d.icon} size={22} className="text-black/80" />
                  </div>
                  <span className="font-oswald text-[11px] font-bold uppercase text-black/60">{d.label}</span>
                </div>
              ))}
            </div>

            {/* Правая часть — таймер + кнопка */}
            <div className="flex flex-col items-start sm:items-end gap-4 shrink-0">
              {/* Таймер */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="text-[10px] font-roboto uppercase tracking-[0.2em] text-black/50">До конца акции</div>
                <div className="flex items-end gap-1.5">
                  <Digit v={time.d} label="дн" />
                  <Sep />
                  <Digit v={time.h} label="час" />
                  <Sep />
                  <Digit v={time.m} label="мин" />
                  <Sep />
                  <Digit v={time.s} label="сек" />
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPriceOpen(true)}
                  className="group relative overflow-hidden inline-flex items-center gap-2 bg-black text-[#FFD700] font-oswald font-bold uppercase tracking-wide px-6 py-3 rounded-xl text-sm active:scale-95 transition-all
                             shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]
                             hover:shadow-[0_6px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,215,0,0.1)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <Icon name="Mail" size={16} className="relative" />
                  <span className="relative">Получить прайс</span>
                </button>
                <a href={CATALOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-black/60 font-roboto text-xs font-semibold hover:text-black/80 transition-colors">
                  <Icon name="ShoppingBag" size={13} />
                  Смотреть каталог
                  <Icon name="ArrowRight" size={12} className="opacity-60" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
    </>
  );
}