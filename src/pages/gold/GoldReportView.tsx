import { ReactNode, useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldDeal, GoldReport, PAYMENT_LABEL, fmtDay, fmtMonth, money } from "./types";
import { fmtG, fmtRub } from "./goldCalc";

const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + money(Math.abs(n));
const tone = (n: number) => (n > 0 ? "text-green-400" : n < 0 ? "text-red-400" : "text-white/40");

function Section({ icon, title, sub, children, color = "text-[#FFD700]" }: { icon: string; title: string; sub?: string; children: ReactNode; color?: string }) {
  return (
    <div className="mb-3 rounded-xl border border-[#1F1F1F] bg-[#101010] p-3">
      <div className="flex items-center gap-2 mb-0.5">
        <Icon name={icon} size={14} className={color} />
        <span className={`font-oswald font-bold uppercase tracking-wide text-sm ${color}`}>{title}</span>
      </div>
      {sub && <div className="font-roboto text-[10px] text-white/35 mb-2">{sub}</div>}
      {!sub && <div className="mb-2" />}
      {children}
    </div>
  );
}

function Kpi({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg bg-black/30 border border-white/5 p-2.5">
      <div className="font-roboto text-[9px] uppercase tracking-wide text-white/40 leading-tight">{label}</div>
      <div className={`font-oswald font-bold text-lg tabular-nums leading-tight mt-0.5 ${color}`}>{value}</div>
      {sub && <div className="font-roboto text-[10px] text-white/30 leading-tight">{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, Math.min(100, (Math.abs(value) / max) * 100)) : 0;
  return <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className={`h-full ${color}`} style={{ width: w + "%" }} /></div>;
}

function DealRow({ d }: { d: GoldDeal }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <div className="font-roboto text-xs text-white/80 truncate">#{d.id} · {d.item_name || "Золото"} · {fmtG(d.weight)} г · {d.purity}</div>
        <div className="font-roboto text-[10px] text-white/30">закупка {money(d.buy)} → продажа {money(d.sell)}</div>
      </div>
      <div className={`font-oswald font-bold text-sm tabular-nums shrink-0 ml-2 ${tone(d.profit)}`}>{sign(d.profit)}</div>
    </div>
  );
}

export default function GoldReportView({ report }: { report: GoldReport }) {
  const [daysAll, setDaysAll] = useState(false);
  const k = report.kpi;
  const maxProfit = Math.max(1, ...report.sold_by_purity.map(r => Math.abs(r.profit || 0)));
  const maxBuy = Math.max(1, ...report.bought_by_purity.map(r => r.buy));
  const maxMonth = Math.max(1, ...report.by_month.map(m => Math.max(m.bought_sum, m.sold_sum)));
  const days = daysAll ? report.bought_by_day : report.bought_by_day.slice(0, 7);
  const totalPay = report.bought_by_payment.reduce((s, p) => s + p.sum, 0);
  const stockTotal = report.stock_age.reduce((s, a) => s + a.buy, 0);

  return (
    <>
      <Section icon="Gauge" title="Эффективность" sub="За выбранный период, по проданным сделкам">
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="Рентабельность" value={`${k.margin_pct}%`} sub="прибыль к закупке" color={tone(k.margin_pct)} />
          <Kpi label="Прибыль на 1 г (585)" value={`${fmtRub(k.profit_per_g585)} ₽`} sub="чистая с грамма" color={tone(k.profit_per_g585)} />
          <Kpi label="Средняя прибыль сделки" value={money(k.avg_profit_per_deal)} sub={`${k.sold_count} сделок`} color={tone(k.avg_profit_per_deal)} />
          <Kpi label="Срок до продажи" value={`${k.avg_days_to_sell} дн.`} sub="в среднем на складе" />
          <Kpi label="Покупаю, ₽/г 585" value={fmtRub(k.avg_buy_price585_sold)} sub="средняя закупка проданного" color="text-[#FFD700]" />
          <Kpi label="Продаю, ₽/г 585" value={fmtRub(k.avg_sell_price585)} sub={`спред ${fmtRub(k.avg_sell_price585 - k.avg_buy_price585_sold)} ₽/г`} color="text-blue-300" />
        </div>
        {(k.loss_deals > 0 || k.cancelled > 0) && (
          <div className="mt-2 font-roboto text-[11px] text-white/45">
            {k.loss_deals > 0 && <span className="text-red-400/80">Убыточных сделок: {k.loss_deals}. </span>}
            {k.cancelled > 0 && <span>Отменено закупок: {k.cancelled}.</span>}
          </div>
        )}
      </Section>

      <Section icon="PieChart" title="Откуда пришла прибыль" sub="Прибыль по пробам: какая проба приносит деньги" color="text-green-400">
        {report.sold_by_purity.length === 0 && <div className="font-roboto text-xs text-white/30 py-2">За период ещё нет проданного</div>}
        <div className="space-y-2.5">
          {report.sold_by_purity.map(r => (
            <div key={r.purity}>
              <div className="flex items-baseline justify-between">
                <div className="font-oswald font-bold text-white text-sm">{r.purity} проба <span className="font-roboto font-normal text-[10px] text-white/35">· {r.count} шт · {fmtG(r.weight585)} г в 585</span></div>
                <div className={`font-oswald font-bold text-base tabular-nums ${tone(r.profit || 0)}`}>{sign(r.profit || 0)}</div>
              </div>
              <Bar value={r.profit || 0} max={maxProfit} color={(r.profit || 0) >= 0 ? "bg-green-400" : "bg-red-400"} />
              <div className="font-roboto text-[10px] text-white/35 mt-0.5">
                закупка {money(r.buy)} → продажа {money(r.sell || 0)} · маржа {r.margin_pct}% · {fmtRub(r.profit_per_g585 || 0)} ₽/г
              </div>
            </div>
          ))}
        </div>
        {report.sold_by_purity.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10 flex items-baseline justify-between">
            <span className="font-roboto text-xs text-white/60">Итого прибыль</span>
            <span className={`font-oswald font-bold text-xl tabular-nums ${tone(k.profit)}`}>{sign(k.profit)}</span>
          </div>
        )}
      </Section>

      <Section icon="ShoppingBag" title="Что закуплено" sub={`За период: ${k.bought_count} шт · ${fmtG(k.bought_weight585)} г в 585 · средняя цена ${fmtRub(k.avg_buy_price585)} ₽/г`}>
        <div className="rounded-lg bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2 mb-3 flex items-baseline justify-between">
          <span className="font-roboto text-xs text-white/60">Потрачено на закупку</span>
          <span className="font-oswald font-bold text-2xl text-[#FFD700] tabular-nums">{money(k.bought_sum)}</span>
        </div>
        <div className="space-y-2.5 mb-3">
          {report.bought_by_purity.map(r => (
            <div key={r.purity}>
              <div className="flex items-baseline justify-between">
                <div className="font-oswald font-bold text-white text-sm">{r.purity} <span className="font-roboto font-normal text-[10px] text-white/35">· {r.count} шт · {fmtG(r.weight)} г → {fmtG(r.weight585)} г в 585</span></div>
                <div className="font-oswald font-bold text-sm tabular-nums text-[#FFD700]">{money(r.buy)}</div>
              </div>
              <Bar value={r.buy} max={maxBuy} color="bg-[#FFD700]" />
              <div className="font-roboto text-[10px] text-white/30 mt-0.5">в среднем {fmtRub(r.avg_price585 || 0)} ₽ за г 585</div>
            </div>
          ))}
        </div>

        <div className="font-roboto text-[10px] uppercase tracking-wide text-white/40 mb-1">По дням</div>
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2.5 py-1.5 bg-white/5 font-roboto text-[9px] uppercase text-white/40">
            <span>День</span><span className="text-right">Шт</span><span className="text-right">г в 585</span><span className="text-right">Сумма</span>
          </div>
          {days.map(d => (
            <div key={d.day} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2.5 py-1.5 border-t border-white/5 font-roboto text-xs">
              <span className="text-white/70">{fmtDay(d.day)}</span>
              <span className="text-right text-white/50 tabular-nums">{d.count}</span>
              <span className="text-right text-white/50 tabular-nums">{fmtG(d.weight585)}</span>
              <span className="text-right text-[#FFD700] font-bold tabular-nums">{fmtRub(d.buy)} ₽</span>
            </div>
          ))}
          {report.bought_by_day.length === 0 && <div className="px-2.5 py-3 font-roboto text-xs text-white/30">Закупок за период нет</div>}
        </div>
        {report.bought_by_day.length > 7 && (
          <button onClick={() => setDaysAll(!daysAll)} className="mt-1.5 w-full text-center font-roboto text-[11px] text-[#FFD700]/70 py-1">
            {daysAll ? "Свернуть" : `Показать все ${report.bought_by_day.length} дн.`}
          </button>
        )}

        {report.bought_by_payment.length > 0 && (
          <div className="mt-3">
            <div className="font-roboto text-[10px] uppercase tracking-wide text-white/40 mb-1">Чем платили клиентам</div>
            <div className="flex flex-wrap gap-2">
              {report.bought_by_payment.map(p => (
                <div key={p.method} className="rounded-md bg-black/30 border border-white/5 px-2.5 py-1.5">
                  <div className="font-roboto text-[10px] text-white/45">{PAYMENT_LABEL[p.method] || p.method} · {p.count} шт</div>
                  <div className="font-oswald font-bold text-sm text-white tabular-nums">{money(p.sum)}{totalPay > 0 && <span className="font-roboto text-[10px] text-white/30 font-normal"> · {Math.round((p.sum / totalPay) * 100)}%</span>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section icon="Package" title="Что лежит на складе" sub={`Не продано: ${report.stock.count} шт · ${fmtG(report.stock.weight)} г (${fmtG(report.stock.weight585)} г в 585) · вложено ${money(report.stock.buy_sum)}`} color="text-blue-300">
        {report.stock.count === 0 ? (
          <div className="font-roboto text-xs text-white/30">Склад пуст, всё продано</div>
        ) : (
          <>
            <div className="space-y-2">
              {report.stock_age.map(a => (
                <div key={a.bucket}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-roboto text-xs text-white/70">{a.bucket} <span className="text-white/30 text-[10px]">· {a.count} шт · {fmtG(a.weight585)} г в 585</span></span>
                    <span className={`font-oswald font-bold text-sm tabular-nums ${a.bucket.startsWith("15") ? "text-red-400" : "text-white"}`}>{money(a.buy)}</span>
                  </div>
                  <Bar value={a.buy} max={stockTotal} color={a.bucket.startsWith("15") ? "bg-red-400" : "bg-blue-400"} />
                </div>
              ))}
            </div>
            <div className="mt-2 font-roboto text-[11px] text-white/40">
              Средняя закупка склада {fmtRub(report.stock.avg_price585)} ₽/г в 585. Золото, которое лежит дольше 2 недель, замораживает деньги.
            </div>
            {report.stock.investor_buy_sum > 0 && (
              <div className="mt-1 font-roboto text-[11px] text-violet-300/80">Из них на деньги инвестора: {money(report.stock.investor_buy_sum)}</div>
            )}
          </>
        )}
      </Section>

      <Section icon="CalendarRange" title="По месяцам" sub="Сколько закупили, на сколько продали и что заработали" color="text-blue-300">
        <div className="space-y-3">
          {report.by_month.map(m => (
            <div key={m.month}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-oswald font-bold text-white text-sm capitalize">{fmtMonth(m.month)}</span>
                <span className={`font-oswald font-bold text-base tabular-nums ${tone(m.profit)}`}>{sign(m.profit)}</span>
              </div>
              <div className="space-y-1">
                <div>
                  <div className="flex justify-between font-roboto text-[10px] text-white/40"><span>куплено {m.bought_count} шт · {fmtG(m.bought_weight585)} г</span><span>{money(m.bought_sum)}</span></div>
                  <Bar value={m.bought_sum} max={maxMonth} color="bg-[#FFD700]" />
                </div>
                <div>
                  <div className="flex justify-between font-roboto text-[10px] text-white/40"><span>продано {m.sold_count} шт</span><span>{money(m.sold_sum)}</span></div>
                  <Bar value={m.sold_sum} max={maxMonth} color="bg-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {(report.top_deals.length > 0 || report.worst_deals.length > 0) && (
        <Section icon="Trophy" title="Лучшие и худшие сделки" color="text-green-400">
          {report.top_deals.length > 0 && <>
            <div className="font-roboto text-[10px] uppercase text-green-400/70 mb-0.5">Больше всего принесли</div>
            {report.top_deals.map(d => <DealRow key={d.id} d={d} />)}
          </>}
          {report.worst_deals.length > 0 && <>
            <div className="font-roboto text-[10px] uppercase text-red-400/80 mt-3 mb-0.5">Убыточные</div>
            {report.worst_deals.map(d => <DealRow key={d.id} d={d} />)}
          </>}
        </Section>
      )}
    </>
  );
}
