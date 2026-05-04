import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLStats, type SLSoldItem, type SLBoughtItem, STATUS_LABEL } from "./types";
import { printReceipt } from "./labelPrinter";
import { useSharedPeriod } from "./useSharedPeriod";
import { SLTabs } from "./slUI";

const PERIODS = [
  { v: "today", l: "Сегодня" },
  { v: "yesterday", l: "Вчера" },
  { v: "7d", l: "7 дн." },
  { v: "30d", l: "30 дн." },
  { v: "year", l: "Год" },
  { v: "all", l: "Всё время" },
];

export default function SLDashboard({ token, onNav, empName: _empName }: { token: string; onNav: (k: string) => void; empName?: string }) {
  const [period, setPeriod] = useSharedPeriod();
  const [data, setData] = useState<SLStats | null>(null);
  const [sold, setSold] = useState<SLSoldItem[]>([]);
  const [bought, setBought] = useState<SLBoughtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    const [r1, r2, r3] = await Promise.all([
      slApi<SLStats>(token, "stats", { params: { period } }),
      slApi<SLSoldItem[]>(token, "sold", { params: { period } }),
      slApi<SLBoughtItem[]>(token, "bought", { params: { period } }),
    ]);
    if (r1.ok && r1.data) setData(r1.data);
    else setErr(r1.error || "Ошибка");
    if (r2.ok && r2.data) setSold(r2.data);
    if (r3.ok && r3.data) setBought(r3.data);
    setLoading(false);
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  const stockCount = (data?.by_status?.stock?.count || 0) + (data?.by_status?.showcase?.count || 0) + (data?.by_status?.consignment?.count || 0);
  const stockSum = (data?.by_status?.stock?.sum || 0) + (data?.by_status?.showcase?.sum || 0) + (data?.by_status?.consignment?.sum || 0);

  return (
    <div>
      {/* Период */}
      <div className="mb-2">
        <SLTabs
          size="sm"
          items={PERIODS.map(p => ({ v: p.v, l: p.l }))}
          value={period}
          onChange={setPeriod}
          right={
            <button onClick={load} disabled={loading} className="text-white/45 hover:text-[#FFD700] p-1.5 rounded-md hover:bg-white/5 transition">
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={12} className={loading ? "animate-spin" : ""} />
            </button>
          }
        />
      </div>

      {err && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-3 text-sm">{err}</div>}

      {/* Главные карточки */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Card title="Куплено" value={`${data?.bought_count || 0} шт.`} sub={`на ${fmt(data?.spent)} ₽`} icon="ShoppingCart" color="emerald" />
        <Card title="Продано" value={`${data?.sold_count || 0} шт.`} sub={`на ${fmt(data?.revenue)} ₽`} icon="HandCoins" color="blue" />
        <Card title="Прибыль" value={`${fmt(Math.max(0, Number(data?.profit ?? 0)))} ₽`} sub={`за период`} icon="TrendingUp" color="yellow" />
        <Card title="На складе" value={`${stockCount} шт.`} sub={`${fmt(stockSum)} ₽`} icon="Package" color="white" />
      </div>

      {/* Разбивка по статусам */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {["stock", "showcase", "consignment"].map(s => {
          const cfg = STATUS_LABEL[s];
          const v = data?.by_status?.[s];
          return (
            <div key={s} className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5 text-center">
              <div className="text-[10px] uppercase text-white/40 tracking-wide">{cfg.l}</div>
              <div className="text-xl font-bold mt-1">{v?.count || 0}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{fmt(v?.sum || 0)} ₽</div>
            </div>
          );
        })}
      </div>

      {/* Проданные товары с датой и кнопкой чека */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase text-white/50 font-bold tracking-wide">Что продано</div>
          <button onClick={() => onNav("operations")} className="text-[10px] text-[#FFD700]/70 hover:text-[#FFD700]">все →</button>
        </div>
        {sold.length === 0 ? (
          <div className="text-white/30 text-xs py-3 text-center">Нет продаж за период</div>
        ) : (
          <div className="space-y-1.5">
            {sold.slice(0, 15).map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-[#141414] rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-[10px] text-white/40 truncate">
                    {s.sell_at ? new Date(s.sell_at).toLocaleString("ru-RU") : "—"}
                    {s.branch_name ? ` • ${s.branch_name}` : ""}
                    {s.client_name ? ` • ${s.client_name}` : ""}
                  </div>
                </div>
                <div className="text-[#FFD700] font-bold text-[13px] shrink-0">{fmt(s.amount || s.sell_price)} ₽</div>
                <button onClick={() => printReceipt(s)} title="Распечатать чек"
                  className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20 px-2 py-1 rounded shrink-0">
                  <Icon name="Receipt" size={12} />
                </button>
              </div>
            ))}
            {sold.length > 15 && (
              <div className="text-center text-[10px] text-white/30 pt-1">… и ещё {sold.length - 15}</div>
            )}
          </div>
        )}
      </div>

      {/* Что куплено */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase text-white/50 font-bold tracking-wide">Что куплено</div>
          <button onClick={() => onNav("operations")} className="text-[10px] text-[#FFD700]/70 hover:text-[#FFD700]">все →</button>
        </div>
        {bought.length === 0 ? (
          <div className="text-white/30 text-xs py-3 text-center">Нет скупок за период</div>
        ) : (
          <div className="space-y-1.5">
            {bought.slice(0, 15).map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-[#141414] rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.title}</div>
                  <div className="text-[10px] text-white/40 truncate">
                    {b.buy_at ? new Date(b.buy_at).toLocaleString("ru-RU") : "—"}
                    {b.branch_name ? ` • ${b.branch_name}` : ""}
                    {b.client_name ? ` • ${b.client_name}` : ""}
                    {b.employee_name ? ` • ${b.employee_name}` : ""}
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-[13px] shrink-0">{fmt(b.amount || b.buy_price)} ₽</div>
              </div>
            ))}
            {bought.length > 15 && (
              <div className="text-center text-[10px] text-white/30 pt-1">… и ещё {bought.length - 15}</div>
            )}
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onNav("buy")} className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-3 active:scale-95 transition-transform text-left">
          <Icon name="Plus" size={20} className="text-emerald-300" />
          <div className="font-bold text-sm mt-1">Принять товар</div>
          <div className="text-[11px] text-white/50">скупка / комиссия</div>
        </button>
        <button onClick={() => onNav("stock")} className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-3 active:scale-95 transition-transform text-left">
          <Icon name="HandCoins" size={20} className="text-blue-300" />
          <div className="font-bold text-sm mt-1">Продать товар</div>
          <div className="text-[11px] text-white/50">из склада / витрины</div>
        </button>
        <button onClick={() => onNav("labels")} className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl p-3 active:scale-95 transition-transform text-left">
          <Icon name="Tag" size={20} className="text-[#FFD700]" />
          <div className="font-bold text-sm mt-1">Ценники</div>
          <div className="text-[11px] text-white/50">печать на термопринтере</div>
        </button>
        <button onClick={() => onNav("import")} className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-3 active:scale-95 transition-transform text-left">
          <Icon name="ArrowUpDown" size={20} className="text-purple-300" />
          <div className="font-bold text-sm mt-1">Импорт / Экспорт</div>
          <div className="text-[11px] text-white/50">Excel / CSV / текст</div>
        </button>
      </div>
    </div>
  );
}

function Card({ title, value, sub, icon, color }: { title: string; value: string; sub: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    blue: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-300",
    yellow: "from-[#FFD700]/15 to-[#FFD700]/5 border-[#FFD700]/30 text-[#FFD700]",
    white: "from-white/10 to-white/5 border-white/20 text-white",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
        <Icon name={icon} size={12} />
        {title}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-[11px] opacity-60 mt-0.5">{sub}</div>
    </div>
  );
}