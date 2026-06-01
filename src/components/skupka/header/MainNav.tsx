import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

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
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
        <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-[#0F0F0F] border border-[#FFD700]/25 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 mb-1 border-b border-white/[0.05]">
            <span className="font-roboto text-[10px] uppercase tracking-widest text-white/30">Антиквариат · Скупка24</span>
          </div>
          {ANTIQUE_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 font-oswald font-bold text-[12px] uppercase tracking-wider transition-colors group/item
                ${pathname === item.href ? "text-[#FFD700] bg-[#FFD700]/8" : "text-white/80 hover:text-white hover:bg-white/[0.04]"}`}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: `${item.color}18` }}>
                <Icon name={item.icon} size={11} style={{ color: item.color }} />
              </span>
              {item.label}
            </a>
          ))}
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
    <div className="relative bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20 overflow-hidden">
      {/* Премиум-фон */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.04) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.04) 100%)" }} />
      <div className="pointer-events-none absolute -top-16 left-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.05)" }} />
      <div className="pointer-events-none absolute -bottom-16 right-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.04)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent)]" />

      <div className={`relative max-w-[1800px] mx-auto px-3 sm:px-4 flex items-center gap-3 transition-[height] duration-300 ${
        compact ? "h-11 md:h-12" : "h-12 md:h-14 lg:h-16"
      }`}>
        {/* ── ЛЕВО: логотип ── */}
        <a href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group min-w-0">
          <div className={`relative shrink-0 rounded-full p-[1.5px] transition-[width,height] duration-300
                          bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)]
                          shadow-[0_0_14px_rgba(255,215,0,0.25)]
                          ${compact ? "w-7 h-7" : "w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10"}`}>
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-full h-full rounded-full object-cover ring-1 ring-black/40"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="leading-tight min-w-0">
            <span className={`font-oswald font-bold tracking-wider animate-shimmer block transition-[font-size] duration-300 ${
              compact ? "text-sm md:text-base lg:text-lg" : "text-base md:text-lg lg:text-xl"
            }`}>СКУПКА24</span>
            {/* Адрес — только на десктопе xl+ и не в compact */}
            {!compact && (
              <div className="font-roboto text-white/40 text-[10px] hidden xl:flex items-center gap-1 whitespace-nowrap">
                <Icon name="MapPin" size={9} className="text-[#FFD700]/60" />
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
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 lg:px-3.5 rounded-md border border-[#FFD700]/35 hover:border-[#FFD700]/70 text-[#FFD700] hover:bg-[#FFD700]/[0.08] active:scale-95 transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.25)]"
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
            href="tel:+79929999777"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            className="hidden xl:inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-md
                       bg-gradient-to-br from-[#FFD700]/[0.12] via-[#FFD700]/[0.05] to-transparent
                       border border-[#FFD700]/40 hover:border-[#FFD700]/70 hover:from-[#FFD700]/[0.18]
                       hover:shadow-[0_0_18px_rgba(255,215,0,0.35)]
                       transition-all duration-300 group"
          >
            <span className="relative w-6 h-6 rounded-full
                              bg-[radial-gradient(circle_at_30%_30%,#fff3a0,#ffd700_45%,#b8860b_100%)]
                              shadow-[0_0_8px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]
                              flex items-center justify-center text-black">
              <Icon name="Phone" size={12} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0D0D0D] animate-pulse" aria-hidden />
            </span>
            <span className="font-oswald font-extrabold text-[13.5px] text-[#FFD700] tracking-wide whitespace-nowrap drop-shadow-[0_0_5px_rgba(255,215,0,0.35)]">
              +7 (992) 999-97-77
            </span>
          </a>
          {/* Телефон — планшет/средний десктоп иконкой */}
          <a
            href="tel:+79929999777"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            title="Позвонить"
            className="hidden md:inline-flex xl:hidden items-center justify-center w-9 h-9 rounded-md border border-[#FFD700]/35 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700]/65 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)] transition-all"
          >
            <Icon name="Phone" size={14} />
          </a>

          {/* Бургер — мобилка (<md) */}
          <button
            onClick={onToggleMenu}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-white hover:text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainNav;