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

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 2500);
    const t2 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${hiding ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at center, #1a1400 0%, #0D0D0D 60%, #000 100%)" }}>

      {/* Premium-фон Trade In DNA: сетка + свечения по углам + переливающаяся линия */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.07)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 65%)" }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#FFD700] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#FFD700]/40 to-transparent" />

      <div className="relative flex flex-col items-center gap-8 px-4">

        {/* Премиум-медальон с золотым ободком и пульсацией */}
        <div className="relative animate-[fadeIn_0.4s_ease]">
          <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" style={{ background: "rgba(255,215,0,0.4)" }} />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px]
                          bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)]
                          shadow-[0_0_40px_rgba(255,215,0,0.5)] animate-[spin_8s_linear_infinite]">
            <div className="w-full h-full rounded-full bg-black p-1">
              <img
                src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
                alt="Скупка24"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Бренд + бейдж */}
        <div className="flex flex-col items-center gap-2 animate-[fadeIn_0.4s_ease_0.15s_both]">
          <span className="font-oswald font-bold text-3xl sm:text-4xl text-[#FFD700] tracking-[0.3em] uppercase"
                style={{ textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
            Скупка24
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/40 px-3 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD700]" />
            </span>
            <span className="font-roboto text-[10px] text-[#FFD700] uppercase tracking-[0.25em] font-semibold">Премиум · 24/7</span>
          </span>
        </div>

        {/* Главный слоган с золотым градиентом */}
        <h2 className="font-oswald text-4xl sm:text-5xl md:text-6xl font-bold uppercase text-center leading-[0.95] animate-[slideDown_0.5s_ease_0.2s_both]">
          <span className="block text-white">Купим дорого</span>
          <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">всё!</span>
        </h2>

        {/* Прогресс-бар с золотым градиентом */}
        <div className="w-64 sm:w-80 flex flex-col gap-2.5 animate-[fadeIn_0.4s_ease_0.5s_both]">
          <div className="h-[4px] w-full bg-white/10 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
            <div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #b8860b, #ffd700, #fff3a0, #ffd700, #b8860b)",
                backgroundSize: "200% auto",
                animation: "splashBar 2.3s cubic-bezier(0.4,0,0.2,1) forwards, shimmer 1.5s linear infinite",
                boxShadow: "0 0 12px rgba(255,215,0,0.5)",
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="font-roboto text-[#FFD700]/60 text-[10px] uppercase tracking-[0.3em] font-semibold">Загружаем витрину</span>
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
            <div key={t.label} className="flex items-center gap-1.5 bg-black/40 border border-[#FFD700]/20 px-2.5 py-1 rounded-full">
              <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={10} className="text-[#FFD700]" />
              <span className="font-roboto text-white/70 text-[10px] uppercase tracking-wide">{t.label}</span>
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
      <Header scrollTo={scrollTo} goldOpen={goldOpen} />
      <HeroSection scrollTo={scrollTo} externalModalOpen={evalOpen} onExternalModalClose={() => setEvalOpen(false)} />
      <InfoSections />
      <JobsSection />
      <ContactsFooter scrollTo={scrollTo} />
      <ExitPopup onOpenEval={() => setEvalOpen(true)} />
      <CookieBanner />

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
            href="https://t.me/skypka24"
            target="_blank" rel="noopener noreferrer"
            onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "sticky_bar" })}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors">
            <Icon name="MessageCircle" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">Telegram</span>
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