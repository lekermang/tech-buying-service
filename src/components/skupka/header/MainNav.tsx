import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

export type NavLink = { label: string; href: string };

interface MainNavProps {
  navLinks: NavLink[];
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNav: (href: string) => void;
}

const MainNav = ({ navLinks, menuOpen, onToggleMenu, onNav }: MainNavProps) => {
  return (
    <div className="bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
            alt="Скупка24"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div>
            <span className="font-oswald font-bold text-lg sm:text-xl tracking-wider animate-shimmer">СКУПКА24</span>
            <div className="font-roboto text-white/40 text-[10px] leading-tight hidden sm:block">Кирова 7/47 · Кирова 11</div>
          </div>
        </div>

        {/* Планшет: компактная навигация */}
        <nav className="hidden md:flex lg:hidden items-center gap-3">
          {navLinks.slice(0, 3).map(l => (
            <button key={l.href} onClick={() => onNav(l.href)}
              className="font-roboto text-xs text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide">
              {l.label}
            </button>
          ))}
          <a href="/catalog" className="font-roboto text-xs text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide flex items-center gap-1">
            <Icon name="ShoppingBag" size={12} />
            Каталог
          </a>
        </nav>

        {/* ПК: полная навигация */}
        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map(l => (
            <button key={l.href} onClick={() => onNav(l.href)}
              className="font-roboto text-sm text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide">
              {l.label}
            </button>
          ))}
          <a href="/catalog"
            className="font-roboto text-sm text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide flex items-center gap-1">
            <Icon name="ShoppingBag" size={13} />
            Каталог
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })} className="hidden lg:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-base hover:opacity-80 transition-opacity">
            <Icon name="Phone" size={16} />
            +7 (992) 999-03-33
          </a>
          {/* Планшет: только иконка телефона */}
          <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })} className="hidden md:flex lg:hidden items-center justify-center w-9 h-9 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors">
            <Icon name="Phone" size={16} />
          </a>
          <a href="/staff" className="hidden md:flex items-center gap-1.5 border border-[#FFD700]/30 text-[#FFD700]/70 hover:text-[#FFD700] hover:border-[#FFD700] font-roboto text-xs px-2.5 py-1.5 transition-colors">
            <Icon name="LogIn" size={13} />
            <span className="hidden lg:inline">Войти</span>
          </a>
          <button onClick={onToggleMenu} className="md:hidden p-2 text-white hover:text-[#FFD700] active:scale-95 transition-all">
            <Icon name={menuOpen ? "X" : "Menu"} size={26} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainNav;
