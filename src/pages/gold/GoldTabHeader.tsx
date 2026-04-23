import Icon from "@/components/ui/icon";

type View = "list" | "analytics";

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  showForm: boolean;
  onToggleForm: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  loading: boolean;
  onRefresh: () => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
};

export default function GoldTabHeader({
  view, onViewChange, showForm, onToggleForm, search, onSearchChange,
  loading, onRefresh, dateFrom, dateTo, onDateFromChange, onDateToChange,
}: Props) {
  return (
    <div className="px-3 pt-3 pb-2 border-b border-[#1A1A1A] bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex flex-1 bg-[#141414] border border-[#1F1F1F] rounded-md p-0.5">
          {[
            { k: "list", l: "Заявки", icon: "List" },
            { k: "analytics", l: "Аналитика", icon: "BarChart2" },
          ].map(v => {
            const active = view === v.k;
            return (
              <button key={v.k} onClick={() => onViewChange(v.k as View)}
                className={`flex-1 py-2 px-2.5 font-roboto text-[11px] rounded-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                  active
                    ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-lg shadow-[#FFD700]/20"
                    : "text-white/50 hover:text-white/80"
                }`}>
                <Icon name={v.icon} size={13} />
                {v.l}
              </button>
            );
          })}
        </div>
        {view === "list" && (
          <button onClick={onToggleForm}
            className={`flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all shrink-0 active:scale-95 ${
              showForm
                ? "bg-[#2A2A2A] text-white/60 border border-[#333]"
                : "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20"
            }`}>
            <Icon name={showForm ? "X" : "Plus"} size={14} />
            {showForm ? "Отмена" : "Заявка"}
          </button>
        )}
      </div>

      {view === "list" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Поиск: имя, телефон, изделие..."
                className="w-full bg-[#141414] border border-[#1F1F1F] text-white pl-9 pr-9 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#1A1A1A] placeholder:text-white/25 transition-all"
              />
              {search && (
                <button onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
            <button onClick={onRefresh} disabled={loading}
              className="text-white/40 hover:text-[#FFD700] active:scale-90 p-2.5 rounded-md transition-all shrink-0 hover:bg-white/5">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { label: "Все", f: "", t: "" },
              { label: "Сегодня", get: () => { const t = new Date().toISOString().slice(0, 10); return { f: t, t }; } },
              { label: "Неделя", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 6); return { f: f.toISOString().slice(0, 10), t: t.toISOString().slice(0, 10) }; } },
              { label: "Месяц", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 29); return { f: f.toISOString().slice(0, 10), t: t.toISOString().slice(0, 10) }; } },
            ].map(q => {
              const range = q.get ? q.get() : { f: "", t: "" };
              const active = range.f === dateFrom && range.t === dateTo;
              return (
                <button key={q.label} onClick={() => { onDateFromChange(range.f); onDateToChange(range.t); }}
                  className={`px-3 py-1.5 font-roboto text-[11px] rounded-full shrink-0 transition-all active:scale-95 ${
                    active
                      ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                      : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
                  }`}>
                  {q.label}
                </button>
              );
            })}
            <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)}
              className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
            <span className="text-white/20 text-xs shrink-0">—</span>
            <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)}
              className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
          </div>
        </div>
      )}
    </div>
  );
}
