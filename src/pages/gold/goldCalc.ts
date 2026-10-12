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
    return `<section class="tag">
      <div class="brand">СКУПКА24 · ЗОЛОТО</div>
      <div class="price">${fmtRub(total)} ₽</div>
      <div class="row"><b>${fmtG(w585)} г</b> в пересчёте на 585</div>
      ${conv ? `<div class="sub">Изделие: ${fmtG(it.weight)} г · проба ${it.purity}</div>` : `<div class="sub">Проба 585 · ${fmtG(it.weight)} г</div>`}
      <div class="sub">${fmtRub(it.price585)} ₽ за 1 г (585)</div>
      <div class="date">${date}</div>
    </section>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ценники</title><style>
    @page { size: 100mm 70mm; margin: 0 }
    * { box-sizing: border-box }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000 }
    .tag { width: 100mm; height: 70mm; padding: 5mm 6mm; page-break-after: always; display: flex; flex-direction: column; justify-content: center; border: 0.6mm solid #000 }
    .brand { font-size: 11pt; font-weight: 700; letter-spacing: 0.5mm; border-bottom: 0.4mm solid #000; padding-bottom: 2mm; margin-bottom: 3mm }
    .price { font-size: 44pt; font-weight: 900; line-height: 1; margin: 2mm 0 3mm }
    .row { font-size: 15pt; margin-bottom: 1.5mm }
    .sub { font-size: 11pt; margin-bottom: 1mm }
    .date { font-size: 9pt; margin-top: 2mm; text-align: right }
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
