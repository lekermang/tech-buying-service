import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { slClasses } from "./primitives";

// ============ Кнопки ============
type SLBtnVariant = "gold" | "goldOutline" | "dark" | "danger" | "success";
export function SLButton({
  children, icon, variant = "gold", size = "md", className = "", ...props
}: {
  children?: ReactNode;
  icon?: string;
  variant?: SLBtnVariant;
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantCls = {
    gold: slClasses.btnGold,
    goldOutline: slClasses.btnGoldOutline,
    dark: slClasses.btnDark,
    danger: slClasses.btnDanger,
    success: slClasses.btnSuccess,
  }[variant];
  const sizeCls = size === "sm" ? "px-2 py-1 text-[10px]" : size === "lg" ? "px-4 py-2.5 text-[12px]" : "px-3 py-1.5 text-[11px]";
  const isGold = variant === "gold";
  return (
    <button className={`relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl font-bold uppercase tracking-wide transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed group ${sizeCls} ${variantCls} ${className}`} {...props}>
      {/* Shimmer sweep on gold variant */}
      {isGold && (
        <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
          background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.45) 48%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.45) 52%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 0.7s ease-out",
        }} />
      )}
      {icon && <Icon name={icon} size={size === "sm" ? 11 : size === "lg" ? 14 : 12} className="relative" />}
      <span className="relative">{children}</span>
    </button>
  );
}

// ============ Pill / Badge ============
export function SLPill({
  children, color = "gold", icon,
}: {
  children: ReactNode;
  color?: "gold" | "green" | "red" | "blue" | "white" | "orange";
  icon?: string;
}) {
  const map = {
    gold: "bg-[#FFD700]/12 text-[#FFD700] border-[#FFD700]/30",
    green: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/12 text-red-300 border-red-500/30",
    blue: "bg-blue-500/12 text-blue-300 border-blue-500/30",
    white: "bg-white/8 text-white/70 border-white/15",
    orange: "bg-orange-500/12 text-orange-300 border-orange-500/30",
  }[color];
  return (
    <span className={`${slClasses.pill} ${map}`}>
      {icon && <Icon name={icon} size={9} />}
      {children}
    </span>
  );
}

// ============ Stat-карточка ============
const STAT_COLORS: Record<string, { border: string; glow: string; bg: string; icon: string }> = {
  white:  { border: "rgba(255,255,255,0.12)", glow: "rgba(255,255,255,0.04)", bg: "rgba(255,255,255,0.03)", icon: "rgba(255,255,255,0.5)" },
  gold:   { border: "rgba(255,215,0,0.25)",   glow: "rgba(255,215,0,0.08)",   bg: "rgba(255,215,0,0.06)",   icon: "#FFD700" },
  green:  { border: "rgba(52,211,153,0.25)",  glow: "rgba(52,211,153,0.08)",  bg: "rgba(52,211,153,0.06)",  icon: "#34d399" },
  red:    { border: "rgba(239,68,68,0.25)",   glow: "rgba(239,68,68,0.08)",   bg: "rgba(239,68,68,0.06)",   icon: "#f87171" },
  blue:   { border: "rgba(96,165,250,0.25)",  glow: "rgba(96,165,250,0.08)",  bg: "rgba(96,165,250,0.06)",  icon: "#60a5fa" },
  orange: { border: "rgba(251,146,60,0.25)",  glow: "rgba(251,146,60,0.08)",  bg: "rgba(251,146,60,0.06)",  icon: "#fb923c" },
};
const STAT_VALUE_COLORS: Record<string, string> = {
  white: "text-white", gold: "text-[#FFD700]", green: "text-emerald-300",
  red: "text-red-300", blue: "text-blue-300", orange: "text-orange-300",
};
export function SLStat({
  label, value, color = "white", icon,
}: {
  label: string;
  value: ReactNode;
  color?: "white" | "gold" | "green" | "red" | "blue" | "orange";
  icon?: string;
}) {
  const c = STAT_COLORS[color] || STAT_COLORS.white;
  return (
    <div className="relative rounded-xl overflow-hidden min-w-0" style={{
      background: `linear-gradient(145deg, rgba(14,12,9,0.98) 0%, rgba(10,8,5,1) 100%)`,
      border: `1px solid ${c.border}`,
      boxShadow: `0 0 16px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{
        background: `linear-gradient(90deg, transparent, ${c.border.replace("0.25","0.6")} 50%, transparent)`,
      }} />
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          {icon && (
            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}>
              <Icon name={icon} size={9} style={{ color: c.icon }} />
            </div>
          )}
          <div className="text-[9px] uppercase tracking-[0.08em] font-bold truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</div>
        </div>
        <div className={`font-oswald text-[16px] font-black leading-tight ${STAT_VALUE_COLORS[color]}`} style={{
          textShadow: color !== "white" ? `0 0 12px ${c.icon}60` : "none",
        }}>{value}</div>
      </div>
    </div>
  );
}

// ============ Compact Modal ============
export function SLModal({
  open, onClose, title, icon, children, maxWidth = "max-w-md", footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
}) {
  if (!open) return null;
  // iPhone Safari + наш staff-tabbar (Ремонт/Чат/.../Команда) внизу занимают ~80px.
  // Резервируем достаточно места, чтобы кнопка "Подтвердить" не уезжала под бар.
  // 110px = высота нашего таб-бара + Safari-бара + запас.
  const bottomReserve = 'max(env(safe-area-inset-bottom, 0px), 12px)';
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-3 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} overflow-hidden relative`}
        style={{
          background: "linear-gradient(180deg, rgba(16,12,6,0.99) 0%, rgba(10,8,4,1) 100%)",
          border: "1px solid rgba(255,215,0,0.2)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,215,0,0.06), 0 -2px 0 rgba(255,215,0,0.15) inset",
          paddingBottom: bottomReserve,
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top 1px gold light line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.4) 30%, rgba(255,255,255,0.6) 50%, rgba(255,215,0,0.4) 70%, transparent)"
        }} />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0" style={{
          borderBottom: "1px solid rgba(255,215,0,0.08)"
        }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                background: "rgba(255,215,0,0.12)",
                border: "1px solid rgba(255,215,0,0.25)",
              }}>
                <Icon name={icon} size={14} className="text-[#FFD700]" />
              </div>
            )}
            <h2 className="font-oswald font-bold uppercase tracking-wide text-[15px] truncate" style={{ color: "rgba(255,240,200,0.95)" }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 shrink-0" style={{
            borderTop: "1px solid rgba(255,215,0,0.1)",
            background: "rgba(8,6,3,0.95)",
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Чекбокс с лейблом (компактный) ============
export function SLCheckbox({
  label, hint, checked, onChange, disabled,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2 text-[12px] cursor-pointer select-none ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-3.5 h-3.5 accent-[#FFD700] cursor-pointer"
      />
      <span className="flex-1 min-w-0">
        <span className="text-white/85 leading-tight">{label}</span>
        {hint && <div className="text-[10px] text-white/40 mt-0.5 leading-snug">{hint}</div>}
      </span>
    </label>
  );
}