import type { C14dDetail } from "./types";
import { fmt, fmtDate } from "./types";

export function printContract14d(c: C14dDetail) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return;
  const today = new Date().toLocaleDateString("ru-RU");
  const passport = c.passport_series
    ? `${c.passport_series} ${c.passport_number || ""}, выдан ${c.passport_issued_by || "—"} ${fmtDate(c.passport_issue_date)}`
    : "";
  const acc = (c.accessories || []).filter(Boolean).join(", ");
  const photoBlock = (c.photos || [])
    .map((p) => `<img src="${p.file_url}" alt="${p.photo_type}" />`)
    .join("");

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Договор ${c.contract_number}</title><style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;margin:30px;font-size:13px;line-height:1.55;color:#000}
    h1{text-align:center;font-size:18px;margin:0 0 4px}
    .sub{text-align:center;color:#444;font-size:12px;margin-bottom:18px}
    h3{font-size:14px;margin:16px 0 6px;border-bottom:1px solid #999;padding-bottom:3px}
    table{width:100%;border-collapse:collapse;margin:6px 0}
    td{padding:5px 8px;border:1px solid #bbb;font-size:12px;vertical-align:top}
    td:first-child{font-weight:bold;width:38%;background:#f5f5f5}
    .row{display:flex;gap:12px;flex-wrap:wrap}
    .col{flex:1;min-width:300px}
    .photos{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
    .photos img{max-width:200px;max-height:160px;border:1px solid #ccc;object-fit:contain}
    .sign{display:flex;justify-content:space-between;margin-top:50px;gap:30px}
    .sign .b{flex:1}
    .line{border-bottom:1px solid #000;margin:36px 0 4px}
    .small{font-size:11px;color:#555}
    .warn{background:#fff8dc;border:1px solid #d4a017;padding:8px 10px;margin:10px 0;font-size:12px}
    @media print{body{margin:14mm}.no-print{display:none}}
    .actions{position:fixed;top:8px;right:8px;display:flex;gap:6px}
    .actions button{padding:6px 12px;background:#FFD700;border:1px solid #d4a017;font-weight:bold;cursor:pointer;border-radius:4px}
  </style></head><body>
  <div class="actions no-print">
    <button onclick="window.print()">🖨 Печать</button>
    <button onclick="window.close()">✕ Закрыть</button>
  </div>

  <h1>ДОГОВОР ПРОДАЖИ № ${c.contract_number}</h1>
  <div class="sub">с правом обратного выкупа в течение 14 дней · г. Калуга, ${today}</div>

  <h3>Стороны договора</h3>
  <div class="row">
    <div class="col">
      <table>
        <tr><td>Продавец (Ломбард)</td><td>ИП Скупка24<br/>г. Калуга, ул. Кирова, 11<br/>тел. +7 (4842) 27-77-04</td></tr>
      </table>
    </div>
    <div class="col">
      <table>
        <tr><td>ФИО клиента</td><td>${c.client_name || "—"}</td></tr>
        <tr><td>Дата рождения</td><td>${fmtDate(c.client_birth_date) || "—"}</td></tr>
        <tr><td>Паспорт</td><td>${passport || "—"}</td></tr>
        <tr><td>Телефон</td><td>${c.client_phone || "—"}</td></tr>
        ${c.client_email ? `<tr><td>E-mail</td><td>${c.client_email}</td></tr>` : ""}
      </table>
    </div>
  </div>

  <h3>Предмет договора</h3>
  <table>
    <tr><td>Тип устройства</td><td>${c.item_type || "—"}</td></tr>
    <tr><td>Марка / модель</td><td>${[c.item_brand, c.item_model].filter(Boolean).join(" ") || "—"}</td></tr>
    ${c.serial_number ? `<tr><td>Серийный номер</td><td>${c.serial_number}</td></tr>` : ""}
    ${c.condition ? `<tr><td>Состояние</td><td>${c.condition}</td></tr>` : ""}
    ${acc ? `<tr><td>Комплектация</td><td>${acc}</td></tr>` : ""}
    ${c.item_notes ? `<tr><td>Особые отметки</td><td>${c.item_notes}</td></tr>` : ""}
  </table>

  <h3>Финансовые условия</h3>
  <table>
    <tr><td>Сумма выдачи</td><td><b>${fmt(c.amount)} ₽</b></td></tr>
    <tr><td>Ставка</td><td>${fmt(c.interest_rate)}% в день</td></tr>
    <tr><td>Срок</td><td>${c.term_days} дней (с ${fmtDate(c.start_date)} по ${fmtDate(c.end_date)})</td></tr>
    <tr><td>Сумма к возврату</td><td><b>${fmt(c.total_due)} ₽</b></td></tr>
    <tr><td>Уже оплачено</td><td>${fmt(c.paid_total)} ₽</td></tr>
    <tr><td>Остаток долга</td><td><b style="color:#b00">${fmt(c.remaining_debt)} ₽</b></td></tr>
  </table>

  <div class="warn">
    <b>Важно.</b> Покупатель (Ломбард) обязуется не отчуждать и не реализовывать имущество третьим лицам в течение 14 (четырнадцати) календарных дней с момента подписания настоящего договора.
    Продавец вправе выкупить имущество обратно в указанный срок, выплатив сумму к возврату.
  </div>

  ${c.payments && c.payments.length > 0 ? `
  <h3>История платежей</h3>
  <table>
    <thead><tr><td>Дата</td><td>Сумма</td><td>Тип</td><td>Комментарий</td><td>Принял</td></tr></thead>
    <tbody>
      ${c.payments.map(p => `<tr>
        <td>${fmtDate(p.paid_at)}</td>
        <td>${fmt(p.amount)} ₽</td>
        <td>${p.payment_type === "full" ? "Полный расчёт" : "Частичный"}</td>
        <td>${p.comment || ""}</td>
        <td>${p.recorded_by || ""}</td>
      </tr>`).join("")}
    </tbody>
  </table>` : ""}

  ${photoBlock ? `<h3>Фотофиксация</h3><div class="photos">${photoBlock}</div>` : ""}

  <h3>Подписи сторон</h3>
  <div class="sign">
    <div class="b">
      <p><b>Продавец / Ломбард:</b></p>
      <p class="small">ИП Скупка24</p>
      <div class="line"></div>
      <p class="small">подпись / М.П.</p>
    </div>
    <div class="b">
      <p><b>Клиент:</b></p>
      <p class="small">${c.client_name || ""}</p>
      <div class="line"></div>
      <p class="small">подпись</p>
    </div>
  </div>
  </body></html>`);
  w.document.close();
}
