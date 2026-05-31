import Icon from "@/components/ui/icon";
import { STATUSES, Order } from "../types";

type Props = {
  orders: Order[];
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  statusCounts: Record<string, number>;
};

export default function RepairStatusFilter({ orders, filterStatus, setFilterStatus, statusCounts }: Props) {
  return (
    <div className="relative px-3 py-2.5 flex gap-1.5 flex-wrap">
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.18),transparent)] pointer-events-none" />
      <button onClick={() => setFilterStatus("all")}
        title={`Показать все заявки (${orders.length})`}
        className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 overflow-hidden group ${
          filterStatus === "all"
            ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]"
            : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
        }`}>
        {filterStatus === "all" && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />}
        <Icon name="Inbox" size={11} />
        <span className="relative">Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span></span>
      </button>
      {STATUSES.map(s => {
        const active = filterStatus === s.key;
        const cnt = statusCounts[s.key] || 0;
        return (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            title={`Фильтр: ${s.label}${cnt > 0 ? ` (${cnt})` : ""}`}
            className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 overflow-hidden group ${
              active
                ? `${s.color} ring-1 ring-current font-bold shadow-[0_2px_10px_currentColor] brightness-110`
                : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-white hover:border-[#FFD700]/30 hover:shadow-[0_0_8px_rgba(255,215,0,0.15)]"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? "animate-pulse shadow-[0_0_6px_currentColor]" : ""}`} />
            {s.label}
            {cnt > 0 && <span className={active ? "opacity-80" : "opacity-50"}>({cnt})</span>}
          </button>
        );
      })}
    </div>
  );
}
