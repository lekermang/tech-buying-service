import Icon from "@/components/ui/icon";
import type { EmployeeOverview } from "@/pages/staff.types";
import { statusDot } from "./ownerSalaryTypes";

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

type MyStats = {
  profit_today: number;
  revenue_today: number;
  sales_today: number;
  profit_month: number;
  revenue_month: number;
  sales_month: number;
} | null;

export default function OwnerEmployeesList({
  employees,
  myStats,
  onSelect,
}: {
  employees: EmployeeOverview[];
  myStats?: MyStats;
  onSelect: (id: number) => void;
}) {
  const now = new Date();
  const monthLabel = now.toLocaleString("ru-RU", { month: "long" });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* Шапка */}
      <div>
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">Управление сотрудниками</p>
      </div>

      {/* Мой доход сегодня */}
      {myStats && (
        <div className="rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(145deg,rgba(255,215,0,0.1),rgba(255,215,0,0.03))",
          border: "1.5px solid rgba(255,215,0,0.3)",
          boxShadow: "0 0 32px rgba(255,215,0,0.06)",
        }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
            <Icon name="Wallet" size={12} style={{ color: "rgba(255,215,0,0.7)" }} />
            <span className="font-roboto text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,215,0,0.6)" }}>
              Мой доход сегодня
            </span>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-roboto text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Чистая прибыль
                </div>
                <div className="font-oswald font-black text-4xl tabular-nums" style={{ color: "#FFD700" }}>
                  {fmt(myStats.profit_today)} ₽
                </div>
                {myStats.sales_today > 0 ? (
                  <div className="font-roboto text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {myStats.sales_today} {myStats.sales_today === 1 ? "продажа" : myStats.sales_today < 5 ? "продажи" : "продаж"} · выручка {fmt(myStats.revenue_today)} ₽
                  </div>
                ) : (
                  <div className="font-roboto text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Продаж сегодня нет
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  За {monthLabel}
                </div>
                <div className="font-oswald font-bold text-xl tabular-nums" style={{ color: "rgba(255,215,0,0.7)" }}>
                  {fmt(myStats.profit_month)} ₽
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {myStats.sales_month} продаж
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список сотрудников */}
      <div>
        <div className="font-roboto text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Сотрудники
        </div>
        {employees.length === 0 ? (
          <div className="text-white/40 text-center py-8 font-roboto">Нет активных сотрудников</div>
        ) : (
          <div className="space-y-2">
            {employees.map(e => {
              const dot = statusDot(e.shift_status);
              return (
                <button
                  key={e.id}
                  onClick={() => onSelect(e.id)}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FFD700]/30 p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/25 flex items-center justify-center font-oswald font-bold text-[#FFD700]">
                      {(e.full_name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-white text-base truncate">{e.full_name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 font-roboto">
                          <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                          {dot.label}
                        </span>
                      </div>
                      <div className="text-white/35 text-xs font-roboto mt-0.5">
                        {e.position || e.role} · {e.daily_rate.toLocaleString("ru-RU")} ₽/смена · {e.bonus_percent}%
                      </div>
                    </div>
                    {(e.unpaid_total ?? 0) > 0 && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wide text-white/40 font-roboto">К выплате</div>
                        <div className="text-[#FFD700] font-bold font-oswald tabular-nums text-sm">
                          {Number(e.unpaid_total).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    )}
                    <Icon name="ChevronRight" size={15} className="text-white/25 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
