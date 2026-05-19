import Icon from "@/components/ui/icon";
import { delta } from "./types";

type Props = {
  label: string;
  value: string;
  hint?: string;
  prev?: number;
  cur?: number;
  invertColor?: boolean;
  accent?: "gold" | "emerald" | "rose" | "sky" | "violet";
  big?: boolean;
};

const ACCENT: Record<string, string> = {
  gold: "from-[#FFD700]/15 to-[#FFD700]/0 border-[#FFD700]/25 text-[#FFD700]",
  emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/30 text-emerald-300",
  rose: "from-rose-500/15 to-rose-500/0 border-rose-500/30 text-rose-300",
  sky: "from-sky-500/15 to-sky-500/0 border-sky-500/30 text-sky-300",
  violet: "from-violet-500/15 to-violet-500/0 border-violet-500/30 text-violet-300",
};

export default function KpiCard({ label, value, hint, prev, cur, invertColor, accent = "gold", big }: Props) {
  const d = prev !== undefined && cur !== undefined ? delta(cur, prev) : null;
  const positive = d !== null ? (invertColor ? d < 0 : d > 0) : null;
  const a = ACCENT[accent];

  return (
    <div className={`relative rounded-lg border bg-gradient-to-br ${a} p-3 overflow-hidden group hover:scale-[1.01] transition`}>
      <div className="text-[10px] uppercase tracking-wider text-white/55 font-roboto truncate">{label}</div>
      <div className={`font-bold ${big ? "text-xl" : "text-base"} mt-1 text-white tabular-nums truncate`}>{value}</div>
      <div className="flex items-center gap-2 mt-1 text-[10px]">
        {hint && <span className="text-white/40 truncate">{hint}</span>}
        {d !== null && (
          <span className={`ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
            positive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
          }`}>
            <Icon name={positive ? "TrendingUp" : "TrendingDown"} size={9} />
            {d > 0 ? "+" : ""}{d.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
