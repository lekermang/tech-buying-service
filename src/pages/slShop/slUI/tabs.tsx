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
    <div className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5 ${className}`}>
      {items.map(t => {
        const active = value === t.v;
        const featured = t.featured && !active;
        // Внешний контейнер — для glow-ореола вокруг плитки
        const tile = (
          <div className="relative group">
            {/* HALO — внешний пульсирующий glow вокруг */}
            {active && (
              <span
                aria-hidden
                className="absolute -inset-1.5 rounded-2xl pointer-events-none animate-[goldHalo_2.4s_ease-in-out_infinite]"
                style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.55),rgba(255,215,0,0.18) 55%,transparent 80%)", filter: "blur(10px)" }}
              />
            )}
            {featured && (
              <span
                aria-hidden
                className="absolute -inset-1 rounded-2xl pointer-events-none opacity-80"
                style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.40),rgba(255,215,0,0.10) 60%,transparent 85%)", filter: "blur(10px)" }}
              />
            )}
            {/* Hover-glow для обычных */}
            {!active && !featured && (
              <span
                aria-hidden
                className="absolute -inset-1 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.30),rgba(255,215,0,0.08) 55%,transparent 80%)", filter: "blur(8px)" }}
              />
            )}

            {/* Сама плитка с conic-gradient рамкой */}
            <button
              type="button"
              onClick={() => onChange(t.v)}
              aria-label={t.tooltip || t.l}
              className={`relative w-full h-[62px] rounded-lg p-[1px] overflow-visible transition-all duration-300 active:scale-[0.95] ${
                active
                  ? "bg-[conic-gradient(from_180deg_at_50%_50%,#fff3a0_0deg,#FFD700_90deg,#b8860b_180deg,#FFD700_270deg,#fff3a0_360deg)] shadow-[0_8px_28px_rgba(255,215,0,0.55),0_0_42px_rgba(255,215,0,0.35)]"
                  : featured
                    ? "bg-[conic-gradient(from_0deg_at_50%_50%,#FFD700_0deg,rgba(255,215,0,0.3)_120deg,#fff3a0_240deg,#FFD700_360deg)] shadow-[0_4px_18px_rgba(255,215,0,0.28),0_0_22px_rgba(255,215,0,0.18)]"
                    : "bg-gradient-to-br from-[#1F1F1F] via-[#1A1A1A] to-[#0F0F0F] hover:bg-[conic-gradient(from_120deg_at_50%_50%,rgba(255,215,0,0.55)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,215,0,0.55)_360deg)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.6),0_0_18px_rgba(255,215,0,0.18)]"
              }`}
            >
              {/* Внутренний слой — основное тело плитки */}
              <div
                className={`relative w-full h-full rounded-[7px] flex flex-col items-center justify-center gap-0.5 px-1 py-1 font-bold uppercase tracking-[0.03em] text-[8.5px] overflow-hidden transition-colors duration-200 ${
                  active
                    ? "bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black"
                    : featured
                      ? "bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0A0A0A] text-[#FFD700]"
                      : "bg-gradient-to-br from-[#141414] via-[#0E0E0E] to-[#0A0A0A] text-white/75 group-hover:text-white"
                }`}
              >
                {/* Внутренний верхний highlight */}
                {active && (
                  <>
                    <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#fff3a0] to-transparent" />
                    {/* световое пятно в углу */}
                    <span aria-hidden className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/45 blur-md pointer-events-none" />
                  </>
                )}
                {!active && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/45 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Sweep-блик при hover (для всех) */}
                {!active && (
                  <span aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]">
                    <span
                      className="absolute -inset-y-2 -left-1/2 w-1/2 opacity-0 group-hover:opacity-100 group-hover:left-[120%] transition-all duration-700 ease-out"
                      style={{ background: "linear-gradient(115deg,transparent 30%,rgba(255,215,0,0.35) 50%,transparent 70%)", transform: "skewX(-20deg)" }}
                    />
                  </span>
                )}

                {/* Featured индикатор */}
                {featured && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
                  </span>
                )}

                {/* Иконка с мощным свечением */}
                {t.icon && (
                  <div
                    className={`relative transition-transform duration-300 ${
                      active
                        ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                        : featured
                          ? "drop-shadow-[0_0_10px_rgba(255,215,0,0.85)] group-hover:scale-110"
                          : "group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]"
                    }`}
                  >
                    <Icon name={t.icon} size={15} />
                    {/* Бейдж */}
                    {((typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge)) ? (
                      <span
                        className={`absolute -top-1.5 -right-3 min-w-[14px] h-[14px] px-1 text-[8px] font-bold rounded-full flex items-center justify-center leading-none ${
                          active
                            ? "bg-black/30 text-black border border-black/40"
                            : "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.85)] animate-pulse"
                        }`}
                      >
                        {t.badge}
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Название */}
                <span
                  className={`relative leading-tight text-center line-clamp-2 px-0.5 ${
                    active ? "text-black" : featured ? "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" : ""
                  }`}
                >
                  {t.l}
                </span>
              </div>
            </button>
          </div>
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