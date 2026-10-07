/* eslint-disable @typescript-eslint/no-explicit-any */
export type SaleRow = {
  op_id: number; date: string; time: string; title: string; sku?: string; imei?: string; category: string;
  buy_price: number; sell_price: number; profit: number; margin_pct: number | null;
  purchased_by: string; own_purchase: boolean; bought_date: string; days_in_stock: number | null;
  discount_count: number; bonus: number;
};
export type PurchaseRow = {
  item_id: number; date: string; time: string; title: string; category: string; buy_price: number;
  sold: boolean; sold_date: string | null; sold_price: number | null; sold_by: string | null;
  profit: number | null; bonus: number;
};
export type OtherSold = {
  item_id: number; title: string; buy_price: number; sold_price: number; profit: number;
  sold_by: string; sold_date: string; bonus: number;
};
export type ReportDay = {
  date: string; sales: SaleRow[]; purchases: PurchaseRow[]; purchases_sold_by_others: OtherSold[];
  shift_status: string | null; shift_started: string; shift_ended: string;
  salary: { entered: boolean; owner_set: boolean; hours: number; base: number; bonus_sale: number; bonus_purchase: number; total: number };
  sales_count: number; sales_revenue: number; sales_profit: number; purchases_count: number; purchases_cost: number;
  has_activity: boolean;
};
export type Report = {
  employee: { id: number; full_name: string; login: string; position: string };
  config: { daily_rate: number; bonus_percent: number; bonus_percent_purchase: number };
  period: { from: string; to: string };
  analytics: any;
  days: ReportDay[];
  sales: SaleRow[];
  purchases: PurchaseRow[];
  payouts: { payout_date: string; amount: number; note: string | null }[];
};

const rub = (n: number | null | undefined) => `${Number(n || 0).toLocaleString("ru-RU")} ₽`;
const fd = (s: string | null | undefined) => (s ? s.split("-").reverse().join(".") : "—");
const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function salesTable(rows: SaleRow[], withDate: boolean) {
  if (!rows.length) return `<p class="muted">Продаж нет</p>`;
  return `<table><thead><tr>${withDate ? "<th>Дата</th>" : ""}<th>Время</th><th>Товар</th><th>Закупка</th><th>Продажа</th><th>Прибыль</th><th>Чей товар (закупщик)</th><th>Куплен / дней</th><th>Бонус</th></tr></thead><tbody>${rows
    .map(
      s => `<tr>${withDate ? `<td>${fd(s.date)}</td>` : ""}<td>${s.time}</td><td>${esc(s.title)}${s.imei ? `<br><small>IMEI ${esc(s.imei)}</small>` : ""}<br><small>${esc(s.category)}</small></td><td class="r">${rub(s.buy_price)}</td><td class="r">${rub(s.sell_price)}</td><td class="r ${s.profit < 0 ? "neg" : "pos"}">${rub(s.profit)}${s.margin_pct !== null ? `<br><small>${s.margin_pct}%</small>` : ""}</td><td>${s.own_purchase ? "<b>Свой</b>" : `Чужой: <b>${esc(s.purchased_by)}</b>`}</td><td>${fd(s.bought_date)}${s.days_in_stock !== null ? ` / ${s.days_in_stock} дн.` : ""}</td><td class="r">${rub(s.bonus)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function purchasesTable(rows: PurchaseRow[], withDate: boolean) {
  if (!rows.length) return `<p class="muted">Закупок нет</p>`;
  return `<table><thead><tr>${withDate ? "<th>Дата</th>" : ""}<th>Время</th><th>Товар</th><th>Закуплен за</th><th>Статус</th><th>Продан за</th><th>Кто продал</th><th>Прибыль</th><th>Бонус</th></tr></thead><tbody>${rows
    .map(
      p => `<tr>${withDate ? `<td>${fd(p.date)}</td>` : ""}<td>${p.time}</td><td>${esc(p.title)}<br><small>${esc(p.category)}</small></td><td class="r">${rub(p.buy_price)}</td><td>${p.sold ? `Продан ${fd(p.sold_date)}` : "На складе"}</td><td class="r">${p.sold ? rub(p.sold_price) : "—"}</td><td>${esc(p.sold_by || "—")}</td><td class="r ${(p.profit ?? 0) < 0 ? "neg" : "pos"}">${p.sold ? rub(p.profit) : "—"}</td><td class="r">${p.sold ? rub(p.bonus) : "—"}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function otherTable(rows: OtherSold[]) {
  if (!rows.length) return "";
  return `<h3>Его закупки, проданные другими сотрудниками</h3><table><thead><tr><th>Товар</th><th>Закупка</th><th>Продано за</th><th>Кто продал</th><th>Дата</th><th>Прибыль</th><th>Бонус закупщику</th></tr></thead><tbody>${rows
    .map(
      m => `<tr><td>${esc(m.title)}</td><td class="r">${rub(m.buy_price)}</td><td class="r">${rub(m.sold_price)}</td><td>${esc(m.sold_by)}</td><td>${fd(m.sold_date)}</td><td class="r pos">${rub(m.profit)}</td><td class="r">${rub(m.bonus)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function dayBlock(d: ReportDay) {
  const s = d.salary;
  return `<div class="day"><h2>${fd(d.date)}</h2>
  <p class="meta">Смена: <b>${esc(d.shift_status || "не отмечена")}</b>${d.shift_started ? ` (${d.shift_started}–${d.shift_ended || "…"})` : ""} ·
  Внесение: <b class="${s.entered ? "pos" : "neg"}">${s.entered ? `внесён, итого ${rub(s.total)}${s.owner_set ? " (вручную)" : ""}` : d.has_activity ? "НЕ ВНЕСЁН при наличии операций" : "нет данных"}</b>
  ${s.entered ? `<br>Часы ${s.hours} · ставка ${rub(s.base)} · бонус с продаж ${rub(s.bonus_sale)} · бонус с закупок ${rub(s.bonus_purchase)}` : ""}</p>
  <p class="meta">Продаж: <b>${d.sales_count}</b> на ${rub(d.sales_revenue)}, прибыль ${rub(d.sales_profit)} · Закупок: <b>${d.purchases_count}</b> на ${rub(d.purchases_cost)}</p>
  <h3>Продал</h3>${salesTable(d.sales, false)}
  <h3>Закупил</h3>${purchasesTable(d.purchases, false)}
  ${otherTable(d.purchases_sold_by_others)}</div>`;
}

export function buildReportHtml(r: Report, onlyDay?: ReportDay) {
  const a = r.analytics;
  const title = onlyDay
    ? `Отчёт за ${fd(onlyDay.date)} — ${r.employee.full_name}`
    : `Отчёт по эффективности — ${r.employee.full_name} (${fd(r.period.from)} – ${fd(r.period.to)})`;
  let body = `<h1>${esc(title)}</h1><p class="meta">${esc(r.employee.position || "")} · @${esc(r.employee.login)} · ставка ${rub(r.config.daily_rate)} · % с продажи ${r.config.bonus_percent} · % с закупки ${r.config.bonus_percent_purchase}<br>Сформирован: ${new Date().toLocaleString("ru-RU")}</p>`;

  if (onlyDay) {
    body += dayBlock(onlyDay);
  } else {
    const alien = (a.alien_sources as any[])
      .map(s => `<tr><td>${esc(s.name)}</td><td class="r">${s.count}</td><td class="r">${rub(s.cost)}</td><td class="r">${rub(s.revenue)}</td><td class="r">${rub(s.profit)}</td></tr>`)
      .join("");
    const whom = (a.my_purchases_sold_in_period.by_whom as any[])
      .map(s => `<tr><td>${esc(s.name)}</td><td class="r">${s.count}</td><td class="r">${rub(s.revenue)}</td><td class="r">${rub(s.profit)}</td></tr>`)
      .join("");
    const cats = (a.categories as any[])
      .map(s => `<tr><td>${esc(s.name)}</td><td class="r">${s.count}</td><td class="r">${rub(s.revenue)}</td><td class="r">${rub(s.profit)}</td></tr>`)
      .join("");
    body += `<h2>Сводка</h2><table><tbody>
    <tr><td>Продано</td><td class="r">${a.sales.count} шт. на ${rub(a.sales.revenue)}</td><td>Прибыль</td><td class="r">${rub(a.sales.profit)}${a.sales.margin_pct !== null ? ` (${a.sales.margin_pct}%)` : ""}</td></tr>
    <tr><td>Средний чек</td><td class="r">${rub(a.sales.avg_check)}</td><td>Средняя прибыль</td><td class="r">${rub(a.sales.avg_profit)}</td></tr>
    <tr><td>Ср. срок на складе</td><td class="r">${a.sales.avg_days_in_stock ?? "—"} дн.</td><td>Бонус с продаж</td><td class="r">${rub(a.sales.bonus)}</td></tr>
    <tr><td>Своих товаров продал</td><td class="r">${a.own_purchase_sales.count} шт. / ${rub(a.own_purchase_sales.profit)}</td><td>Чужих товаров продал</td><td class="r">${a.alien_purchase_sales.count} шт. / ${rub(a.alien_purchase_sales.profit)}</td></tr>
    <tr><td>Закуплено</td><td class="r">${a.purchases.count} шт. на ${rub(a.purchases.cost)}</td><td>Продано из закупок</td><td class="r">${a.purchases.sold_count} (${a.purchases.sold_pct ?? "—"}%)</td></tr>
    <tr><td>Не продано из закупок</td><td class="r">${a.purchases.unsold_count} на ${rub(a.purchases.unsold_cost)}</td><td>Остаток на складе от него</td><td class="r">${a.stock_now.count} шт. / ${rub(a.stock_now.cost)}</td></tr>
    <tr><td>Его закупки продались за период</td><td class="r">${a.my_purchases_sold_in_period.count} шт. / прибыль ${rub(a.my_purchases_sold_in_period.profit)}</td><td>Бонус с закупок</td><td class="r">${rub(a.my_purchases_sold_in_period.bonus)}</td></tr>
    <tr><td>Начислено</td><td class="r">${rub(a.discipline.earned)}</td><td>Выплачено</td><td class="r">${rub(a.discipline.paid)}</td></tr>
    <tr><td>Рабочих дней</td><td class="r">${a.discipline.work_days}</td><td>Дни с операциями без внесения</td><td class="r neg">${a.discipline.days_not_entered.map(fd).join(", ") || "нет"}</td></tr>
    </tbody></table>
    <h3>Чужие закупки, которые он продал</h3>${alien ? `<table><thead><tr><th>Закупщик</th><th>Шт.</th><th>Закупка</th><th>Продано за</th><th>Прибыль</th></tr></thead><tbody>${alien}</tbody></table>` : `<p class="muted">Нет</p>`}
    <h3>Его закупки — кто продал</h3>${whom ? `<table><thead><tr><th>Продавец</th><th>Шт.</th><th>Выручка</th><th>Прибыль</th></tr></thead><tbody>${whom}</tbody></table>` : `<p class="muted">Нет</p>`}
    <h3>По категориям</h3><table><thead><tr><th>Категория</th><th>Шт.</th><th>Выручка</th><th>Прибыль</th></tr></thead><tbody>${cats}</tbody></table>
    <h2>Все продажи</h2>${salesTable(r.sales, true)}
    <h2>Все закупки</h2>${purchasesTable(r.purchases, true)}
    <h2>Выплаты</h2>${r.payouts.length ? `<table><thead><tr><th>Дата</th><th>Сумма</th><th>Примечание</th></tr></thead><tbody>${r.payouts.map(p => `<tr><td>${fd(String(p.payout_date))}</td><td class="r">${rub(p.amount)}</td><td>${esc(p.note || "")}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Нет</p>`}
    <h2>Подробно по датам</h2>${[...r.days].filter(d => d.has_activity || d.salary.entered).map(dayBlock).join("")}`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;margin:16px}
  h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px;border-bottom:2px solid #333;padding-bottom:2px}h3{font-size:12px;margin:10px 0 4px}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}th,td{border:1px solid #bbb;padding:3px 5px;vertical-align:top;text-align:left}
  th{background:#eee}td.r{text-align:right;white-space:nowrap}small,.muted{color:#666}.meta{margin:2px 0 6px}
  .pos{color:#0a7a2f}.neg{color:#c00}.day{page-break-inside:auto;margin-bottom:14px}tr{page-break-inside:avoid}
  @media print{@page{size:A4 landscape;margin:10mm}}</style></head><body>${body}</body></html>`;
}

export function openPdf(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Разрешите всплывающие окна, чтобы сохранить PDF");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
