import Icon from "@/components/ui/icon";
import { EMPTY_FORM } from "./repairTypes";

type View = "orders" | "analytics" | "labor_prices" | "price_list" | "import_parts";

type Props = {
  view: View;
  setView: (v: View) => void;
  search: string;
  setSearch: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  setForm: (v: typeof EMPTY_FORM) => void;
  syncing: boolean;
  syncResult: string | null;
  syncParts: () => void;
  onShowHistory: () => void;
};

export default function RepairTabHeader({
  view, setView, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo,
  loading, onRefresh, showForm, setShowForm, setForm, syncing, syncResult, syncParts, onShowHistory,
}: Props) {
  return (
    <div className="px-4 py-3 border-b border-[#222] flex items-center gap-3 flex-wrap">
      <div className="flex rounded overflow-hidden border border-[#333]">
        <button onClick={() => setView("orders")}
          className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "orders" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
          <Icon name="ClipboardList" size={13} />Заявки
        </button>
        <button onClick={() => setView("analytics")}
          className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "analytics" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
          <Icon name="BarChart2" size={13} />Аналитика
        </button>
        <button onClick={() => setView("labor_prices")}
          className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "labor_prices" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
          <Icon name="Tag" size={13} />Цены работ
        </button>
        <button onClick={() => setView("price_list")}
          className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "price_list" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
          <Icon name="Percent" size={13} />Прайс
        </button>
        <button onClick={() => setView("import_parts")}
          className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "import_parts" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
          <Icon name="FileUp" size={13} />Импорт Excel
        </button>
      </div>

      {view === "orders" && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, модели..."
            className="flex-1 min-w-[150px] bg-[#0D0D0D] border border-[#333] text-white px-3 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              className={`px-2 py-1 font-roboto text-[10px] border transition-colors ${
                !dateFrom && !dateTo ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:border-white/30 hover:text-white/70"
              }`}>Все</button>
            {[
              { label: "Сегодня", get: () => { const t = new Date().toISOString().slice(0,10); return [t, t]; } },
              { label: "Неделя",  get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
              { label: "Месяц",   get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
            ].map(q => (
              <button key={q.label} onClick={() => { const [f,to] = q.get(); setDateFrom(f); setDateTo(to); }}
                className={`px-2 py-1 font-roboto text-[10px] border transition-colors ${
                  (() => { const [f,to] = q.get(); return dateFrom===f && dateTo===to; })()
                    ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10"
                    : "border-[#333] text-white/40 hover:border-white/30 hover:text-white/70"
                }`}>{q.label}</button>
            ))}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              title="Дата сдачи от"
              className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
            <span className="text-white/20 text-xs">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              title="Дата сдачи до"
              className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
          </div>
          <button onClick={onRefresh} disabled={loading} className="text-white/40 hover:text-white p-1.5 transition-colors">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
            className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
            <Icon name={showForm ? "X" : "Plus"} size={13} />
            {showForm ? "Отмена" : "Новая заявка"}
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onShowHistory}
              title="Последние действия"
              className="flex items-center gap-1.5 border border-[#333] text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 font-roboto text-xs transition-colors"
            >
              <Icon name="History" size={13} />
              Действия
            </button>
            <button
              onClick={syncParts}
              disabled={syncing}
              title="Синхронизировать каталог запчастей из МойСклад"
              className="flex items-center gap-1.5 border border-[#333] text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 font-roboto text-xs transition-colors disabled:opacity-40"
            >
              <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Синхронизация..." : "Запчасти"}
            </button>
            {syncResult && (
              <span className="font-roboto text-[10px] text-green-400">{syncResult}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}