import { useState, useEffect } from "react";
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
    description: "Два офиса Скупка24 в центре Калуги: ул. Кирова, 11 и ул. Кирова, 7/47. Работаем 24/7 без выходных. Телефон: +7 (992) 999-03-33, 8 (800) 600-68-33.",
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
    description: "Телефон: +7 (992) 999-03-33, бесплатно 8 (800) 600-68-33. Telegram @skypka24. Два офиса в Калуге: Кирова 11 и 7/47. Работаем круглосуточно.",
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

  // Точки-частицы (золотая пыль)
  const particles = Array.from({ length: 14 }, (_, i) => i);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${hiding ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at center, #1a1400 0%, #0D0D0D 60%, #000 100%)" }}>

      {/* Premium-фон: сетка + свечения по углам + золотые рамки */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)" }} />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none animate-pulse" style={{ background: "rgba(255,215,0,0.12)", animationDuration: "4s" }} />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none animate-pulse" style={{ background: "rgba(255,184,0,0.08)", animationDuration: "5s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.10) 0%, transparent 65%)" }} />

      {/* Золотые рамки-углы (премиум-фрейм) */}
      <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-[#FFD700]/60" />
      <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-[#FFD700]/60" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-[#FFD700]/60" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-[#FFD700]/60" />

      {/* Праздничная полоса сверху на сплеше — Георгиевская лента / снежинки / триколор */}
      {holiday && holiday.holiday.pattern === "snow" && (
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute text-white/55 select-none"
              style={{
                left: `${(i * 7 + 3) % 100}%`,
                top: "-10px",
                fontSize: `${10 + (i % 3) * 6}px`,
                animation: `splashParticle ${8 + (i % 5) * 2}s linear ${i * 0.4}s infinite`,
              }}
            >
              ❄
            </span>
          ))}
        </div>
      )}

      {/* Боковые золотые линии */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#FFD700] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#FFD700]/40 to-transparent" />

      {/* Золотая пыль — частицы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((i) => {
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

        {/* Премиум-медальон: вращающееся золотое кольцо + статичный логотип внутри */}
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

          {/* мощное свечение вокруг (только opacity — без layout) */}
          <div className="absolute inset-0 -m-4 rounded-full blur-2xl logo-glow pointer-events-none" style={{ background: "rgba(255,215,0,0.45)" }} />

          {/* внешнее тонкое кольцо-орбита */}
          <div className="absolute -inset-3 rounded-full border border-[#FFD700]/25 logo-spin-slow pointer-events-none">
            <span className="absolute -top-[3px] left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-[#FFD700]" style={{ boxShadow: "0 0 10px #FFD700" }} />
            <span className="absolute top-1/2 -right-[3px] w-1 h-1 -translate-y-1/2 rounded-full bg-[#fff3a0]" style={{ boxShadow: "0 0 8px #FFD700" }} />
          </div>

          {/* основной золотой ободок (вращается плавно) */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2px] logo-spin
                          bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)]
                          shadow-[0_0_50px_rgba(255,215,0,0.55)]">
            {/* Логотип внутри — компенсируем вращение родителя обратной анимацией, чтобы картинка стояла ровно */}
            <div className="w-full h-full rounded-full bg-black p-1 logo-spin-reverse">
              <img
                src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
                alt="Скупка24"
                className="w-full h-full rounded-full object-cover"
                draggable={false}
              />
            </div>
          </div>

          {/* искры в углах */}
          <Icon name="Sparkles" size={14} className="absolute -top-2 -right-2 text-[#FFD700] animate-pulse pointer-events-none" />
          <Icon name="Sparkles" size={10} className="absolute -bottom-1 -left-2 text-[#fff3a0] animate-pulse pointer-events-none" />
        </div>

        {/* Бренд + бейдж */}
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

        {/* Главный слоган с золотым градиентом */}
        <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold uppercase text-center leading-[1.1] tracking-tight animate-[fadeIn_0.5s_ease_0.2s_both] flex flex-col items-center gap-1">
          <span className="block text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.15)] py-1">Купим дорого</span>
          <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer py-1">всё!</span>
        </h2>

        {/* Праздничное приветствие на сплеше (если активен праздник) */}
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

        {/* Прогресс-бар с золотым градиентом + проценты */}
        <div className="w-64 sm:w-80 flex flex-col gap-2 animate-[fadeIn_0.4s_ease_0.5s_both]">
          <div className="flex items-center justify-between text-[10px] font-roboto uppercase tracking-[0.3em] font-semibold">
            <span className="text-[#FFD700]/60">Загрузка</span>
            <span className="text-[#FFD700] tabular-nums" style={{ textShadow: "0 0 8px rgba(255,215,0,0.6)" }}>{progress}%</span>
          </div>
          <div className="relative h-[6px] w-full bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] border border-[#FFD700]/15">
            <div
              className="h-full rounded-full relative"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #b8860b, #ffd700, #fff3a0, #ffd700, #b8860b)",
                backgroundSize: "200% auto",
                animation: "shimmer 1.5s linear infinite",
                boxShadow: "0 0 14px rgba(255,215,0,0.7), 0 0 4px rgba(255,215,0,1)",
                transition: "width 0.1s linear",
              }}
            >
              {/* блик-головка прогресса */}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" style={{ boxShadow: "0 0 12px #fff, 0 0 20px #FFD700" }} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-1 h-1 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="font-roboto text-[#FFD700]/70 text-[10px] uppercase tracking-[0.3em] font-semibold">
              {progress < 35 ? "Открываем сейф" : progress < 70 ? "Считаем выгоду" : progress < 95 ? "Полируем витрину" : "Готово"}
            </span>
            <div className="w-1 h-1 rounded-full bg-[#FFD700] animate-pulse" />
          </div>
        </div>

        {/* Триггеры доверия */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md animate-[fadeIn_0.4s_ease_0.8s_both]">
          {[
            { icon: "Award", label: "9 лет на рынке" },
            { icon: "Users", label: "50 000+ клиентов" },
            { icon: "Star", label: "4.9 на картах" },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-1.5 bg-black/50 border border-[#FFD700]/25 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-[0_0_12px_rgba(255,215,0,0.08)]">
              <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={10} className="text-[#FFD700]" />
              <span className="font-roboto text-white/80 text-[10px] uppercase tracking-wide">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = ({ goldOpen = false }: { goldOpen?: boolean }) => {
  const [splashDone, setSplashDone] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  useAutoScroll(splashDone);
  useDynamicSeo(splashDone);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  // ?action=eval — открыть форму оценки (для рекламных ссылок)
  useEffect(() => {
    if (!splashDone) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("action") === "eval" || p.get("action") === "evaluate") {
      setEvalOpen(true);
    }
  }, [splashDone]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    ymGoal(Goals.INSTALL_PWA);
    installPrompt.prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await (installPrompt as any).userChoice;
    if (outcome === "accepted") { setInstallPrompt(null); setInstalled(true); }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[72px] md:pb-0">
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {/* Праздничный баннер — автоматически появляется за 3 дня до и 3 дня после праздника (9 мая, 23 фев, 8 марта и т.д.) */}
      <HolidayBanner />
      {/* Угловое праздничное украшение поверх всей страницы (Георгиевская лента, снежинки и т.д.) */}
      <HolidayCornerDecor />
      <Header scrollTo={scrollTo} goldOpen={goldOpen} />
      <HeroSection scrollTo={scrollTo} externalModalOpen={evalOpen} onExternalModalClose={() => setEvalOpen(false)} />
      <SafeDealsBanner />
      <PremiumServicesGrid />
      <InfoSections />

      {/* С нами стало проще — премиум-блок (приложения + преимущества), стиль Trade In */}
      <EasierWithUsBlock />

      {/* Быстрая связь — 4 канала: телефон, чат, telegram, офисы */}
      <QuickContactSection />

      <JobsSection />
      <MaxChannelBanner />

      <ContactsFooter scrollTo={scrollTo} />
      <ExitPopup onOpenEval={() => setEvalOpen(true)} />
      <CookieBanner />
      <PublicChatFab />

      {/* Sticky нижняя панель — только мобильные */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/98 backdrop-blur-sm border-t border-[#FFD700]/20 pb-safe">
        <div className="flex h-[68px]">
          <a
            href="tel:+79929990333"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "sticky_bar" })}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors">
            <Icon name="Phone" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">Позвонить</span>
          </a>
          <button
            onClick={() => { ymGoal(Goals.FORM_OPEN, { place: "sticky_bar" }); setEvalOpen(true); }}
            className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#FFD700] text-black active:bg-yellow-400 transition-colors">
            <Icon name="Zap" size={22} />
            <span className="font-oswald font-bold text-sm uppercase tracking-wide">Оценить онлайн</span>
          </button>
          <a
            href="https://max.ru/skypka24bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors relative">
            <Icon name="MessageCircle" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">MAX</span>
            <span className="absolute top-2 right-1/3 w-2 h-2 bg-green-400 rounded-full ring-2 ring-[#0D0D0D] animate-pulse" />
          </a>
          {installPrompt && !installed ? (
            <button
              onClick={installApp}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors">
              <Icon name="Download" size={22} />
              <span className="font-roboto text-[10px] uppercase tracking-wide">Установить</span>
            </button>
          ) : (
            <a
              href="/catalog"
              onClick={() => ymGoal(Goals.CATALOG_OPEN, { place: "sticky_bar" })}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-[#FFD700] active:text-[#FFD700] transition-colors">
              <Icon name="ShoppingBag" size={22} />
              <span className="font-roboto text-[10px] uppercase tracking-wide">Каталог</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;