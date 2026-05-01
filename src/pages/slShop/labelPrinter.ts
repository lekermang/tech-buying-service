import type { SLItem, SLLabelTemplate } from "./types";

function fmtPrice(n: number | string | undefined | null): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

function escapeHtml(s: string | undefined | null): string {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

function barcodeBars(value: string): string {
  const chars = String(value || "0").split("");
  const widths = ["1px", "2px", "3px", "1px"];
  let bars = "";
  for (const ch of chars) {
    const code = ch.charCodeAt(0);
    for (let i = 0; i < 4; i++) {
      const isBlack = ((code >> i) & 1) === 1;
      bars += `<span style="display:inline-block;width:${widths[i]};height:100%;background:${isBlack ? "#000" : "#fff"}"></span>`;
    }
  }
  bars += `<span style="display:inline-block;width:2px;height:100%;background:#000"></span>`;
  bars += `<span style="display:inline-block;width:1px;height:100%;background:#fff"></span>`;
  bars += `<span style="display:inline-block;width:3px;height:100%;background:#000"></span>`;
  return bars;
}

function labelHtml(item: SLItem, tmpl: SLLabelTemplate, opts: { empName?: string }): string {
  const w = Number(tmpl.width_mm);
  const h = Number(tmpl.height_mm);
  const isThermal = tmpl.is_thermal;
  const titleSize = (w / 16).toFixed(2);
  const specsSize = (w / 24).toFixed(2);
  const priceSize = (w / 7).toFixed(2);
  const small = (w / 30).toFixed(2);
  const tiny = (w / 36).toFixed(2);

  const showSpecs = tmpl.show_specs && (item.specs_short || item.specs);
  const specsText = item.specs_short || (item.specs || "").slice(0, 80);
  const showImei = tmpl.show_imei && item.imei;
  const category = item.category_path || item.category_name || "";
  const branch = item.branch_name || "";
  const empName = opts.empName || "";
  const idStr = String(item.id);

  const accent = isThermal ? "#000" : "#C8A14B";
  const headerBg = isThermal ? "#000" : "linear-gradient(180deg, #FFD700 0%, #C8A14B 100%)";
  const headerColor = isThermal ? "#fff" : "#000";

  return `
    <div class="label" style="width:${w}mm;height:${h}mm;font-family:${tmpl.font_family || "Arial"},sans-serif">
      <div class="hdr" style="background:${headerBg};color:${headerColor};font-size:${tiny}mm;">
        <span style="font-weight:900;letter-spacing:0.4mm">СКУПКА24</span>
        ${branch ? `<span style="opacity:0.85">${escapeHtml(branch)}</span>` : ""}
        <span style="font-weight:700">#${escapeHtml(idStr)}</span>
      </div>
      ${category ? `<div class="cat" style="font-size:${tiny}mm;color:${accent}">${escapeHtml(category)}</div>` : ""}
      <div class="title" style="font-size:${titleSize}mm">${escapeHtml(item.title)}</div>
      ${showSpecs ? `<div class="specs" style="font-size:${specsSize}mm">${escapeHtml(specsText)}</div>` : ""}
      ${showImei ? `<div class="imei" style="font-size:${tiny}mm">IMEI: ${escapeHtml(item.imei || "")}</div>` : ""}
      <div class="price" style="font-size:${priceSize}mm;color:${accent}">${fmtPrice(item.sell_price)}₽</div>
      <div class="barcode-wrap">
        <div class="barcode" style="height:${(h * 0.12).toFixed(2)}mm">${barcodeBars(idStr)}</div>
        <div class="barcode-id" style="font-size:${tiny}mm">ID ${escapeHtml(idStr)}${item.sku ? ` · ${escapeHtml(item.sku)}` : ""}</div>
      </div>
      <div class="footer" style="font-size:${small}mm">
        <span>Ответственное лицо:</span>
        <b>${escapeHtml(empName || "—")}</b>
      </div>
    </div>
  `;
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
        display: flex; flex-direction: column; align-items: stretch; justify-content: space-between;
        padding: 1mm 1.5mm; overflow: hidden; gap: 0.5mm;
      }
      .label .hdr {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.4mm 1mm; border-radius: 0.6mm;
        text-transform: uppercase; letter-spacing: 0.1mm;
        gap: 1mm;
      }
      .label .cat { text-align: center; font-style: italic; opacity: 0.85; line-height: 1; margin-top: 0.3mm; }
      .label .title { font-weight: 800; text-align: center; line-height: 1.05; width: 100%; }
      .label .specs { text-align: center; line-height: 1.1; width: 100%; }
      .label .imei  { text-align: center; line-height: 1; width: 100%; color: #444; }
      .label .price { font-weight: 900; text-align: center; line-height: 1; width: 100%; }
      .label .barcode-wrap { width: 100%; text-align: center; }
      .label .barcode { display: inline-flex; align-items: stretch; gap: 0; }
      .label .barcode-id { font-family: 'Courier New', monospace; letter-spacing: 0.3mm; line-height: 1; margin-top: 0.2mm; }
      .label .footer { display: flex; justify-content: space-between; gap: 1mm; line-height: 1.1; border-top: 0.2mm dashed #000; padding-top: 0.3mm; }
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
      Гарантия 14 дней.<br>
      Спасибо за покупку!<br>
      skupka24.ru
    </div>
    <script>setTimeout(() => window.print(), 350);</` + `script>
  </body></html>`);
  w.document.close();
}
