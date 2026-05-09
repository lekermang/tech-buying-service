import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLAccounting, type SLCashSummary, SLSHOP_URL } from "./types";
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

export default function SLBookkeeping({ token }: { token: string }) {
  const [period, setPeriod] = useSharedPeriod();
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
      <SLTabs
        size="sm"
        items={PERIODS.map(p => ({ v: p.v, l: p.l }))}
        value={period}
        onChange={setPeriod}
        right={
          <button onClick={downloadExport} className="inline-flex items-center gap-1 bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md transition active:scale-[0.97]">
            <Icon name="Download" size={10} />Excel
          </button>
        }
      />

      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-[#FFD700] mb-2">Денежная сводка</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat l="Выручка с продаж" v={fmt(data?.revenue || 0) + " ₽"} c="text-emerald-300" />
          <Stat
            l="Проценты СмартЛомбард"
            v={"+" + fmt(data?.contract_income || 0) + " ₽"}
            c="text-purple-300"
            hint="Доход от процентов и пени по закрытым договорам 14 дней. Тело займа в прибыль не попадает — это возврат денег клиенту."
          />
          <Stat
            l="Инвестировано в товар"
            v={fmt((data?.purchases ?? 0)) + " ₽"}
            c="text-sky-300"
            hint="Скупка Б/У техники — это инвестиция в склад, а не расход. В прибыль попадает только разница sell−buy после продажи."
          />
          <Stat
            l="Себестоимость продаж"
            v={"−" + fmt((data?.cogs ?? 0)) + " ₽"}
            c="text-amber-300"
            hint="Закупочная цена именно того, что продали в этом периоде — единственное, что вычитается из выручки в прибыль"
          />
          <Stat
            l="Операционные расходы"
            v={"−" + fmt((data?.opex ?? 0)) + " ₽"}
            c="text-red-300"
            hint="Зарплаты, аренда, прочие платежи из кассы"
          />
          <Stat
            l="Маржа (до расходов)"
            v={fmt(Math.max(0, Number(data?.gross_profit ?? 0))) + " ₽"}
            c="text-emerald-200"
            hint="(Выручка − Себестоимость) + Проценты по договорам"
          />
          <Stat
            l="Чистая прибыль"
            v={fmt(Math.max(0, Number(data?.profit ?? 0))) + " ₽"}
            c="text-[#FFD700]"
            hint="Маржа − Операционные расходы"
          />
          <Stat l="Касса (сейчас)" v={fmt(totalCash) + " ₽"} c="text-blue-300" />
          <Stat l="Сделок (прод/закуп)" v={`${data?.sales_count || 0} / ${data?.buys_count || 0}`} c="text-white/70" />
        </div>
        <div className="text-[10px] text-white/40 mt-2 leading-relaxed">
          «Инвестировано в товар» — это вложения в склад Б/У, они НЕ уменьшают прибыль. В прибыль вписывается только разница (sell − buy) с уже проданных товаров + проценты по закрытым договорам СмартЛомбарда.
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

function Stat({ l, v, c, hint }: { l: string; v: string; c: string; hint?: string }) {
  return (
    <div className="bg-[#0A0A0A] rounded-lg p-2" title={hint}>
      <div className="text-[9px] uppercase text-white/40 tracking-wide flex items-center gap-1">
        {l}
        {hint && <Icon name="Info" size={9} className="text-white/30" />}
      </div>
      <div className={`text-base font-bold mt-0.5 ${c}`}>{v}</div>
    </div>
  );
}