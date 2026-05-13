import Icon from "@/components/ui/icon";
import type { EmployeeOverview } from "@/pages/staff.types";
import { statusDot } from "./ownerSalaryTypes";

export default function OwnerEmployeesList({
  employees,
  onSelect,
}: {
  employees: EmployeeOverview[];
  onSelect: (id: number) => void;
}) {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">Полное управление: смены, выходные, выплаты</p>
      </div>

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
