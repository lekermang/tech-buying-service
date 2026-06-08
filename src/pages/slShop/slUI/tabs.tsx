import { useRef, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { SLTooltip } from "./tooltip";

// ============ Тип ============================================================
export type SLTabItem = {
  v: string;
  l: string;
  icon?: string;
  badge?: number | string;
  featured?: boolean;
  tooltip?: string;
};

// ============ SLTabs — горизонтальный скролл-таб (периоды) ===================
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
  const sizeCls = size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]";
  const iconSize = size === "sm" ? 10 : 11;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
        {items.map(t => {
          const active = value === t.v;
          const btn = (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange(t.v)}
              aria-label={t.tooltip || t.l}
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg font-oswald font-bold uppercase tracking-[0.08em] transition-all duration-150 active:scale-95 ${sizeCls}`}
              style={active ? {
                background: "linear-gradient(135deg, #FFE34D 0%, #FFD700 50%, #d4a017 100%)",
                color: "#000",
                boxShadow: "0 0 16px rgba(255,215,0,0.4), 0 3px 10px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.35)",
              } : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.45)",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,215,0,0.85)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              {t.icon && <Icon name={t.icon} size={iconSize} />}
              {t.l}
              {((typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge)) && (
                <span className={`text-[8px] leading-none px-1 py-0.5 rounded-full font-bold ml-0.5 ${active ? "bg-black/20 text-black" : "bg-[#FFD700]/15 text-[#FFD700]"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
          return t.tooltip
            ? <SLTooltip key={t.v} content={t.tooltip} placement="bottom" delay={400}>{btn}</SLTooltip>
            : btn;
        })}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

// ============ SLTabsGrid — горизонтальный nav СмартЛомбарда =================
/*
  Концепция: вместо скучной 4-колоночной таблицы квадратиков —
  два ряда горизонтального скролла:
  1. PRIMARY ROW: большие «pill-кнопки» с иконкой + именем для топ-разделов
  2. SECONDARY ROW: компактные кнопки для всего остального
  Активная вкладка — неоновый подчёркивающий индикатор + glow.
*/

const PRIMARY_KEYS = ["dashboard", "buy", "stock", "operations", "analytics", "cash"];

const PRIMARY_ACCENT: Record<string, { bg: string; glow: string; iconColor: string; indicator: string }> = {
  dashboard: { bg: "rgba(255,215,0,0.12)",  glow: "rgba(255,215,0,0.3)",   iconColor: "#FFD700",  indicator: "#FFD700" },
  buy:       { bg: "rgba(74,222,128,0.12)", glow: "rgba(74,222,128,0.3)",  iconColor: "#4ade80",  indicator: "#4ade80" },
  stock:     { bg: "rgba(96,165,250,0.12)", glow: "rgba(96,165,250,0.3)",  iconColor: "#60a5fa",  indicator: "#60a5fa" },
  operations:{ bg: "rgba(251,146,60,0.12)", glow: "rgba(251,146,60,0.3)",  iconColor: "#fb923c",  indicator: "#fb923c" },
  analytics: { bg: "rgba(167,139,250,0.12)",glow: "rgba(167,139,250,0.3)", iconColor: "#a78bfa",  indicator: "#a78bfa" },
  cash:      { bg: "rgba(52,211,153,0.12)", glow: "rgba(52,211,153,0.3)",  iconColor: "#34d399",  indicator: "#34d399" },
};

export function SLTabsGrid({
  items, value, onChange, className = "",
}: {
  items: SLTabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const primary = items.filter(t => PRIMARY_KEYS.includes(t.v));
  const secondary = items.filter(t => !PRIMARY_KEYS.includes(t.v));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* ── Основные разделы ── */}
      <PrimaryRow items={primary} value={value} onChange={onChange} />
      {/* ── Дополнительные ── */}
      {secondary.length > 0 && (
        <SecondaryRow items={secondary} value={value} onChange={onChange} />
      )}
    </div>
  );
}

// ─── Строка основных разделов (крупные пилюли) ───────────────────────────────
function PrimaryRow({ items, value, onChange }: {
  items: SLTabItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<string | null>(null);

  // Автоскролл к активной вкладке
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {items.map(t => {
        const active = value === t.v;
        const isPressed = pressed === t.v;
        const accent = PRIMARY_ACCENT[t.v];

        const btn = (
          <button
            key={t.v}
            data-active={active}
            type="button"
            onClick={() => onChange(t.v)}
            onPointerDown={() => setPressed(t.v)}
            onPointerUp={() => setPressed(null)}
            onPointerLeave={() => setPressed(null)}
            className="relative shrink-0 flex flex-col items-center rounded-xl overflow-hidden active:scale-[0.93]"
            style={{
              minWidth: 68,
              padding: "10px 12px 8px",
              transition: "all 0.18s ease",
              transform: isPressed ? "scale(0.93)" : "scale(1)",
              ...(active ? {
                background: `linear-gradient(160deg, ${accent?.bg ?? "rgba(255,215,0,0.12)"} 0%, rgba(10,8,5,0.95) 100%)`,
                border: `1px solid ${accent?.glow ?? "rgba(255,215,0,0.3)"}`,
                boxShadow: `0 0 20px ${accent?.glow ?? "rgba(255,215,0,0.3)"}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }),
            }}
            onMouseEnter={e => {
              if (active) return;
              (e.currentTarget as HTMLElement).style.background = accent?.bg ?? "rgba(255,215,0,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = accent?.glow ?? "rgba(255,215,0,0.25)";
            }}
            onMouseLeave={e => {
              if (active) return;
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            }}
          >
            {/* Top indicator bar */}
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] rounded-b"
                style={{
                  width: "60%",
                  background: accent?.indicator ?? "#FFD700",
                  boxShadow: `0 0 8px ${accent?.indicator ?? "#FFD700"}, 0 0 16px ${accent?.glow ?? "rgba(255,215,0,0.4)"}`,
                }} />
            )}

            {/* Иконка в рамке */}
            {t.icon && (
              <div className="relative mb-1.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                  background: active ? (accent?.bg ?? "rgba(255,215,0,0.15)") : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? (accent?.glow ?? "rgba(255,215,0,0.4)") : "rgba(255,255,255,0.07)"}`,
                  boxShadow: active ? `0 0 12px ${accent?.glow ?? "rgba(255,215,0,0.3)"}` : "none",
                  transition: "all 0.18s ease",
                }}>
                  <Icon name={t.icon} size={17} style={{
                    color: active ? (accent?.iconColor ?? "#FFD700") : "rgba(255,255,255,0.45)",
                    filter: active ? `drop-shadow(0 0 5px ${accent?.glow ?? "rgba(255,215,0,0.5)"})` : "none",
                    transition: "all 0.18s ease",
                  }} />
                </div>
                {/* Бейдж */}
                {((typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge)) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 text-[8px] font-bold rounded-full flex items-center justify-center bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse">
                    {t.badge}
                  </span>
                )}
              </div>
            )}

            {/* Лейбл */}
            <span className="whitespace-nowrap leading-none text-center" style={{
              fontFamily: "Oswald, sans-serif",
              fontSize: "9.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: active ? (accent?.iconColor ?? "#FFD700") : "rgba(255,255,255,0.5)",
              textShadow: active ? `0 0 8px ${accent?.glow ?? "rgba(255,215,0,0.4)"}` : "none",
              transition: "all 0.18s ease",
            }}>
              {t.l}
            </span>
          </button>
        );

        return t.tooltip
          ? <SLTooltip key={t.v} content={t.tooltip} placement="top" delay={500}>{btn}</SLTooltip>
          : btn;
      })}
    </div>
  );
}

// ─── Строка дополнительных разделов (компактные чипы) ────────────────────────
function SecondaryRow({ items, value, onChange }: {
  items: SLTabItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [pressed, setPressed] = useState<string | null>(null);

  // Группировка: featured — первыми
  const featured = items.filter(t => t.featured);
  const regular = items.filter(t => !t.featured);
  const sorted = [...featured, ...regular];

  return (
    <div className="relative rounded-xl overflow-hidden"
      style={{
        background: "rgba(14,12,9,0.95)",
        border: "1px solid rgba(255,215,0,0.1)",
      }}>
      {/* Левая вертикальная золотая полоска */}
      <div className="absolute top-0 left-0 bottom-0 w-[2px] pointer-events-none z-10" style={{
        background: "linear-gradient(180deg, transparent, rgba(255,215,0,0.5) 30%, rgba(255,215,0,0.7) 50%, rgba(255,215,0,0.5) 70%, transparent)",
      }} />

      <div className="flex gap-1.5 overflow-x-auto pl-5 pr-2 py-2"
        style={{ scrollbarWidth: "none" }}>
        {sorted.map(t => {
          const active = value === t.v;
          const isFeat = t.featured && !active;
          const isPressed = pressed === t.v;

          const btn = (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange(t.v)}
              onPointerDown={() => setPressed(t.v)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              className="relative shrink-0 inline-flex items-center gap-1.5 rounded-lg overflow-hidden transition-all"
              style={{
                padding: "6px 11px",
                transform: isPressed ? "scale(0.93)" : "scale(1)",
                transition: "transform 0.1s ease, background 0.15s ease",
                ...(active ? {
                  background: "rgba(255,215,0,0.2)",
                  border: "1px solid rgba(255,215,0,0.4)",
                  boxShadow: "0 0 14px rgba(255,215,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                } : isFeat ? {
                  background: "rgba(255,215,0,0.08)",
                  border: "1px solid rgba(255,215,0,0.3)",
                  boxShadow: "0 0 8px rgba(255,215,0,0.12)",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }),
              }}
              onMouseEnter={e => {
                if (active) return;
                (e.currentTarget as HTMLElement).style.background = isFeat ? "rgba(255,215,0,0.14)" : "rgba(255,215,0,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.35)";
              }}
              onMouseLeave={e => {
                if (active) return;
                (e.currentTarget as HTMLElement).style.background = isFeat ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = isFeat ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.07)";
              }}
            >
              {/* Featured пульс */}
              {isFeat && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
                </span>
              )}

              {/* Иконка */}
              {t.icon && (
                <Icon name={t.icon} size={12}
                  style={{
                    color: active ? "#FFD700" : isFeat ? "#FFD700" : "rgba(255,255,255,0.55)",
                    filter: (active || isFeat) ? "drop-shadow(0 0 4px rgba(255,215,0,0.7))" : "none",
                  }} />
              )}

              {/* Лейбл */}
              <span className="font-oswald font-bold uppercase tracking-[0.05em] whitespace-nowrap"
                style={{
                  fontSize: "10px",
                  color: active ? "#FFD700" : isFeat ? "#FFD700" : "rgba(255,255,255,0.55)",
                  textShadow: active ? "0 0 8px rgba(255,215,0,0.6), 0 0 16px rgba(255,215,0,0.3)" : "none",
                }}>
                {t.l}
              </span>

              {/* Бейдж */}
              {((typeof t.badge === "number" && t.badge > 0) || (typeof t.badge === "string" && t.badge)) && (
                <span className={`text-[8px] px-1 py-0.5 rounded-full font-bold leading-none ${active ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-red-500 text-white shadow-[0_0_5px_rgba(239,68,68,0.7)] animate-pulse"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );

          return t.tooltip
            ? <SLTooltip key={t.v} content={t.tooltip} placement="top" delay={500}>{btn}</SLTooltip>
            : btn;
        })}
      </div>
    </div>
  );
}