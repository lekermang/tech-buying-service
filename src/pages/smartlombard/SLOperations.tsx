import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { smartlombardCall } from "../staff.types";

type Op = {
  id: number;
  type_operation: string;
  sum: number | string;
  created_at?: string;
  pawn_ticket_id?: number;
  client_name?: string;
  client_id?: number;
  employee_name?: string;
  branch_name?: string;
};

const TYPE_LABELS: Record<string, { l: string; tint: string; icon: string }> = {
  pledge:                    { l: "Залог",            tint: "text-blue-300 bg-blue-500/10 border-blue-500/30",     icon: "ArrowDownToLine" },
  buyout:                    { l: "Выкуп",            tint: "text-green-300 bg-green-500/10 border-green-500/30", icon: "ArrowUpFromLine" },
  prolongation:              { l: "Продление",        tint: "text-amber-300 bg-amber-500/10 border-amber-500/30", icon: "RefreshCw" },
  prolongation_online:       { l: "Продление онлайн", tint: "text-amber-300 bg-amber-500/10 border-amber-500/30", icon: "Globe" },
  repledge:                  { l: "Перезалог",        tint: "text-purple-300 bg-purple-500/10 border-purple-500/30", icon: "Repeat" },
  dobor:                     { l: "Добор",            tint: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",     icon: "PlusCircle" },
  part_buyout:               { l: "Частичный выкуп",  tint: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", icon: "Minus" },
  part_buyout_pawn_good:     { l: "Частичный выкуп им.", tint: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", icon: "Minus" },
  sell_realization:          { l: "Реализация",       tint: "text-pink-300 bg-pink-500/10 border-pink-500/30",     icon: "ShoppingCart" },
  send_to_realization:       { l: "В реализацию",     tint: "text-pink-300 bg-pink-500/10 border-pink-500/30",     icon: "Truck" },
  seizure:                   { l: "Изъятие",          tint: "text-red-300 bg-red-500/10 border-red-500/30",        icon: "AlertOctagon" },
};

function todayDmy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
function shiftDmy(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function SLOperations({ token }: { token: string }) {
  const [dateFrom, setDateFrom] = useState(todayDmy());
  const [dateTo, setDateTo] = useState(todayDmy());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Op[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (resetPage = true) => {
    setLoading(true); setError("");
    const targetPage = resetPage ? 1 : page;
    const r = await smartlombardCall<{ operations?: Op[] }>({
      token,
      path: "/operations",
      params: { date_begin: dateFrom, date_end: dateTo, page: targetPage, limit: 50 },
    });
    if (!r.ok) {
      setError(r.error || "Ошибка"); setItems([]);
    } else {
      const ops = r.data?.operations || [];
      setItems(prev => (resetPage ? ops : [...prev, ...ops]));
      setHasMore(ops.length >= 50);
      if (resetPage) setPage(1);
    }
    setLoading(false);
  }, [token, dateFrom, dateTo, page]);

  useEffect(() => { load(true);   }, [dateFrom, dateTo]);

  const filtered = items.filter(op => {
    const t = (op.type_operation || "").split(",")[0].trim();
    if (typeFilter !== "all" && t !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${op.client_name || ""} ${op.employee_name || ""} ${op.branch_name || ""} ${op.id} ${op.pawn_ticket_id || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const total = filtered.reduce((s, o) => s + Number(o.sum || 0), 0);

  const setPreset = (days: number) => {
    setDateFrom(shiftDmy(-days + 1));
    setDateTo(todayDmy());
  };

  const loadMore = async () => {
    setPage(p => p + 1);
    setLoading(true); setError("");
    const r = await smartlombardCall<{ operations?: Op[] }>({
      token, path: "/operations",
      params: { date_begin: dateFrom, date_end: dateTo, page: page + 1, limit: 50 },
    });
    if (!r.ok) setError(r.error || "Ошибка");
    else {
      const ops = r.data?.operations || [];
      setItems(prev => [...prev, ...ops]);
      setHasMore(ops.length >= 50);
    }
    setLoading(false);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Период */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button onClick={() => { setDateFrom(todayDmy()); setDateTo(todayDmy()); }}
            className="shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-[#FFD700] active:scale-95">Сегодня</button>
          <button onClick={() => { setDateFrom(shiftDmy(-1)); setDateTo(shiftDmy(-1)); }}
            className="shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-[#FFD700] active:scale-95">Вчера</button>
          <button onClick={() => setPreset(7)}
            className="shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-[#FFD700] active:scale-95">7 дней</button>
          <button onClick={() => setPreset(30)}
            className="shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 hover:text-[#FFD700] active:scale-95">30 дней</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DateInput label="С" value={dateFrom} onChange={setDateFrom} />
          <DateInput label="По" value={dateTo} onChange={setDateTo} />
        </div>
      </div>

      {/* Быстрые пресеты */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button onClick={() => setTypeFilter("sell_realization")}
          className={`shrink-0 flex items-center gap-1.5 font-oswald font-bold text-[11px] uppercase px-3 py-2 rounded-md transition-all active:scale-95 border ${
            typeFilter === "sell_realization"
              ? "bg-[#FFD700] text-black border-[#FFD700]"
              : "bg-pink-500/15 text-pink-300 border-pink-400/30 hover:bg-pink-500/20"
          }`}>
          <Icon name="ShoppingCart" size={13} />
          Только продажи товара
        </button>
        <button onClick={() => setTypeFilter("all")}
          className={`shrink-0 flex items-center gap-1.5 font-oswald font-bold text-[11px] uppercase px-3 py-2 rounded-md transition-all active:scale-95 border ${
            typeFilter === "all"
              ? "bg-[#FFD700] text-black border-[#FFD700]"
              : "bg-[#141414] text-white/60 border-[#1F1F1F] hover:text-white"
          }`}>
          <Icon name="List" size={13} />
          Все операции
        </button>
      </div>

      {/* Поиск + фильтр типа */}
      <div className="space-y-2">
        <div className="relative">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск: клиент, сотрудник, № билета"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Все</FilterChip>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <FilterChip key={k} active={typeFilter === k} onClick={() => setTypeFilter(k)}>{v.l}</FilterChip>
          ))}
        </div>
      </div>

      {/* Сводка */}
      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-lg px-3 py-2.5 flex items-center justify-between">
        <span className="font-roboto text-white/60 text-[11px]">Найдено операций</span>
        <div className="text-right">
          <div className="font-oswald font-bold text-white text-lg tabular-nums leading-none">{filtered.length}</div>
          <div className="font-roboto text-[#FFD700] text-[10px] tabular-nums">Σ {total.toLocaleString("ru-RU")} ₽</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 font-roboto text-[11px] flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Список */}
      <div className="space-y-1.5">
        {filtered.map(op => {
          const t = (op.type_operation || "").split(",")[0].trim();
          const meta = TYPE_LABELS[t] || { l: t || "?", tint: "text-white/60 bg-white/5 border-white/10", icon: "Circle" };
          const sum = Number(op.sum || 0);
          return (
            <div key={op.id} className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5 hover:border-[#2A2A2A] transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 font-roboto text-[10px] px-2 py-0.5 rounded-full border ${meta.tint}`}>
                  <Icon name={meta.icon} size={10} />{meta.l}
                </span>
                <span className="font-oswald font-bold text-white text-sm tabular-nums shrink-0">{sum.toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-roboto text-white/50">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {op.client_name && <span className="flex items-center gap-1 truncate"><Icon name="User" size={9} />{op.client_name}</span>}
                  {op.pawn_ticket_id && <span className="flex items-center gap-1"><Icon name="FileText" size={9} />№{op.pawn_ticket_id}</span>}
                </div>
                {op.created_at && <span className="text-white/30 shrink-0">{op.created_at.slice(0, 16).replace("T", " ")}</span>}
              </div>
              {(op.employee_name || op.branch_name) && (
                <div className="text-[9px] font-roboto text-white/30 mt-0.5 flex items-center gap-2 flex-wrap">
                  {op.employee_name && <span>👤 {op.employee_name}</span>}
                  {op.branch_name && <span>🏢 {op.branch_name}</span>}
                </div>
              )}
            </div>
          );
        })}

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-12 text-white/30">
            <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-50" />
            <div className="font-roboto text-sm">Операций не найдено</div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-white/30">
            <Icon name="Loader" size={16} className="animate-spin mr-2" />
            <span className="font-roboto text-sm">Загружаю...</span>
          </div>
        )}

        {hasMore && !loading && (
          <button onClick={loadMore}
            className="w-full bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:text-[#FFD700] text-white/60 font-roboto text-xs py-2.5 rounded-md transition-colors active:scale-95">
            Загрузить ещё
          </button>
        )}
      </div>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // value в формате DD.MM.YYYY
  const toIso = (v: string) => {
    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };
  const fromIso = (v: string) => {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
  };
  return (
    <label className="block">
      <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">{label}</span>
      <input type="date" value={toIso(value)} onChange={e => onChange(fromIso(e.target.value))}
        className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-2.5 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 mt-1" />
    </label>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 font-roboto text-[10px] px-2.5 py-1 rounded-full transition-all active:scale-95 ${
        active ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
      }`}>{children}</button>
  );
}

export default SLOperations;