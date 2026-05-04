import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[#101010] border border-[#1A1A1A] rounded-xl p-2.5 shadow-[0_1px_0_rgba(255,215,0,0.04)_inset]">
      <div className="text-[9px] uppercase font-bold tracking-[0.08em] text-white/45 mb-1.5">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.08em] text-white/45 font-bold mb-0.5">{label}</div>
      {children}
    </div>
  );
}

export function Inp({ v, s, ph }: { v: string; s: (x: string) => void; ph?: string }) {
  return (
    <input value={v} onChange={e => s(e.target.value)} placeholder={ph}
      className="w-full bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#262626] focus:border-[#FFD700]/60 rounded-md px-2.5 py-1.5 text-[13px] outline-none transition placeholder:text-white/25" />
  );
}

export default Section;