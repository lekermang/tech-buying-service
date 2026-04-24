import Icon from "@/components/ui/icon";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  loading: boolean;
  loadOrders: () => void;
};

export default function StaffRepairSearchBar({
  search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, loading, loadOrders,
}: Props) {
  return (
    <div className="px-3 py-2.5 border-b border-[#1A1A1A] space-y-2 bg-[#0A0A0A]">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск: имя, телефон, модель..."
            className="w-full bg-[#141414] border border-[#1F1F1F] text-white pl-9 pr-9 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#1A1A1A] placeholder:text-white/25 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <button onClick={loadOrders} disabled={loading}
          className="text-white/40 hover:text-[#FFD700] active:scale-90 p-2.5 rounded-md transition-all shrink-0 hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { label: "Все",     get: (): [string,string] => ["", ""] },
          { label: "Сегодня", get: (): [string,string] => { const t = new Date().toISOString().slice(0,10); return [t, t]; } },
          { label: "Неделя",  get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
          { label: "Месяц",   get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
        ].map(q => {
          const [qf, qt] = q.get();
          const isActive = qf === dateFrom && qt === dateTo;
          return (
            <button key={q.label} onClick={() => { setDateFrom(qf); setDateTo(qt); }}
              className={`px-3 py-1.5 font-roboto text-[11px] rounded-full shrink-0 transition-all active:scale-95 ${
                isActive
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {q.label}
            </button>
          );
        })}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
        <span className="text-white/20 text-xs shrink-0">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
      </div>
    </div>
  );
}
