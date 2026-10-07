import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";
import { isoLocal, startOfMonth, endOfMonth } from "./ownerSalaryTypes";
import { buildReportHtml, openPdf, type Report, type ReportDay } from "./ownerReportPdf";

const rub = (n: number | null | undefined) => `${Number(n || 0).toLocaleString("ru-RU")} ₽`;
const fmtDate = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}`;
};

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-white/40 text-[10px] uppercase font-oswald">{label}</div>
      <div className="font-bold font-oswald text-lg tabular-nums mt-1" style={{ color: color || "#fff" }}>{value}</div>
      {sub && <div className="text-white/40 text-[11px] font-roboto mt-0.5">{sub}</div>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-white/50 text-xs uppercase font-oswald mb-2">{title}</div>
      {children}
    </div>
  );
}

function DayCard({ d, employee, onPdf }: { d: ReportDay; employee: string; onPdf: (d: ReportDay) => void }) {
  const [open, setOpen] = useState(false);
  const entered = d.salary.entered;
  const warn = d.has_activity && !entered;
  const wd = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][new Date(d.date + "T00:00:00").getDay()];
  return (
    <div className={`rounded-xl border ${warn ? "border-red-500/40 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
      <button onClick={() => setOpen(!open)} className="w-full p-3 flex items-center gap-3 text-left">
        <div className="min-w-[64px]">
          <div className="text-white font-oswald font-bold">{fmtDate(d.date).slice(0, 5)}</div>
          <div className="text-white/40 text-[11px]">{wd}</div>
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-xs font-roboto">
          <span className="text-white/60">Продаж: <b className="text-white">{d.sales_count}</b></span>
          <span className="text-white/60">Выручка: <b className="text-white">{rub(d.sales_revenue)}</b></span>
          <span className="text-white/60">Прибыль: <b className={d.sales_profit < 0 ? "text-red-400" : "text-green-400"}>{rub(d.sales_profit)}</b></span>
          <span className="text-white/60">Закупок: <b className="text-white">{d.purchases_count}</b> ({rub(d.purchases_cost)})</span>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-roboto whitespace-nowrap ${entered ? "bg-green-500/15 text-green-300" : warn ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white/40"}`}>
          {entered ? `Внесён · ${rub(d.salary.total)}` : warn ? "Не внесён!" : "Нет данных"}
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-white/60 font-roboto">
              Смена: {d.shift_status || "не отмечена"}
              {d.shift_started ? ` · ${d.shift_started}–${d.shift_ended || "…"}` : ""}
              {entered && ` · ${d.salary.hours} ч · ставка ${rub(d.salary.base)} · бонус с продаж ${rub(d.salary.bonus_sale)} · с закупок ${rub(d.salary.bonus_purchase)}${d.salary.owner_set ? " · вручную" : ""}`}
            </div>
            <button onClick={() => onPdf(d)}
              className="px-3 py-1.5 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-xs font-oswald uppercase flex items-center gap-1.5">
              <Icon name="FileDown" size={13} /> PDF за {fmtDate(d.date).slice(0, 5)}
            </button>
          </div>

          {d.sales.length > 0 && (
            <div>
              <div className="text-white/50 text-[11px] uppercase font-oswald mb-1">Продал</div>
              <div className="space-y-1.5">
                {d.sales.map(s => (
                  <div key={s.op_id} className="rounded-lg bg-black/30 p-2 text-xs font-roboto">
                    <div className="flex justify-between gap-2">
                      <span className="text-white">{s.time} · {s.title}</span>
                      <span className={s.profit < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{s.profit >= 0 ? "+" : ""}{rub(s.profit)}</span>
                    </div>
                    <div className="text-white/50 mt-0.5">
                      Закупка {rub(s.buy_price)} → продажа {rub(s.sell_price)}
                      {s.margin_pct !== null && ` (${s.margin_pct}%)`} · бонус {rub(s.bonus)}
                    </div>
                    <div className="mt-0.5">
                      <span className={s.own_purchase ? "text-blue-300" : "text-orange-300"}>
                        {s.own_purchase ? "Свой товар" : `Чужая закупка: ${s.purchased_by}`}
                      </span>
                      <span className="text-white/40">
                        {s.bought_date ? ` · куплен ${fmtDate(s.bought_date)}` : ""}
                        {s.days_in_stock !== null ? ` · на складе ${s.days_in_stock} дн.` : ""}
                        {s.discount_count ? ` · скидок: ${s.discount_count}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.purchases.length > 0 && (
            <div>
              <div className="text-white/50 text-[11px] uppercase font-oswald mb-1">Закупил</div>
              <div className="space-y-1.5">
                {d.purchases.map(p => (
                  <div key={p.item_id} className="rounded-lg bg-black/30 p-2 text-xs font-roboto">
                    <div className="flex justify-between gap-2">
                      <span className="text-white">{p.time} · {p.title}</span>
                      <span className="text-white/80 font-bold">{rub(p.buy_price)}</span>
                    </div>
                    <div className="text-white/50 mt-0.5">
                      {p.sold
                        ? `Продан ${fmtDate(p.sold_date || "")} за ${rub(p.sold_price)} · продавец: ${p.sold_by || "не указан"} · прибыль ${rub(p.profit)}`
                        : "Ещё не продан"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.purchases_sold_by_others.length > 0 && (
            <div>
              <div className="text-white/50 text-[11px] uppercase font-oswald mb-1">Его закупки, проданные другими в этот день</div>
              <div className="space-y-1.5">
                {d.purchases_sold_by_others.map(m => (
                  <div key={m.item_id} className="rounded-lg bg-black/30 p-2 text-xs font-roboto">
                    <div className="flex justify-between gap-2">
                      <span className="text-white">{m.title}</span>
                      <span className="text-green-400 font-bold">+{rub(m.profit)}</span>
                    </div>
                    <div className="text-white/50">Продал: {m.sold_by} · {rub(m.buy_price)} → {rub(m.sold_price)} · бонус закупщику {rub(m.bonus)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!d.has_activity && <div className="text-white/40 text-xs">В этот день операций не найдено ({employee}).</div>}
        </div>
      )}
    </div>
  );
}

export default function OwnerEmployeeReport({ employeeId, token, initialMonth }: { employeeId: number; token: string; initialMonth: Date }) {
  const [from, setFrom] = useState(isoLocal(startOfMonth(initialMonth)));
  const [to, setTo] = useState(isoLocal(endOfMonth(initialMonth)));
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onlyProblems, setOnlyProblems] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${SALARY_URL}?action=owner_employee_report&employee_id=${employeeId}&from=${from}&to=${to}`, {
        headers: { "X-Employee-Token": token },
      });
      if (!r.ok) throw new Error("Не удалось загрузить отчёт");
      setData(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [employeeId, from, to, token]);

  useEffect(() => { load(); }, [load]);

  const setPreset = (kind: "month" | "prev" | "week") => {
    const now = new Date();
    if (kind === "month") { setFrom(isoLocal(startOfMonth(now))); setTo(isoLocal(endOfMonth(now))); }
    if (kind === "prev") {
      const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setFrom(isoLocal(startOfMonth(p))); setTo(isoLocal(endOfMonth(p)));
    }
    if (kind === "week") {
      const s = new Date(now); s.setDate(now.getDate() - 6);
      setFrom(isoLocal(s)); setTo(isoLocal(now));
    }
  };

  const a = data?.analytics;
  const days = (data?.days || []).filter(d => (onlyProblems ? d.has_activity && !d.salary.entered : true)).slice().reverse();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-white/50 font-oswald uppercase">С
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="block mt-1 px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm font-roboto" />
          </label>
          <label className="text-xs text-white/50 font-oswald uppercase">По
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="block mt-1 px-2 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm font-roboto" />
          </label>
          <div className="flex gap-1.5">
            {([["week", "7 дней"], ["month", "Этот месяц"], ["prev", "Прошлый"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setPreset(k)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-roboto">{l}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button disabled={!data} onClick={() => data && openPdf(buildReportHtml(data))}
            className="px-3 py-2 rounded-lg bg-[#FFD700] text-black font-oswald font-bold uppercase text-xs flex items-center gap-1.5 disabled:opacity-40">
            <Icon name="FileDown" size={14} /> Полный отчёт в PDF
          </button>
          <button onClick={() => setOnlyProblems(!onlyProblems)}
            className={`px-3 py-2 rounded-lg text-xs font-roboto border ${onlyProblems ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-white/5 border-white/10 text-white/60"}`}>
            Только дни без внесения
          </button>
        </div>
      </div>

      {loading && <div className="text-white/50 text-sm text-center py-6">Загрузка отчёта…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {data && a && !loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Продано" value={`${a.sales.count} шт.`} sub={`выручка ${rub(a.sales.revenue)}`} />
            <Stat label="Прибыль с продаж" value={rub(a.sales.profit)} color={a.sales.profit < 0 ? "#f87171" : "#4ade80"}
              sub={a.sales.margin_pct !== null ? `маржа ${a.sales.margin_pct}%` : undefined} />
            <Stat label="Средний чек" value={rub(a.sales.avg_check)} sub={`прибыль/продажу ${rub(a.sales.avg_profit)}`} />
            <Stat label="Бонус с продаж" value={rub(a.sales.bonus)} color="#FFD700" sub={`${data.config.bonus_percent}% с прибыли`} />
            <Stat label="Закуплено" value={`${a.purchases.count} шт.`} sub={`на ${rub(a.purchases.cost)}`} />
            <Stat label="Из закупок продано" value={a.purchases.sold_pct !== null ? `${a.purchases.sold_pct}%` : "—"}
              sub={`не продано ${a.purchases.unsold_count} на ${rub(a.purchases.unsold_cost)}`} />
            <Stat label="Его закупки продались" value={`${a.my_purchases_sold_in_period.count} шт.`}
              sub={`прибыль ${rub(a.my_purchases_sold_in_period.profit)} · бонус ${rub(a.my_purchases_sold_in_period.bonus)}`} />
            <Stat label="На складе от него" value={`${a.stock_now.count} шт.`} sub={`на ${rub(a.stock_now.cost)}`} />
          </div>

          <Block title="Чей товар он продавал">
            <div className="grid grid-cols-2 gap-2 text-xs font-roboto mb-2">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <div className="text-blue-300">Свои закупки</div>
                <div className="text-white font-bold">{a.own_purchase_sales.count} шт. · {rub(a.own_purchase_sales.revenue)}</div>
                <div className="text-white/50">прибыль {rub(a.own_purchase_sales.profit)}</div>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-2">
                <div className="text-orange-300">Чужие закупки</div>
                <div className="text-white font-bold">{a.alien_purchase_sales.count} шт. · {rub(a.alien_purchase_sales.revenue)}</div>
                <div className="text-white/50">прибыль {rub(a.alien_purchase_sales.profit)}</div>
              </div>
            </div>
            {a.alien_sources.map(s => (
              <div key={s.name} className="flex justify-between text-xs font-roboto py-1 border-t border-white/5">
                <span className="text-white/80">{s.name}</span>
                <span className="text-white/60">{s.count} шт. · закуп {rub(s.cost)} → продано {rub(s.revenue)} · <b className={s.profit < 0 ? "text-red-400" : "text-green-400"}>{rub(s.profit)}</b></span>
              </div>
            ))}
            {a.alien_sources.length === 0 && <div className="text-white/40 text-xs">Чужих товаров не продавал.</div>}
          </Block>

          <Block title="Его закупки — кто продал">
            {a.my_purchases_sold_in_period.by_whom.map(w => (
              <div key={w.name} className="flex justify-between text-xs font-roboto py-1 border-t border-white/5 first:border-0">
                <span className="text-white/80">{w.name}</span>
                <span className="text-white/60">{w.count} шт. · выручка {rub(w.revenue)} · прибыль <b className="text-green-400">{rub(w.profit)}</b></span>
              </div>
            ))}
            {a.my_purchases_sold_in_period.by_whom.length === 0 && <div className="text-white/40 text-xs">За период его закупки не продавались.</div>}
          </Block>

          <Block title="По категориям">
            {a.categories.map(c => (
              <div key={c.name} className="flex justify-between text-xs font-roboto py-1 border-t border-white/5 first:border-0">
                <span className="text-white/80">{c.name}</span>
                <span className="text-white/60">{c.count} шт. · {rub(c.revenue)} · <b className={c.profit < 0 ? "text-red-400" : "text-green-400"}>{rub(c.profit)}</b></span>
              </div>
            ))}
          </Block>

          {(a.loss_sales.length > 0 || a.top_sales.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Block title="Топ-5 по прибыли">
                {a.top_sales.map((t, i) => (
                  <div key={i} className="text-xs font-roboto py-1 flex justify-between gap-2">
                    <span className="text-white/80 truncate">{fmtDate(t.date).slice(0, 5)} · {t.title}</span>
                    <b className="text-green-400">{rub(t.profit)}</b>
                  </div>
                ))}
              </Block>
              <Block title={`Убыточные продажи (${a.loss_sales.length})`}>
                {a.loss_sales.length === 0 && <div className="text-white/40 text-xs">Нет</div>}
                {a.loss_sales.map((t, i) => (
                  <div key={i} className="text-xs font-roboto py-1 flex justify-between gap-2">
                    <span className="text-white/80 truncate">{fmtDate(t.date).slice(0, 5)} · {t.title} <span className="text-white/40">({t.purchased_by})</span></span>
                    <b className="text-red-400">{rub(t.profit)}</b>
                  </div>
                ))}
              </Block>
            </div>
          )}

          <Block title="Дисциплина внесения">
            <div className="text-xs font-roboto text-white/70 space-y-1">
              <div>Рабочих дней: <b className="text-white">{a.discipline.work_days}</b> · дней с операциями: <b className="text-white">{a.discipline.days_with_activity}</b></div>
              <div>Начислено: <b className="text-white">{rub(a.discipline.earned)}</b> · выплачено: <b className="text-white">{rub(a.discipline.paid)}</b></div>
              <div className={a.discipline.days_not_entered.length ? "text-red-300" : "text-green-300"}>
                {a.discipline.days_not_entered.length
                  ? `Дни с операциями, но без внесения: ${a.discipline.days_not_entered.map(x => fmtDate(x).slice(0, 5)).join(", ")}`
                  : "Во все дни с операциями смена внесена"}
              </div>
            </div>
          </Block>

          <div className="text-white/50 text-xs uppercase font-oswald pt-1">Отчёт по датам ({days.length})</div>
          <div className="space-y-2">
            {days.map(d => (
              <DayCard key={d.date} d={d} employee={data.employee.full_name}
                onPdf={day => openPdf(buildReportHtml(data, day))} />
            ))}
            {days.length === 0 && <div className="text-white/40 text-sm text-center py-4">Нет данных за период</div>}
          </div>
        </>
      )}
    </div>
  );
}
