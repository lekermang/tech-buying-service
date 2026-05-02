import type { SLItem, SLLabelTemplate } from "./types";

function fmtPrice(n: number | string | undefined | null): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

function escapeHtml(s: string | undefined | null): string {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

/** Code128-подобный штрих-код через div'ы (рендерится прямо в HTML без зависимостей).
 *  Это упрощённый visual barcode под номер товара (для считывания внутри магазина).
 */
function barcodeBars(text: string, heightMm: number): string {
  // Простая псевдо-кодировка: каждый символ → 4 чёрные/белые полосы переменной ширины.
  const widths = [0.25, 0.5, 0.35, 0.6];
  const chars = text.replace(/[^0-9A-Za-z]/g, "").slice(0, 14) || "00000000";
  let bars = "";
  // стартовая полоса
  bars += `<div style="display:inline-block;width:0.6mm;height:${heightMm}mm;background:#000;"></div>`;
  bars += `<div style="display:inline-block;width:0.3mm;height:${heightMm}mm;background:#fff;"></div>`;
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    for (let j = 0; j < 4; j++) {
      const isBar = (code >> j) & 1;
      const w = widths[(code + j) % widths.length];
      bars += `<div style="display:inline-block;width:${w}mm;height:${heightMm}mm;background:${isBar ? "#000" : "#fff"};"></div>`;
    }
    bars += `<div style="display:inline-block;width:0.3mm;height:${heightMm}mm;background:#fff;"></div>`;
  }
  bars += `<div style="display:inline-block;width:0.6mm;height:${heightMm}mm;background:#000;"></div>`;
  return bars;
}

function labelHtml(item: SLItem, tmpl: SLLabelTemplate, opts: { empName?: string }): string {
  const w = Number(tmpl.width_mm);
  const h = Number(tmpl.height_mm);

  // Адаптивные размеры под формат ценника (типовой 58×40 / 80×50)
  const titleSize = (w / 11).toFixed(2);
  const specsSize = (w / 22).toFixed(2);
  const priceSize = (w / 5).toFixed(2);
  const small = (w / 28).toFixed(2);
  const tiny = (w / 32).toFixed(2);

  const ramStorage = (item.ram_gb && item.storage_gb)
    ? `${item.ram_gb}/${item.storage_gb}`
    : (item.storage_gb ? `${item.storage_gb}` : "");

  const titleHasRam = !!String(item.title).match(/\d+\s*\/\s*\d+/);
  const titleWithRam = ramStorage && !titleHasRam ? `${item.title} ${ramStorage}` : item.title;

  // Характеристики: только полный текст (без дублирования формата 4/128)
  const baseSpecs = (item.specs || item.specs_short || "").trim();
  const extra: string[] = [];
  if (item.color) extra.push(String(item.color));
  if (item.battery_health) extra.push(`АКБ ${item.battery_health}%`);
  if (item.condition) extra.push(String(item.condition));
  if (item.has_box) extra.push("коробка");
  if (item.has_charger) extra.push("зарядка");
  const extraStr = extra.filter(b => !baseSpecs.toLowerCase().includes(b.toLowerCase())).join(" • ");
  const specsCombined = [baseSpecs, extraStr].filter(Boolean).join(" • ").slice(0, 240);

  const showSpecs = tmpl.show_specs !== false && specsCombined;
  const sn = item.serial_number || item.imei || "";
  const empName = opts.empName || "";
  const idStr = item.sku || `ID${item.id}`;

  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU");
  const barcodeText = String(item.sku || item.id || "");

  return `
    <div class="label" style="width:${w}mm;height:${h}mm;font-family:Arial,sans-serif">
      <div class="hdr" style="font-size:${tiny}mm;">
        <span class="hdr-l">${escapeHtml(dateStr)} &nbsp; <b>${escapeHtml(idStr)}</b></span>
        <span class="hdr-r"><b>Скупка24</b></span>
      </div>
      <div class="title" style="font-size:${titleSize}mm">${escapeHtml(titleWithRam)}</div>
      ${showSpecs ? `<div class="specs" style="font-size:${specsSize}mm"><b>Характеристики:</b> ${escapeHtml(specsCombined)}</div>` : ""}
      ${sn ? `<div class="sn" style="font-size:${specsSize}mm"><b>Описание:</b> с/н ${escapeHtml(sn)}</div>` : ""}
      <div class="barcode-wrap" style="height:${(h / 7).toFixed(2)}mm">
        <div class="barcode-bars">${barcodeBars(barcodeText, h / 8)}</div>
        <div class="barcode-text" style="font-size:${tiny}mm">${escapeHtml(barcodeText)}</div>
      </div>
      <div class="price" style="font-size:${priceSize}mm">Цена: ${fmtPrice(item.sell_price)} руб.</div>
      <div class="footer" style="font-size:${small}mm">
        <span>Цена за 1 шт.</span>
        <span>Отв. лицо: <b>${escapeHtml(empName || "—")}</b></span>
      </div>
    </div>
  `;
}

/** Шаблон ценника по умолчанию для быстрой печати из карточки товара. */
export const DEFAULT_LABEL_TMPL: SLLabelTemplate = {
  id: 0,
  name: "Стандарт 80×50",
  width_mm: 80,
  height_mm: 50,
  layout: "classic",
  show_brand: true,
  show_specs: true,
  show_imei: true,
  show_qr: false,
  show_barcode: true,
  font_family: "Arial",
  is_default: true,
  is_thermal: true,
};

/** Быстрая печать одного ценника по товару без выбора шаблона. */
export function printLabelQuick(item: SLItem, opts: { empName?: string; tmpl?: SLLabelTemplate } = {}): void {
  const tmpl = opts.tmpl || DEFAULT_LABEL_TMPL;
  printLabels([item], tmpl, { empName: opts.empName });
}

export function printLabels(items: SLItem[], tmpl: SLLabelTemplate, opts: { empName?: string } = {}): void {
  if (!items.length) return;
  const w = window.open("", "_blank", "width=600,height=800");
  if (!w) return;
  const W = Number(tmpl.width_mm);
  const H = Number(tmpl.height_mm);

  const labels = items.map(it => labelHtml(it, tmpl, opts)).join("");

  const pageStyle = tmpl.is_thermal
    ? `@page { size: ${W}mm ${H}mm; margin: 0; } body { margin: 0; padding: 0; }`
    : `@page { size: A4; margin: 5mm; } body { margin: 0; padding: 0; }`;

  const layoutCss = tmpl.is_thermal
    ? `.sheet { display: block; } .label { page-break-after: always; }`
    : `.sheet { display: flex; flex-wrap: wrap; gap: 2mm; } .label { page-break-inside: avoid; }`;

  w.document.write(`<!DOCTYPE html><html><head><title>Ценники</title>
    <style>
      ${pageStyle}
      * { box-sizing: border-box; }
      body { background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { padding: 0; }
      ${layoutCss}
      .label {
        border: 0.4mm solid #000;
        display: flex; flex-direction: column; align-items: stretch;
        padding: 1mm 1.5mm; overflow: hidden; gap: 0.6mm; color: #000; background: #fff;
      }
      .label .hdr {
        display: flex; justify-content: space-between; align-items: center;
        padding-bottom: 0.6mm; border-bottom: 0.2mm solid #000;
      }
      .label .title { font-weight: 800; text-align: center; line-height: 1.1; width: 100%; padding: 0.5mm 0; }
      .label .specs { line-height: 1.2; width: 100%; word-wrap: break-word; padding: 0 0.5mm; }
      .label .sn { line-height: 1.2; width: 100%; padding: 0 0.5mm; }
      .label .barcode-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.3mm 0; }
      .label .barcode-bars { display: flex; align-items: center; }
      .label .barcode-text { font-family: 'Courier New', monospace; letter-spacing: 0.3mm; }
      .label .price { font-weight: 900; text-align: left; line-height: 1; width: 100%; padding: 0.5mm; border-top: 0.2mm solid #000; padding-top: 1mm; }
      .label .footer { display: flex; justify-content: space-between; gap: 1mm; line-height: 1.1; border-top: 0.2mm solid #000; padding-top: 0.5mm; }
      @media screen {
        body { padding: 12px; background: #f3f3f3; }
        .label { background: #fff; margin: 4mm; }
      }
      @media print {
        body { padding: 0; background: #fff; }
        .toolbar { display: none !important; }
      }
      .toolbar { position: sticky; top: 0; padding: 8px; background: #111; color: #fff; display: flex; gap: 8px; align-items: center; font-family: Arial; z-index: 10; }
      .toolbar button { background: #FFD700; color: #000; border: 0; padding: 6px 14px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    </style>
  </head><body>
    <div class="toolbar">
      <span>Ценников: ${items.length} • Размер: ${W}×${H}мм • ${tmpl.is_thermal ? "Термопринтер" : "A4 лист (цветная печать)"}</span>
      <button onclick="window.print()">🖨 Печать</button>
      <button onclick="window.close()">Закрыть</button>
    </div>
    <div class="sheet">${labels}</div>
    <script>setTimeout(() => window.print(), 350);</` + `script>
  </body></html>`);
  w.document.close();
}

// Печать чека по продаже
export function printReceipt(item: {
  id: number;
  title: string;
  specs_short?: string | null;
  imei?: string | null;
  sku?: string | null;
  sell_price?: number | string;
  sell_at?: string | null;
  amount?: number | string;
  payment_method?: string;
  contract_number?: string | null;
  employee_name?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  branch_name?: string | null;
  branch_address?: string | null;
  category_name?: string | null;
}): void {
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) return;
  const date = item.sell_at ? new Date(item.sell_at).toLocaleString("ru-RU") : new Date().toLocaleString("ru-RU");
  const amount = item.amount ?? item.sell_price ?? 0;
  const paymentMap: Record<string, string> = { cash: "Наличные", card: "Карта", transfer: "Перевод" };
  w.document.write(`<!DOCTYPE html><html><head><title>Чек</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      body { font-family: 'Courier New', Courier, monospace; padding: 10mm 4mm; max-width: 72mm; margin: 0 auto; color: #000; font-size: 11px; }
      h1 { text-align: center; font-size: 16px; margin: 0 0 2mm; letter-spacing: 1px; }
      .sub { text-align: center; font-size: 10px; margin-bottom: 3mm; }
      hr { border: 0; border-top: 1px dashed #000; margin: 3mm 0; }
      .row { display: flex; justify-content: space-between; gap: 4px; padding: 1px 0; }
      .row b { font-weight: 700; }
      .total { font-size: 16px; font-weight: 900; text-align: center; margin: 3mm 0; padding: 2mm; border: 1px solid #000; }
      .footer { text-align: center; font-size: 9px; margin-top: 4mm; }
      .id { text-align: center; letter-spacing: 2px; font-size: 12px; font-weight: bold; }
      @media screen { body { background: #fff; box-shadow: 0 0 8px rgba(0,0,0,0.1); margin: 16px auto; } }
      @media print { body { box-shadow: none; } .toolbar { display: none } }
      .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #111; color: #fff; padding: 8px; text-align: center; }
      .toolbar button { background: #FFD700; color: #000; border: 0; padding: 4px 12px; font-weight: bold; cursor: pointer; }
    </style>
  </head><body>
    <div class="toolbar">
      <button onclick="window.print()">🖨 Печать</button>
      <button onclick="window.close()" style="background:#444;color:#fff">Закрыть</button>
    </div>
    <div style="height: 30px"></div>
    <h1>СКУПКА24</h1>
    <div class="sub">
      ${escapeHtml(item.branch_name || "")}<br>
      ${escapeHtml(item.branch_address || "г. Калуга")}
    </div>
    <hr>
    <div class="row"><span>Чек № продажи</span><b>${item.id}</b></div>
    <div class="row"><span>Дата</span><b>${escapeHtml(date)}</b></div>
    ${item.contract_number ? `<div class="row"><span>Договор</span><b>${escapeHtml(item.contract_number)}</b></div>` : ""}
    <hr>
    <div style="font-weight:bold; margin-bottom: 1mm">${escapeHtml(item.title)}</div>
    ${item.category_name ? `<div style="font-size:10px; color:#444">${escapeHtml(item.category_name)}</div>` : ""}
    ${item.specs_short ? `<div style="font-size:10px">${escapeHtml(item.specs_short)}</div>` : ""}
    ${item.imei ? `<div style="font-size:10px">IMEI: ${escapeHtml(item.imei)}</div>` : ""}
    ${item.sku ? `<div style="font-size:10px">SKU: ${escapeHtml(item.sku)}</div>` : ""}
    <hr>
    <div class="total">${fmtPrice(amount)} ₽</div>
    <div class="row"><span>Оплата</span><b>${escapeHtml(paymentMap[item.payment_method || "cash"] || item.payment_method || "—")}</b></div>
    ${item.client_name ? `<div class="row"><span>Покупатель</span><b>${escapeHtml(item.client_name)}</b></div>` : ""}
    ${item.client_phone ? `<div class="row"><span>Телефон</span><b>${escapeHtml(item.client_phone)}</b></div>` : ""}
    <hr>
    <div class="row"><span>Продавец</span><b>${escapeHtml(item.employee_name || "—")}</b></div>
    <div class="id">#${item.id}</div>
    <div class="footer">
      Гарантия: <b>1 год</b> с даты продажи.<br>
      Действует до: <b>${new Date(Date.now() + 365 * 86400000).toLocaleDateString("ru-RU")}</b><br>
      Спасибо за покупку!<br>
      skupka24.ru
    </div>
    <script>setTimeout(() => window.print(), 350);</` + `script>
  </body></html>`);
  w.document.close();
}