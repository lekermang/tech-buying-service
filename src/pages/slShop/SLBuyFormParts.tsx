import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold tracking-wide text-white/40 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-1">{label}</div>
      {children}
    </div>
  );
}

export function Inp({ v, s, ph }: { v: string; s: (x: string) => void; ph?: string }) {
  return (
    <input value={v} onChange={e => s(e.target.value)} placeholder={ph}
      className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/50 outline-none" />
  );
}

export default Section;
