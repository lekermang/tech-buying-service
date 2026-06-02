import Icon from "@/components/ui/icon";
import { fmt } from "./employee.types";
import type { DayRow, PayoutRow, DayDetail, GoldRow, RepairShopRow, ContractRow } from "./employee.types";

interface Props {
  days: DayRow[];
  payouts: PayoutRow[];
  totalEarned: number;
  totalPaid: number;
  expandedDate: string | null;
  detailCache: Record<string, DayDetail>;
  detailLoading: string | null;
  onToggleDay: (date: string) => void;
}

export default function EmployeeSalesHistory({
  days,
  payouts,
  totalEarned,
  totalPaid,
  expandedDate,
  detailCache,
  detailLoading,
  onToggleDay,
}: Props) {
  return (
    <div>
      <div className="font-oswald font-bold text-base uppercase tracking-wide text-white mb-3">Доход по дням</div>
      {days.length === 0 ? (
        <div className="text-center py-8 font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
          За этот период начислений нет
        </div>
      ) : (
        <div className="space-y-1.5">
          {days.map((h) => {
            const bonus = Number(h.bonus_amount) || 0;
            const rate = Number(h.base_rate) || 0;
            const isExp = expandedDate === h.shift_date;
            const isLoadingThis = detailLoading === h.shift_date;
            const detail = detailCache[h.shift_date];

            return (
              <div key={h.shift_date} className="rounded-xl overflow-hidden" style={{
                border: isExp ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.07)",
                background: isExp ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.03)",
              }}>
                <button className="w-full flex items-center justify-between px-3 py-3 text-left" onClick={() => onToggleDay(h.shift_date)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-roboto text-sm font-semibold text-white">
                      {new Date(h.shift_date + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                      {Number(h.hours_worked) > 0 && (
                        <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{Number(h.hours_worked).toFixed(1)} ч</span>
                      )}
                      {rate > 0 && <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>· оклад {fmt(rate)} ₽</span>}
                      {bonus > 0 && <span className="font-roboto text-xs font-semibold" style={{ color: "#a78bfa" }}>· бонус +{fmt(bonus)} ₽</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#FFD700" }}>
                      {fmt(Number(h.total))} ₽
                    </div>
                    {isLoadingThis
                      ? <Icon name="Loader2" size={14} className="animate-spin" style={{ color: "rgba(255,215,0,0.5)" }} />
                      : <Icon name={isExp ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                    }
                  </div>
                </button>

                {isExp && detail && (
                  <div className="border-t" style={{ borderColor: "rgba(255,215,0,0.15)" }}>
                    <div className="px-3 pt-3 pb-3 space-y-1.5">
                      <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Расшифровка начислений
                      </div>
                      {rate > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                            <div>
                              <div className="font-roboto text-sm text-white">Оклад за смену</div>
                              {Number(h.hours_worked) > 0 && (
                                <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{Number(h.hours_worked).toFixed(1)} ч работы</div>
                              )}
                            </div>
                          </div>
                          <div className="font-oswald font-bold text-sm text-white">{fmt(rate)} ₽</div>
                        </div>
                      )}

                      {detail.sales.length > 0 && (
                        <div className="space-y-1.5 mt-1">
                          <div className="font-roboto text-[10px] uppercase tracking-widest px-1" style={{ color: "rgba(167,139,250,0.7)" }}>
                            Продажи · бонус {detail.config.bonus_percent}% с прибыли
                          </div>
                          {detail.sales.map((sale) => (
                            <div key={sale.id} className="px-3 py-2 rounded-lg" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)" }}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sale.time}</span>
                                    <span className="font-roboto text-sm text-white/90 truncate">{sale.item_title}</span>
                                  </div>
                                  {sale.item_category && (
                                    <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sale.item_category}</div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-x-2 mt-1">
                                    <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Продано: {fmt(sale.sell_price)} ₽</span>
                                    <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>Закупка: {fmt(sale.buy_price)} ₽</span>
                                    <span className="font-roboto text-[11px] font-semibold" style={{ color: "#34d399" }}>Прибыль: {fmt(sale.profit)} ₽</span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="font-oswald font-bold text-sm" style={{ color: "#a78bfa" }}>+{fmt(sale.bonus_from_sale)} ₽</div>
                                  <div className="font-roboto text-[10px]" style={{ color: "rgba(167,139,250,0.5)" }}>бонус</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {bonus > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)" }}>
                              <span className="font-roboto text-xs font-semibold" style={{ color: "#a78bfa" }}>Итого бонус с {detail.sales.length} продаж</span>
                              <span className="font-oswald font-bold text-sm" style={{ color: "#a78bfa" }}>+{fmt(bonus)} ₽</span>
                            </div>
                          )}
                        </div>
                      )}

                      {detail.sales.length === 0 && bonus === 0 && (
                        <div className="px-3 py-2 font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Продаж за этот день не найдено</div>
                      )}

                      {/* Золото */}
                      {(detail.gold?.length ?? 0) > 0 && (
                        <div className="space-y-1 mt-1">
                          <div className="font-roboto text-[10px] uppercase tracking-widest px-1" style={{ color: "rgba(255,215,0,0.6)" }}>
                            Золото · {detail.gold!.length} {detail.gold!.length === 1 ? "сделка" : "сделки"}
                          </div>
                          {detail.gold!.map((g: GoldRow) => (
                            <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
                              <div>
                                <span className="font-roboto text-[10px] mr-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{g.time}</span>
                                <span className="font-roboto text-sm text-white">{g.description}</span>
                              </div>
                              <span className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>{fmt(g.total_price)} ₽</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ремонты */}
                      {(detail.repairs?.length ?? 0) > 0 && (
                        <div className="space-y-1 mt-1">
                          <div className="font-roboto text-[10px] uppercase tracking-widest px-1" style={{ color: "rgba(52,211,153,0.6)" }}>
                            Ремонты · {detail.repairs!.length} {detail.repairs!.length === 1 ? "заказ" : "заказа"}
                          </div>
                          {detail.repairs!.map((r: RepairShopRow) => (
                            <div key={r.id} className="px-3 py-2 rounded-lg"
                              style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-roboto text-[10px] mr-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{r.time}</span>
                                  <span className="font-roboto text-sm text-white">{r.device}</span>
                                </div>
                                <span className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>{fmt(r.amount)} ₽</span>
                              </div>
                              {r.repair_type && r.repair_type !== "—" && (
                                <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{r.repair_type}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Договора 14 дней */}
                      {(detail.contracts?.length ?? 0) > 0 && (
                        <div className="space-y-1 mt-1">
                          <div className="font-roboto text-[10px] uppercase tracking-widest px-1" style={{ color: "rgba(96,165,250,0.6)" }}>
                            Договора · {detail.contracts!.length} {detail.contracts!.length === 1 ? "договор" : "договора"}
                          </div>
                          {detail.contracts!.map((c: ContractRow) => (
                            <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
                              <div>
                                <span className="font-roboto text-[10px] mr-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{c.time}</span>
                                <span className="font-roboto text-sm text-white truncate">{c.item_name}</span>
                              </div>
                              <span className="font-oswald font-bold text-sm" style={{ color: "#60a5fa" }}>{fmt(c.loan_amount)} ₽</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg mt-1" style={{
                        background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
                      }}>
                        <span className="font-roboto text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(255,215,0,0.8)" }}>Итого за день</span>
                        <span className="font-oswald font-black text-lg" style={{ color: "#FFD700" }}>{fmt(Number(h.total))} ₽</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {days.length > 0 && (
            <div className="flex justify-between px-3 py-2 font-roboto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>Итого за период</span>
              <span style={{ color: "#FFD700", fontWeight: 600 }}>{fmt(totalEarned)} ₽</span>
            </div>
          )}
        </div>
      )}

      {/* Выплаты */}
      {payouts.filter(p => p.amount > 0).length > 0 && (
        <div className="mt-4">
          <div className="font-oswald font-bold text-base uppercase tracking-wide text-white mb-3">Выплаты</div>
          <div className="space-y-1.5">
            {payouts.filter(p => p.amount > 0).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl px-3 py-3" style={{
                background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
              }}>
                <div>
                  <div className="font-roboto text-sm text-white">
                    {new Date(p.payout_date.slice(0, 10) + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </div>
                  {p.note && <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{p.note}</div>}
                </div>
                <div className="flex items-center gap-1.5 font-oswald font-bold tabular-nums" style={{ color: "#34d399" }}>
                  <Icon name="ArrowDownLeft" size={14} />
                  {fmt(Number(p.amount))} ₽
                </div>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              <span>Всего выплачено за период</span>
              <span style={{ color: "#34d399" }}>{fmt(totalPaid)} ₽</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}