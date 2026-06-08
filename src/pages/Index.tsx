import { useState, useEffect } from "react";
import DigitalParticles from "@/components/fx/DigitalParticles";
import Header from "@/components/skupka/Header";
import HeroSection from "@/components/skupka/HeroSection";
import InfoSections from "@/components/skupka/InfoSections";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import ExitPopup from "@/components/skupka/ExitPopup";
import CookieBanner from "@/components/skupka/CookieBanner";
import JobsSection from "@/components/skupka/JobsSection";
import HolidayBanner from "@/components/holidays/HolidayBanner";
import HolidayCornerDecor from "@/components/holidays/HolidayCornerDecor";
import PremiumServicesGrid from "@/components/skupka/PremiumServicesGrid";

import SafeDealsBanner from "@/components/skupka/SafeDealsBanner";
import MaxChannelBanner from "@/components/skupka/MaxChannelBanner";
import PublicChatFab from "@/components/skupka/PublicChatFab";
import AppDownloadCard from "@/components/AppDownloadCard";
import EasierWithUsBlock from "@/components/EasierWithUsBlock";
import QuickContactSection from "@/components/QuickContactSection";
import WholesaleBanner from "@/components/skupka/WholesaleBanner";
import AntiquesPreviewBlock from "@/components/skupka/AntiquesPreviewBlock";
import WantToBuySection from "@/components/skupka/WantToBuySection";
import DesktopStickyBar from "@/components/skupka/DesktopStickyBar";
import AppleSaleBanner from "@/components/skupka/AppleSaleBanner";
import RepairLinksOnIndex from "@/components/skupka/RepairLinksOnIndex";
import CarBuyoutBanner from "@/components/skupka/CarBuyoutBanner";
import SpecTechBuyoutBanner from "@/components/skupka/SpecTechBuyoutBanner";
import LandBuyoutBanner from "@/components/skupka/LandBuyoutBanner";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/** Автоскролл к якорю из URL: поддерживает #section и ?section=xxx (для Яндекс.Директа) */
const useAutoScroll = (ready: boolean) => {
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section") || params.get("block");
    const hash = window.location.hash.replace("#", "");
    const target = section || hash;
    if (!target) return;
    const t = setTimeout(() => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(t);
  }, [ready]);
};

/** Динамические SEO-метатеги в зависимости от ?section= (для рекламы в Яндекс.Директе) */
const SECTION_SEO: Record<string, { title: string; description: string }> = {
  catalog: {
    title: "Что принимаем в скупку — Скупка24 Калуга | iPhone, MacBook, золото",
    description: "Принимаем: iPhone до 95 000 ₽, MacBook и ноутбуки до 150 000 ₽, iPad, Apple Watch, PlayStation, Xbox, золото и украшения до 500 000 ₽. Честная оценка за 15 минут в Калуге.",
  },
  tradein: {
    title: "Trade In Скупка24 — Обмен старой техники на новую | Эко-утилизация",
    description: "Программа Скупка24 Trade In: сдайте старое устройство и получите скидку на новое онлайн или в магазине. Не подходит для обмена — бесплатно и безопасно утилизируем. Выгодно для вас и планеты.",
  },
  how: {
    title: "Как работает Скупка24 — 4 шага до денег | Калуга",
    description: "Оставьте заявку → получите оценку за 15 минут → приезжайте в офис на Кирова 11 или 7/47 → получите деньги в день обращения. Наличные или перевод на карту.",
  },
  guarantees: {
    title: "Наши гарантии — Скупка24 | Честная оценка и официальный договор",
    description: "Работаем с 2015 года, 50 000+ сделок, 4.9 на Яндекс Картах. Честная оценка, официальный договор, выплата день в день. Никаких скрытых комиссий.",
  },
  branches: {
    title: "Наши офисы в Калуге — Кирова 11 и Кирова 7/47 | Скупка24",
    description: "Два офиса Скупка24 в центре Калуги: ул. Кирова, 11 и ул. Кирова, 7/47. Работаем 24/7 без выходных. Телефон: +7 (992) 999-03-33.",
  },
  reviews: {
    title: "Отзывы клиентов Скупка24 на Яндекс Картах | Рейтинг 5.0",
    description: "Более 200 отзывов на Яндекс Картах. Рейтинг 5.0. Клиенты отмечают честную оценку, быстрое оформление и выплату день в день.",
  },
  avito: {
    title: "Скупка24 на Авито — Проверенный продавец | Безопасная сделка",
    description: "Актуальные объявления Скупка24 на Авито. Проверенный продавец, быстрый ответ, безопасные сделки с гарантией Авито Доставки.",
  },
  contacts: {
    title: "Контакты Скупка24 Калуга | Телефон, Telegram, адреса офисов",
    description: "Телефон: +7 (992) 999-03-33. Telegram @skypka24. Два офиса в Калуге: Кирова 11 и 7/47. Работаем круглосуточно.",
  },
  jobs: {
    title: "Работа в Скупка24 Калуга — Вакансии | Менеджер, оценщик, кассир",
    description: "Открыты вакансии в Скупка24: менеджер онлайн, оценщик техники, кассир-приёмщик. Стабильная зарплата, обучение, удобный график. Откликнитесь онлайн.",
  },
};

const useDynamicSeo = (ready: boolean) => {
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section") || params.get("block") || window.location.hash.replace("#", "");
    if (!section) return;
    const seo = SECTION_SEO[section];
    if (!seo) return;

    const prevTitle = document.title;
    document.title = seo.title;
    const setMeta = (selector: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute("content", value);
    };
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);

    return () => {
      document.title = prevTitle;
    };
  }, [ready]);
};

// Хук для активного праздника на сплеше
const useActiveHoliday = () => {
  const [h, setH] = useState<{ holiday: { id: string; name: string; emoji: string; greeting: string; primaryColor: string; secondaryColor: string; pattern: string }; daysToHoliday: number } | null>(null);
  useEffect(() => {
    import("@/components/holidays/holidays").then(m => {
      setH(m.getActiveHoliday() as typeof h);
    }).catch(() => { /* noop */ });
  }, []);
  return h;
};

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [hiding, setHiding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holiday = useActiveHoliday();

  useEffect(() => {
    const start = performance.now();
    const duration = 2300;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t1 = setTimeout(() => setHiding(true), 2500);
    const t2 = setTimeout(() => onDone(), 2900);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const particles = Array.from({ length: 14 }, (_, i) => i);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${hiding ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at center, #1a1400 0%, #0D0D0D 60%, #000 100%)" }}>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 20%, transparent 75%)" }} />
      {/* Ambient breathing glows */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)", animation: "ambientBreathe 5s ease-in-out infinite" }} />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,140,0,0.06)", animation: "ambientBreathe 7s ease-in-out 1.5s infinite" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,215,0,0.08) 0%, transparent 70%)", animation: "ambientBreathe 4s ease-in-out 0.5s infinite" }} />
      {/* Cinematic light beam */}
      <div className="hero-light-beam" />

      {/* Частицы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <style>{`
          @keyframes splashParticle {
            0%   { transform: translateY(0) scale(1); opacity: 0.5; }
            50%  { opacity: 0.8; }
            100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
          }
        `}</style>
        {particles.map(i => {
          const left = (i * 37) % 100;
          const delay = (i * 0.4) % 5;
          const dur = 6 + (i % 5);
          const size = 2 + (i % 3);
          return (
            <span key={i}
              className="absolute rounded-full bg-[#FFD700]"
              style={{
                left: `${left}%`,
                bottom: `-10px`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: 0.5,
                boxShadow: "0 0 8px rgba(255,215,0,0.8)",
                animation: `splashParticle ${dur}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      <div className="relative flex flex-col items-center gap-7 px-4">

        <div className="relative">
          <style>{`
            @keyframes logoSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes logoSpinR { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            @keyframes logoGlow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
            .logo-spin { animation: logoSpin 8s linear infinite; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
            .logo-spin-slow { animation: logoSpin 18s linear infinite; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
            .logo-spin-reverse { animation: logoSpinR 8s linear infinite; will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
            .logo-glow { animation: logoGlow 2.4s ease-in-out infinite; will-change: opacity; }
          `}</style>

          <div className="absolute inset-0 -m-4 rounded-full blur-2xl logo-glow pointer-events-none" style={{ background: "rgba(255,215,0,0.45)" }} />

          <div className="absolute -inset-3 rounded-full border border-[#FFD700]/25 logo-spin-slow pointer-events-none">
            <span className="absolute -top-[3px] left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-[#FFD700]" style={{ boxShadow: "0 0 10px #FFD700" }} />
            <span className="absolute top-1/2 -right-[3px] w-1 h-1 -translate-y-1/2 rounded-full bg-[#fff3a0]" style={{ boxShadow: "0 0 8px #FFD700" }} />
          </div>

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2px] logo-spin bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_50px_rgba(255,215,0,0.55)]">
            <div className="w-full h-full rounded-full bg-black p-1 logo-spin-reverse">
              <img
                src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
                alt="Скупка24"
                className="w-full h-full rounded-full object-cover"
                draggable={false}
              />
            </div>
          </div>

          <Icon name="Sparkles" size={14} className="absolute -top-2 -right-2 text-[#FFD700] animate-pulse pointer-events-none" />
          <Icon name="Sparkles" size={10} className="absolute -bottom-1 -left-2 text-[#fff3a0] animate-pulse pointer-events-none" />
        </div>

        <div className="flex flex-col items-center gap-2 animate-[fadeIn_0.4s_ease_0.15s_both]">
          <span className="font-oswald font-bold text-3xl sm:text-4xl text-[#FFD700] tracking-[0.3em] uppercase"
                style={{ textShadow: '0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)' }}>
            Скупка24
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/40 px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD700]" />
            </span>
            <Icon name="Crown" size={10} className="text-[#FFD700]" />
            <span className="font-roboto text-[10px] text-[#FFD700] uppercase tracking-[0.25em] font-semibold">Премиум · 24/7</span>
          </span>
        </div>

        <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold uppercase text-center leading-[1.1] tracking-tight animate-[fadeIn_0.5s_ease_0.2s_both] flex flex-col items-center gap-1">
          <span className="block text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.15)] py-1">Купим дорого</span>
          <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer py-1">всё!</span>
        </h2>

        {holiday && (
          <div
            className="relative inline-flex items-center gap-2.5 px-5 py-2 rounded-full border animate-[fadeIn_0.5s_ease_0.4s_both] overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${holiday.holiday.primaryColor}DD, ${holiday.holiday.primaryColor}99)`,
              borderColor: holiday.holiday.secondaryColor + "AA",
              boxShadow: `0 0 24px ${holiday.holiday.primaryColor}66, inset 0 1px 0 ${holiday.holiday.secondaryColor}40`,
            }}
          >
            <span className="relative text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" aria-hidden>
              {holiday.holiday.emoji}
            </span>
            <span
              className="relative font-oswald font-bold text-sm uppercase tracking-wider whitespace-nowrap"
              style={{ color: "#fff", textShadow: `0 1px 4px rgba(0,0,0,0.6), 0 0 10px ${holiday.holiday.secondaryColor}88` }}
            >
              {holiday.holiday.greeting}
            </span>
          </div>
        )}

        <div className="w-64 sm:w-80 flex flex-col gap-2.5 animate-[fadeIn_0.4s_ease_0.5s_both]">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <span className="font-roboto text-[10px] text-[#FFD700]/40 uppercase tracking-[0.35em] font-semibold">
              Скупка24
            </span>
            <span className="font-roboto text-[10px] text-[#FFD700] tabular-nums font-bold"
              style={{ textShadow: "0 0 10px rgba(255,215,0,0.7)" }}>
              {progress}%
            </span>
          </div>

          {/* Progress track — thicker, more premium */}
          <div className="relative h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: "rgba(255,215,0,0.06)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)" }}>
            {/* Track fill */}
            <div
              className="h-full rounded-full relative"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #7a5c00, #b8860b, #ffd700, #fff3a0, #ffd700, #b8860b)",
                backgroundSize: "300% auto",
                animation: "shimmer 1.8s linear infinite",
                boxShadow: "0 0 8px rgba(255,215,0,0.6), 0 0 2px rgba(255,215,0,1)",
                transition: "width 0.08s linear",
              }}
            />
            {/* Head glow */}
            {progress > 2 && progress < 99 && (
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 -translate-x-1/2 rounded-full pointer-events-none"
                style={{ left: `${progress}%`, background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.6) 50%, transparent 80%)", filter: "blur(1px)" }} />
            )}
          </div>

          {/* Status — clean, no gimmicks */}
          <div className="text-center">
            <span className="font-roboto text-[9px] text-white/20 uppercase tracking-[0.4em]">
              {progress < 100 ? "Инициализация" : "Добро пожаловать"}
            </span>
          </div>
        </div>

        {/* Trust badges — elevated glass style */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm animate-[fadeIn_0.4s_ease_0.8s_both]">
          {[
            { icon: "Award", label: "9 лет" },
            { icon: "Users", label: "50 000+" },
            { icon: "Star", label: "4.9 ★" },
          ].map(t => (
            <div key={t.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,215,0,0.05)",
                border: "1px solid rgba(255,215,0,0.18)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 0 16px rgba(255,215,0,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}>
              <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={9} className="text-[#FFD700]" />
              <span className="font-oswald text-[11px] text-white/55 font-semibold tracking-widest uppercase">{t.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default function Index() {
  const [splashDone, setSplashDone] = useState(false);
  useScrollReveal();

  useAutoScroll(splashDone);
  useDynamicSeo(splashDone);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className={`transition-opacity duration-700 ${splashDone ? "opacity-100" : "opacity-0 pointer-events-none"}`}>

        <HolidayBanner />
        <HolidayCornerDecor />

        {/* Фоновые частицы */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <DigitalParticles />
        </div>

        <div className="relative z-10">
          <Header />
          <HeroSection />

          <AppleSaleBanner />
          <CarBuyoutBanner />
          <SpecTechBuyoutBanner />
          <LandBuyoutBanner />
          <SafeDealsBanner />

          <PremiumServicesGrid />
          <RepairLinksOnIndex />
          <WantToBuySection />
          <WholesaleBanner />

          <InfoSections />

          <AntiquesPreviewBlock />

          <EasierWithUsBlock />

          <QuickContactSection />

          <JobsSection />

          <MaxChannelBanner />

          <ContactsFooter />
        </div>

        {/* Мобильная нижняя навигация — premium frosted glass */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-frosted px-2 py-2 safe-area-pb">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {[
              { icon: "Home",        label: "Главная",  href: "/" },
              { icon: "ShoppingBag", label: "Каталог",  href: "/catalog" },
              { icon: "RefreshCw",   label: "Скупка",   href: "/#catalog", onClick: () => { scrollTo("#catalog"); ymGoal(Goals.NAV_CLICK, { item: "catalog" }); } },
              { icon: "Wrench",      label: "Ремонт",   href: "/repair" },
              { icon: "Phone",       label: "Звонок",   href: "tel:+78006006833", onClick: () => ymGoal(Goals.CALL_CLICK, { place: "mobile_nav" }) },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className="nav-frosted-item"
              >
                <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={19} />
                <span className="text-[9px] font-semibold font-roboto uppercase tracking-widest">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        <ExitPopup />
        <CookieBanner />
        <PublicChatFab />
        <DesktopStickyBar />
      </div>
    </>
  );
}