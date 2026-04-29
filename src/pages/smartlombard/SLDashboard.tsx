import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SMARTLOMBARD_URL } from "../staff.types";

type Stats = {
  date_from: string;
  date_to: string;
  income: number;
  expense: number;
  period_income: number;
  period_costs: number;
  period_profit: number;
  sales_total?: number;
  sales_count?: number;
  pledge_total?: number;
  pledge_count?: number;
  buyout_total?: number;
  buyout_count?: number;
  operations_total: number;
  cached?: boolean;
  error?: string;
};

const fmt = (n: number) => (n || 0).toLocaleString("ru-RU");

function todayDmy() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function shiftDmy(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const PRESETS: { k: string; l: string; from: () => string; to: () => string }[] = [
  { k: "today", l: "Сегодня", from: () => todayDmy(), to: () => todayDmy() },
  { k: "yest",  l: "Вчера",   from: () => shiftDmy(-1), to: () => shiftDmy(-1) },
  { k: "w7",    l: "7 дней",  from: () => shiftDmy(-6), to: () => todayDmy() },
  { k: "m30",   l: "30 дней", from: () => shiftDmy(-29), to: () => todayDmy() },
];

export function SLDashboard({ token }: { token: string }) {
  const [preset, setPreset] = useState("today");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    setLoading(true); setError("");
    const cur = PRESETS.find(p => p.k === preset) || PRESETS[0];
    const url = `${SMARTLOMBARD_URL}?date_from=${cur.from()}&date_to=${cur.to()}${force ? "&nocache=1" : ""}`;
    try {
      const res = await fetch(url, { headers: { "X-Employee-Token": token } });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || `Ошибка ${res.status}`);
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [preset, token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {PRESETS.map(p => {
            const a = preset === p.k;
            return (
              <button key={p.k} onClick={() => setPreset(p.k)}
                className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
                }`}>{p.l}</button>
            );
          })}
        </div>
        <button onClick={() => load(true)} disabled={loading}
          title="Обновить"
          className="shrink-0 p-2 rounded-md bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] active:scale-95 transition-all disabled:opacity-50">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-oswald font-bold text-red-300 text-xs uppercase">Не удалось загрузить</div>
            <div className="font-roboto text-red-300/70 text-[11px] mt-1 break-words">{error}</div>
          </div>
        </div>
      )}

      {!error && stats && (
        <div className="grid grid-cols-2 gap-2">
          {/* ВЫДЕЛЕННАЯ карточка ПРОДАЖИ ТОВАРА (sell_realization) */}
          <div className="col-span-2">
            <Card
              label="Продажи товара (Iphone, Sony и т.д.)"
              value={stats.sales_total ?? 0}
              icon="ShoppingCart"
              tint="gold"
              big
              sub={`${stats.sales_count ?? 0} операций`}
            />
          </div>
          <Card label="Приход" value={stats.income} icon="ArrowDownToLine" tint="green" />
          <Card label="Расход" value={stats.expense} icon="ArrowUpFromLine" tint="red" />
          <Card label="Залоги" value={stats.pledge_total ?? 0} icon="ArrowDownToLine" tint="red" sub={`${stats.pledge_count ?? 0} операций`} />
          <Card label="Выкупы" value={stats.buyout_total ?? 0} icon="ArrowUpFromLine" tint="green" sub={`${stats.buyout_count ?? 0} операций`} />
          <Card label="Доход (%)" value={stats.period_income} icon="TrendingUp" tint="green" sub="проценты + сверх" />
          <Card label="Издержки" value={stats.period_costs} icon="TrendingDown" tint="red" sub="убытки" />
          <div className="col-span-2">
            <Card label="Прибыль" value={stats.period_profit}
              icon={stats.period_profit >= 0 ? "Sparkles" : "AlertTriangle"}
              tint={stats.period_profit >= 0 ? "gold" : "red"} big />
          </div>
          <div className="col-span-2 bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Activity" size={14} className="text-white/40" />
              <span className="font-roboto text-white/50 text-[11px]">Операций за период</span>
            </div>
            <span className="font-oswald font-bold text-white text-base tabular-nums">{stats.operations_total}</span>
          </div>
          <div className="col-span-2 text-center font-roboto text-white/30 text-[10px]">
            {stats.date_from === stats.date_to ? `за ${stats.date_from}` : `${stats.date_from} — ${stats.date_to}`}
            {stats.cached && <span className="ml-2 text-white/20">(из кэша)</span>}
          </div>
        </div>
      )}

      {!error && !stats && loading && (
        <div className="flex items-center justify-center py-12 text-white/30">
          <Icon name="Loader" size={18} className="animate-spin mr-2 text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю данные...</span>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon, tint, sub, big }: {
  label: string; value: number; icon: string;
  tint: "green" | "red" | "gold"; sub?: string; big?: boolean;
}) {
  const palette = {
    green: { bg: "from-green-500/10 to-green-500/[0.02]", border: "border-green-500/20", text: "text-green-400" },
    red:   { bg: "from-red-500/10 to-red-500/[0.02]",     border: "border-red-500/20",   text: "text-red-400" },
    gold:  { bg: "from-[#FFD700]/15 to-[#FFD700]/[0.02]", border: "border-[#FFD700]/30", text: "text-[#FFD700]" },
  }[tint];
  return (
    <div className={`relative bg-gradient-to-br ${palette.bg} border ${palette.border} rounded-lg p-3 overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-roboto text-white/50 text-[10px] uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={13} className={palette.text} />
      </div>
      <div className={`font-oswald font-bold ${palette.text} tabular-nums leading-none ${big ? "text-3xl" : "text-xl"}`}>
        {fmt(value)} <span className="text-white/30 text-sm">₽</span>
      </div>
      {sub && <div className="font-roboto text-white/30 text-[9px] mt-1">{sub}</div>}
    </div>
  );
}

export default SLDashboard;