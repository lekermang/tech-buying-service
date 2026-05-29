import Icon from "@/components/ui/icon";
import type { StaffTab } from "./staffConstants";

type SectionMeta = {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  skip?: boolean;
};

const SECTION_META: Record<string, SectionMeta> = {
  repair:       { title: "Ремонт",       subtitle: "Заявки, сроки, статусы и история обслуживания",           icon: "Wrench",      color: "#fb923c" },
  clients:      { title: "Клиенты",      subtitle: "База клиентов, скидки и СМС-рассылки",                    icon: "Users",       color: "#60a5fa" },
  analytics:    { title: "Статистика",   subtitle: "Аналитика по продажам, ремонтам и сотрудникам",           icon: "BarChart2",   color: "#a78bfa" },
  smartlombard: { title: "СмартЛомбард", subtitle: "Скупка и продажа Б/У техники",                            icon: "Coins",       color: "#FFD700",  skip: true },
  avitopro:     { title: "Авито PRO",    subtitle: "Сводка по объявлениям, статистика и автодействия",         icon: "Zap",         color: "#34d399",  skip: true },
  gold:         { title: "Золото",       subtitle: "Учёт ювелирных изделий и драгметаллов",                   icon: "Gem",         color: "#fbbf24" },
  employees:    { title: "Команда",      subtitle: "Управление сотрудниками, ролями и графиками",             icon: "UserCog",     color: "#60a5fa" },
  goods:        { title: "Товары",       subtitle: "Каталог товаров в наличии",                               icon: "Package",     color: "#34d399" },
  sales:        { title: "Продажи",      subtitle: "История продаж и операций",                               icon: "Receipt",     color: "#a3e635" },
  myday:        { title: "Мой день",     subtitle: "Чек-лист, сигналы и узкие места на сегодня",              icon: "Sunrise",     color: "#fb923c",  skip: true },
  wanttobuy:    { title: "Хочу купить",  subtitle: "Заявки клиентов на поиск б/у и нового товара",            icon: "ShoppingBag", color: "#60a5fa",  skip: true },
};

export default function StaffSectionBanner({ tab }: { tab: StaffTab }) {
  const meta = SECTION_META[tab];
  if (!meta || meta.skip) return null;

  const color = meta.color || "#FFD700";

  return (
    <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 max-w-[1400px] mx-auto w-full">
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${color}0d 0%, rgba(5,5,8,0) 60%)`,
          border: `1px solid ${color}25`,
          boxShadow: `0 0 30px ${color}08, inset 0 1px 0 ${color}15`,
        }}>

        {/* Угловое свечение */}
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full blur-2xl pointer-events-none"
          style={{ background: `${color}18` }} />

        {/* Верхняя полоска */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

        {/* Фоновый код-паттерн */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[40px] font-bold pointer-events-none select-none hidden sm:block"
          style={{ color: `${color}06`, letterSpacing: "-0.05em" }}>
          {tab.toUpperCase()}
        </div>

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Иконка */}
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
              boxShadow: `0 0 16px ${color}20`,
            }}>
            <Icon name={meta.icon} size={18} style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} />
          </div>

          {/* Текст */}
          <div className="flex-1 min-w-0">
            <h1 className="font-oswald font-bold uppercase text-base tracking-wide leading-tight"
              style={{ color, textShadow: `0 0 20px ${color}50` }}>
              {meta.title}
            </h1>
            <p className="text-[11px] font-roboto text-white/35 truncate leading-tight mt-0.5">
              {meta.subtitle}
            </p>
          </div>

          {/* Online-индикатор */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-green-400">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
