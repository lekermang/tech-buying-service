import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";

export function Section({
  title, children, icon, tooltip,
}: {
  title: string;
  children: ReactNode;
  icon?: string;
  tooltip?: string;
}) {
  return (
    <div
      className="bg-[#101010] border border-[#1A1A1A] rounded-xl p-2.5 shadow-[0_1px_0_rgba(255,215,0,0.04)_inset]"
      title={tooltip}
    >
      <div className="text-[9px] uppercase font-bold tracking-[0.08em] text-white/55 mb-1.5 flex items-center gap-1">
        {icon && <Icon name={icon} size={10} className="text-[#FFD700]" />}
        {title}
        {tooltip && <Icon name="Info" size={9} className="text-white/30 ml-auto" />}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function Field({
  label, children, hint, tooltip,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  tooltip?: string;
}) {
  return (
    <div title={tooltip}>
      <div className="text-[9px] uppercase tracking-[0.08em] text-white/45 font-bold mb-0.5 flex items-center gap-1">
        <span>{label}</span>
        {tooltip && <Icon name="Info" size={9} className="text-white/30" />}
      </div>
      {children}
      {hint && <div className="text-[9px] text-white/35 mt-0.5">{hint}</div>}
    </div>
  );
}

export function Inp({
  v, s, ph, title, type,
}: {
  v: string;
  s: (x: string) => void;
  ph?: string;
  title?: string;
  type?: string;
}) {
  return (
    <input
      value={v}
      onChange={e => s(e.target.value)}
      placeholder={ph}
      title={title}
      type={type}
      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#0E0E0E] rounded-md px-2.5 py-1.5 text-[13px] outline-none transition placeholder:text-white/25"
    />
  );
}

export default Section;