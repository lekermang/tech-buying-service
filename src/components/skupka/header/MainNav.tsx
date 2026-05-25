import { useEffect, useState } from "react";
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
    className={`relative font-oswald font-bold ${compact ? "text-[11px]" : "text-[13px] xl:text-[13.5px]"} uppercase tracking-[0.08em] transition-all duration-300 px-2 py-1.5 group whitespace-nowrap
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

/**
 * MainNav — главная навигация сайта (вторая строка шапки).
 *
 * Адаптация по экранам:
 *   - Мобилка (<md, <768px):  лого (компакт) + бургер
 *   - Планшет (md-lg, 768-1024px): лого + 4 пункта + Каталог + телефон-иконка + бургер для остальных
 *   - Десктоп (lg-xl, 1024-1280px): лого + 6 пунктов + Каталог + телефон-иконка
 *   - Большой ПК (xl+, 1280px+): лого с адресом + все 8 пунктов + Каталог + телефон-капсула
 */
const MainNav = ({ navLinks, menuOpen, onToggleMenu, onNav, compact = false }: MainNavProps) => {
  const hrefs = navLinks.map(l => l.href);
  const active = useActiveSection(hrefs);

  return (
    <div className="relative bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20 overflow-hidden">
      {/* Премиум-фон */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.04) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.04) 100%)" }} />
      <div className="pointer-events-none absolute -top-16 left-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.05)" }} />
      <div className="pointer-events-none absolute -bottom-16 right-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.04)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent)]" />

      <div className={`relative max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3 transition-[height] duration-300 ${
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

        {/* Большой ПК (xl+, 1280px+): все пункты + золотые разделители */}
        <nav className="hidden xl:flex items-center gap-2.5 mx-4 min-w-0">
          {navLinks.map((l, i) => (
            <span key={l.href} className="flex items-center gap-2.5">
              <NavItem link={l} active={active === l.href} onClick={() => onNav(l.href)} />
              {i < navLinks.length - 1 && <NavSeparator />}
            </span>
          ))}
        </nav>

        {/* ── ПРАВО: каталог + телефон + бургер ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Каталог — на md+ : премиум контурная кнопка */}
          <a
            href="/catalog"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 lg:px-3.5 rounded-md border border-[#FFD700]/35 hover:border-[#FFD700]/70 text-[#FFD700] hover:bg-[#FFD700]/[0.08] active:scale-95 transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.25)]"
          >
            <Icon name="ShoppingBag" size={13} />
            <span className="font-oswald font-bold text-[11.5px] lg:text-[12.5px] uppercase tracking-wider">Каталог</span>
          </a>

          {/* Телефон — десктоп xl+ : премиум золотая капсула */}
          <a
            href="tel:+79929990333"
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