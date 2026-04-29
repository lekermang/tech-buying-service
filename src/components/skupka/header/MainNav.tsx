import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import InstallAppModal, { isStandaloneApp } from "@/components/InstallAppModal";

export type NavLink = { label: string; href: string };

interface MainNavProps {
  navLinks: NavLink[];
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNav: (href: string) => void;
}

/** Scroll-spy: какой якорь сейчас в зоне просмотра */
const useActiveSection = (hrefs: string[]) => {
  const [active, setActive] = useState<string>(hrefs[0] || "");
  useEffect(() => {
    const ids = hrefs.map(h => h.replace(/^#/, "")).filter(Boolean);
    const onScroll = () => {
      const y = window.scrollY + 140; // учитываем высоту фикс. шапки
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
    className={`relative font-roboto ${compact ? "text-xs" : "text-sm"} uppercase tracking-wide transition-colors px-1 py-1 group
                ${active ? "text-[#FFD700]" : "text-white/80 hover:text-[#FFD700]"}`}
  >
    {link.label}
    {/* Тонкая золотая подсветка активного пункта */}
    <span
      className={`pointer-events-none absolute left-0 right-0 -bottom-[11px] h-[2px] bg-[linear-gradient(90deg,transparent,#FFD700,transparent)]
                  transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
    />
    <span
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-[16px] w-6 h-6 rounded-full blur-md
                  transition-opacity duration-300 ${active ? "opacity-60" : "opacity-0 group-hover:opacity-25"}`}
      style={{ background: "rgba(255,215,0,0.55)" }}
    />
  </button>
);

const MainNav = ({ navLinks, menuOpen, onToggleMenu, onNav }: MainNavProps) => {
  const hrefs = navLinks.map(l => l.href);
  const active = useActiveSection(hrefs);
  const [installOpen, setInstallOpen] = useState(false);
  const installed = isStandaloneApp();

  return (
    <div className="relative bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20 overflow-hidden">
      {/* Премиум-фон как в Trade In: мягкие золотые свечения по углам */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.04) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.04) 100%)" }} />
      <div className="pointer-events-none absolute -top-16 left-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.05)" }} />
      <div className="pointer-events-none absolute -bottom-16 right-10 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.04)" }} />
      {/* Золотая линия снизу (парная линии в GoldTicker) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* ЛОГО — премиум-медальон */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[1.5px]
                          bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)]
                          shadow-[0_0_14px_rgba(255,215,0,0.25)]">
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-full h-full rounded-full object-cover ring-1 ring-black/40"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="leading-tight">
            <span className="font-oswald font-bold text-lg sm:text-xl tracking-wider animate-shimmer block">СКУПКА24</span>
            <div className="font-roboto text-white/40 text-[10px] hidden sm:flex items-center gap-1">
              <Icon name="MapPin" size={9} className="text-[#FFD700]/60" />
              Кирова 7/47 · Кирова 11
            </div>
          </div>
        </div>

        {/* Планшет: компактная навигация */}
        <nav className="hidden md:flex lg:hidden items-center gap-4">
          {navLinks.slice(0, 3).map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} compact />
          ))}
          <a href="/catalog" className="relative font-roboto text-xs text-[#FFD700] uppercase tracking-wide flex items-center gap-1 hover:opacity-90 transition-opacity">
            <Icon name="ShoppingBag" size={12} />
            Каталог
          </a>
        </nav>

        {/* ПК: полная навигация */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(l => (
            <NavItem key={l.href} link={l} active={active === l.href} onClick={() => onNav(l.href)} />
          ))}
          <a href="/catalog"
            className="relative font-roboto text-sm text-[#FFD700] uppercase tracking-wide flex items-center gap-1.5 hover:opacity-90 transition-opacity pl-5 border-l border-[#FFD700]/20">
            <Icon name="ShoppingBag" size={13} />
            Каталог
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Десктоп — телефон премиум-капсулой */}
          <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            className="hidden lg:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-sm hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
              <Icon name="Phone" size={13} />
            </div>
            <span className="whitespace-nowrap">+7 (992) 999-03-33</span>
          </a>
          {/* Планшет: только иконка телефона */}
          <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })}
            className="hidden md:flex lg:hidden items-center justify-center w-9 h-9 rounded-md border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors">
            <Icon name="Phone" size={16} />
          </a>
          {!installed && (
            <button onClick={() => setInstallOpen(true)} title="Установить как приложение"
              className="hidden md:flex items-center gap-1.5 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-xs px-2.5 py-1.5 rounded-md hover:bg-[#FFD700]/10 transition-all">
              <Icon name="Download" size={13} />
              <span className="hidden lg:inline">Приложение</span>
            </button>
          )}
          <a href="/staff"
            className="hidden md:flex items-center gap-1.5 border border-[#FFD700]/25 hover:border-[#FFD700]/60 text-[#FFD700]/70 hover:text-[#FFD700] font-roboto text-xs px-2.5 py-1.5 rounded-md hover:bg-[#FFD700]/5 transition-all">
            <Icon name="LogIn" size={13} />
            <span className="hidden lg:inline">Сотрудник</span>
          </a>
          <button onClick={onToggleMenu} className="md:hidden p-2 text-white hover:text-[#FFD700] active:scale-95 transition-all">
            <Icon name={menuOpen ? "X" : "Menu"} size={26} />
          </button>
        </div>
      </div>
      <InstallAppModal open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
};

export default MainNav;