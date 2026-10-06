import type { SLOperation } from "./types";

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

function fmtMoney(n: unknown): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function localTimeKey(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export type DocKind = "act_buy" | "act_sell" | "check_sell";

export type PrintOpts = {
  kind: DocKind;
  date: string;
  timeFrom: string;
  timeTo: string;
  showTime: boolean;
  rowTime?: boolean;
  customTime?: string;
};

function rowTimeOf(o: SLOperation, opts: { customTime?: string }): string {
  return opts.customTime || localTimeKey(o.created_at);
}

export function filterByDayAndTime(ops: SLOperation[], opType: "buy" | "sell", date: string, timeFrom: string, timeTo: string): SLOperation[] {
  return ops
    .filter(o => o.op_type === opType && localDateKey(o.created_at) === date)
    .filter(o => {
      const t = localTimeKey(o.created_at);
      return t >= (timeFrom || "00:00") && t <= (timeTo || "23:59");
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

const BASE_CSS = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: 'Times New Roman', serif; color: #000; font-size: 12pt; margin: 0; }
.toolbar { background: #111; color: #fff; padding: 10px; display: flex; gap: 8px; font-family: Arial; position: sticky; top: 0; }
.toolbar button { background: #FFD700; color: #000; border: 0; padding: 6px 14px; font-weight: bold; cursor: pointer; border-radius: 4px; }
.toolbar button.gray { background: #444; color: #fff; }
@media print { .toolbar { display: none } }
.page { padding: 10mm 8mm; }
h1 { text-align: center; font-size: 15pt; margin: 0 0 2mm; }
.sub { text-align: center; margin-bottom: 6mm; }
.org { margin-bottom: 4mm; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #000; padding: 2mm 2.5mm; font-size: 10.5pt; vertical-align: top; }
th { background: #f0f0f0; }
.c { text-align: center; } .r { text-align: right; white-space: nowrap; }
.total { margin-top: 4mm; text-align: right; font-weight: bold; }
.signs { display: flex; justify-content: space-between; gap: 10mm; margin-top: 16mm; }
.signs > div { width: 48%; }
.line { border-bottom: 1px solid #000; height: 10mm; }
.small { font-size: 9pt; color: #444; margin-top: 1mm; }
.check { border: 1px dashed #000; padding: 4mm 5mm; margin-bottom: 5mm; page-break-inside: avoid; }
.check .row { display: flex; justify-content: space-between; gap: 6mm; padding: 0.6mm 0; }
.check .big { font-size: 14pt; font-weight: bold; text-align: right; margin-top: 2mm; }
`;

function openWindow(title: string, body: string): boolean {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}</style></head><body>
<div class="toolbar">
  <span style="flex:1">${esc(title)}</span>
  <button onclick="window.print()">Печать</button>
  <button class="gray" onclick="window.close()">Закрыть</button>
</div>
<div class="page">${body}</div>
</body></html>`);
  w.document.close();
  return true;
}

function periodLabel(date: string, timeFrom: string, timeTo: string, showTime: boolean, customTime?: string): string {
  const dateRu = new Date(date + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  if (customTime) return `${dateRu}, ${customTime}`;
  if (!showTime) return dateRu;
  return `${dateRu}, с ${timeFrom || "00:00"} до ${timeTo || "23:59"}`;
}

function buildActs(list: SLOperation[], opts: PrintOpts): { title: string; period: string; body: string } {
  const isBuy = opts.kind === "act_buy";
  const title = isBuy ? "АКТ ЗАКУПКИ" : "АКТ ПРОДАЖИ";
  const partyLabel = isBuy ? "ФИО продавца (клиента)" : "ФИО покупателя";
  const period = periodLabel(opts.date, opts.timeFrom, opts.timeTo, opts.showTime, opts.customTime);
  const total = list.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const showCol = !!(opts.showTime || opts.rowTime);
  const timeHead = showCol ? `<th style="width:16mm">Время</th>` : "";
  const cols = showCol ? 6 : 5;

  const rows = list.map((o, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      ${showCol ? `<td class="c">${esc(rowTimeOf(o, opts))}</td>` : ""}
      <td>${esc(o.client_name || "—")}</td>
      <td>${esc(o.item_title || "—")}</td>
      <td>${esc(o.item_imei || "—")}</td>
      <td class="r">${fmtMoney(o.amount)}</td>
    </tr>`).join("");
  const empty = list.length === 0
    ? `<tr><td colspan="${cols}" class="c" style="padding:10mm">За выбранный период операций нет</td></tr>`
    : "";

  const body = `
  <h1>${title}</h1>
  <div class="sub">за ${esc(period)}, г. Калуга</div>
  <div class="org"><b>Организация:</b> Скупка24, г. Калуга</div>
  <table>
    <thead><tr><th style="width:8mm">№</th>${timeHead}<th>${partyLabel}</th><th>Устройство</th><th>IMEI / серийный №</th><th style="width:24mm">Сумма, ₽</th></tr></thead>
    <tbody>${rows}${empty}</tbody>
  </table>
  <div class="total">Всего: ${list.length} шт. на сумму ${fmtMoney(total)} ₽</div>
  <div class="signs">
    <div><div class="line"></div><div class="small">Ответственное лицо Скупка24 / подпись, ФИО</div></div>
    <div><div class="line"></div><div class="small">Дата, М.П.</div></div>
  </div>`;
  return { title, period, body };
}

export function printPoliceActs(list: SLOperation[], opts: PrintOpts): boolean {
  const r = buildActs(list, opts);
  return openWindow(`${r.title} ${r.period}`, r.body);
}

function buildChecks(list: SLOperation[], opts: PrintOpts): { period: string; body: string } {
  const period = periodLabel(opts.date, opts.timeFrom, opts.timeTo, opts.showTime, opts.customTime);
  const total = list.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const checks = list.map(o => {
    const dateStr = new Date(opts.date + "T12:00:00").toLocaleDateString("ru-RU");
    const showT = !!(opts.showTime || opts.rowTime);
    const pay = ({ cash: "Наличные", card: "Карта", transfer: "Перевод" } as Record<string, string>)[String(o.payment_method || "cash")] || "—";
    return `
    <div class="check">
      <div class="row"><b>ТОВАРНЫЙ ЧЕК № ${o.id}</b><span>${esc(dateStr)}${showT ? " " + esc(rowTimeOf(o, opts)) : ""}</span></div>
      <div class="row"><span>Товар</span><b>${esc(o.item_title || "—")}</b></div>
      <div class="row"><span>IMEI / серийный №</span><span>${esc(o.item_imei || "—")}</span></div>
      <div class="row"><span>Покупатель</span><span>${esc(o.client_name || "—")}</span></div>
      <div class="row"><span>Оплата</span><span>${esc(pay)}</span></div>
      <div class="row"><span>Продавец</span><span>${esc(o.employee_name || "—")}</span></div>
      <div class="big">${fmtMoney(o.amount)} ₽</div>
    </div>`;
  }).join("");

  const body = `
  <h1>ЧЕКИ ПРОДАЖИ</h1>
  <div class="sub">за ${esc(period)}, г. Калуга</div>
  ${checks || `<div class="c" style="padding:10mm">За выбранный период продаж нет</div>`}
  <div class="total">Всего: ${list.length} шт. на сумму ${fmtMoney(total)} ₽</div>`;
  return { period, body };
}

export function printPoliceChecks(list: SLOperation[], opts: PrintOpts): boolean {
  const r = buildChecks(list, opts);
  return openWindow(`Чеки продажи ${r.period}`, r.body);
}

/** Закупка + продажа + чеки за одно число — одним документом. */
export function printPoliceAll(buy: SLOperation[], sell: SLOperation[], opts: Omit<PrintOpts, "kind">): boolean {
  const a = buildActs(buy, { ...opts, kind: "act_buy" });
  const b = buildActs(sell, { ...opts, kind: "act_sell" });
  const c = buildChecks(sell, { ...opts, kind: "check_sell" });
  const brk = `<div style="page-break-after:always"></div>`;
  return openWindow(`Документы за ${a.period}`, a.body + brk + b.body + brk + c.body);
}
