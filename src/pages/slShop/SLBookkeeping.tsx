import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLAccounting, type SLCashSummary, SLSHOP_URL } from "./types";

export default function SLBookkeeping({ token }: { token: string }) {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<SLAccounting | null>(null);
  const [accounts, setAccounts] = useState<SLCashSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      slApi<SLAccounting>(token, "accounting", { params: { period } }),
      slApi<SLCashSummary[]>(token, "cash_summary"),
    ]);
    if (r1.ok && r1.data) setData(r1.data);
    if (r2.ok && r2.data) setAccounts(r2.data);
    setLoading(false);
  }, [token, period]);
  useEffect(() => { load(); }, [load]);

  const downloadExport = async () => {
    const url = `${SLSHOP_URL}?action=export&format=csv`;
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `slshop-buh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const totalCash = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {[
          { v: "7d", l: "7 дней" },
          { v: "30d", l: "Месяц" },
          { v: "year", l: "Год" },
          { v: "all", l: "Всё" },
        ].map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)}
            className={`text-[11px] px-3 py-1.5 rounded-full ${period === p.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50"}`}>
            {p.l}
          </button>
        ))}
        <button onClick={downloadExport} className="ml-auto bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Icon name="Download" size={11} />Excel/CSV
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-[#FFD700] mb-2">Денежная сводка</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat l="Доход (период)" v={fmt(data?.revenue || 0) + " ₽"} c="text-emerald-300" />
          <Stat l="Расход (период)" v={fmt(data?.spent || 0) + " ₽"} c="text-red-300" />
          <Stat l="Прибыль" v={fmt(data?.profit || 0) + " ₽"} c="text-[#FFD700]" />
          <Stat l="Касса (сейчас)" v={fmt(totalCash) + " ₽"} c="text-blue-300" />
        </div>
      </div>

      {/* Книга учёта операций */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Касса по филиалам</div>
        <div className="space-y-1.5">
          {accounts.map(a => (
            <div key={a.id} className="bg-[#141414] rounded p-2.5 flex items-center gap-2">
              <Icon name="Wallet" size={14} className="text-[#FFD700]" />
              <div className="flex-1">
                <div className="text-sm font-bold">{a.name}</div>
                <div className="text-[10px] text-white/40">сегодня: +{fmt(a.today_in)} / −{fmt(a.today_out)}</div>
              </div>
              <div className="font-bold text-[#FFD700]">{fmt(a.balance)} ₽</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Касса по филиалам (период)</div>
        {!data || data.cash_by_branch.length === 0 ? (
          <div className="text-white/30 text-sm text-center py-4">Нет данных</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-white/40">
              <tr>
                <th className="text-left py-1">Филиал / Касса</th>
                <th className="text-right">Приход</th>
                <th className="text-right">Расход</th>
                <th className="text-right">Сальдо</th>
              </tr>
            </thead>
            <tbody>
              {data.cash_by_branch.map((b, i) => {
                const sal = Number(b.in_sum) - Number(b.out_sum);
                return (
                  <tr key={i} className="border-t border-[#1F1F1F]">
                    <td className="py-1.5 font-bold">{b.branch || "—"} <span className="text-white/40 text-[11px]">{b.account}</span></td>
                    <td className="text-right text-emerald-300">+{fmt(b.in_sum)}₽</td>
                    <td className="text-right text-red-300">−{fmt(b.out_sum)}₽</td>
                    <td className={`text-right font-bold ${sal >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {sal >= 0 ? "+" : ""}{fmt(sal)}₽
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Расходы по категориям</div>
        {!data || data.expenses_by_category.length === 0 ? (
          <div className="text-white/30 text-sm text-center py-4">Нет данных</div>
        ) : (
          <div className="space-y-1">
            {data.expenses_by_category.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex-1 truncate">{c.category || "—"}</span>
                <span className="text-white/40 text-[11px] mr-2">{c.cnt} опер.</span>
                <span className="text-red-300 font-bold w-24 text-right">−{fmt(c.sum)}₽</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] text-white/40 px-1">
        Полные таблицы по операциям можно выгрузить кнопкой «Excel/CSV» вверху или в разделе «Импорт/Экспорт».
        {loading && <span className="text-[#FFD700] ml-1">обновление...</span>}
      </div>
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: string; c: string }) {
  return (
    <div className="bg-[#0A0A0A] rounded-lg p-2">
      <div className="text-[9px] uppercase text-white/40 tracking-wide">{l}</div>
      <div className={`text-base font-bold mt-0.5 ${c}`}>{v}</div>
    </div>
  );
}