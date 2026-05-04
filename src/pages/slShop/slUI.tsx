import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import Icon from "@/components/ui/icon";

/**
 * Премиум-компоненты для модуля СмартЛомбард — компактные, единый стиль.
 * Чёрный фон, золотой акцент, минимум вертикали.
 */

// ============ Базовые классы (можно использовать напрямую) ============
export const slClasses = {
  card: "bg-[#101010] border border-[#1A1A1A] rounded-xl shadow-[0_1px_0_rgba(255,215,0,0.04)_inset,0_8px_24px_rgba(0,0,0,0.3)]",
  cardPad: "p-2.5 sm:p-3",
  field: "rounded-md bg-[#0A0A0A] border border-[#1A1A1A] focus-within:border-[#FFD700]/60 focus-within:bg-[#0E0E0E] hover:border-[#262626] transition-all",
  input: "w-full bg-transparent outline-none px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/25",
  label: "text-[9px] uppercase tracking-[0.08em] font-bold text-white/45",
  pill: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold border",
  btn: "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97]",
  btnGold: "bg-[#FFD700] hover:bg-[#FFE34D] text-black shadow-[0_2px_8px_rgba(255,215,0,0.25)]",
  btnGoldOutline: "bg-[#FFD700]/8 hover:bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700]",
  btnDark: "bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/30 text-white/75",
  btnDanger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300",
  btnSuccess: "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300",
};

// ============ Card ============
export function SLCard({ children, className = "", padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <div className={`${slClasses.card} ${padding ? slClasses.cardPad : ""} ${className}`}>
      {children}
    </div>
  );
}

// ============ Section с заголовком и иконкой ============
export function SLSection({
  icon, title, right, children, className = "",
}: {
  icon?: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${slClasses.card} ${slClasses.cardPad} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <Icon name={icon} size={12} className="text-[#FFD700] shrink-0" />}
          <h3 className="font-oswald uppercase text-[12px] tracking-[0.06em] font-bold truncate">{title}</h3>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

// ============ Поле формы ============
type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
};
export function SLField({ label, hint, children, className = "", required }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <div className={`${slClasses.label} mb-1 flex items-center gap-1`}>
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
        </div>
      )}
      {children}
      {hint && <div className="text-[9px] text-white/35 mt-0.5">{hint}</div>}
    </div>
  );
}

// ============ Текстовое поле ============
type SLInputProps = InputHTMLAttributes<HTMLInputElement> & { iconLeft?: string };
export function SLInput({ iconLeft, className = "", ...props }: SLInputProps) {
  return (
    <div className={`${slClasses.field} flex items-center ${className}`}>
      {iconLeft && <Icon name={iconLeft} size={12} className="text-white/35 ml-2 shrink-0" />}
      <input className={slClasses.input + (iconLeft ? " pl-1" : "")} {...props} />
    </div>
  );
}

// ============ Textarea ============
type SLTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
export function SLTextarea({ className = "", rows = 2, ...props }: SLTextareaProps) {
  return (
    <div className={`${slClasses.field} ${className}`}>
      <textarea rows={rows} className={slClasses.input + " resize-y leading-snug"} {...props} />
    </div>
  );
}

// ============ Select ============
type SLSelectProps = SelectHTMLAttributes<HTMLSelectElement>;
export function SLSelect({ className = "", children, ...props }: SLSelectProps) {
  return (
    <div className={`${slClasses.field} ${className}`}>
      <select className={slClasses.input + " appearance-none pr-7 cursor-pointer"} {...props}>{children}</select>
    </div>
  );
}

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

// ============ Грид-секция (компактные колонки) ============
export function SLGrid({
  children, cols = 2, className = "",
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const map = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[cols];
  return <div className={`grid ${map} gap-2 ${className}`}>{children}</div>;
}

// ============ Премиум-сегмент-таб (для табов и периодов) ============
export type SLTabItem = {
  v: string;
  l: string;
  icon?: string;
  badge?: number | string;
  featured?: boolean;
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
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange(t.v)}
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
        })}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}