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
    className={`relative font-roboto ${compact ? "text-xs" : "text-sm"} uppercase tracking-wide transition-colors px-1 py-1 group whitespace-nowrap
                ${active ? "text-[#FFD700]" : "text-white/80 hover:text-[#FFD700]"}`}
  >
    {link.label}
    <span
      className={`pointer-events-none absolute left-0 right-0 -bottom-[11px] h-[2px] bg-[linear-gradient(90deg,transparent,#FFD700,transparent)]
                  transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
    />
  </button>
);

/**
 * Главная навигация сайта (вторая строка шапки).
 * Переделана с нуля: всё чёткое, единая высота, ничего не уезжает.
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

      <div className={`relative max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3 transition-[height] duration-300 ${compact ? "h-12 sm:h-12" : "h-14 sm:h-16"}`}>
        {/* ── ЛЕВО: логотип ── */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className={`relative shrink-0 rounded-full p-[1.5px] transition-[width,height] duration-300
                          bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)]
                          shadow-[0_0_14px_rgba(255,215,0,0.25)] ${compact ? "w-8 h-8" : "w-10 h-10"}`}>
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-full h-full rounded-full object-cover ring-1 ring-black/40"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="leading-tight">
            <span className={`font-oswald font-bold tracking-wider animate-shimmer block transition-[font-size] duration-300 ${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>СКУПКА24</span>
            {!compact && (
              <div className="font-roboto text-white/40 text-[10px] hidden sm:flex items-center gap-1">
                <Icon name="MapPin" size={9} className="text-[#FFD700]/60" />
                Кирова 7/47 · Кирова 11
              </div>
            )}
          </div>
        </a>

        {/* ── ЦЕНТР: навигация ── */}
        {/* Планшет md-lg: 3 пункта */}
        <nav className="hidden md:flex lg:hidden items-center gap-3 mx-3">
          {navLinks.slice(0, 3).map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} compact />
          ))}
        </nav>

        {/* Десктоп lg–xl: 5 пунктов */}
        <nav className="hidden lg:flex xl:hidden items-center gap-4 mx-4">
          {navLinks.slice(0, 5).map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} compact />
          ))}
        </nav>

        {/* Большой десктоп xl+: все 8 пунктов */}
        <nav className="hidden xl:flex items-center gap-5 mx-4">
          {navLinks.map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} />
          ))}
        </nav>

        {/* ── ПРАВО: каталог + телефон + бургер ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Каталог — на md+ */}
          <a
            href="/catalog"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#FFD700]/30 hover:border-[#FFD700]/60 text-[#FFD700] hover:bg-[#FFD700]/5 active:scale-95 transition-all"
          >
            <Icon name="ShoppingBag" size={13} />
            <span className="font-oswald font-bold text-[12px] uppercase tracking-wide">Каталог</span>
          </a>

          {/* Телефон — десктоп с подписью */}
          <a
            href="tel:+79929990333"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            className="hidden xl:inline-flex items-center gap-2 h-9 px-3 rounded-md text-[#FFD700] hover:bg-[#FFD700]/5 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
              <Icon name="Phone" size={12} />
            </div>
            <span className="font-oswald font-semibold text-[13px] whitespace-nowrap">+7 (992) 999-03-33</span>
          </a>
          {/* Телефон — планшет иконкой */}
          <a
            href="tel:+79929990333"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            title="Позвонить"
            className="hidden md:inline-flex xl:hidden items-center justify-center w-9 h-9 rounded-md border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
          >
            <Icon name="Phone" size={15} />
          </a>

          {/* Бургер — мобилка */}
          <button
            onClick={onToggleMenu}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-white hover:text-[#FFD700] active:scale-95 transition-all"
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainNav;