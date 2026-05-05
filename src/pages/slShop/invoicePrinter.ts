import type { SLItem } from "./types";

/** Сумма прописью на русском (упрощённо, для рублей).
 *  Хватает для чека/накладной — без копеек. */
function num2words(n: number): string {
  if (n === 0) return "ноль рублей";
  const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const onesF = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

  function under1000(num: number, female = false): string {
    const arr = female ? onesF : ones;
    const parts: string[] = [];
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    if (h) parts.push(hundreds[h]);
    if (t === 1) {
      parts.push(teens[o]);
    } else {
      if (t) parts.push(tens[t]);
      if (o) parts.push(arr[o]);
    }
    return parts.join(" ");
  }

  function rubleEnding(num: number): string {
    const last2 = num % 100;
    const last1 = num % 10;
    if (last2 >= 11 && last2 <= 14) return "рублей";
    if (last1 === 1) return "рубль";
    if (last1 >= 2 && last1 <= 4) return "рубля";
    return "рублей";
  }

  function thousandEnding(num: number): string {
    const last2 = num % 100;
    const last1 = num % 10;
    if (last2 >= 11 && last2 <= 14) return "тысяч";
    if (last1 === 1) return "тысяча";
    if (last1 >= 2 && last1 <= 4) return "тысячи";
    return "тысяч";
  }

  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions) {
    parts.push(under1000(millions) + " миллион" + (millions === 1 ? "" : (millions >= 2 && millions <= 4 ? "а" : "ов")));
  }
  if (thousands) {
    parts.push(under1000(thousands, true) + " " + thousandEnding(thousands));
  }
  if (rest) {
    parts.push(under1000(rest));
  }
  parts.push(rubleEnding(n));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

type PrintOpts = {
  title?: string;          // Заголовок, например "Сверка с накладной"
  branchName?: string;     // Филиал
  empName?: string;        // Исполнитель
  brandFilter?: string;    // Если выводим только один бренд — указать
};

/** Открывает окно печати «Сверка с накладной» в формате бумажной накладной. */
export function printInvoice(items: SLItem[], opts: PrintOpts = {}): void {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;

  const totalQty = items.reduce((s, it) => s + (Number(it.quantity ?? 1) || 1), 0);
  const totalBuy = items.reduce((s, it) => s + (Number(it.buy_price) || 0) * (Number(it.quantity ?? 1) || 1), 0);
  const totalSell = items.reduce((s, it) => s + (Number(it.sell_price) || 0) * (Number(it.quantity ?? 1) || 1), 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU") + " " + now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const orderNum = "СВ-" + now.getTime().toString().slice(-6);

  const rows = items.map((it, idx) => {
    const qty = Number(it.quantity ?? 1) || 1;
    const buy = Number(it.buy_price) || 0;
    const sell = Number(it.sell_price) || 0;
    const sumBuy = buy * qty;
    const sumSell = sell * qty;
    return `
      <tr>
        <td class="num">${idx + 1}</td>
        <td class="name">
          <div class="name-main">${escapeHtml(it.title)}</div>
          ${it.specs_short ? `<div class="name-spec">${escapeHtml(it.specs_short)}</div>` : ""}
          ${it.sku ? `<div class="name-sku">${escapeHtml(it.sku)}</div>` : ""}
        </td>
        <td class="qty">${qty}</td>
        <td class="price">${buy.toLocaleString("ru-RU")}</td>
        <td class="sum">${sumBuy.toLocaleString("ru-RU")}</td>
        <td class="price">${sell.toLocaleString("ru-RU")}</td>
        <td class="sum">${sumSell.toLocaleString("ru-RU")}</td>
      </tr>
    `;
  }).join("");

  const headerTitle = opts.title || "Сверка с накладной";
  const brandLine = opts.brandFilter ? `<div class="meta-row"><b>Бренд:</b> ${escapeHtml(opts.brandFilter)}</div>` : "";
  const branchLine = opts.branchName ? `<div class="meta-row"><b>Филиал:</b> ${escapeHtml(opts.branchName)}</div>` : "";
  const empLine = opts.empName ? `<div class="meta-row"><b>Исполнитель:</b> ${escapeHtml(opts.empName)}</div>` : "";

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(headerTitle)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #000; background: #fff; margin: 0; font-size: 11pt; }
  .header { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
  .org { font-size: 14pt; font-weight: 900; letter-spacing: 0.5px; }
  .org-sub { font-size: 9pt; color: #444; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 14pt; font-weight: 900; margin: 8px 0 4px; text-transform: uppercase; letter-spacing: 1px; }
  .doc-num { text-align: center; font-size: 10pt; color: #444; margin-bottom: 8px; }
  .meta { margin-bottom: 8px; font-size: 10pt; }
  .meta-row { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  thead th { background: #f0f0f0; border: 1px solid #000; padding: 4px 6px; font-weight: 900; text-align: center; font-size: 9pt; text-transform: uppercase; }
  tbody td { border: 1px solid #555; padding: 4px 6px; vertical-align: top; }
  td.num { width: 30px; text-align: center; font-weight: bold; }
  td.qty { width: 50px; text-align: center; font-weight: bold; font-size: 11pt; }
  td.price, td.sum { width: 80px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.sum { font-weight: bold; }
  td.name .name-main { font-weight: bold; }
  td.name .name-spec { font-size: 8pt; color: #555; }
  td.name .name-sku { font-size: 8pt; color: #888; font-family: 'Courier New', monospace; }
  tfoot td { border: 1px solid #000; padding: 5px 6px; font-weight: 900; background: #fafafa; }
  tfoot .label { text-align: right; }
  .totals-block { margin-top: 12px; border-top: 2px solid #000; padding-top: 8px; }
  .total-row { display: flex; justify-content: space-between; align-items: baseline; margin: 3px 0; font-size: 11pt; }
  .total-row.big { font-size: 13pt; font-weight: 900; }
  .words { font-style: italic; color: #444; margin-top: 4px; font-size: 10pt; }
  .signs { margin-top: 30px; display: flex; justify-content: space-between; gap: 40px; font-size: 10pt; }
  .sign-block { flex: 1; }
  .sign-line { border-bottom: 1px solid #000; margin-top: 30px; }
  .sign-label { font-size: 8pt; color: #555; margin-top: 2px; }
  .toolbar { padding: 10px; background: #FFD700; color: #000; display: flex; gap: 10px; align-items: center; position: sticky; top: 0; z-index: 100; }
  .toolbar button { background: #000; color: #FFD700; border: 0; padding: 6px 14px; font-weight: bold; cursor: pointer; border-radius: 4px; }
  @media print { .toolbar { display: none !important; } body { padding: 0; } }
</style>
</head><body>
  <div class="toolbar">
    <button onclick="window.print()">🖨 Печать</button>
    <span style="font-weight:bold">Сверка с накладной — ${items.length} поз. · ${totalQty} шт</span>
    <span style="margin-left:auto;color:#444;font-size:11px">Открой в новой вкладке для удобства</span>
  </div>
  <div class="header">
    <div class="org">СКУПКА24</div>
    <div class="org-sub">г. Калуга • Б/У техника, скупка и продажа</div>
  </div>
  <div class="doc-title">${escapeHtml(headerTitle)}</div>
  <div class="doc-num">№ ${orderNum} от ${dateStr}</div>
  <div class="meta">
    ${brandLine}
    ${branchLine}
    ${empLine}
  </div>
  <table>
    <thead>
      <tr>
        <th>№</th>
        <th>Наименование</th>
        <th>Кол-во</th>
        <th>Закуп ₽</th>
        <th>Сумма закуп</th>
        <th>Розн. ₽</th>
        <th>Сумма розн.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" class="label">ИТОГО:</td>
        <td class="qty">${totalQty}</td>
        <td></td>
        <td class="sum">${totalBuy.toLocaleString("ru-RU")}</td>
        <td></td>
        <td class="sum">${totalSell.toLocaleString("ru-RU")}</td>
      </tr>
    </tfoot>
  </table>
  <div class="totals-block">
    <div class="total-row"><span>Позиций:</span><b>${items.length}</b></div>
    <div class="total-row"><span>Штук всего:</span><b>${totalQty}</b></div>
    <div class="total-row"><span>Сумма закупки:</span><b>${totalBuy.toLocaleString("ru-RU")} ₽</b></div>
    <div class="total-row big"><span>Сумма розницы:</span><b>${totalSell.toLocaleString("ru-RU")} ₽</b></div>
    <div class="words">Сумма закупки прописью: <b>${capitalize(num2words(Math.round(totalBuy)))}</b></div>
  </div>
  <div class="signs">
    <div class="sign-block">
      <div>Принял:</div>
      <div class="sign-line"></div>
      <div class="sign-label">${escapeHtml(opts.empName || "ФИО / подпись")}</div>
    </div>
    <div class="sign-block">
      <div>Сдал:</div>
      <div class="sign-line"></div>
      <div class="sign-label">ФИО / подпись</div>
    </div>
  </div>
  <script>setTimeout(() => window.print(), 350);</script>
</body></html>`);
  w.document.close();
}

function escapeHtml(s: string | undefined | null): string {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
