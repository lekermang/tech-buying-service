import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import type { StaffTab } from "./staffConstants";

type SectionMeta = {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  skip?: boolean;
  tag?: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  repair:       { title: "Ремонт",       subtitle: "Заявки, сроки, статусы и история обслуживания",         icon: "Wrench",      color: "#fb923c", tag: "REPAIR_SYS" },
  clients:      { title: "Клиенты",      subtitle: "База клиентов, скидки и СМС-рассылки",                  icon: "Users",       color: "#60a5fa", tag: "CRM_DB" },
  analytics:    { title: "Статистика",   subtitle: "Аналитика по продажам, ремонтам и сотрудникам",         icon: "BarChart2",   color: "#a78bfa", tag: "ANALYTICS" },
  smartlombard: { title: "СмартЛомбард", subtitle: "Скупка и продажа Б/У техники",                          icon: "Coins",       color: "#FFD700",  skip: true },
  avitopro:     { title: "Авито PRO",    subtitle: "Сводка по объявлениям, статистика и автодействия",       icon: "Zap",         color: "#34d399",  skip: true },
  gold:         { title: "Золото",       subtitle: "Учёт ювелирных изделий и драгметаллов",                 icon: "Gem",         color: "#fbbf24", tag: "GOLD_ACC" },
  employees:    { title: "Команда",      subtitle: "Управление сотрудниками, ролями и графиками",           icon: "UserCog",     color: "#60a5fa", tag: "TEAM_MGR" },
  goods:        { title: "Товары",       subtitle: "Каталог товаров в наличии",                             icon: "Package",     color: "#34d399", tag: "STOCK_DB" },
  sales:        { title: "Продажи",      subtitle: "История продаж и операций",                             icon: "Receipt",     color: "#a3e635", tag: "SALES_LOG" },
  myday:        { title: "Мой день",     subtitle: "Чек-лист, сигналы и узкие места на сегодня",            icon: "Sunrise",     color: "#fb923c",  skip: true },
  wanttobuy:    { title: "Хочу купить",  subtitle: "Заявки клиентов на поиск б/у и нового товара",          icon: "ShoppingBag", color: "#60a5fa",  skip: true },
};

export default function StaffSectionBanner({ tab }: { tab: StaffTab }) {
  const meta = SECTION_META[tab];
  const [mounted, setMounted] = useState(false);
  const [prevTab, setPrevTab] = useState(tab);
  const [visible, setVisible] = useState(true);

  // Анимация при смене таба
  useEffect(() => {
    if (tab !== prevTab) {
      setVisible(false);
      const t1 = setTimeout(() => { setPrevTab(tab); setVisible(true); }, 120);
      return () => clearTimeout(t1);
    }
  }, [tab, prevTab]);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const currentMeta = SECTION_META[prevTab];
  if (!currentMeta || currentMeta.skip) return null;

  const color = currentMeta.color || "#FFD700";

  return (
    <>
      <style>{`
        @keyframes scanLineBanner {
          0%   { top: 0; opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="px-3 pt-3 pb-0 sm:px-4 sm:pt-3 max-w-[1400px] mx-auto w-full">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${color}0e 0%, rgba(5,5,8,0.0) 65%)`,
            border: `1px solid ${color}22`,
            boxShadow: `0 0 24px ${color}0a, inset 0 1px 0 ${color}12`,
            opacity: mounted && visible ? 1 : 0,
            transform: mounted && visible ? "translateY(0)" : "translateY(-4px)",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
        >
          {/* Верхняя неоновая линия */}
          <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }} />

          {/* Сканирующая линия */}
          <div className="absolute left-0 right-0 h-[1px] pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
              animation: "scanLineBanner 4s linear infinite",
              animationDelay: "0.5s",
            }} />

          {/* Угловое свечение */}
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: `${color}20` }} />

          {/* Corner brackets */}
          {[
            { top: 0, left: 0, borderTop: `1.5px solid ${color}50`, borderLeft: `1.5px solid ${color}50` },
            { top: 0, right: 0, borderTop: `1.5px solid ${color}50`, borderRight: `1.5px solid ${color}50` },
            { bottom: 0, left: 0, borderBottom: `1.5px solid ${color}30`, borderLeft: `1.5px solid ${color}30` },
            { bottom: 0, right: 0, borderBottom: `1.5px solid ${color}30`, borderRight: `1.5px solid ${color}30` },
          ].map((s, i) => (
            <span key={i} className="absolute w-4 h-4 pointer-events-none" style={s} />
          ))}

          {/* Фоновый watermark */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-black pointer-events-none select-none hidden sm:block"
            style={{ color: `${color}05`, fontSize: "52px", letterSpacing: "-0.05em", lineHeight: 1 }}>
            {currentMeta.tag || tab.toUpperCase()}
          </div>

          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Иконка */}
            <div className="shrink-0 relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}28`,
                boxShadow: `0 0 20px ${color}18`,
              }}>
              <Icon name={currentMeta.icon} size={18}
                style={{ color, filter: `drop-shadow(0 0 6px ${color}90)` }} />
              {/* Угловая точка иконки */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}`, opacity: 0.8 }} />
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-oswald font-black uppercase text-[15px] tracking-[0.07em] leading-tight"
                  style={{ color, textShadow: `0 0 20px ${color}60` }}>
                  {currentMeta.title}
                </h1>
                {currentMeta.tag && (
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded hidden sm:inline-block"
                    style={{ color: `${color}60`, background: `${color}0a`, border: `1px solid ${color}15`, letterSpacing: "0.1em" }}>
                    {currentMeta.tag}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-roboto truncate leading-tight mt-0.5"
                style={{ color: "rgba(255,255,255,0.32)" }}>
                {currentMeta.subtitle}
              </p>
            </div>

            {/* Статус */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-green-400">Live</span>
              </div>
            </div>
          </div>

          {/* Нижняя линия */}
          <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${color}15, transparent)` }} />
        </div>
      </div>
    </>
  );
}
