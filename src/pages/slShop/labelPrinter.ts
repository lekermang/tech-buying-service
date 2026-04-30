import type { SLItem, SLLabelTemplate } from "./types";

function fmtPrice(n: number | string | undefined | null): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

function escapeHtml(s: string | undefined | null): string {
  return String(s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}

function labelHtml(item: SLItem, tmpl: SLLabelTemplate): string {
  const w = Number(tmpl.width_mm);
  const h = Number(tmpl.height_mm);
  const titleSize = (w / 14).toFixed(2);
  const specsSize = (w / 22).toFixed(2);
  const priceSize = (w / 7).toFixed(2);
  const small = (w / 28).toFixed(2);

  const showSpecs = tmpl.show_specs && (item.specs_short || item.specs);
  const specsText = item.specs_short || (item.specs || "").slice(0, 80);
  const showImei = tmpl.show_imei && item.imei;

  return `
    <div class="label" style="width:${w}mm;height:${h}mm;font-family:${tmpl.font_family || "Arial"},sans-serif">
      <div class="title" style="font-size:${titleSize}mm">${escapeHtml(item.title)}</div>
      ${showSpecs ? `<div class="specs" style="font-size:${specsSize}mm">${escapeHtml(specsText)}</div>` : ""}
      ${showImei ? `<div class="imei" style="font-size:${small}mm">IMEI: ${escapeHtml(item.imei || "")}</div>` : ""}
      <div class="price" style="font-size:${priceSize}mm">${fmtPrice(item.sell_price)}₽</div>
    </div>
  `;
}

export function printLabels(items: SLItem[], tmpl: SLLabelTemplate): void {
  if (!items.length) return;
  const w = window.open("", "_blank", "width=600,height=800");
  if (!w) return;
  const W = Number(tmpl.width_mm);
  const H = Number(tmpl.height_mm);

  const labels = items.map(it => labelHtml(it, tmpl)).join("");

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
      body { background: #fff; color: #000; }
      .sheet { padding: 0; }
      ${layoutCss}
      .label {
        border: 0.4mm solid #000;
        display: flex; flex-direction: column; align-items: center; justify-content: space-between;
        padding: 1.5mm; overflow: hidden;
      }
      .label .title { font-weight: 800; text-align: center; line-height: 1.05; width: 100%; }
      .label .specs { text-align: center; line-height: 1.1; width: 100%; }
      .label .imei  { text-align: center; line-height: 1; width: 100%; color: #444; }
      .label .price { font-weight: 900; text-align: center; line-height: 1; width: 100%; }
      @media screen {
        body { padding: 12px; background: #f3f3f3; }
        .label { background: #fff; margin: 4mm; }
      }
      @media print {
        body { padding: 0; background: #fff; }
        .toolbar { display: none !important; }
      }
      .toolbar { position: sticky; top: 0; padding: 8px; background: #111; color: #fff; display: flex; gap: 8px; align-items: center; font-family: Arial; }
      .toolbar button { background: #FFD700; color: #000; border: 0; padding: 6px 14px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    </style>
  </head><body>
    <div class="toolbar">
      <span>Ценников: ${items.length} • Размер: ${W}×${H}мм • ${tmpl.is_thermal ? "Термопринтер" : "A4 лист"}</span>
      <button onclick="window.print()">🖨 Печать</button>
      <button onclick="window.close()">Закрыть</button>
    </div>
    <div class="sheet">${labels}</div>
    <script>setTimeout(() => window.print(), 350);</` + `script>
  </body></html>`);
  w.document.close();
}
