import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { c14dApi, fmt, fmtDate, type C14dIncomeReport } from "./types";
import { SLSection, SLField, SLInput, SLSelect, SLButton, SLStat, SLGrid } from "../slUI";

type Props = { token: string };

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); };

const incomeLabel = (t: string) => {
  if (t === "principal") return "Тело";
  if (t === "interest") return "Проценты";
  if (t === "mixed") return "Смешан.";
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
      params: { start_date: from, end_date: to, income_type: incomeType, contract_status: contractStatus },
    });
    setLoading(false);
    if (!r.ok || !r.data) { setErr(r.error || "Не удалось загрузить отчёт"); setReport(null); return; }
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
        fmtDate(d.paid_at), d.contract_number, d.client_name,
        incomeLabel(d.income_type),
        d.payment_type === "full" ? "Полный" : "Частичный",
        fmt(d.amount), d.contract_status, d.recorded_by || "", d.comment || "",
      ]),
    ];
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? "");
      if (s.includes(";") || s.includes("\"") || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `income_14d_${from}_${to}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <SLSection icon="BarChart3" title="Отчёт по доходам" right={
        <div className="flex gap-1">
          {[
            { k: "today", l: "Сегодня" },
            { k: "week", l: "7 дн." },
            { k: "month", l: "Месяц" },
          ].map(b => (
            <button key={b.k} onClick={() => setQuick(b.k as "today" | "week" | "month")}
              className="px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#FFD700]/40 text-[9px] font-bold uppercase tracking-wide text-white/65">
              {b.l}
            </button>
          ))}
        </div>
      }>
        <SLGrid cols={4}>
          <SLField label="С"><SLInput type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} /></SLField>
          <SLField label="По"><SLInput type="date" value={to} onChange={e => setTo(e.target.value)} min={from} max={today()} /></SLField>
          <SLField label="Тип дохода">
            <SLSelect value={incomeType} onChange={e => setIncomeType(e.target.value as typeof incomeType)}>
              <option value="all">Все</option>
              <option value="interest">% проценты</option>
              <option value="principal">Тело</option>
              <option value="mixed">Смешанные</option>
            </SLSelect>
          </SLField>
          <SLField label="Статус">
            <SLSelect value={contractStatus} onChange={e => setContractStatus(e.target.value as typeof contractStatus)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="closed">Закрытые</option>
              <option value="terminated">Расторгнутые</option>
            </SLSelect>
          </SLField>
        </SLGrid>
        <div className="flex gap-1.5 mt-2">
          <SLButton variant="gold" size="sm" icon={loading ? "Loader2" : "Search"} onClick={load} disabled={loading} className="flex-1">
            Сформировать
          </SLButton>
          <SLButton variant="success" size="sm" icon="FileSpreadsheet" onClick={exportExcel} disabled={!report || (report?.details.length || 0) === 0}>
            Excel
          </SLButton>
        </div>
      </SLSection>

      {err && <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>}

      {report && (
        <>
          <SLGrid cols={4}>
            <SLStat label="Доход" value={`${fmt(report.summary.total_income)} ₽`} color="gold" icon="Coins" />
            <SLStat label="Платежей" value={String(report.summary.payments_count)} icon="Receipt" />
            <SLStat label="Договоров" value={String(report.summary.contract_count)} color="green" icon="FileText" />
            <SLStat label="Средн./договор" value={`${fmt(report.summary.avg_income_per_contract)} ₽`} color="blue" icon="TrendingUp" />
          </SLGrid>
          <SLGrid cols={3}>
            <SLStat label="Тело" value={`${fmt(report.summary.principal_income)} ₽`} />
            <SLStat label="Проценты" value={`${fmt(report.summary.interest_income)} ₽`} color="orange" />
            <SLStat label="Смешан." value={`${fmt(report.summary.mixed_income)} ₽`} />
          </SLGrid>

          {report.daily.length > 0 && (
            <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-white/45 font-bold mb-1.5">По дням</div>
              <div className="flex items-end gap-0.5 h-16">
                {(() => {
                  const max = Math.max(...report.daily.map(d => d.amount), 1);
                  return report.daily.map(d => {
                    const h = Math.max(2, Math.round((d.amount / max) * 100));
                    return (
                      <div key={d.date} className="flex-1 min-w-[3px]" title={`${fmtDate(d.date)} · ${fmt(d.amount)} ₽`}>
                        <div className="w-full bg-gradient-to-t from-[#FFD700]/30 to-[#FFD700] rounded-sm" style={{ height: `${h}%` }} />
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-white/35">
                <span>{fmtDate(report.daily[0]?.date)}</span>
                <span>{fmtDate(report.daily[report.daily.length - 1]?.date)}</span>
              </div>
            </div>
          )}

          <SLSection icon="ListOrdered" title={`Платежи · ${report.details.length}`}>
            {report.details.length === 0 ? (
              <div className="text-center py-3 text-white/35 text-[12px]">За период доходов нет</div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[12px] min-w-[520px]">
                  <thead>
                    <tr className="text-[9px] text-white/40 uppercase tracking-wider">
                      <th className="text-left p-1">Дата</th>
                      <th className="text-left p-1">№</th>
                      <th className="text-left p-1">Клиент</th>
                      <th className="text-left p-1">Тип</th>
                      <th className="text-right p-1">Сумма</th>
                      <th className="text-left p-1">Принял</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map(d => (
                      <tr key={d.id} className="border-t border-[#1A1A1A]">
                        <td className="p-1 text-white/65">{fmtDate(d.paid_at)}</td>
                        <td className="p-1 text-[#FFD700] font-bold">{d.contract_number}</td>
                        <td className="p-1 text-white/85 truncate max-w-[140px]">{d.client_name}</td>
                        <td className="p-1 text-white/55">{incomeLabel(d.income_type)}</td>
                        <td className="p-1 text-right text-emerald-300 font-bold">{fmt(d.amount)} ₽</td>
                        <td className="p-1 text-white/55 truncate max-w-[80px]">{d.recorded_by || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SLSection>
        </>
      )}
    </div>
  );
}
