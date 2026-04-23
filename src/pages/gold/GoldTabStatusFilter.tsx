import Icon from "@/components/ui/icon";
import { GOLD_STATUSES, GoldOrder } from "./types";

type Props = {
  filterStatus: string;
  onFilterChange: (s: string) => void;
  orders: GoldOrder[];
};

export default function GoldTabStatusFilter({ filterStatus, onFilterChange, orders }: Props) {
  const countByStatus = (key: string) => orders.filter(o => o.status === key).length;

  return (
    <div className="px-3 py-2.5 flex gap-1.5 flex-wrap border-b border-[#1A1A1A] bg-[#0A0A0A]">
      <button onClick={() => onFilterChange("all")}
        className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
          filterStatus === "all"
            ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
            : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
        }`}>
        <Icon name="Gem" size={11} />
        Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span>
      </button>
      {GOLD_STATUSES.map(s => {
        const cnt = countByStatus(s.key);
        const active = filterStatus === s.key;
        return (
          <button key={s.key} onClick={() => onFilterChange(s.key)}
            className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
              active
                ? `${s.color} ring-1 ring-current font-bold`
                : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? "animate-pulse" : ""}`} />
            {s.label}
            {cnt > 0 && <span className={active ? "opacity-70" : "opacity-50"}>({cnt})</span>}
          </button>
        );
      })}
    </div>
  );
}
