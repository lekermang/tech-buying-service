import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const PUBLIC_CHAT_URL = "https://functions.poehali.dev/60644856-ff88-4875-b2a9-97c87d32a630";

/** Кнопка Live-чата для мобильной шапки */
function MobileLiveChatBtn() {
  const [unread, setUnread] = useState(false);
  const [hasChat, setHasChat] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem("pchat_auth");
    const room = localStorage.getItem("pchat_room");
    if (auth && room) setHasChat(true);
  }, []);

  useEffect(() => {
    if (!hasChat) return;
    const auth = localStorage.getItem("pchat_auth");
    const room = localStorage.getItem("pchat_room");
    if (!auth || !room) return;
    let cancelled = false;
    const check = async () => {
      try {
        const since = parseInt(localStorage.getItem("pchat_last_seen_id") || "0", 10) || 0;
        const r = await fetch(`${PUBLIC_CHAT_URL}?action=poll&room_id=${room}&since=${since}`, {
          headers: { "X-Auth-Token": auth },
        });
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (d?.messages?.some((m: { author_type?: string }) => m.author_type !== "client")) {
          setUnread(true);
        }
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [hasChat]);

  if (pathname === "/chat") return null;

  return (
    <a
      href="/chat"
      aria-label="Написать в чат"
      onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "header_mobile_chat" })}
      className="md:hidden relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full active:scale-90 transition-all duration-200"
      style={{
        background: hasChat && unread
          ? "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.08))"
          : "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
        border: hasChat && unread
          ? "1px solid rgba(74,222,128,0.45)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: hasChat && unread
          ? "0 0 14px rgba(74,222,128,0.25)"
          : "none",
      }}
    >
      {/* Иконка */}
      <span className="relative flex items-center justify-center w-5 h-5">
        <Icon
          name="MessageCircle"
          size={17}
          className={hasChat && unread ? "text-green-400" : "text-white/70"}
        />
        {/* Живая точка */}
        {hasChat && unread ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#0D0D0D] animate-pulse" />
        ) : (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }}>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        )}
      </span>
      {/* Текст */}
      <span className="font-oswald font-bold text-[11px] uppercase tracking-wider"
        style={{ color: hasChat && unread ? "#4ade80" : "rgba(255,255,255,0.75)" }}>
        Live
      </span>
    </a>
  );
}

export type NavLink = { label: string; href: string };

interface MainNavProps {
  navLinks: NavLink[];
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNav: (href: string) => void;
  /** При скролле — компактная версия */
  compact?: boolean;
  onPayClick?: () => void;
}

/** Scroll-spy: какой якорь сейчас в зоне просмотра */
const useActiveSection = (hrefs: string[]) => {
  const [active, setActive] = useState<string>(hrefs[0] || "");
  useEffect(() => {
    const ids = hrefs.map(h => h.replace(/^#/, "")).filter(Boolean);
    const onScroll = () => {
      const y = window.scrollY + 140;
      let current = ids[0] || "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActive("#" + current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hrefs]);
  return active;
};

type NavItemProps = {
  link: NavLink;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
};

const NavItem = ({ link, active, onClick, compact }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`relative font-oswald font-bold ${compact ? "text-[11px] px-1" : "text-[12px] xl:text-[12.5px] 2xl:text-[13.5px] px-1.5 2xl:px-2"} uppercase tracking-[0.06em] xl:tracking-[0.08em] transition-all duration-300 py-1.5 group whitespace-nowrap shrink-0
                ${active
                  ? "text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]"
                  : "text-white/85 hover:text-[#FFD700] hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.35)]"}`}
    style={active ? {
      background: "linear-gradient(135deg, #fff3a0 0%, #ffd700 60%, #d4940a 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    } : undefined}
  >
    {link.label}
    {/* Премиум-подчёркивание: золотой градиент с двумя «точками-засечками» */}
    <span
      className={`pointer-events-none absolute left-1 right-1 -bottom-[6px] h-[2px] rounded-full
                  bg-[linear-gradient(90deg,transparent,#FFD700_25%,#fff3a0_50%,#FFD700_75%,transparent)]
                  transition-all duration-300
                  ${active ? "opacity-100 scale-x-100 shadow-[0_0_10px_rgba(255,215,0,0.6)]" : "opacity-0 scale-x-50 group-hover:opacity-60 group-hover:scale-x-90"}`}
    />
    {/* Свечение при активном */}
    {active && (
      <span className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.12),transparent_70%)] rounded" />
    )}
  </button>
);

/** Тонкий золотой вертикальный разделитель между пунктами. */
const NavSeparator = () => (
  <span aria-hidden className="hidden xl:block w-px h-3 bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent" />
);

/** Кнопка «Ещё ▾» с выпадающим списком — для xl (когда не помещается всё). */
const MoreMenu = ({ items, active, onNav }: { items: NavLink[]; active: string; onNav: (href: string) => void }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  const hasActive = items.some(i => i.href === active);
  return (
    <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative font-oswald font-bold text-[12px] xl:text-[12.5px] uppercase tracking-[0.06em] xl:tracking-[0.08em] px-2 py-1.5 rounded transition-colors whitespace-nowrap inline-flex items-center gap-1
                    ${open || hasActive ? "text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]" : "text-white/85 hover:text-[#FFD700]"}`}
      >
        Ещё <Icon name="ChevronDown" size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] dropdown-glass rounded-xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 mb-1 border-b border-[#FFD700]/10 flex items-center gap-2">
            <span className="font-roboto text-[9px] uppercase tracking-widest text-white/30">Разделы сайта</span>
          </div>
          {items.map(l => (
            <button
              key={l.href}
              onClick={() => { onNav(l.href); setOpen(false); }}
              className={`w-full text-left px-3 py-2 font-oswald font-bold text-[12px] uppercase tracking-wider transition-colors
                          ${active === l.href ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/85 hover:text-[#FFD700] hover:bg-[#FFD700]/[0.06]"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ANTIQUE_ITEMS = [
  { label: "Царские монеты",          href: "/russian-coins",     icon: "Coins",   color: "#FFD700" },
  { label: "Православные иконы",       href: "/icons",             icon: "Flame",   color: "#e2a84b" },
  { label: "Фарфор и хрусталь",        href: "/porcelain",         icon: "Coffee",  color: "#60a5fa" },
  { label: "Советский антиквариат",    href: "/soviet-antiques",   icon: "Medal",   color: "#ef4444" },
  { label: "Древние монеты",           href: "/ancient-coins",     icon: "CircleDot", color: "#a3e635" },
  { label: "Бронзовые статуэтки",      href: "/bronze-sculptures", icon: "Gem",     color: "#a78bfa" },
];

/** Кнопка «Антиквариат ▾» с выпадающим меню */
const AntiqueDropdown = ({ compact }: { compact?: boolean }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isActive = ANTIQUE_ITEMS.some(i => i.href === pathname);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative shrink-0" onMouseDown={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative font-oswald font-bold ${compact ? "text-[11px] px-1" : "text-[12px] xl:text-[12.5px] px-1.5"} uppercase tracking-[0.06em] xl:tracking-[0.08em] py-1.5 inline-flex items-center gap-1 transition-all duration-300 group whitespace-nowrap
          ${open || isActive ? "text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]" : "text-white/85 hover:text-[#FFD700] hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.35)]"}`}
      >
        Антиквариат
        <Icon name="ChevronDown" size={10} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        <span className={`pointer-events-none absolute left-1 right-1 -bottom-[6px] h-[2px] rounded-full
          bg-[linear-gradient(90deg,transparent,#FFD700_25%,#fff3a0_50%,#FFD700_75%,transparent)]
          transition-all duration-300
          ${open || isActive ? "opacity-100 scale-x-100 shadow-[0_0_10px_rgba(255,215,0,0.6)]" : "opacity-0 scale-x-50 group-hover:opacity-60 group-hover:scale-x-90"}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-60 dropdown-glass rounded-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 mb-1 border-b border-[#FFD700]/12 flex items-center gap-2">
            <span className="font-roboto text-[9px] uppercase tracking-widest text-white/30">Антиквариат · Скупка24</span>
          </div>
          {ANTIQUE_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 font-oswald font-bold text-[12px] uppercase tracking-wider transition-all duration-200 group/item
                ${pathname === item.href ? "text-[#FFD700] bg-[#FFD700]/8 pl-5" : "text-white/80 hover:text-white hover:pl-5"}`}
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all group-hover/item:scale-110"
                style={{ background: `${item.color}20`, boxShadow: `0 0 8px ${item.color}30` }}>
                <Icon name={item.icon} size={12} style={{ color: item.color }} />
              </span>
              {item.label}
            </a>
          ))}
          <div className="px-3 pt-2 mt-1 border-t border-[#FFD700]/10">
            <a href="/antiques" className="flex items-center justify-between font-roboto text-[10px] text-[#FFD700]/50 hover:text-[#FFD700] uppercase tracking-widest transition-colors">
              <span>Все категории</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MainNav — главная навигация сайта (вторая строка шапки).
 *
 * Адаптация по экранам:
 *   - Мобилка (<md, <768px):  лого (компакт) + бургер
 *   - Планшет (md-lg, 768-1024px): лого + 4 пункта + Каталог + телефон-иконка + бургер для остальных
 *   - Десктоп (lg-xl, 1024-1280px): лого + 6 пунктов + Каталог + телефон-иконка
 *   - Большой ПК (xl+, 1280px+): лого с адресом + все 8 пунктов + Каталог + телефон-капсула
 */
const MainNav = ({ navLinks, menuOpen, onToggleMenu, onNav, compact = false, onPayClick }: MainNavProps) => {
  const hrefs = navLinks.map(l => l.href);
  const active = useActiveSection(hrefs);

  return (
    <div className="relative">
      {/* Премиум-фон */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.04) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.04) 100%)" }} />
      <div className="pointer-events-none absolute -top-16 left-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.05)" }} />
      <div className="pointer-events-none absolute -bottom-16 right-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.04)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent)]" />

      <div className={`relative max-w-[1800px] mx-auto px-3 sm:px-4 flex items-center gap-3 transition-[height] duration-300 ${
        compact ? "h-11 md:h-12" : "h-12 md:h-14 lg:h-16"
      }`}>
        {/* ── ЛЕВО: логотип — точно как на сплэш-экране ── */}
        <a href="/" className="flex items-center gap-3 shrink-0 group">
          <style>{`
            @keyframes navLogoSpin  { from { transform: rotate(0deg);    } to { transform: rotate(360deg);  } }
            @keyframes navLogoSpinR { from { transform: rotate(0deg);    } to { transform: rotate(-360deg); } }
            @keyframes navLogoGlow  { 0%,100% { opacity:.5; } 50% { opacity:1; } }
            .nav-logo-spin       { animation: navLogoSpin   8s linear infinite; }
            .nav-logo-spin-slow  { animation: navLogoSpin  18s linear infinite; }
            .nav-logo-spin-r     { animation: navLogoSpinR  8s linear infinite; }
            .nav-logo-glow       { animation: navLogoGlow 2.4s ease-in-out infinite; }
          `}</style>

          {/* Медальон */}
          <div className={`relative shrink-0 transition-all duration-300 ${compact ? "w-8 h-8" : "w-10 h-10 md:w-11 md:h-11"}`}>
            {/* Пульсирующее золотое свечение */}
            <div className="absolute inset-0 -m-2 rounded-full blur-xl nav-logo-glow pointer-events-none"
              style={{ background: "rgba(255,215,0,0.4)" }} />
            {/* Орбитальное кольцо с точками */}
            <div className="absolute -inset-2 rounded-full border border-[#FFD700]/20 nav-logo-spin-slow pointer-events-none">
              <span className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FFD700]"
                style={{ boxShadow: "0 0 8px #FFD700" }} />
              <span className="absolute top-1/2 -right-[2px] -translate-y-1/2 w-1 h-1 rounded-full bg-[#fff3a0]"
                style={{ boxShadow: "0 0 6px #FFD700" }} />
            </div>
            {/* Главное вращающееся conic кольцо */}
            <div className="w-full h-full rounded-full p-[2px] nav-logo-spin"
              style={{
                background: "conic-gradient(from 0deg, #b8860b, #ffd700, #fff3a0, #ffd700, #b8860b)",
                boxShadow: "0 0 24px rgba(255,215,0,0.5)",
              }}>
              {/* Контр-вращение чтобы фото оставалось ровным */}
              <div className="w-full h-full rounded-full bg-black p-[2px] nav-logo-spin-r">
                <img
                  src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
                  alt="Скупка24"
                  className="w-full h-full rounded-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

          </div>

          {/* Текст */}
          <div className="leading-tight flex flex-col items-start">
            <span className={`font-oswald font-bold tracking-wider transition-[font-size] duration-300 flex whitespace-nowrap ${
              compact ? "text-sm md:text-base" : "text-base md:text-lg lg:text-xl"
            }`}>
              {"СКУПКА24".split("").map((char, i) => (
                <span key={i} className="letter-kinetic inline-block" style={{
                  animationDelay: `${i * 55}ms`,
                  backgroundImage: i % 2 === 0
                    ? "linear-gradient(180deg, #fff3a0 0%, #FFD700 55%, #b8860b 100%)"
                    : "linear-gradient(180deg, #FFD700 0%, #fff3a0 40%, #FFD700 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  paddingBottom: "1px",
                }}>{char}</span>
              ))}
            </span>
            {!compact && (
              <div className="font-roboto text-white/35 text-[10px] hidden xl:flex items-center gap-1 whitespace-nowrap mt-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Кирова 7/47 · Кирова 11
              </div>
            )}
          </div>
        </a>

        {/* ── ЦЕНТР: навигация ── */}
        {/* Планшет (md–lg, 768–1024px): 4 пункта */}
        <nav className="hidden md:flex lg:hidden items-center gap-3 mx-2 min-w-0">
          {navLinks.slice(0, 4).map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} compact />
          ))}
        </nav>

        {/* Десктоп (lg–xl, 1024–1280px): 6 пунктов */}
        <nav className="hidden lg:flex xl:hidden items-center gap-4 mx-3 min-w-0">
          {navLinks.slice(0, 6).map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} compact />
          ))}
        </nav>

        {/* Большой ПК (xl+, 1280px+): первые 6 пунктов, остальные в «Ещё ▾»;
            на 2xl (1536px+) — все 8 пунктов в одну строку. */}
        <nav className="hidden xl:flex 2xl:hidden items-center gap-1.5 mx-3 flex-1 justify-center overflow-hidden">
          {navLinks.slice(0, 6).map((l, i) => (
            <div key={l.href} className="flex items-center gap-1.5 shrink-0">
              <NavItem link={l} active={active === l.href} onClick={() => onNav(l.href)} />
              {i < 5 && <NavSeparator />}
            </div>
          ))}
          {navLinks.length > 6 && (
            <MoreMenu items={navLinks.slice(6)} active={active} onNav={onNav} />
          )}
        </nav>

        <nav className="hidden 2xl:flex items-center gap-1.5 xl:gap-2 mx-3 xl:mx-4 overflow-hidden flex-1 justify-center">
          {navLinks.map((l, i) => (
            <div key={l.href} className="flex items-center gap-1.5 xl:gap-2 shrink-0">
              <NavItem link={l} active={active === l.href} onClick={() => onNav(l.href)} />
              {i < navLinks.length - 1 && <NavSeparator />}
            </div>
          ))}
        </nav>

        {/* ── ПРАВО: каталог + телефон + бургер ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Антиквариат — выпадающее меню на md+ */}
          <div className="hidden md:block">
            <AntiqueDropdown compact={compact} />
          </div>

          {/* Каталог — на md+ : премиум контурная кнопка */}
          <a
            href="/catalog"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#FFD700]/25 hover:border-[#FFD700]/60 text-[#FFD700] hover:bg-[#FFD700]/[0.06] active:scale-95 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]"
          >
            <Icon name="ShoppingBag" size={13} />
            <span className="font-oswald font-bold text-[11.5px] lg:text-[12.5px] uppercase tracking-wider">Каталог</span>
          </a>

          {/* Оплата ЮKassa */}
          {onPayClick && (
            <button
              onClick={onPayClick}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 lg:px-3.5 rounded-md border border-emerald-500/40 hover:border-emerald-400/70 text-emerald-400 hover:bg-emerald-500/[0.08] active:scale-95 transition-all hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]"
              title="Оплатить услуги"
            >
              <Icon name="CreditCard" size={13} />
              <span className="font-oswald font-bold text-[11.5px] lg:text-[12.5px] uppercase tracking-wider">Оплата</span>
            </button>
          )}

          {/* Телефон — десктоп xl+ : премиум золотая капсула */}
          <a
            href="tel:+79929990333"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            className="hidden xl:inline-flex items-center gap-2 h-9 pl-2.5 pr-4 rounded-full
                       border border-[#FFD700]/30 hover:border-[#FFD700]/70
                       active:scale-95 transition-all duration-300 group overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.04) 100%)",
              boxShadow: "0 0 0 1px rgba(255,215,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span className="relative w-7 h-7 rounded-full flex items-center justify-center text-black shrink-0"
              style={{ background: "linear-gradient(135deg, #fff3a0 0%, #ffd700 50%, #c8960a 100%)", boxShadow: "0 0 12px rgba(255,215,0,0.5)" }}>
              <Icon name="Phone" size={13} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#07050A] animate-pulse" />
            </span>
            <span className="font-oswald font-extrabold text-[13.5px] text-[#FFD700] tracking-wide whitespace-nowrap drop-shadow-[0_0_5px_rgba(255,215,0,0.35)]">
              +7 (992) 999-03-33
            </span>
          </a>
          {/* Телефон — планшет/средний десктоп иконкой */}
          <a
            href="tel:+79929990333"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            title="Позвонить"
            className="hidden md:inline-flex xl:hidden items-center justify-center w-9 h-9 rounded-md border border-[#FFD700]/35 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]/65 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)] transition-all"
          >
            <Icon name="Phone" size={14} />
          </a>

          {/* Live чат — мобилка (<md) */}
          <MobileLiveChatBtn />

          {/* Бургер — мобилка (<md) */}
          <button
            onClick={onToggleMenu}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#FFD700]/20 text-white hover:text-[#FFD700] hover:border-[#FFD700]/50 hover:bg-[#FFD700]/5 active:scale-90 transition-all duration-200"
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainNav;