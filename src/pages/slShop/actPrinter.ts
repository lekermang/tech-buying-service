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

export type ActKind = "buy" | "sell";

export function printDayAct(kind: ActKind, date: string, ops: SLOperation[]): boolean {
  const list = ops
    .filter(o => o.op_type === kind && localDateKey(o.created_at) === date)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;

  const isBuy = kind === "buy";
  const title = isBuy ? "АКТ ЗАКУПКИ" : "АКТ ПРОДАЖИ";
  const partyLabel = isBuy ? "ФИО продавца (клиента)" : "ФИО покупателя";
  const dateRu = new Date(date + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const total = list.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const rows = list.map((o, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td class="c">${esc(new Date(o.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }))}</td>
      <td>${esc(o.client_name || "—")}</td>
      <td>${esc(o.item_title || "—")}</td>
      <td>${esc(o.item_imei || "—")}</td>
      <td class="r">${fmtMoney(o.amount)}</td>
    </tr>`).join("");

  const empty = list.length === 0
    ? `<tr><td colspan="6" class="c" style="padding:10mm">За выбранное число операций нет</td></tr>`
    : "";

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ${esc(dateRu)}</title>
<style>
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
</style></head><body>
<div class="toolbar">
  <span style="flex:1">${title} за ${esc(dateRu)}</span>
  <button onclick="window.print()">Печать</button>
  <button class="gray" onclick="window.close()">Закрыть</button>
</div>
<div class="page">
  <h1>${title}</h1>
  <div class="sub">за ${esc(dateRu)}, г. Калуга</div>
  <div class="org"><b>Организация:</b> Скупка24, г. Калуга</div>
  <table>
    <thead>
      <tr><th style="width:8mm">№</th><th style="width:16mm">Время</th><th>${partyLabel}</th><th>Устройство</th><th>IMEI / серийный №</th><th style="width:24mm">Сумма, ₽</th></tr>
    </thead>
    <tbody>${rows}${empty}</tbody>
  </table>
  <div class="total">Всего: ${list.length} шт. на сумму ${fmtMoney(total)} ₽</div>
  <div class="signs">
    <div><div class="line"></div><div class="small">Ответственное лицо Скупка24 / подпись, ФИО</div></div>
    <div><div class="line"></div><div class="small">Дата, М.П.</div></div>
  </div>
</div>
</body></html>`);
  w.document.close();
  return true;
}
