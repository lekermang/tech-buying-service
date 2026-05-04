import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { SLTooltip } from "./tooltip";

// ============ Премиум-сегмент-таб (для табов и периодов) ============
export type SLTabItem = {
  v: string;
  l: string;
  icon?: string;
  badge?: number | string;
  featured?: boolean;
  tooltip?: string;
};

export function SLTabs({
  items, value, onChange, className = "", size = "md", right,
}: {
  items: SLTabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: "sm" | "md";
  right?: ReactNode;
}) {
  const sizeCls = size === "sm"
    ? "px-2 py-1 text-[10px]"
    : "px-2.5 py-1.5 text-[11px]";
  const iconSize = size === "sm" ? 10 : 11;
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 flex-1">
        {items.map(t => {
          const active = value === t.v;
          const featured = t.featured && !active;
          const btn = (
            <button
              type="button"
              onClick={() => onChange(t.v)}
              aria-label={t.tooltip || t.l}
              className={`shrink-0 inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-[0.06em] transition-all active:scale-[0.96] ${sizeCls} ${
                active
                  ? "bg-gradient-to-b from-[#FFE34D] to-[#FFD700] text-black shadow-[0_2px_10px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]"
                  : featured
                    ? "bg-gradient-to-br from-[#FFD700]/22 via-[#FFD700]/8 to-transparent border border-[#FFD700]/55 text-[#FFD700] hover:bg-[#FFD700]/18 shadow-[0_0_12px_rgba(255,215,0,0.22)]"
                    : "bg-[#0E0E0E] border border-[#1A1A1A] text-white/55 hover:text-white hover:border-[#FFD700]/30 hover:bg-[#131313]"
              }`}
            >
              {t.icon && <Icon name={t.icon} size={iconSize} />}
              {t.l}
              {(typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge) ? (
                <span className={`text-[8px] leading-none px-1 py-0.5 rounded-full font-bold ml-0.5 ${active ? "bg-black/20 text-black" : "bg-[#FFD700]/15 text-[#FFD700]"}`}>
                  {t.badge}
                </span>
              ) : null}
              {featured && (
                <span className="relative inline-flex h-1 w-1 ml-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-[#FFD700]" />
                </span>
              )}
            </button>
          );
          if (t.tooltip) {
            return (
              <SLTooltip key={t.v} content={t.tooltip} placement="bottom" delay={400}>
                {btn}
              </SLTooltip>
            );
          }
          return <span key={t.v}>{btn}</span>;
        })}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

// ============ Премиум-таб-плитки (сетка) — для главного меню СмартЛомбарда ============
export function SLTabsGrid({
  items, value, onChange, className = "",
}: {
  items: SLTabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 ${className}`}>
      {items.map(t => {
        const active = value === t.v;
        const featured = t.featured && !active;
        const tile = (
          <button
            type="button"
            onClick={() => onChange(t.v)}
            aria-label={t.tooltip || t.l}
            className={`group relative w-full h-[68px] rounded-xl flex flex-col items-center justify-center gap-1 px-1.5 py-2 font-bold uppercase tracking-[0.04em] text-[10px] transition-all active:scale-[0.96] overflow-hidden ${
              active
                ? "bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black shadow-[0_4px_18px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_8px_rgba(184,134,11,0.3)] border border-[#FFD700]/60"
                : featured
                  ? "bg-gradient-to-br from-[#FFD700]/22 via-[#FFD700]/6 to-transparent border border-[#FFD700]/55 text-[#FFD700] hover:from-[#FFD700]/30 hover:via-[#FFD700]/10 shadow-[0_0_18px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,215,0,0.18)]"
                  : "bg-gradient-to-br from-[#141414] via-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-white hover:border-[#FFD700]/40 hover:shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,215,0,0.05),0_0_12px_rgba(255,215,0,0.08)] hover:from-[#181818] hover:to-[#0E0E0E]"
            }`}
          >
            {/* Световой блик при hover (не активный) */}
            {!active && (
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            {/* Активный — двойная подсветка */}
            {active && (
              <>
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <span className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-white/30 blur-xl pointer-events-none" />
              </>
            )}

            {/* Featured indicator */}
            {featured && (
              <span className="absolute top-1 right-1.5 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFD700]" />
              </span>
            )}

            {/* Иконка с золотым свечением */}
            {t.icon && (
              <div className={`relative ${active ? "drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]" : featured ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" : "group-hover:drop-shadow-[0_0_5px_rgba(255,215,0,0.4)] transition-all"}`}>
                <Icon name={t.icon} size={18} />
                {/* Бейдж */}
                {((typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge)) ? (
                  <span className={`absolute -top-1.5 -right-3 min-w-[14px] h-[14px] px-1 text-[8px] font-bold rounded-full flex items-center justify-center leading-none ${
                    active ? "bg-black/25 text-black border border-black/30" : "bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  }`}>{t.badge}</span>
                ) : null}
              </div>
            )}

            {/* Название */}
            <span className="relative leading-tight text-center line-clamp-2 px-0.5">{t.l}</span>
          </button>
        );
        if (t.tooltip) {
          return (
            <SLTooltip key={t.v} content={t.tooltip} placement="top" delay={400}>
              {tile}
            </SLTooltip>
          );
        }
        return <span key={t.v} className="block">{tile}</span>;
      })}
    </div>
  );
}
