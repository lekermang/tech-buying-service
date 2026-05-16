import Icon from "@/components/ui/icon";
import type { StaffTab } from "./staffConstants";

/**
 * Премиум-баннер раздела Staff — в стиле HeroSection / шапки СКУПКА24 на главной.
 * Conic-градиент медальон + shimmer-заголовок + golden-glow + статус "online".
 * Автоматически появляется над контентом каждого таба (кроме разделов со своей шапкой).
 */

type SectionMeta = {
  title: string;
  subtitle: string;
  icon: string;
  /** Не показывать баннер для этого таба — раздел сам рисует свою шапку */
  skip?: boolean;
};

const SECTION_META: Record<string, SectionMeta> = {
  repair:       { title: "Ремонт",       subtitle: "Заявки, сроки, статусы и история обслуживания",           icon: "Wrench" },
  clients:      { title: "Клиенты",      subtitle: "База клиентов, скидки и СМС-рассылки",                    icon: "Users" },
  analytics:    { title: "Статистика",   subtitle: "Аналитика по продажам, ремонтам и сотрудникам",           icon: "BarChart2" },
  smartlombard: { title: "СмартЛомбард", subtitle: "Скупка и продажа Б/У техники",                            icon: "Coins", skip: true },
  avitopro:     { title: "Авито PRO",    subtitle: "Сводка по объявлениям, статистика и автодействия",         icon: "Zap", skip: true },
  gold:         { title: "Золото",       subtitle: "Учёт ювелирных изделий и драгметаллов",                   icon: "Gem" },
  employees:    { title: "Команда",      subtitle: "Управление сотрудниками, ролями и графиками",             icon: "UserCog" },
  goods:        { title: "Товары",       subtitle: "Каталог товаров в наличии",                               icon: "Package" },
  sales:        { title: "Продажи",      subtitle: "История продаж и операций",                               icon: "Receipt" },
};

export default function StaffSectionBanner({ tab }: { tab: StaffTab }) {
  const meta = SECTION_META[tab];
  if (!meta || meta.skip) return null;

  return (
    <div className="relative px-3 pt-3 pb-2 sm:px-4 sm:pt-4 max-w-[1400px] mx-auto w-full">
      <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/25 bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/3 to-transparent shadow-[0_0_28px_rgba(255,215,0,0.07),inset_0_1px_0_rgba(255,215,0,0.12)]">
        {/* Декоративные слои — как Hero на главной */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 90%)",
          }}
        />
        <div className="absolute -top-12 -left-10 w-44 h-44 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.12)" }} />
        <div className="absolute -bottom-16 right-6 w-44 h-44 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.06)" }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent" />

        <div className="relative flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          {/* Conic-медальон с иконкой */}
          <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_16px_rgba(255,215,0,0.35)]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
              <Icon name={meta.icon} size={18} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]" />
            </div>
          </div>

          {/* Заголовок + подпись */}
          <div className="flex-1 min-w-0">
            <h1 className="font-oswald font-bold uppercase text-[15px] sm:text-[17px] tracking-[0.06em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
              {meta.title}
            </h1>
            <div className="text-[10px] sm:text-[11px] text-white/55 truncate leading-tight">
              {meta.subtitle}
            </div>
          </div>

          {/* Premium индикатор */}
          <div
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 border border-[#FFD700]/30 shrink-0 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,215,0,0.08)]"
            title="Раздел активен"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-[#FFD700]">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}