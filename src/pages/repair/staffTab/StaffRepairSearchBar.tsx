import Icon from "@/components/ui/icon";
import { SLTooltip } from "../../slShop/slUI";

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
    <div className="relative px-3 py-2.5 space-y-2">
      {/* Премиум-фон */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.25),transparent)]" />
      </div>

      <div className="relative flex items-center gap-2">
        {/* Поисковая строка с premium-обводкой */}
        <div className="flex-1 relative group">
          <div className="absolute -inset-px rounded-lg bg-gradient-to-r from-[#FFD700]/0 via-[#FFD700]/25 to-[#FFD700]/0 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFD700]/60 pointer-events-none z-10" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск: имя, телефон, модель..."
            className="relative w-full bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white pl-9 pr-9 py-2.5 font-roboto text-sm rounded-lg focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#1A1A1A] placeholder:text-white/25 transition-all shadow-[inset_0_1px_0_rgba(255,215,0,0.04)]"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FFD700] p-0.5 transition-colors z-10">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        {/* Кнопка обновления — премиум */}
        <SLTooltip content="Обновить список заявок" placement="bottom" delay={300}>
          <button onClick={loadOrders} disabled={loading}
            aria-label="Обновить"
            className="relative text-white/50 hover:text-[#FFD700] active:scale-90 p-2.5 rounded-lg transition-all shrink-0 bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:shadow-[0_0_14px_rgba(255,215,0,0.2)] group">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={`${loading ? "animate-spin text-[#FFD700]" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          </button>
        </SLTooltip>
      </div>

      {/* Быстрые фильтры дат */}
      <div className="relative flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { label: "Все",     icon: "List",       get: (): [string,string] => ["", ""] },
          { label: "Сегодня", icon: "Sun",        get: (): [string,string] => { const t = new Date().toISOString().slice(0,10); return [t, t]; } },
          { label: "Неделя",  icon: "CalendarDays", get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
          { label: "Месяц",   icon: "Calendar",   get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
        ].map(q => {
          const [qf, qt] = q.get();
          const isActive = qf === dateFrom && qt === dateTo;
          return (
            <button key={q.label} onClick={() => { setDateFrom(qf); setDateTo(qt); }}
              className={`relative inline-flex items-center gap-1 px-3 py-1.5 font-roboto text-[11px] rounded-full shrink-0 transition-all active:scale-95 overflow-hidden group ${
                isActive
                  ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]"
                  : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
              }`}>
              {isActive && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />}
              <Icon name={q.icon} size={10} />
              <span className="relative">{q.label}</span>
            </button>
          );
        })}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          title="Дата с"
          className="bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/65 px-2 py-1.5 font-roboto text-[11px] rounded-md focus:outline-none focus:border-[#FFD700]/50 hover:border-[#FFD700]/30 shrink-0 w-[120px] transition-colors" />
        <span className="text-white/25 text-xs shrink-0">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          title="Дата по"
          className="bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/65 px-2 py-1.5 font-roboto text-[11px] rounded-md focus:outline-none focus:border-[#FFD700]/50 hover:border-[#FFD700]/30 shrink-0 w-[120px] transition-colors" />
      </div>
    </div>
  );
}
