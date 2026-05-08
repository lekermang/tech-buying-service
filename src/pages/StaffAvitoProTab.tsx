import { useState } from "react";
import Icon from "@/components/ui/icon";
import AvitoDashboard from "./staffAvitoPro/AvitoDashboard";
import AvitoChat from "./staffAvitoPro/AvitoChat";
import AvitoPromote from "./staffAvitoPro/AvitoPromote";
import AvitoAutoload from "./staffAvitoPro/AvitoAutoload";
import { SubTab } from "./staffAvitoPro/types";

const SUB_TABS: { k: SubTab; l: string; icon: string; tip: string }[] = [
  { k: "dashboard", l: "Сводка", icon: "LayoutDashboard", tip: "Тоталы, графики, топ объявлений" },
  { k: "chat", l: "Чат", icon: "MessageCircle", tip: "Переписка с покупателями Авито" },
  { k: "promote", l: "Продвижение", icon: "Rocket", tip: "Расписание поднятий объявлений" },
  { k: "autoload", l: "Autoload", icon: "Upload", tip: "XML-фид публикации товаров" },
];

export default function StaffAvitoProTab(_props: { token: string }) {
  void _props;
  const [sub, setSub] = useState<SubTab>(() => {
    try {
      const saved = localStorage.getItem("avitopro_subtab");
      if (saved && ["dashboard", "chat", "promote", "autoload"].includes(saved)) return saved as SubTab;
    } catch { /* ignore */ }
    return "dashboard";
  });

  const setActive = (s: SubTab) => {
    setSub(s);
    try { localStorage.setItem("avitopro_subtab", s); } catch { /* ignore */ }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 pt-3 pb-6 space-y-3">
      {/* Шапка раздела */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-3 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FFD700]/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

        <div className="relative flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
            <Icon name="Zap" size={18} className="text-black drop-shadow" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-oswald font-bold uppercase text-[15px] tracking-[0.04em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#FFE34D] to-[#FFD700] bg-clip-text text-transparent">
              Авито PRO
            </div>
            <div className="text-[11px] text-white/60 mt-0.5">
              Сводка, чаты, автопродвижение и публикация товаров — всё в одном месте
            </div>
          </div>
        </div>
      </div>

      {/* Навигация по подразделам */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-1.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {SUB_TABS.map(t => (
            <button
              key={t.k}
              onClick={() => setActive(t.k)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all ${
                sub === t.k
                  ? "bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/40 shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                  : "border border-transparent hover:bg-white/5"
              }`}
              title={t.tip}
            >
              <Icon
                name={t.icon}
                size={16}
                className={sub === t.k ? "text-[#FFD700]" : "text-white/60"}
              />
              <span className={`font-oswald font-bold text-[12px] uppercase tracking-wide ${
                sub === t.k ? "text-[#FFD700]" : "text-white/70"
              }`}>
                {t.l}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div>
        {sub === "dashboard" && <AvitoDashboard />}
        {sub === "chat" && <AvitoChat />}
        {sub === "promote" && <AvitoPromote />}
        {sub === "autoload" && <AvitoAutoload />}
      </div>
    </div>
  );
}
