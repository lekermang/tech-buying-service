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
  const sizeCls = size === "sm" ? "px-2 py-1 text-[10px]" : size === "lg" ? "px-3.5 py-2 text-[12px]" : "px-3 py-1.5 text-[11px]";
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 rounded-md font-bold uppercase tracking-wide transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${sizeCls} ${variantCls} ${className}`} {...props}>
      {icon && <Icon name={icon} size={size === "sm" ? 11 : size === "lg" ? 14 : 12} />}
      {children}
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
export function SLStat({
  label, value, color = "white", icon,
}: {
  label: string;
  value: ReactNode;
  color?: "white" | "gold" | "green" | "red" | "blue" | "orange";
  icon?: string;
}) {
  const map = {
    white: "text-white",
    gold: "text-[#FFD700]",
    green: "text-emerald-300",
    red: "text-red-300",
    blue: "text-blue-300",
    orange: "text-orange-300",
  }[color];
  return (
    <div className="rounded-lg bg-[#0C0C0C] border border-[#1A1A1A] px-2 py-1.5 min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        {icon && <Icon name={icon} size={10} className="text-white/40" />}
        <div className="text-[9px] uppercase tracking-[0.08em] font-bold text-white/45 truncate">{label}</div>
      </div>
      <div className={`font-oswald text-[15px] font-bold leading-tight ${map}`}>{value}</div>
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
  return (
    <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-3 animate-[fadeIn_0.15s_ease]" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} ${slClasses.card} max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && <Icon name={icon} size={13} className="text-[#FFD700] shrink-0" />}
            <h3 className="font-oswald uppercase text-[13px] tracking-wide font-bold truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white shrink-0 p-1 -mr-1"><Icon name="X" size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-premium p-3">
          {children}
        </div>
        {footer && <div className="border-t border-[#1A1A1A] px-3 py-2 flex gap-2 justify-end">{footer}</div>}
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
