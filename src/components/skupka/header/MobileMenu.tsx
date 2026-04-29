import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import type { NavLink } from "./MainNav";
import InstallAppModal, { isStandaloneApp } from "@/components/InstallAppModal";

interface MobileMenuProps {
  open: boolean;
  navLinks: NavLink[];
  onNav: (href: string) => void;
}

const MobileMenu = ({ open, navLinks, onNav }: MobileMenuProps) => {
  const [installOpen, setInstallOpen] = useState(false);
  const installed = isStandaloneApp();
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-x-0 top-0 bottom-0 bg-[#0D0D0D] z-[60] flex flex-col overflow-y-auto pt-[88px]">
      <div className="px-4 py-2 flex-1">
        {navLinks.map(l => (
          <button key={l.href} onClick={() => onNav(l.href)}
            className="flex items-center justify-between w-full py-4 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-base">
            {l.label}
            <Icon name="ChevronRight" size={16} className="text-white/20" />
          </button>
        ))}
        <a href="/catalog" className="flex items-center justify-between w-full py-4 font-roboto text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-base font-bold">
          <span className="flex items-center gap-2"><Icon name="ShoppingBag" size={16} />Каталог техники</span>
          <Icon name="ChevronRight" size={16} className="text-[#FFD700]/40" />
        </a>
        {!installed && (
          <button
            onClick={() => setInstallOpen(true)}
            className="flex items-center justify-between w-full py-4 font-roboto border-b border-white/5 uppercase tracking-wide text-base font-bold text-white"
          >
            <span className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md bg-[#0A0A0A] border border-[#FFD700] flex items-center justify-center">
                <span className="font-oswald font-black text-[#FFD700] text-base leading-none">S</span>
              </span>
              Добавить сайт как приложение
            </span>
            <Icon name="Download" size={18} className="text-[#FFD700]" />
          </button>
        )}
        <a href="/cabinet" className="flex items-center justify-between w-full py-4 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-base">
          <span className="flex items-center gap-2"><Icon name="User" size={16} />Личный кабинет клиента</span>
          <Icon name="ChevronRight" size={16} className="text-white/20" />
        </a>
      </div>
      <div className="px-4 pt-4 pb-8 space-y-3">
        <a href="tel:+79929990333"
          className="flex items-center justify-center gap-3 w-full bg-[#FFD700] text-black font-oswald font-bold text-xl py-4 uppercase tracking-wide active:scale-95 transition-all">
          <Icon name="Phone" size={22} />
          +7 (992) 999-03-33
        </a>
        <a href="https://t.me/skypka24"
          target="_blank" rel="noopener noreferrer"
          onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "mobile_menu" })}
          className="flex items-center justify-center gap-3 w-full border-2 border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-base py-3.5 uppercase tracking-wide active:scale-95 transition-all">
          <Icon name="MessageCircle" size={18} />
          Написать в Telegram
        </a>
        <a href="/staff"
          className="flex items-center justify-center gap-2 w-full border border-[#1F1F1F] bg-[#0A0A0A] text-white/80 hover:text-white hover:border-white/30 font-oswald font-bold text-sm py-3 uppercase tracking-wide rounded-md active:scale-95 transition-all">
          <Icon name="LogIn" size={14} />
          Регистрация и вход сотрудника
        </a>
      </div>
      <InstallAppModal open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
};

export default MobileMenu;