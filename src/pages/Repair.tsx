/**
 * Repair.tsx — главная страница ремонта.
 * Оптимизация для слабого мобильного интернета:
 * - Только Hero + шапка грузятся сразу (~8 КБ)
 * - Все секции ниже — lazy + Suspense (отдельные чанки)
 * - fx-эффекты — только десктоп, lazy
 * - Сплэш пропускается на saveData / slow connection (2G/3G)
 * - contentVisibility: auto на всех секциях ниже первого экрана
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import RepairSEO from "@/components/repair/RepairSEO";
import RepairHero from "@/components/repair/RepairHero";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "@/components/repair/repairContacts";

/* ── Lazy-компоненты (каждый = отдельный чанк, грузится по мере скролла) ── */
const RepairSplash      = lazy(() => import("@/components/repair/RepairSplash"));
const RepairTopBlock    = lazy(() => import("@/components/repair/RepairTopBlock"));
const RepairStats       = lazy(() => import("@/components/repair/RepairStats"));
const RepairPriceTable  = lazy(() => import("@/components/repair/RepairPriceTable"));
const RepairServices    = lazy(() => import("@/components/repair/RepairServices"));
const RepairFeatures    = lazy(() => import("@/components/repair/RepairFeatures"));
const RepairBeforeAfter = lazy(() => import("@/components/repair/RepairBeforeAfter"));
const RepairAllDevices  = lazy(() => import("@/components/repair/RepairAllDevices"));
const RepairParts       = lazy(() => import("@/components/repair/RepairParts"));
const RepairModels      = lazy(() => import("@/components/repair/RepairModels"));
const RepairUnlockBanner= lazy(() => import("@/components/repair/RepairUnlockBanner"));
const RepairHowItWorks  = lazy(() => import("@/components/repair/RepairHowItWorks"));
const RepairLocation    = lazy(() => import("@/components/repair/RepairLocation"));
const RepairReviews     = lazy(() => import("@/components/repair/RepairReviews"));
const RepairFAQ         = lazy(() => import("@/components/repair/RepairFAQ"));
const RepairSEOText     = lazy(() => import("@/components/repair/RepairSEOText"));
const RepairSEOLinks    = lazy(() => import("@/components/repair/RepairSEOLinks"));

/* fx — только desktop, минимальный приоритет */
const DigitalParticles  = lazy(() => import("@/components/fx/DigitalParticles"));
const AuroraBackground  = lazy(() => import("@/components/fx/AuroraBackground"));
const GlowCursor        = lazy(() => import("@/components/fx/GlowCursor"));
const NoiseBg           = lazy(() => import("@/components/fx/NoiseBg"));

/* ── Определяем, нужен ли сплэш ──────────────────────────────────────────── */
function shouldSkipSplash(): boolean {
  try {
    const nav = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (nav?.saveData) return true;
    if (nav?.effectiveType && ["slow-2g", "2g", "3g"].includes(nav.effectiveType)) return true;
  } catch { /* ignore */ }
  // Пропускаем если уже был на странице в этой сессии
  if (sessionStorage.getItem("repair_splash_done")) return true;
  return false;
}

/* ── Минимальный skeleton-заполнитель для секций ─────────────────────────── */
const SectionSkeleton = () => (
  <div className="h-32 mx-4 my-2 rounded-2xl bg-white/[0.025] animate-pulse" />
);

const SERVICE_LINKS = [
  { to: "/remont-iphone-kaluga",        label: "iPhone",       color: "#fff3a0" },
  { to: "/remont-samsung-kaluga",       label: "Samsung",      color: "#93c5fd" },
  { to: "/remont-xiaomi-kaluga",        label: "Xiaomi",       color: "#86efac" },
  { to: "/zamena-stekla-kaluga",        label: "Стекло",       color: "#c4b5fd" },
  { to: "/zamena-akkumulyatora-kaluga", label: "Аккумулятор",  color: "#6ee7b7" },
  { to: "/remont-posle-vody-kaluga",    label: "После воды",   color: "#7dd3fc" },
  { to: "/bga-pajka-kaluga",            label: "BGA-пайка",    color: "#fca5a5" },
  { to: "/snyatie-frp-kaluga",          label: "FRP / iCloud", color: "#fdba74" },
];

/* ── Компонент секции с lazy-содержимым и contentVisibility ─────────────── */
function LazySection({
  children,
  height = "400px",
}: {
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: `0 ${height}` }}>
      <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
    </div>
  );
}

export default function Repair() {
  const [scrolled,   setScrolled]   = useState(false);
  const [splashDone, setSplashDone] = useState(() => shouldSkipSplash());
  const prefetchedRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Prefetch нижних секций через idle — не блокирует первый рендер */
  useEffect(() => {
    if (!splashDone || prefetchedRef.current) return;
    prefetchedRef.current = true;
    const cb = () => {
      import("@/components/repair/RepairPriceTable");
      import("@/components/repair/RepairServices");
      import("@/components/repair/RepairAllDevices");
      import("@/components/repair/RepairReviews");
    };
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void })
        .requestIdleCallback(cb);
    } else {
      setTimeout(cb, 2000);
    }
  }, [splashDone]);

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem("repair_splash_done", "1");
    setSplashDone(true);
  }, []);

  const scrollToForm = useCallback(() => {
    document.getElementById("repair-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      <RepairSEO />

      {/* Сплэш — пропускается на slow connection */}
      {!splashDone && (
        <Suspense fallback={null}>
          <RepairSplash onDone={handleSplashDone} />
        </Suspense>
      )}

      {/* fx-эффекты — только десктоп, lazy */}
      <Suspense fallback={null}>
        <GlowCursor />
        <NoiseBg opacity={0.022} />
      </Suspense>

      {/* Фон */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        {/* Canvas + Aurora — только md/lg, lazy */}
        <Suspense fallback={null}>
          <DigitalParticles />
          <AuroraBackground />
        </Suspense>
        {/* Статичные градиенты — для всех, без JS */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse,rgba(255,215,0,0.09) 0%,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse,rgba(255,140,0,0.05) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 70%)",
          }} />
      </div>

      <div className="relative z-10">

        {/* ── STICKY HEADER ── */}
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0d0d0d]/95 border-b border-[#FFD700]/15 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            : "bg-[#0d0d0d]/70 border-b border-white/[0.06] backdrop-blur-sm"
        }`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link to="/" aria-label="На главную Скупка24"
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#FFD700]/30 transition-all shrink-0 active:scale-95">
                <Icon name="ChevronLeft" size={18} className="text-white/60" />
              </Link>
              <div className="min-w-0 hidden xs:block">
                <div className="font-oswald font-black text-base sm:text-xl leading-none tracking-wide truncate"
                  style={{ background: "linear-gradient(90deg,#fff3a0,#FFD700,#b8860b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Ремонт24
                </div>
                <div className="font-roboto text-[9px] uppercase tracking-[0.2em] text-white/30 mt-0.5 hidden sm:block">
                  Сервисный центр · Калуга
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_header" })}
                className="hidden md:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
                <Icon name="Phone" size={14} />
                {REPAIR_PHONE_DISPLAY}
              </a>
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_header_mobile" })}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700] active:bg-[#FFD700]/20 transition-all">
                <Icon name="Phone" size={16} />
              </a>
              <button onClick={scrollToForm}
                className="inline-flex items-center gap-1.5 text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm active:scale-95 transition-all"
                style={{
                  background: "linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%)",
                  boxShadow: "0 0 0 1px rgba(255,215,0,0.4),0 4px 16px rgba(255,215,0,0.25)",
                }}>
                <Icon name="Zap" size={13} />
                Заявка
              </button>
            </div>
          </div>

          {/* Навигация по услугам */}
          <div className="border-t border-white/[0.05] overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            <div className="flex items-center gap-1 px-4 sm:px-8 py-1.5 min-w-max">
              {[
                { href: "#repair-form", label: "Заявка"   },
                { href: "#prices",      label: "Цены"     },
                { href: "#services",    label: "Услуги"   },
                { href: "#all-devices", label: "Бренды"   },
                { href: "#reviews",     label: "Отзывы"   },
                { href: "#contacts",    label: "Контакты" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  className="whitespace-nowrap px-3 py-1.5 font-roboto text-[11px] text-white/40 hover:text-white/80 transition-colors shrink-0">
                  {item.label}
                </a>
              ))}
              <span className="w-px h-4 bg-white/10 mx-1 shrink-0" />
              {SERVICE_LINKS.map(s => (
                <Link key={s.to} to={s.to}
                  className="whitespace-nowrap px-2.5 py-1 rounded-md font-roboto text-[11px] font-medium shrink-0 transition-all active:scale-95"
                  style={{ background: s.color + "14", color: s.color, border: `1px solid ${s.color}28` }}>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* ── HERO — грузится сразу, не lazy ── */}
        <RepairHero onOrder={scrollToForm} />

        {/* ── ОСНОВНОЙ КОНТЕНТ — всё lazy ── */}

        {/* Форма заявки — высокий приоритет, но всё же lazy */}
        <Suspense fallback={<SectionSkeleton />}>
          <RepairTopBlock />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <RepairStats />
        </Suspense>

        <LazySection height="480px">
          <RepairPriceTable onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="500px">
          <RepairServices onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="400px">
          <RepairFeatures />
        </LazySection>

        <LazySection height="500px">
          <RepairBeforeAfter onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="600px">
          <RepairAllDevices onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="400px">
          <RepairParts onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="400px">
          <RepairModels onOrder={scrollToForm} />
        </LazySection>

        <LazySection height="300px">
          <RepairUnlockBanner />
        </LazySection>

        <LazySection height="400px">
          <RepairHowItWorks />
        </LazySection>

        <LazySection height="350px">
          <RepairLocation />
        </LazySection>

        <LazySection height="500px">
          <RepairReviews />
        </LazySection>

        <LazySection height="600px">
          <RepairSEOLinks />
          <RepairFAQ />
          <RepairSEOText />
        </LazySection>

        {/* Подвал */}
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a] px-4 py-10 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="Wrench" size={15} className="text-[#FFD700]" />
            <span className="font-oswald text-white/60 uppercase tracking-wide text-sm">
              Ремонт24 · Сервисный центр · Калуга
            </span>
          </div>
          <a href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_footer" })}
            className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline block mb-2">
            {REPAIR_PHONE_DISPLAY}
          </a>
          <p className="text-white/35">Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00</p>
          <Link to="/"
            className="inline-flex items-center gap-1.5 mt-5 text-white/30 hover:text-[#FFD700] font-roboto text-sm transition-colors">
            <Icon name="ChevronLeft" size={14} />
            Скупка24 — главная
          </Link>
        </footer>
      </div>
    </div>
  );
}
