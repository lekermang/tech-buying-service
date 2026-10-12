export const PURITY_BASE = 585;

export const toNum = (s: string | number | null | undefined) => {
  if (s === null || s === undefined || s === "") return 0;
  const n = typeof s === "number" ? s : parseFloat(String(s).replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export const to585 = (weight: number, purity: string | number | null | undefined) => {
  const p = toNum(purity) || PURITY_BASE;
  return (weight * p) / PURITY_BASE;
};

export const perGramOfPurity = (price585: number, purity: string | number | null | undefined) => {
  const p = toNum(purity) || PURITY_BASE;
  return (price585 * p) / PURITY_BASE;
};

export const fmtG = (n: number) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const fmtRub = (n: number) => Math.round(n).toLocaleString("ru-RU");

export type TagItem = { weight: number; purity: string; price585: number; label?: string };

export function printTags(items: TagItem[]) {
  const date = new Date().toLocaleDateString("ru-RU");
  const pages = items.map(it => {
    const w585 = to585(it.weight, it.purity);
    const total = w585 * it.price585;
    const conv = toNum(it.purity) !== PURITY_BASE;
    const weights = conv
      ? `<div class="w"><div class="wl">Изделие · ${it.purity} проба</div><div class="wv">${fmtG(it.weight)} г</div></div>
         <div class="arrow">→</div>
         <div class="w main"><div class="wl">В пересчёте на 585</div><div class="wv">${fmtG(w585)} г</div></div>`
      : `<div class="w main single"><div class="wl">Вес · 585 проба</div><div class="wv">${fmtG(it.weight)} г</div></div>`;
    return `<section class="tag"><div class="inner">
      <div class="top"><span class="brand">СКУПКА24 · ЗОЛОТО</span><span class="date">${date}</span></div>
      <div class="price">${fmtRub(total)}<span class="cur"> ₽</span></div>
      <div class="weights">${weights}</div>
      <div class="foot">${fmtRub(it.price585)} ₽ за 1 г в 585 пробе</div>
    </div></section>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ценники</title><style>
    @page { size: 100mm 70mm; margin: 0 }
    * { box-sizing: border-box }
    html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact }
    .tag { width: 100mm; height: 70mm; padding: 2.5mm; page-break-after: always; break-after: page }
    .tag:last-child { page-break-after: auto; break-after: auto }
    .inner { width: 100%; height: 100%; border: 0.7mm solid #000; border-radius: 2.5mm; padding: 2.5mm 4mm; display: flex; flex-direction: column; justify-content: space-between }
    .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 0.35mm solid #000; padding-bottom: 1.5mm }
    .brand { font-size: 10pt; font-weight: 800; letter-spacing: 0.4mm }
    .date { font-size: 9pt }
    .price { font-size: 46pt; font-weight: 900; line-height: 1; text-align: center; letter-spacing: -0.3mm; white-space: nowrap }
    .cur { font-size: 30pt; font-weight: 800 }
    .weights { display: flex; align-items: stretch; justify-content: center; gap: 2mm }
    .w { flex: 1; border: 0.35mm solid #000; border-radius: 1.8mm; padding: 1.2mm 2mm; text-align: center }
    .w.main { background: #000; color: #fff }
    .w.single { flex: 0 1 70%; }
    .wl { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.2mm; margin-bottom: 0.6mm }
    .wv { font-size: 17pt; font-weight: 800; line-height: 1.05 }
    .arrow { align-self: center; font-size: 14pt; font-weight: 800 }
    .foot { font-size: 9.5pt; text-align: center; padding-top: 1.2mm; border-top: 0.35mm dashed #000 }
  </style></head><body>${pages}</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow!.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 300);
}
