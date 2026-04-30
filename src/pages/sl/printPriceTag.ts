import type { SLItem, SLFormat } from "./types";

type Options = {
  format: SLFormat;
  copies?: number;
  shopName?: string;
};

/** Открывает окно с готовыми ценниками для печати. */
export function printPriceTags(items: SLItem[], opts: Options) {
  const { format, copies = 1, shopName = "Скупка24" } = opts;
  const w = window.open("", "_blank", "width=600,height=800");
  if (!w) return;

  const W = format.width_mm;
  const H = format.height_mm;
  const showSpecs = format.show_specs;
  const showLogo = format.show_logo;
  const isThermal = format.is_thermal;
  const fontFamily = format.font_family || "Arial";

  const tagHtml = (it: SLItem) => {
    const title = (it.title || "").replace(/</g, "&lt;");
    const specsRaw = (it.specs || "").replace(/</g, "&lt;");
    const price = Number(it.sell_price || 0).toLocaleString("ru-RU");
    const condition = it.condition ? `Состояние: ${it.condition}` : "";
    const extra = [it.color, it.storage].filter(Boolean).join(" / ");
    return `
      <div class="tag">
        ${showLogo ? `<div class="logo">${shopName}</div>` : ""}
        <div class="title">${title}</div>
        ${showSpecs && specsRaw ? `<div class="specs">${specsRaw}</div>` : ""}
        ${extra ? `<div class="extra">${extra}</div>` : ""}
        <div class="price">${price} ₽</div>
        <div class="footer">${condition}${condition && it.id ? " · " : ""}${it.id ? "№" + it.id : ""}</div>
      </div>`;
  };

  const allTags: string[] = [];
  for (const it of items) {
    for (let i = 0; i < copies; i++) allTags.push(tagHtml(it));
  }

  const pageCss = isThermal
    ? `@page { size: ${W}mm ${H}mm; margin: 0; }`
    : `@page { size: A4; margin: 5mm; }`;

  const tagSizeCss = `width:${W}mm; height:${H}mm;`;

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ценники</title>
<style>
  ${pageCss}
  * { box-sizing: border-box; }
  body { margin:0; padding:${isThermal ? "0" : "5mm"}; font-family: ${fontFamily}, Arial, sans-serif; background: #fff; color: #000; }
  .sheet { display:flex; flex-wrap:wrap; gap:${isThermal ? "0" : "2mm"}; }
  .tag {
    ${tagSizeCss}
    border: ${isThermal ? "0" : "1px dashed #999"};
    padding: 1.5mm 2mm;
    display:flex; flex-direction:column; align-items:stretch; justify-content:space-between;
    page-break-inside: avoid;
    overflow: hidden;
    background: #fff;
  }
  .logo {
    font-size: 7pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; text-align:center; color:#333; line-height:1;
  }
  .title {
    font-size: ${H >= 35 ? "10pt" : "8pt"}; font-weight: 700;
    line-height: 1.1; text-align:center; word-wrap: break-word;
    max-height: ${H >= 35 ? "8mm" : "6mm"}; overflow: hidden;
  }
  .specs {
    font-size: ${H >= 40 ? "7pt" : "6pt"}; line-height: 1.15;
    text-align:center; color: #333;
    max-height: ${H >= 40 ? "10mm" : "7mm"}; overflow: hidden;
  }
  .extra {
    font-size: 6.5pt; text-align:center; color:#555; line-height:1.1;
  }
  .price {
    font-size: ${H >= 40 ? "16pt" : "13pt"};
    font-weight: 900; text-align:center; line-height:1;
    border-top: 1px solid #000; padding-top:0.5mm;
  }
  .footer {
    font-size: 5.5pt; color:#666; text-align:center; line-height:1;
  }
  @media print { body { padding:0; } .tag { border: 0; } }
</style></head><body>
<div class="sheet">${allTags.join("")}</div>
<script>window.onload = () => { setTimeout(() => window.print(), 200); };</script>
</body></html>`);
  w.document.close();
}
