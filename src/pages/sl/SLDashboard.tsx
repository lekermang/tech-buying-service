import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slGet, fmtMoney, type SLStats } from "./types";

const PERIODS = [
  { v: "today", l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "week", l: "7 дней" },
  { v: "month", l: "30 дней" },
  { v: "year", l: "Год" },
  { v: "all", l: "Всё время" },
];

export default function SLDashboard({ token }: { token: string }) {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<SLStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await slGet<SLStats>(token, "stats", { period });
      setStats(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  const buyout = stats?.by_type?.buyout || { count: 0, total: 0 };
  const sale = stats?.by_type?.sale || { count: 0, total: 0 };
  const ret = stats?.by_type?.return || { count: 0, total: 0 };

  const inStock = stats?.by_status?.in_stock || { count: 0, total: 0 };
  const sold = stats?.by_status?.sold || { count: 0, total: 0 };
  const onShowcase = stats?.by_location?.showcase || 0;
  const onStorage = stats?.by_location?.storage || 0;
  const onReserve = stats?.by_location?.reserved || 0;

  const profit = stats?.profit_period || 0;
  const margin = sale.total > 0 ? Math.round((profit / sale.total) * 100) : 0;

  return (
    <div className="p-3 space-y-3">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
          <Icon name="Gem" size={18} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-bold uppercase text-base leading-tight">СмартЛомбард</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">учёт скупки и продажи</div>
        </div>
        <button onClick={load} disabled={loading}
          className="ml-auto text-white/40 hover:text-[#FFD700] active:scale-90 p-2 rounded-md transition-all hover:bg-white/5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Период */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIODS.map((p) => {
          const active = period === p.v;
          return (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              {p.l}
            </button>
          );
        })}
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <Icon name="AlertCircle" size={14} /> {err}
        </div>
      )}

      {/* Главные KPI */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] uppercase tracking-wider font-bold">
            <Icon name="ShoppingCart" size={12} /> Куплено
          </div>
          <div className="text-2xl font-oswald font-bold text-blue-300 mt-1">{buyout.count}<span className="text-sm text-white/40 ml-1">шт.</span></div>
          <div className="text-xs text-blue-300/80 mt-0.5">на {fmtMoney(buyout.total)}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-green-400 text-[10px] uppercase tracking-wider font-bold">
            <Icon name="Banknote" size={12} /> Продано
          </div>
          <div className="text-2xl font-oswald font-bold text-green-300 mt-1">{sale.count}<span className="text-sm text-white/40 ml-1">шт.</span></div>
          <div className="text-xs text-green-300/80 mt-0.5">на {fmtMoney(sale.total)}</div>
        </div>
      </div>

      {/* Прибыль */}
      <div className="bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border border-[#FFD700]/30 rounded-xl p-3 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#FFD700]/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[#FFD700] text-[10px] uppercase tracking-wider font-bold">
            <Icon name="TrendingUp" size={12} /> Прибыль за период
          </div>
          <div className="text-3xl font-oswald font-bold text-[#FFD700] mt-1">{fmtMoney(profit)}</div>
          <div className="text-[11px] text-[#FFD700]/70 mt-1">
            продано {stats?.sold_in_period || 0} шт · маржа {margin}%
          </div>
        </div>
      </div>

      {/* Склад */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-2 flex items-center gap-1">
          <Icon name="Package" size={11} /> На складе
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-oswald font-bold">{onShowcase}</div>
            <div className="text-[10px] text-white/40 uppercase">Витрина</div>
          </div>
          <div>
            <div className="text-xl font-oswald font-bold">{onStorage}</div>
            <div className="text-[10px] text-white/40 uppercase">Склад</div>
          </div>
          <div>
            <div className="text-xl font-oswald font-bold">{onReserve}</div>
            <div className="text-[10px] text-white/40 uppercase">Резерв</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#1F1F1F] flex justify-between text-[11px] text-white/60">
          <span>Всего в наличии: <b className="text-white">{inStock.count}</b></span>
          <span>Сумма витрины: <b className="text-[#FFD700]">{fmtMoney(inStock.total)}</b></span>
        </div>
      </div>

      {/* Топ категорий */}
      {stats?.top_categories && stats.top_categories.length > 0 && (
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-2 flex items-center gap-1">
            <Icon name="BarChart2" size={11} /> Топ категорий по продажам
          </div>
          <div className="space-y-1.5">
            {stats.top_categories.slice(0, 6).map((c) => {
              const max = stats.top_categories[0]?.total || 1;
              const w = Math.max(5, Math.round((c.total / max) * 100));
              return (
                <div key={c.name} className="text-[11px]">
                  <div className="flex justify-between text-white/70">
                    <span>{c.name}</span>
                    <span><b className="text-white">{c.count}</b> · {fmtMoney(c.total)}</span>
                  </div>
                  <div className="h-1.5 mt-0.5 bg-[#0A0A0A] rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#FFD700] to-yellow-500" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Возвраты */}
      {ret.count > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
          <Icon name="Undo2" size={16} className="text-orange-400" />
          <div className="flex-1">
            <div className="text-[10px] uppercase text-orange-400 font-bold">Возвраты</div>
            <div className="text-sm text-white/80">{ret.count} шт. на {fmtMoney(ret.total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
