import Icon from "@/components/ui/icon";
import { fmt } from "./employee.types";
import type { RepairHistory, RepairDayDetail } from "./employee.types";

interface Props {
  repairHistory: RepairHistory | null;
  repairLoading: boolean;
  expandedRepairDate: string | null;
  repairDetailCache: Record<string, RepairDayDetail>;
  repairDetailLoading: string | null;
  onToggleDay: (date: string) => void;
}

export default function EmployeeRepairHistory({
  repairHistory,
  repairLoading,
  expandedRepairDate,
  repairDetailCache,
  repairDetailLoading,
  onToggleDay,
}: Props) {
  return (
    <div>
      <div className="font-oswald font-bold text-base uppercase tracking-wide text-white mb-3">Доход с ремонтов</div>
      {repairLoading ? (
        <div className="py-8 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Icon name="Loader2" size={16} className="animate-spin" /><span className="font-roboto text-sm">Загрузка...</span>
        </div>
      ) : !repairHistory || repairHistory.days.length === 0 ? (
        <div className="text-center py-8 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
          За этот период ремонтов нет
        </div>
      ) : (
        <div className="space-y-1.5">
          {repairHistory.days.map((d) => {
            const isExp = expandedRepairDate === d.repair_date;
            const isLoadingThis = repairDetailLoading === d.repair_date;
            const detail = repairDetailCache[d.repair_date];
            const dateLabel = new Date(d.repair_date + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });

            return (
              <div key={d.repair_date} className="rounded-xl overflow-hidden" style={{
                border: isExp ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.07)",
                background: isExp ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.03)",
              }}>
                {/* Строка дня */}
                <button className="w-full flex items-center justify-between px-3 py-3 text-left" onClick={() => onToggleDay(d.repair_date)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-roboto text-sm font-semibold text-white">{dateLabel}</div>
                    <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                      <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {d.orders_count} {d.orders_count === 1 ? "ремонт" : d.orders_count < 5 ? "ремонта" : "ремонтов"}
                      </span>
                      <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>· выручка {fmt(d.total_revenue)} ₽</span>
                      {d.total_costs > 0 && (
                        <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>· запчасти {fmt(d.total_costs)} ₽</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#34d399" }}>
                      {fmt(d.master_income)} ₽
                    </div>
                    {isLoadingThis
                      ? <Icon name="Loader2" size={14} className="animate-spin" style={{ color: "rgba(52,211,153,0.5)" }} />
                      : <Icon name={isExp ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                    }
                  </div>
                </button>

                {/* Детализация заказов */}
                {isExp && detail && (
                  <div className="border-t" style={{ borderColor: "rgba(52,211,153,0.15)" }}>
                    <div className="px-3 pt-3 pb-3 space-y-2">
                      <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Расшифровка ремонтов
                      </div>

                      {detail.orders.map((o) => (
                        <div key={o.id} className="rounded-xl px-3 py-2.5" style={{
                          background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)",
                        }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{o.time}</span>
                                <span className="font-roboto text-sm font-semibold text-white truncate">{o.model}</span>
                              </div>
                              {o.repair_type && o.repair_type !== "—" && (
                                <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{o.repair_type}</div>
                              )}
                              {o.parts_name && (
                                <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>Запчасть: {o.parts_name}</div>
                              )}
                              <div className="flex flex-wrap items-center gap-x-2 mt-1">
                                <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  Ремонт: {fmt(o.repair_amount)} ₽
                                </span>
                                {o.purchase_amount > 0 && (
                                  <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    Запчасти: {fmt(o.purchase_amount)} ₽
                                  </span>
                                )}
                                <span className="font-roboto text-[11px] font-semibold" style={{ color: "#60a5fa" }}>
                                  Прибыль: {fmt(o.profit)} ₽
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="font-oswald font-bold text-base" style={{ color: "#34d399" }}>
                                {fmt(o.master_income)} ₽
                              </div>
                              <div className="font-roboto text-[10px]" style={{ color: "rgba(52,211,153,0.5)" }}>мой доход</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Итог дня */}
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{
                        background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
                      }}>
                        <div>
                          <div className="font-roboto text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(52,211,153,0.8)" }}>
                            Итого за день
                          </div>
                          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Прибыль магазина: {fmt(detail.summary.total_profit)} ₽
                          </div>
                        </div>
                        <div className="font-oswald font-black text-xl" style={{ color: "#34d399" }}>
                          {fmt(detail.summary.total_master_income)} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Итог периода */}
          {repairHistory.days.length > 0 && (
            <div className="flex justify-between px-3 py-2 font-roboto text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>Итого за период ({repairHistory.days.length} дн.)</span>
              <span style={{ color: "#34d399", fontWeight: 600 }}>{fmt(repairHistory.total_earned)} ₽</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
