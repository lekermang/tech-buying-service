import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import type { NavLink } from "./MainNav";
import InstallAppModal, { isStandaloneApp } from "@/components/InstallAppModal";

const ANTIQUE_ITEMS = [
  { label: "Царские монеты",       href: "/russian-coins",     color: "#FFD700" },
  { label: "Православные иконы",    href: "/icons",             color: "#e2a84b" },
  { label: "Фарфор и хрусталь",     href: "/porcelain",         color: "#60a5fa" },
  { label: "Советский антиквариат", href: "/soviet-antiques",   color: "#ef4444" },
  { label: "Древние монеты",        href: "/ancient-coins",     color: "#a3e635" },
  { label: "Бронзовые статуэтки",   href: "/bronze-sculptures", color: "#a78bfa" },
];

interface MobileMenuProps {
  open: boolean;
  navLinks: NavLink[];
  onNav: (href: string) => void;
  onPayClick?: () => void;
}

const MobileMenu = ({ open, navLinks, onNav, onPayClick }: MobileMenuProps) => {
  const [installOpen, setInstallOpen] = useState(false);
  const [antiqueOpen, setAntiqueOpen] = useState(false);
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

        {/* Антиквариат — раскрывающийся раздел */}
        <div className="border-b border-white/5">
          <button
            onClick={() => setAntiqueOpen(o => !o)}
            className="flex items-center justify-between w-full py-4 font-roboto text-[#FFD700] uppercase tracking-wide text-base font-bold"
          >
            <span className="flex items-center gap-2">
              <Icon name="Landmark" size={16} />
              Антиквариат
            </span>
            <Icon name={antiqueOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-[#FFD700]/50" />
          </button>
          {antiqueOpen && (
            <div className="pb-2 pl-2 flex flex-col gap-0.5">
              {ANTIQUE_ITEMS.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 py-2.5 px-2 rounded-lg font-roboto text-white/70 text-sm uppercase tracking-wide hover:text-white transition-colors"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

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
        <a href="/client" className="flex items-center justify-between w-full py-4 mt-2 px-3 -mx-3 rounded-lg bg-gradient-to-r from-[#FFD700]/15 via-[#FFD700]/8 to-transparent border border-[#FFD700]/30 font-roboto uppercase tracking-wide text-base font-bold text-[#FFD700]">
          <span className="flex items-center gap-2"><Icon name="UserCircle" size={18} />Кабинет клиента</span>
          <Icon name="ChevronRight" size={16} className="text-[#FFD700]/60" />
        </a>
      </div>
      <div className="px-4 pt-4 pb-8 space-y-3">
        <a href="tel:+79929990333"
          className="flex items-center justify-center gap-3 w-full bg-[#FFD700] text-black font-oswald font-bold text-xl py-4 uppercase tracking-wide active:scale-95 transition-all">
          <Icon name="Phone" size={22} />
          8 992 999-03-33
        </a>
        <a href="https://t.me/skypka24"
          target="_blank" rel="noopener noreferrer"
          onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "mobile_menu" })}
          className="flex items-center justify-center gap-3 w-full border-2 border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-base py-3.5 uppercase tracking-wide active:scale-95 transition-all">
          <Icon name="MessageCircle" size={18} />
          Написать в Telegram
        </a>
        {onPayClick && (
          <button
            onClick={onPayClick}
            className="flex items-center justify-center gap-3 w-full border-2 border-emerald-500/50 text-emerald-400 font-oswald font-bold text-base py-3.5 uppercase tracking-wide active:scale-95 transition-all">
            <Icon name="CreditCard" size={18} />
            Оплатить услуги
          </button>
        )}
        <a href="/chat"
          onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "mobile_menu_chat" })}
          className="flex items-center justify-center gap-3 w-full border-2 border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700] font-oswald font-bold text-base py-3.5 uppercase tracking-wide active:scale-95 transition-all">
          <span className="relative flex items-center justify-center">
            <Icon name="MessageSquare" size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" />
          </span>
          Чат Live
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