import { useState } from "react";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "Что принимаем", href: "#catalog" },
  { label: "Как работает", href: "#how" },
  { label: "Гарантии", href: "#guarantees" },
  { label: "Филиалы", href: "#branches" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
];

interface HeaderProps {
  scrollTo: (href: string) => void;
}

const Header = ({ scrollTo }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (href: string) => {
    scrollTo(href);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
            alt="Скупка24"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <span className="font-oswald font-bold text-xl tracking-wider animate-shimmer">СКУПКА24</span>
            <div className="font-roboto text-white/40 text-[10px] leading-tight">Кирова 7/47 · Кирова 11</div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)}
              className="font-roboto text-sm text-white/70 hover:text-[#FFD700] transition-colors uppercase tracking-wide">
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="tel:+79929990333" className="hidden md:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-base hover:opacity-80 transition-opacity">
            <Icon name="Phone" size={16} />
            +7 (992) 999-03-33
          </a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-white hover:text-[#FFD700]">
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-[#1A1A1A] border-t border-[#FFD700]/20 px-4 py-4">
          {NAV_LINKS.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)}
              className="block w-full text-left py-3 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-sm">
              {l.label}
            </button>
          ))}
          <a href="tel:+79929990333" className="flex items-center gap-2 mt-4 text-[#FFD700] font-oswald font-semibold text-lg">
            <Icon name="Phone" size={16} />
            +7 (992) 999-03-33
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;