 
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

export const AVITO_SYNC_URL = (funcUrls as Record<string, string>)["avito-sync"];

export const money = (n: number) => `${(n || 0).toLocaleString("ru-RU")} ₽`;
export const phoneHref = (p?: string | null) => (p ? `tel:${p.replace(/[^+0-9]/g, "")}` : "#");

export function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="p-1.5 rounded-md bg-black/30 border border-white/5 text-center">
      <div className="text-[9px] text-white/45 uppercase tracking-wider">{label}</div>
      <div className={`text-[13px] font-bold tabular-nums ${className || "text-white"}`}>{value}</div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/15 rounded-md py-3 text-center">
      <Icon name="CheckCircle2" size={14} className="inline mr-1" />
      {text}
    </div>
  );
}
