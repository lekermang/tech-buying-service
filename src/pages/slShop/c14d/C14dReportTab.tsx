import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { c14dApi, fmt, fmtDate, type C14dIncomeReport } from "./types";

type Props = { token: string };

const inp = "rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white";
const lbl = "block text-[10px] uppercase tracking-wider font-semibold text-white/60 mb-1";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); };

const incomeLabel = (t: string) => {
  if (t === "principal") return "Тело";
  if (t === "interest") return "Проценты";
  if (t === "mixed") return "Смешанный";
  if (t === "penalty") return "Пеня";
  return t;
};

export default function C14dReportTab({ token }: Props) {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [incomeType, setIncomeType] = useState<"all" | "principal" | "interest" | "mixed">("all");
  const [contractStatus, setContractStatus] = useState<"all" | "active" | "closed" | "terminated">("all");
  const [report, setReport] = useState<C14dIncomeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    const r = await c14dApi<C14dIncomeReport>(token, "income_report", {
      params: {
        start_date: from,
        end_date: to,
        income_type: incomeType,
        contract_status: contractStatus,
      },
    });
    setLoading(false);
    if (!r.ok || !r.data) {
      setErr(r.error || "Не удалось загрузить отчёт");
      setReport(null);
      return;
    }
    setReport(r.data);
  };

  useEffect(() => { load();   }, []);

  const setQuick = (kind: "today" | "week" | "month") => {
    if (kind === "today") { setFrom(today()); setTo(today()); }
    if (kind === "week") { setFrom(weekAgo()); setTo(today()); }
    if (kind === "month") { setFrom(monthStart()); setTo(today()); }
  };

  const exportExcel = () => {
    if (!report) return;
    const rows = [
      ["Отчёт по доходам · Договор продажи на 14 дней"],
      [`Период: ${fmtDate(report.period.start_date)} — ${fmtDate(report.period.end_date)}`],
      [],
      ["Сводка"],
      ["Всего платежей", String(report.summary.payments_count)],
      ["Договоров", String(report.summary.contract_count)],
      ["Общий доход, ₽", fmt(report.summary.total_income)],
      ["Тело, ₽", fmt(report.summary.principal_income)],
      ["Проценты, ₽", fmt(report.summary.interest_income)],
      ["Смешанный, ₽", fmt(report.summary.mixed_income)],
      ["Средний доход на договор, ₽", fmt(report.summary.avg_income_per_contract)],
      [],
      ["Дата платежа", "№ договора", "Клиент", "Тип дохода", "Тип платежа", "Сумма ₽", "Статус договора", "Принял", "Комментарий"],
      ...report.details.map(d => [
        fmtDate(d.paid_at),
        d.contract_number,
        d.client_name,
        incomeLabel(d.income_type),
        d.payment_type === "full" ? "Полный" : "Частичный",
        fmt(d.amount),
        d.contract_status,
        d.recorded_by || "",
        d.comment || "",
      ]),
    ];
    // CSV (UTF-8 BOM) — Excel корректно открывает
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? "");
      if (s.includes(";") || s.includes("\"") || s.includes("\n")) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income_14d_${from}_${to}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Фильтры */}
      <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="BarChart3" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Отчёт по доходам</h3>
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          {[
            { k: "today", l: "Сегодня" },
            { k: "week", l: "7 дней" },
            { k: "month", l: "Месяц" },
          ].map(b => (
            <button key={b.k} onClick={() => setQuick(b.k as "today" | "week" | "month")} className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0F0F0F] border border-[#222] hover:border-[#FFD700]/40 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {b.l}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-4 gap-2">
          <div>
            <label className={lbl}>С</label>
            <input className={inp + " w-full"} type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} />
          </div>
          <div>
            <label className={lbl}>По</label>
            <input className={inp + " w-full"} type="date" value={to} onChange={e => setTo(e.target.value)} min={from} max={today()} />
          </div>
          <div>
            <label className={lbl}>Тип дохода</label>
            <select className={inp + " w-full"} value={incomeType} onChange={e => setIncomeType(e.target.value as typeof incomeType)}>
              <option value="all">Все</option>
              <option value="interest">Только проценты</option>
              <option value="principal">Только тело</option>
              <option value="mixed">Смешанные</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Статус договора</label>
            <select className={inp + " w-full"} value={contractStatus} onChange={e => setContractStatus(e.target.value as typeof contractStatus)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="closed">Закрытые</option>
              <option value="terminated">Расторгнутые</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={load} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold uppercase tracking-wide text-xs disabled:opacity-50">
            {loading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Search" size={13} />}
            Сформировать
          </button>
          <button onClick={exportExcel} disabled={!report || (report?.details.length || 0) === 0} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wide text-xs disabled:opacity-50">
            <Icon name="FileSpreadsheet" size={13} /> Excel
          </button>
        </div>
      </div>

      {err && <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 text-sm">{err}</div>}

      {/* Сводка */}
      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat l="Общий доход" v={`${fmt(report.summary.total_income)} ₽`} c="text-[#FFD700]" />
            <Stat l="Платежей" v={String(report.summary.payments_count)} c="text-white" />
            <Stat l="Договоров" v={String(report.summary.contract_count)} c="text-emerald-300" />
            <Stat l="Средний / договор" v={`${fmt(report.summary.avg_income_per_contract)} ₽`} c="text-blue-300" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat l="Тело" v={`${fmt(report.summary.principal_income)} ₽`} c="text-white/80" />
            <Stat l="Проценты" v={`${fmt(report.summary.interest_income)} ₽`} c="text-orange-300" />
            <Stat l="Смешанные" v={`${fmt(report.summary.mixed_income)} ₽`} c="text-white/60" />
          </div>

          {/* График по дням (мини-бар) */}
          {report.daily.length > 0 && (
            <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-2">По дням</div>
              <div className="flex items-end gap-1 h-24">
                {(() => {
                  const max = Math.max(...report.daily.map(d => d.amount), 1);
                  return report.daily.map(d => {
                    const h = Math.max(2, Math.round((d.amount / max) * 100));
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-[4px]" title={`${fmtDate(d.date)} · ${fmt(d.amount)} ₽`}>
                        <div className="w-full bg-gradient-to-t from-[#FFD700]/30 to-[#FFD700] rounded-t" style={{ height: `${h}%` }} />
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-white/40">
                <span>{fmtDate(report.daily[0]?.date)}</span>
                <span>{fmtDate(report.daily[report.daily.length - 1]?.date)}</span>
              </div>
            </div>
          )}

          {/* Таблица деталей */}
          <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="ListOrdered" size={14} className="text-[#FFD700]" />
              <h3 className="font-oswald uppercase text-sm tracking-wide">Платежи ({report.details.length})</h3>
            </div>
            {report.details.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-sm">За выбранный период доходов нет</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-[10px] text-white/40 uppercase tracking-wider">
                      <th className="text-left p-1.5">Дата</th>
                      <th className="text-left p-1.5">№ договора</th>
                      <th className="text-left p-1.5">Клиент</th>
                      <th className="text-left p-1.5">Тип</th>
                      <th className="text-right p-1.5">Сумма</th>
                      <th className="text-left p-1.5">Принял</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map(d => (
                      <tr key={d.id} className="border-t border-[#1F1F1F]">
                        <td className="p-1.5 text-white/70">{fmtDate(d.paid_at)}</td>
                        <td className="p-1.5 text-[#FFD700] font-semibold">{d.contract_number}</td>
                        <td className="p-1.5 text-white/85 truncate max-w-[180px]">{d.client_name}</td>
                        <td className="p-1.5 text-white/60">{incomeLabel(d.income_type)}</td>
                        <td className="p-1.5 text-right text-emerald-300 font-semibold">{fmt(d.amount)} ₽</td>
                        <td className="p-1.5 text-white/60">{d.recorded_by || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: string; c: string }) {
  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{l}</div>
      <div className={`font-oswald text-base font-bold ${c}`}>{v}</div>
    </div>
  );
}
