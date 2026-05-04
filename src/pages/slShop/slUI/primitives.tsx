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

// ============ Адаптивный контейнер для страниц/форм ============
export function SLPageWrap({
  children, max = "md", className = "",
}: {
  children: ReactNode;
  /** sm = 640, md = 768 (по умолчанию для форм), lg = 960, xl = 1200, full */
  max?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}) {
  const w = {
    sm: "max-w-[640px]",
    md: "max-w-[760px]",
    lg: "max-w-[960px]",
    xl: "max-w-[1200px]",
    full: "max-w-full",
  }[max];
  return <div className={`mx-auto w-full ${w} ${className}`}>{children}</div>;
}
