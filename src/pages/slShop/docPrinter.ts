import type { SLDocContext, SLDocTemplate } from "./types";

function fmtPrice(n: unknown): string {
  return (Number(n) || 0).toLocaleString("ru-RU");
}
function escape(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));
}
function fmtDate(d?: unknown): string {
  if (!d) return new Date().toLocaleDateString("ru-RU");
  try { return new Date(String(d)).toLocaleDateString("ru-RU"); } catch { return String(d); }
}
function priceWords(n: number): string {
  // упрощённое — рубли прописью невозможно без библиотеки, ограничимся «суммой цифрами + копейки»
  const r = Math.floor(n);
  const k = Math.round((n - r) * 100);
  return `${fmtPrice(r)} руб. ${String(k).padStart(2, "0")} коп.`;
}

const A4_HEAD = `
<style>
@page { size: A4; margin: 12mm; }
body { font-family: 'Times New Roman', serif; color: #000; font-size: 12pt; line-height: 1.4; padding: 0; margin: 0; }
.toolbar { position: sticky; top: 0; background: #111; color: #fff; padding: 10px; display: flex; gap: 8px; z-index: 100; }
.toolbar button { background: #FFD700; color: #000; border: 0; padding: 6px 14px; font-weight: bold; cursor: pointer; border-radius: 4px; }
.toolbar button.gray { background: #444; color: #fff; }
@media print { .toolbar { display: none } body { padding: 0 } }
.page { padding: 18mm 16mm; max-width: 210mm; margin: 0 auto; background: #fff; }
@media screen { .page { box-shadow: 0 0 12px rgba(0,0,0,0.15); margin: 16px auto; } body { background: #f0f0f0; } }
h1 { text-align: center; font-size: 14pt; margin: 0 0 4mm; }
h2 { text-align: center; font-size: 12pt; margin: 0 0 6mm; font-weight: normal; }
.subtitle { text-align: center; font-size: 11pt; margin-bottom: 6mm; color: #444; }
.row { display: flex; justify-content: space-between; gap: 8mm; }
.box { border: 1px solid #000; padding: 3mm 4mm; margin: 2mm 0; }
.section { margin: 4mm 0; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
table.bordered td, table.bordered th { border: 1px solid #000; padding: 2mm 3mm; font-size: 11pt; }
table.bordered th { background: #f3f3f3; font-weight: bold; }
.label { display: inline-block; min-width: 38%; font-weight: bold; }
.signs { display: flex; justify-content: space-between; margin-top: 18mm; gap: 8mm; }
.signs > div { width: 48%; }
.signline { border-bottom: 1px solid #000; height: 18mm; margin-bottom: 2mm; }
.small { font-size: 9pt; color: #555; }
.center { text-align: center; }
.right { text-align: right; }
.italic { font-style: italic; }
.uppercase { text-transform: uppercase; }
.mt2 { margin-top: 2mm; }
.mt4 { margin-top: 4mm; }
.mt8 { margin-top: 8mm; }
</style>`;

function toolbarHtml(label: string): string {
  return `
  <div class="toolbar">
    <span style="flex:1;font-family:Arial">${escape(label)}</span>
    <button onclick="window.print()">🖨 Печать</button>
    <button class="gray" onclick="window.close()">Закрыть</button>
  </div>`;
}

function reqLine(ctx: SLDocContext): string {
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const parts = [
    r.legal_name ? escape(r.legal_name) : "",
    r.inn ? `ИНН ${escape(r.inn)}` : "",
    r.ogrn ? `ОГРН ${escape(r.ogrn)}` : "",
    r.legal_address ? escape(r.legal_address) : "",
    r.phone ? `тел. ${escape(r.phone)}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

// ==================== Шаблоны ====================
function tplContractPurchase(ctx: SLDocContext, copyOf?: number): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(it.buy_at);
  const price = Number(it.buy_price) || 0;
  const num = it.id ? `№${it.id}` : "";
  return `${toolbarHtml(`Договор купли-продажи ${num}${copyOf ? ` (экз. ${copyOf})` : ""}`)}
  <div class="page">
    <h1>ДОГОВОР КУПЛИ-ПРОДАЖИ ${num}</h1>
    <div class="row">
      <div>${escape(r.actual_address || "г. Калуга")}</div>
      <div>${date}</div>
    </div>
    <div class="section">
      <p><b>Покупатель:</b> ${escape(r.legal_name || "—")}, ${escape(r.actual_address || "")}, тел. ${escape(r.phone || "—")}, в лице ${escape(r.director_position || "ИП")} ${escape(r.director_name || "")}, действующего на основании Свидетельства, далее — «Покупатель», с одной стороны, и</p>
      <p><b>Продавец:</b> ${escape(cl.full_name || "—")}, паспорт ${escape(cl.passport_series || "—")} ${escape(cl.passport_number || "")}, выдан ${escape(cl.passport_issued_by || "—")} ${cl.passport_issued_date ? fmtDate(cl.passport_issued_date) : ""}, зарегистрирован: ${escape(cl.address || "—")}, тел. ${escape(cl.phone || "—")}, далее — «Продавец», с другой стороны, заключили настоящий договор о нижеследующем:</p>
    </div>
    <div class="section">
      <p><b>1. Предмет договора.</b> Продавец передаёт в собственность Покупателя, а Покупатель принимает и оплачивает следующее имущество (далее — «Товар»):</p>
      <table class="bordered">
        <tr><th style="width:40%">Наименование</th><td>${escape(it.title)}</td></tr>
        ${it.specs_short ? `<tr><th>Характеристики</th><td>${escape(it.specs_short)}</td></tr>` : ""}
        ${it.imei ? `<tr><th>IMEI / серийный номер</th><td>${escape(it.imei)}</td></tr>` : ""}
        ${it.condition ? `<tr><th>Состояние</th><td>${escape(it.condition)}</td></tr>` : ""}
        <tr><th>Стоимость</th><td><b>${fmtPrice(price)} руб.</b> (${priceWords(price)})</td></tr>
      </table>
    </div>
    <div class="section">
      <p><b>2.</b> Продавец гарантирует, что Товар принадлежит ему на праве собственности, не находится под арестом, в залоге, не является предметом спора и не имеет иных обременений.</p>
      <p><b>3.</b> Покупатель осмотрел Товар и претензий к его качеству и комплектации не имеет.</p>
      <p><b>4.</b> Расчёт между сторонами произведён в полном объёме в момент подписания настоящего договора. Товар передан Покупателю одновременно с подписанием договора.</p>
      <p><b>5. Гарантия.</b> На Товар установлен гарантийный срок <b>1 (один) год</b> с даты продажи Покупателем конечному потребителю. Гарантия не распространяется на повреждения, возникшие в результате нарушения правил эксплуатации, попадания жидкости и механических повреждений.</p>
      <p><b>6.</b> Настоящий договор составлен в двух экземплярах, имеющих равную юридическую силу — по одному для каждой стороны.</p>
    </div>
    <div class="signs">
      <div>
        <p><b>Покупатель</b></p>
        <p class="small">${escape(r.short_name || r.legal_name || "")}</p>
        <div class="signline"></div>
        <p class="small">подпись / М.П.</p>
      </div>
      <div>
        <p><b>Продавец</b></p>
        <p class="small">${escape(cl.full_name || "")}</p>
        <div class="signline"></div>
        <p class="small">подпись</p>
      </div>
    </div>
    <p class="small mt8">Денежные средства в сумме ${fmtPrice(price)} руб. получил полностью. Претензий не имею. _________________ (${escape(cl.full_name || "")})</p>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplPersonalConsent(ctx: SLDocContext): string {
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(null);
  return `${toolbarHtml("Согласие на обработку персональных данных")}
  <div class="page">
    <h1>СОГЛАСИЕ<br>на обработку персональных данных</h1>
    <p class="right">${escape(r.actual_address || "г. Калуга")}, ${date}</p>
    <p>Я, <b>${escape(cl.full_name || "_________________")}</b>, паспорт ${escape(cl.passport_series || "—")} ${escape(cl.passport_number || "")}, выдан ${escape(cl.passport_issued_by || "—")} ${cl.passport_issued_date ? fmtDate(cl.passport_issued_date) : ""}, зарегистрирован: ${escape(cl.address || "—")}, в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» даю согласие ${escape(r.legal_name || "—")} (далее — «Оператор») на обработку моих персональных данных, включая сбор, систематизацию, накопление, хранение, уточнение, использование, передачу, обезличивание, блокирование и уничтожение.</p>
    <p>Перечень персональных данных: фамилия, имя, отчество; пол; дата и место рождения; данные документа, удостоверяющего личность; адрес регистрации и фактического проживания; контактные телефоны; иные сведения, необходимые для исполнения договорных обязательств.</p>
    <p>Цели обработки: оформление и исполнение договоров купли-продажи, договоров комиссии, ведение учёта операций, исполнение требований законодательства РФ.</p>
    <p>Срок действия согласия: бессрочно. Согласие может быть отозвано путём направления Оператору письменного заявления.</p>
    <div class="signs">
      <div>
        <p>«___» __________ ${new Date().getFullYear()} г.</p>
      </div>
      <div>
        <p>${escape(cl.full_name || "_________________")}</p>
        <div class="signline"></div>
        <p class="small">подпись</p>
      </div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplSalesReceipt(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const op = (ctx.operation || {}) as Record<string, unknown>;
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const br = (ctx.branch || {}) as Record<string, unknown>;
  const date = op.created_at ? new Date(String(op.created_at)).toLocaleString("ru-RU") : new Date().toLocaleString("ru-RU");
  const amount = Number(op.amount || it.sell_price) || 0;
  const warranty = Number(r.warranty_days) || 365;
  return `<style>
@page { size: 80mm auto; margin: 4mm; }
body { font-family: 'Courier New', monospace; padding: 8mm 4mm; max-width: 72mm; margin: 0 auto; color: #000; font-size: 11px; }
h1 { text-align: center; font-size: 16px; margin: 0 0 2mm; letter-spacing: 1px; }
.sub { text-align: center; font-size: 10px; margin-bottom: 3mm; }
hr { border: 0; border-top: 1px dashed #000; margin: 3mm 0; }
.row { display: flex; justify-content: space-between; gap: 4px; padding: 1px 0; }
.total { font-size: 16px; font-weight: 900; text-align: center; margin: 3mm 0; padding: 2mm; border: 2px solid #000; }
.id { text-align: center; font-size: 12px; font-weight: bold; letter-spacing: 2px; }
.footer { text-align: center; font-size: 9px; margin-top: 3mm; }
@media screen { body { background: #fff; box-shadow: 0 0 8px rgba(0,0,0,0.1); margin: 16px auto; } }
@media print { .toolbar { display: none } }
.toolbar { position: fixed; top: 0; left: 0; right: 0; background: #111; color: #fff; padding: 8px; text-align: center; font-family: Arial; }
.toolbar button { background: #FFD700; color: #000; border: 0; padding: 4px 12px; font-weight: bold; cursor: pointer; }
</style>
<div class="toolbar">
  <button onclick="window.print()">🖨 Печать</button>
  <button onclick="window.close()" style="background:#444;color:#fff">Закрыть</button>
</div>
<div style="height:30px"></div>
<h1>${escape(r.short_name || "СКУПКА24")}</h1>
<div class="sub">${escape(br.name || "")}<br>${escape(br.address || "")}<br>${escape(r.phone || "")}</div>
<hr>
<div class="row"><span>ТОВАРНЫЙ ЧЕК №</span><b>${it.id || op.id || ""}</b></div>
<div class="row"><span>Дата</span><b>${escape(date)}</b></div>
${op.contract_number ? `<div class="row"><span>Договор</span><b>${escape(op.contract_number)}</b></div>` : ""}
<hr>
<div style="font-weight:bold;margin-bottom:1mm">${escape(it.title || "")}</div>
${it.specs_short ? `<div style="font-size:10px">${escape(it.specs_short)}</div>` : ""}
${it.imei ? `<div style="font-size:10px">IMEI: ${escape(it.imei)}</div>` : ""}
<hr>
<div class="total">${fmtPrice(amount)} ₽</div>
<div class="row"><span>Оплата</span><b>${escape({cash:"Наличные",card:"Карта",transfer:"Перевод"}[String(op.payment_method || "cash")] || "—")}</b></div>
${cl.full_name ? `<div class="row"><span>Покупатель</span><b>${escape(cl.full_name)}</b></div>` : ""}
<hr>
<div class="row"><span>Продавец</span><b>${escape(op.employee_name || "—")}</b></div>
<div class="id">#${it.id || op.id}</div>
<div class="footer">
  Гарантия: <b>${warranty >= 365 ? Math.round(warranty / 365) + ' год' : warranty + ' дней'}</b> с даты продажи.<br>
  Действует до: <b>${new Date(Date.now() + warranty * 86400000).toLocaleDateString("ru-RU")}</b><br>
  Спасибо за покупку!<br>
  ${escape(r.email || "skupka24.ru")}
</div>
<script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplPKO(ctx: SLDocContext, sign: "in" | "out"): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const op = (ctx.operation || {}) as Record<string, unknown>;
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(op.created_at);
  const amount = Number(op.amount || (sign === "in" ? it.sell_price : it.buy_price)) || 0;
  const title = sign === "in" ? "ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР" : "РАСХОДНЫЙ КАССОВЫЙ ОРДЕР";
  const verb = sign === "in" ? "Принято от" : "Выдано";
  const num = op.id ? `№${op.id}` : "";
  return `${toolbarHtml(`${title} ${num}`)}
  <style>${A4_HEAD.replace(/<\/?style>/g, "")}</style>
  <div class="page" style="max-width:148mm;padding:10mm 8mm">
    <div class="row" style="margin-bottom:4mm">
      <div class="small">${escape(r.legal_name || "")}<br>${escape(r.inn ? "ИНН " + r.inn : "")}</div>
      <div class="small">Унифицированная форма ${sign === "in" ? "КО-1" : "КО-2"}</div>
    </div>
    <h1>${title} ${num}</h1>
    <div class="row"><div>от ${date}</div></div>
    <table class="bordered mt4">
      <tr>
        <th style="width:60%">${verb}</th>
        <td>${escape(cl.full_name || "—")}${cl.phone ? `, тел. ${escape(cl.phone)}` : ""}</td>
      </tr>
      <tr><th>Основание</th><td>${escape(it.title || "—")}${it.imei ? `, IMEI ${escape(it.imei)}` : ""}</td></tr>
      <tr><th>Сумма</th><td><b>${fmtPrice(amount)} руб.</b> (${priceWords(amount)})</td></tr>
      <tr><th>Приложение</th><td>${escape(op.contract_number || "договор купли-продажи")}</td></tr>
    </table>
    <div class="signs">
      <div>
        <p>${sign === "in" ? "Принял" : "Выдал"}: ${escape(r.director_position || "")} ${escape(r.director_name || "")}</p>
        <div class="signline"></div>
      </div>
      <div>
        <p>${sign === "in" ? "Внёс" : "Получил"}: ${escape(cl.full_name || "")}</p>
        <div class="signline"></div>
      </div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplControlLabel(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  return `<style>
@page { size: 58mm 40mm; margin: 0; }
body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.label { width: 58mm; height: 40mm; padding: 2mm; box-sizing: border-box; border: 0.4mm solid #000; display: flex; flex-direction: column; justify-content: space-between; }
.h { background: #000; color: #fff; padding: 0.5mm 1.5mm; font-weight: 900; font-size: 8pt; display: flex; justify-content: space-between; }
.t { font-weight: bold; font-size: 9pt; text-align: center; line-height: 1.1; }
.p { font-size: 14pt; font-weight: 900; text-align: center; }
.id { font-size: 7pt; text-align: center; font-family: 'Courier New', monospace; }
.toolbar { position: fixed; top: 0; left: 0; right: 0; background: #111; color: #fff; padding: 8px; text-align: center; }
.toolbar button { background: #FFD700; color: #000; border: 0; padding: 4px 12px; font-weight: bold; cursor: pointer; }
@media print { .toolbar { display: none } body { background: #fff } }
@media screen { body { background: #f3f3f3; padding-top: 50px } .label { background: #fff; margin: 16px auto; box-shadow: 0 0 8px rgba(0,0,0,0.15); } }
</style>
<div class="toolbar"><button onclick="window.print()">🖨 Печать</button> <button onclick="window.close()" style="background:#444;color:#fff">Закрыть</button></div>
<div class="label">
  <div class="h"><span>${escape(r.short_name || "СКУПКА24")}</span><span>#${it.id || ""}</span></div>
  <div class="t">${escape(it.title || "")}</div>
  ${it.specs_short ? `<div style="font-size:7pt;text-align:center">${escape(it.specs_short)}</div>` : ""}
  ${it.imei ? `<div style="font-size:7pt;text-align:center">IMEI: ${escape(it.imei)}</div>` : ""}
  <div class="p">${fmtPrice(it.sell_price)}₽</div>
  <div class="id">${escape(it.sku || "")}</div>
</div>
<script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplContractConsignment(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(it.buy_at);
  const minPrice = Number(it.min_price || it.sell_price) || 0;
  const sellPrice = Number(it.sell_price) || 0;
  const percent = Number(it.consignment_percent) || 0;
  return `${toolbarHtml(`Договор комиссии №${it.id || ""}`)}
  <div class="page">
    <h1>ДОГОВОР КОМИССИИ № ${it.id || ""}</h1>
    <h2>(на реализацию товара)</h2>
    <div class="row">
      <div>${escape(r.actual_address || "г. Калуга")}</div>
      <div>${date}</div>
    </div>
    <p><b>Комиссионер:</b> ${escape(r.legal_name || "")}, в лице ${escape(r.director_position || "")} ${escape(r.director_name || "")}, далее — «Комиссионер», с одной стороны, и</p>
    <p><b>Комитент:</b> ${escape(cl.full_name || "")}, паспорт ${escape(cl.passport_series || "")} ${escape(cl.passport_number || "")}, тел. ${escape(cl.phone || "")}, далее — «Комитент», с другой стороны, заключили настоящий договор о нижеследующем:</p>
    <p><b>1.</b> Комитент передаёт, а Комиссионер принимает на реализацию следующее имущество:</p>
    <table class="bordered">
      <tr><th>Наименование</th><td>${escape(it.title)}</td></tr>
      ${it.specs_short ? `<tr><th>Характеристики</th><td>${escape(it.specs_short)}</td></tr>` : ""}
      ${it.imei ? `<tr><th>IMEI / S/N</th><td>${escape(it.imei)}</td></tr>` : ""}
      ${it.condition ? `<tr><th>Состояние</th><td>${escape(it.condition)}</td></tr>` : ""}
      <tr><th>Цена реализации</th><td><b>${fmtPrice(sellPrice)} руб.</b></td></tr>
      <tr><th>Минимальная цена</th><td>${fmtPrice(minPrice)} руб.</td></tr>
      <tr><th>Комиссионное вознаграждение</th><td>${percent}%</td></tr>
    </table>
    <p><b>2.</b> Комиссионер обязуется реализовать имущество за вознаграждение в размере ${percent}% от фактической цены продажи.</p>
    <p><b>3.</b> Денежные средства за реализованное имущество, за вычетом комиссионного вознаграждения, выплачиваются Комитенту после продажи и обращения за расчётом.</p>
    <p><b>4.</b> При отсутствии продажи в течение 60 (шестидесяти) дней Комитент вправе забрать имущество в любой момент.</p>
    <p><b>5.</b> Договор составлен в двух экземплярах, имеющих равную юридическую силу.</p>
    <div class="signs">
      <div>
        <p><b>Комиссионер</b></p>
        <p class="small">${escape(r.short_name || "")}</p>
        <div class="signline"></div>
        <p class="small">М.П.</p>
      </div>
      <div>
        <p><b>Комитент</b></p>
        <p class="small">${escape(cl.full_name || "")}</p>
        <div class="signline"></div>
        <p class="small">подпись</p>
      </div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplWaybill(ctx: SLDocContext, dir: "in" | "out"): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(null);
  const title = dir === "out" ? "НАКЛАДНАЯ (исходящее перемещение)" : "НАКЛАДНАЯ (входящее перемещение)";
  return `${toolbarHtml(title)}
  <div class="page">
    <h1>${title}</h1>
    <p class="right">${date}</p>
    <p>${escape(r.legal_name || "")}, ${escape(r.actual_address || "")}</p>
    <table class="bordered">
      <tr><th>№</th><th>Наименование</th><th>SKU/IMEI</th><th>Кол-во</th><th>Цена</th></tr>
      <tr>
        <td>1</td><td>${escape(it.title || "")}</td>
        <td>${escape(it.sku || it.imei || "")}</td>
        <td>1 шт.</td><td>${fmtPrice(it.sell_price)} ₽</td>
      </tr>
    </table>
    <div class="signs">
      <div><p>Сдал:</p><div class="signline"></div></div>
      <div><p>Принял:</p><div class="signline"></div></div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplWriteoff(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(null);
  return `${toolbarHtml("Акт списания")}
  <div class="page">
    <h1>АКТ СПИСАНИЯ / ИЗЪЯТИЯ ТОВАРА</h1>
    <p class="right">${escape(r.actual_address || "г. Калуга")}, ${date}</p>
    <p>Комиссия в составе сотрудников ${escape(r.legal_name || "")} составила настоящий акт о том, что нижеуказанное имущество подлежит списанию по причине: _________________________________________</p>
    <table class="bordered">
      <tr><th>Наименование</th><td>${escape(it.title || "")}</td></tr>
      ${it.imei ? `<tr><th>IMEI / S/N</th><td>${escape(it.imei)}</td></tr>` : ""}
      <tr><th>Балансовая стоимость</th><td>${fmtPrice(it.buy_price)} руб.</td></tr>
    </table>
    <div class="signs">
      <div><p>Председатель комиссии:</p><div class="signline"></div></div>
      <div><p>Член комиссии:</p><div class="signline"></div></div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplInvoice(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(null);
  const amount = Number(it.sell_price) || 0;
  return `${toolbarHtml("Счёт на оплату")}
  <div class="page">
    <h1>СЧЁТ НА ОПЛАТУ № ${it.id || ""}</h1>
    <p class="right">от ${date}</p>
    <table class="bordered">
      <tr><th>Поставщик</th><td>${escape(r.legal_name || "")}, ${escape(r.legal_address || "")}, ИНН ${escape(r.inn || "—")}</td></tr>
      <tr><th>Банк</th><td>${escape(r.bank_name || "—")}</td></tr>
      <tr><th>БИК</th><td>${escape(r.bank_bic || "—")}</td></tr>
      <tr><th>Р/с</th><td>${escape(r.bank_account || "—")}</td></tr>
      <tr><th>К/с</th><td>${escape(r.corr_account || "—")}</td></tr>
    </table>
    <table class="bordered mt4">
      <tr><th>№</th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr>
      <tr><td>1</td><td>${escape(it.title || "")}</td><td>1</td><td>${fmtPrice(amount)}</td><td>${fmtPrice(amount)}</td></tr>
    </table>
    <p class="right mt4"><b>Итого: ${fmtPrice(amount)} руб.</b></p>
    <p class="mt4">К оплате: <b>${priceWords(amount)}</b>. НДС не облагается.</p>
    <div class="signs">
      <div><p>${escape(r.director_position || "ИП")} ${escape(r.director_name || "")}</p><div class="signline"></div></div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

function tplActConsignmentReturn(ctx: SLDocContext): string {
  const it = (ctx.item || {}) as Record<string, unknown>;
  const cl = (ctx.client || {}) as Record<string, unknown>;
  const r = (ctx.requisites || {}) as Record<string, unknown>;
  const date = fmtDate(null);
  return `${toolbarHtml("Акт возврата товара по договору комиссии")}
  <div class="page">
    <h1>АКТ ВОЗВРАТА ТОВАРА<br>по договору комиссии</h1>
    <p class="right">${escape(r.actual_address || "г. Калуга")}, ${date}</p>
    <p><b>Комиссионер:</b> ${escape(r.legal_name || "")}</p>
    <p><b>Комитент:</b> ${escape(cl.full_name || "")}</p>
    <p>Стороны составили настоящий акт о том, что Комиссионер возвращает, а Комитент принимает следующее имущество:</p>
    <table class="bordered">
      <tr><th>Наименование</th><td>${escape(it.title || "")}</td></tr>
      ${it.imei ? `<tr><th>IMEI / S/N</th><td>${escape(it.imei)}</td></tr>` : ""}
      <tr><th>Состояние</th><td>${escape(it.condition || "Исправно")}</td></tr>
    </table>
    <p>Имущество возвращено в полной комплектации. Стороны претензий друг к другу не имеют.</p>
    <div class="signs">
      <div><p>Комиссионер</p><div class="signline"></div></div>
      <div><p>Комитент: ${escape(cl.full_name || "")}</p><div class="signline"></div></div>
    </div>
  </div>
  <script>setTimeout(()=>window.print(),350);</` + `script>`;
}

// ==================== Маршрутизация ====================
const RENDERERS: Record<string, (ctx: SLDocContext) => string> = {
  contract_purchase: (c) => tplContractPurchase(c),
  contract_purchase_jewelry: (c) => tplContractPurchase(c),
  purchase_receipt: (c) => tplContractPurchase(c),
  rko_buyout: (c) => tplPKO(c, "out"),
  rko_return: (c) => tplPKO(c, "out"),
  rko_consignment_settlement: (c) => tplPKO(c, "out"),
  pko_sale: (c) => tplPKO(c, "in"),
  pko_consignment_sale: (c) => tplPKO(c, "in"),
  control_label: tplControlLabel,
  personal_consent: tplPersonalConsent,
  sales_receipt: tplSalesReceipt,
  contract_consignment: tplContractConsignment,
  act_consignment_return: tplActConsignmentReturn,
  invoice: tplInvoice,
  waybill_in: (c) => tplWaybill(c, "in"),
  waybill_out: (c) => tplWaybill(c, "out"),
  writeoff_act: tplWriteoff,
};

export function printDoc(template: SLDocTemplate, ctx: SLDocContext): void {
  const renderer = RENDERERS[template.code];
  if (!renderer) {
    alert(`Шаблон «${template.name}» пока не реализован`);
    return;
  }
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${template.name}</title>${A4_HEAD}</head><body>${renderer(ctx)}</body></html>`);
  w.document.close();
}