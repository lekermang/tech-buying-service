import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";

interface Props {
  token: string;
  employeeName: string;
}

type TodayState = {
  config: { daily_rate: number; bonus_percent: number };
  today_total: number | null;
  total_earned: number;
  total_paid: number;
  remaining: number;
};

type DayRow = {
  shift_date: string;
  hours_worked: number;
  base_rate?: number;
  bonus_amount?: number;
  total: number;
};

type PayoutRow = { id: number; payout_date: string; amount: number; note: string | null };

type SaleRow = {
  id: number;
  time: string;
  item_title: string;
  item_category: string | null;
  sell_price: number;
  buy_price: number;
  profit: number;
  bonus_from_sale: number;
};

type DayDetail = {
  date: string;
  day_log: DayRow | null;
  config: { daily_rate: number; bonus_percent: number };
  sales: SaleRow[];
};

const fmt = (n: number) => n.toLocaleString("ru-RU");

// Первый и последний день текущего месяца
function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function EmployeeSalaryView({ token, employeeName }: Props) {
  const [state, setState] = useState<TodayState | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const range = currentMonthRange();
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, DayDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async (from: string, to: string) => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`${SALARY_URL}?action=my_today`, { headers: { "X-Employee-Token": token } }),
      fetch(`${SALARY_URL}?action=my_history&date_from=${from}&date_to=${to}`, { headers: { "X-Employee-Token": token } }),
    ]);
    if (r1.ok) setState(await r1.json());
    if (r2.ok) {
      const d = await r2.json();
      setDays(d.days || []);
      setPayouts(d.payouts || []);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchAll(dateFrom, dateTo);
  }, [fetchAll, dateFrom, dateTo]);

  const loadDetail = async (date: string) => {
    if (detailCache[date]) {
      setExpandedDate(prev => prev === date ? null : date);
      return;
    }
    if (expandedDate === date) { setExpandedDate(null); return; }
    setDetailLoading(date);
    try {
      const r = await fetch(`${SALARY_URL}?action=my_detail&date=${date}`, {
        headers: { "X-Employee-Token": token },
      });
      if (r.ok) {
        const d: DayDetail = await r.json();
        setDetailCache(prev => ({ ...prev, [date]: d }));
        setExpandedDate(date);
      }
    } finally {
      setDetailLoading(null);
    }
  };

  const totalEarned = days.reduce((s, d) => s + Number(d.total), 0);
  const totalPaid = payouts.filter(p => p.amount > 0).reduce((s, p) => s + Number(p.amount), 0);

  if (loading || !state) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-white/40">
        <Icon name="Loader2" size={18} className="animate-spin" />
        <span className="font-roboto text-sm">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
          background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 16px rgba(255,215,0,0.35)",
        }}>
          <Icon name="Wallet" size={17} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-black uppercase tracking-wide text-sm" style={{
            background: "linear-gradient(90deg,#fff8e8,#FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Моя зарплата</div>
          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{employeeName}</div>
        </div>
      </div>

      {/* Итог — К выплате всего */}
      <div className="rounded-2xl p-5 text-center" style={{
        background: "linear-gradient(145deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))",
        border: "1.5px solid rgba(255,215,0,0.3)",
        boxShadow: "0 0 32px rgba(255,215,0,0.08)",
      }}>
        <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.6)" }}>К выплате</div>
        <div className="font-oswald font-black text-5xl tabular-nums" style={{ color: "#FFD700" }}>
          {fmt(state.remaining)} ₽
        </div>
        <div className="font-roboto text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
          Заработано {fmt(state.total_earned)} ₽ · Выплачено {fmt(state.total_paid)} ₽
        </div>
      </div>

      {/* Два показателя */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Ставка / день</div>
          <div className="font-oswald font-bold text-xl text-white">{fmt(state.config.daily_rate)} ₽</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Бонус с продаж</div>
          <div className="font-oswald font-bold text-xl" style={{ color: "#a78bfa" }}>{state.config.bonus_percent}%</div>
        </div>
      </div>

      {/* Фильтр дат */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Период</div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        {days.length > 0 && (
          <div className="flex justify-between font-roboto text-xs pt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>Дней с начислением: {days.length}</span>
            <span>Итого: <span style={{ color: "#FFD700", fontWeight: 600 }}>{fmt(totalEarned)} ₽</span></span>
          </div>
        )}
      </div>

      {/* Доход по дням */}
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
              const isExpanded = expandedDate === h.shift_date;
              const isLoadingThis = detailLoading === h.shift_date;
              const detail = detailCache[h.shift_date];

              return (
                <div key={h.shift_date} className="rounded-xl overflow-hidden" style={{
                  border: isExpanded ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  background: isExpanded ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.03)",
                }}>
                  {/* Строка дня — кликабельная */}
                  <button
                    className="w-full flex items-center justify-between px-3 py-3 text-left transition-all"
                    onClick={() => loadDetail(h.shift_date)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-roboto text-sm font-semibold text-white">
                          {new Date(h.shift_date + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {Number(h.hours_worked) > 0 && (
                          <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {Number(h.hours_worked).toFixed(1)} ч
                          </span>
                        )}
                        {rate > 0 && (
                          <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                            · оклад {fmt(rate)} ₽
                          </span>
                        )}
                        {bonus > 0 && (
                          <span className="font-roboto text-xs font-semibold" style={{ color: "#a78bfa" }}>
                            · бонус +{fmt(bonus)} ₽
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="font-oswald font-bold text-base tabular-nums" style={{ color: "#FFD700" }}>
                        {fmt(Number(h.total))} ₽
                      </div>
                      {isLoadingThis
                        ? <Icon name="Loader2" size={14} className="animate-spin" style={{ color: "rgba(255,215,0,0.5)" }} />
                        : <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                      }
                    </div>
                  </button>

                  {/* Детализация продаж */}
                  {isExpanded && detail && (
                    <div className="border-t" style={{ borderColor: "rgba(255,215,0,0.15)" }}>

                      {/* Расшифровка: оклад */}
                      <div className="px-3 pt-3 space-y-1.5 pb-2">
                        <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Расшифровка начислений
                        </div>

                        {/* Оклад */}
                        {rate > 0 && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="flex items-center gap-2">
                              <Icon name="Clock" size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                              <div>
                                <div className="font-roboto text-sm text-white">Оклад за смену</div>
                                {Number(h.hours_worked) > 0 && (
                                  <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    {Number(h.hours_worked).toFixed(1)} ч работы
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="font-oswald font-bold text-sm text-white">{fmt(rate)} ₽</div>
                          </div>
                        )}

                        {/* Список продаж */}
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
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                        Продано: {fmt(sale.sell_price)} ₽
                                      </span>
                                      <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        Закупка: {fmt(sale.buy_price)} ₽
                                      </span>
                                      <span className="font-roboto text-[11px] font-semibold" style={{ color: "#34d399" }}>
                                        Прибыль: {fmt(sale.profit)} ₽
                                      </span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <div className="font-oswald font-bold text-sm" style={{ color: "#a78bfa" }}>
                                      +{fmt(sale.bonus_from_sale)} ₽
                                    </div>
                                    <div className="font-roboto text-[10px]" style={{ color: "rgba(167,139,250,0.5)" }}>бонус</div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Итог бонуса */}
                            {bonus > 0 && (
                              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)" }}>
                                <span className="font-roboto text-xs font-semibold" style={{ color: "#a78bfa" }}>Итого бонус с {detail.sales.length} продаж</span>
                                <span className="font-oswald font-bold text-sm" style={{ color: "#a78bfa" }}>+{fmt(bonus)} ₽</span>
                              </div>
                            )}
                          </div>
                        )}

                        {detail.sales.length === 0 && bonus === 0 && (
                          <div className="px-3 py-2 font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Продаж за этот день не найдено
                          </div>
                        )}

                        {/* Итог дня */}
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
          </div>
        )}
      </div>

      {/* Выплаты */}
      {payouts.filter(p => p.amount > 0).length > 0 && (
        <div>
          <div className="font-oswald font-bold text-base uppercase tracking-wide text-white mb-3">Выплаты</div>
          <div className="space-y-1.5">
            {payouts.filter(p => p.amount > 0).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl px-3 py-3" style={{
                background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)",
              }}>
                <div>
                  <div className="font-roboto text-sm text-white">
                    {new Date(toInputDate(p.payout_date) + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </div>
                  {p.note && <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{p.note}</div>}
                </div>
                <div className="flex items-center gap-1.5 font-oswald font-bold tabular-nums" style={{ color: "#34d399" }}>
                  <Icon name="ArrowDownLeft" size={14} />
                  {fmt(Number(p.amount))} ₽
                </div>
              </div>
            ))}
            {totalPaid > 0 && (
              <div className="flex justify-between px-3 py-2 font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                <span>Всего выплачено за период</span>
                <span style={{ color: "#34d399" }}>{fmt(totalPaid)} ₽</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
