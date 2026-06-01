import Icon from "@/components/ui/icon";
import type { EmployeeOverview } from "@/pages/staff.types";
import { statusDot } from "./ownerSalaryTypes";

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

type Summary = {
  revenue_month: number;
  profit_month: number;
  sales_count_month: number;
  repair_revenue_month: number;
  repair_profit_month: number;
  repair_count_month: number;
  total_revenue_month: number;
  total_profit_month: number;
  salary_month: number;
  salary_unpaid: number;
} | null;

export default function OwnerEmployeesList({
  employees,
  summary,
  onSelect,
}: {
  employees: EmployeeOverview[];
  summary?: Summary;
  onSelect: (id: number) => void;
}) {
  const now = new Date();
  const monthLabel = now.toLocaleString("ru-RU", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* Шапка */}
      <div>
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">Полное управление: смены, выходные, выплаты</p>
      </div>

      {/* Сводка по выручке */}
      {summary && (
        <div className="rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(145deg,rgba(255,215,0,0.07),rgba(255,215,0,0.02))",
          border: "1px solid rgba(255,215,0,0.2)",
        }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
            <Icon name="TrendingUp" size={13} style={{ color: "rgba(255,215,0,0.7)" }} />
            <span className="font-roboto text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
              Выручка магазина — {monthLabel}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {/* Итоговая строка */}
            <div className="flex items-center justify-between">
              <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Общая выручка</span>
              <span className="font-oswald font-black text-2xl" style={{ color: "#FFD700" }}>
                {fmt(summary.total_revenue_month)} ₽
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Чистая прибыль</span>
              <span className="font-oswald font-bold text-xl" style={{ color: "#34d399" }}>
                {fmt(summary.total_profit_month)} ₽
              </span>
            </div>

            {/* Разбивка */}
            <div className="grid grid-cols-2 gap-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name="ShoppingBag" size={11} style={{ color: "#a78bfa" }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.7)" }}>Ломбард</span>
                </div>
                <div className="font-oswald font-bold text-base" style={{ color: "#a78bfa" }}>
                  {fmt(summary.revenue_month)} ₽
                </div>
                <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  прибыль: {fmt(summary.profit_month)} ₽
                </div>
                <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {summary.sales_count_month} продаж
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name="Wrench" size={11} style={{ color: "#34d399" }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.7)" }}>Ремонты</span>
                </div>
                <div className="font-oswald font-bold text-base" style={{ color: "#34d399" }}>
                  {fmt(summary.repair_revenue_month)} ₽
                </div>
                <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  прибыль: {fmt(summary.repair_profit_month)} ₽
                </div>
                <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {summary.repair_count_month} ремонтов
                </div>
              </div>
            </div>

            {/* Зарплата */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{
              background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)",
            }}>
              <div>
                <div className="font-roboto text-xs font-semibold" style={{ color: "rgba(248,113,113,0.8)" }}>
                  Зарплата за месяц
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Задолженность всего: {fmt(summary.salary_unpaid)} ₽
                </div>
              </div>
              <div className="font-oswald font-bold text-base" style={{ color: "#f87171" }}>
                {fmt(summary.salary_month)} ₽
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список сотрудников */}
      {employees.length === 0 ? (
        <div className="text-white/40 text-center py-8 font-roboto">Нет активных сотрудников</div>
      ) : (
        <div className="space-y-3">
          {employees.map(e => {
            const dot = statusDot(e.shift_status);
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="w-full text-left rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FFD700]/30 p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/30 flex items-center justify-center font-oswald font-bold text-[#FFD700]">
                    {(e.full_name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-oswald font-bold text-white text-base truncate">{e.full_name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/50 font-roboto">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                        {dot.label}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs font-roboto mt-0.5">
                      {e.position || e.role} · {e.daily_rate.toLocaleString("ru-RU")} ₽/смена · {e.bonus_percent}%
                    </div>
                  </div>
                  {(e.unpaid_total ?? 0) > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wide text-white/50 font-oswald">К выплате</div>
                      <div className="text-[#FFD700] font-bold font-oswald tabular-nums">
                        {Number(e.unpaid_total).toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  )}
                  <Icon name="ChevronRight" size={16} className="text-white/30 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
