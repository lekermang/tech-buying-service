import type { SLItem, SLLabelTemplate } from "./types";

function fmtPrice(n: number | string | undefined | null): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

function escapeHtml(s: string | undefined | null): string {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

/** Опции скидки для ценника: старая зачёркнутая + новая жирная. */
export type DiscountOpts = {
  enabled?: boolean;        // включить отображение скидки
  oldPrice?: number | string; // старая цена (зачёркивается)
  newPrice?: number | string; // новая цена (жирная, основная)
};

function labelHtml(
  item: SLItem,
  tmpl: SLLabelTemplate,
  opts: { empName?: string; discount?: DiscountOpts },
): string {
  const w = Number(tmpl.width_mm);
  const h = Number(tmpl.height_mm);
  const isThermal = tmpl.is_thermal;
  const titleSize = (w / 14).toFixed(2);
  const specsSize = (w / 20).toFixed(2);
  const priceSize = (w / 6.5).toFixed(2);
  // Цены при скидке: старая чуть меньше, новая — основная (жирная)
  const oldPriceSize = (w / 11).toFixed(2);
  const newPriceSize = (w / 6).toFixed(2);
  const small = (w / 28).toFixed(2);
  const tiny = (w / 34).toFixed(2);

  // Формат памяти: "4/128GB" если есть оба поля, иначе fallback на storage
  const ramStorage = (item.ram_gb && item.storage_gb)
    ? `${item.ram_gb}/${item.storage_gb}GB`
    : (item.storage_gb ? `${item.storage_gb}GB` : (item.storage ? String(item.storage) : ""));

  // Собираем расширенные характеристики: краткие + память/АКБ/цвет/коробка/зарядка
  const extraBits: string[] = [];
  if (ramStorage) extraBits.push(ramStorage);
  if (item.color) extraBits.push(String(item.color));
  if (item.battery_health) extraBits.push(`АКБ ${item.battery_health}%`);
  if (item.condition) extraBits.push(String(item.condition));
  if (item.has_box) extraBits.push("коробка");
  if (item.has_charger) extraBits.push("зарядка");

  // Заголовок с памятью: "Honor 9X 4/128"
  const titleWithRam = ramStorage && !String(item.title).match(/\d+\/\d+/)
    ? `${item.title} ${ramStorage.replace(/GB$/i, "")}`
    : item.title;

  const baseSpecs = item.specs_short || (item.specs || "").slice(0, 100);
  // Объединяем, удаляя дубликаты подстрок
  const extraStr = extraBits
    .filter(b => !baseSpecs.toLowerCase().includes(b.toLowerCase()))
    .join(" • ");
  const specsCombined = [baseSpecs, extraStr].filter(Boolean).join(" • ").slice(0, 140);

  const showSpecs = tmpl.show_specs && specsCombined;
  const showImei = tmpl.show_imei && item.imei;
  const category = item.category_path || item.category_name || "";
  const branch = item.branch_name || "";
  const empName = opts.empName || "";
  const idStr = String(item.id);

  const accent = isThermal ? "#000" : "#C8A14B";
  const headerBg = isThermal ? "#000" : "linear-gradient(180deg, #FFD700 0%, #C8A14B 100%)";
  const headerColor = isThermal ? "#fff" : "#000";

  // ─── Блок цены: со скидкой или обычный ────────────────────────────────────
  const dc = opts.discount;
  const dcOldRaw = dc?.oldPrice !== undefined && dc?.oldPrice !== "" && dc?.oldPrice !== null
    ? Number(dc.oldPrice)
    : Number(item.sell_price) || 0;
  const dcNewRaw = dc?.newPrice !== undefined && dc?.newPrice !== "" && dc?.newPrice !== null
    ? Number(dc.newPrice)
    : 0;
  const showDiscount = !!(dc?.enabled && dcOldRaw > 0 && dcNewRaw > 0 && dcNewRaw < dcOldRaw);
  const discountPct = showDiscount ? Math.round((1 - dcNewRaw / dcOldRaw) * 100) : 0;

  const priceBlock = showDiscount
    ? `
      <div class="price-block">
        <div class="price-old" style="font-size:${oldPriceSize}mm;color:#777">
          <span class="strike">${fmtPrice(dcOldRaw)}₽</span>
          ${discountPct > 0 ? `<span class="badge" style="font-size:${small}mm">−${discountPct}%</span>` : ""}
        </div>
        <div class="price price-new" style="font-size:${newPriceSize}mm;color:#c00">${fmtPrice(dcNewRaw)}₽</div>
      </div>
    `
    : `<div class="price" style="font-size:${priceSize}mm;color:${accent}">${fmtPrice(item.sell_price)}₽</div>`;

  return `
    <div class="label" style="width:${w}mm;height:${h}mm;font-family:${tmpl.font_family || "Arial"},sans-serif">
      <div class="hdr" style="background:${headerBg};color:${headerColor};font-size:${tiny}mm;">
        <span style="font-weight:900;letter-spacing:0.4mm">СКУПКА24</span>
        ${branch ? `<span style="opacity:0.85">${escapeHtml(branch)}</span>` : ""}
        <span style="font-weight:700">#${escapeHtml(item.sku || idStr)}</span>
      </div>
      ${category ? `<div class="cat" style="font-size:${tiny}mm;color:${accent}">${escapeHtml(category)}</div>` : ""}
      <div class="title" style="font-size:${titleSize}mm">${escapeHtml(titleWithRam)}</div>
      ${showSpecs ? `<div class="specs" style="font-size:${specsSize}mm">${escapeHtml(specsCombined)}</div>` : ""}
      ${showImei ? `<div class="imei" style="font-size:${tiny}mm">IMEI: ${escapeHtml(item.imei || "")}</div>` : ""}
      ${priceBlock}
      <div class="footer" style="font-size:${small}mm">
        <span>Ответственное лицо:</span>
        <b>${escapeHtml(empName || "—")}</b>
      </div>
      <div style="font-size:${tiny}mm;text-align:center;color:${accent}">
        Гарантия: 1 год
      </div>
    </div>
  `;
}

/** Доступные размеры ценников (мм). */
export const LABEL_SIZES: { code: string; w: number; h: number; name: string; thermal: boolean }[] = [
  { code: "58x40", w: 58, h: 40, name: "58×40 термо", thermal: true },
  { code: "58x60", w: 58, h: 60, name: "58×60 термо", thermal: true },
  { code: "80x50", w: 80, h: 50, name: "80×50 термо", thermal: true },
  { code: "100x70", w: 100, h: 70, name: "100×70 термо", thermal: true },
  { code: "a4-30x50", w: 50, h: 30, name: "A4 лист 50×30", thermal: false },
  { code: "a4-70x40", w: 70, h: 40, name: "A4 лист 70×40", thermal: false },
];

const STORAGE_LAST_SIZE = "sl_label_last_size";

function makeTmpl(w: number, h: number, thermal: boolean): SLLabelTemplate {
  return {
    id: 0,
    name: `${w}×${h}`,
    width_mm: w,
    height_mm: h,
    layout: "classic",
    show_brand: true,
    show_specs: true,
    show_imei: true,
    show_qr: false,
    show_barcode: true,
    font_family: "Arial",
    is_default: true,
    is_thermal: thermal,
  };
}

/** Шаблон ценника по умолчанию (последний выбранный или 58×40). */
export const DEFAULT_LABEL_TMPL: SLLabelTemplate = makeTmpl(58, 40, true);

export function getLastLabelSize(): string {
  if (typeof window === "undefined") return "58x40";
  return window.localStorage.getItem(STORAGE_LAST_SIZE) || "58x40";
}

export function setLastLabelSize(code: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_LAST_SIZE, code); } catch { /* noop */ }
}

/** Быстрая печать одного ценника. Если передан size — печатает в нём, иначе в последнем выбранном. */
export function printLabelQuick(item: SLItem, opts: { empName?: string; size?: string; tmpl?: SLLabelTemplate; discount?: DiscountOpts } = {}): void {
  if (opts.tmpl) {
    printLabels([item], opts.tmpl, { empName: opts.empName, discount: opts.discount });
    return;
  }
  const code = opts.size || getLastLabelSize();
  const sz = LABEL_SIZES.find(s => s.code === code) || LABEL_SIZES[0];
  setLastLabelSize(sz.code);
  printLabels([item], makeTmpl(sz.w, sz.h, sz.thermal), { empName: opts.empName, discount: opts.discount });
}

export function printLabels(items: SLItem[], tmpl: SLLabelTemplate, opts: { empName?: string; discount?: DiscountOpts } = {}): void {
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
      .label .specs { text-align: center; line-height: 1.15; width: 100%; font-weight: 600; color: #000; word-wrap: break-word; }
      .label .imei  { text-align: center; line-height: 1; width: 100%; color: #444; }
      .label .price { font-weight: 900; text-align: center; line-height: 1; width: 100%; }
      .label .price-block { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.3mm; }
      .label .price-old { width: 100%; text-align: center; line-height: 1; font-weight: 700; display: flex; gap: 1.2mm; align-items: center; justify-content: center; }
      .label .price-old .strike { position: relative; display: inline-block; }
      .label .price-old .strike::after { content: ""; position: absolute; left: -0.4mm; right: -0.4mm; top: 50%; height: 0.6mm; background: #c00; transform: rotate(-8deg); border-radius: 0.3mm; }
      .label .price-old .badge { background: #c00; color: #fff; font-weight: 900; padding: 0.1mm 0.8mm; border-radius: 0.6mm; line-height: 1; letter-spacing: 0.2mm; }
      .label .price-new { font-weight: 900 !important; letter-spacing: 0.1mm; }
      .label .sku-id { width: 100%; text-align: center; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 0.4mm; line-height: 1; }
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
      Гарантия: <b>1 год</b> с даты продажи.<br>
      Действует до: <b>${new Date(Date.now() + 365 * 86400000).toLocaleDateString("ru-RU")}</b><br>
      Спасибо за покупку!<br>
      skupka24.ru
    </div>
    <script>setTimeout(() => window.print(), 350);</` + `script>
  </body></html>`);
  w.document.close();
}