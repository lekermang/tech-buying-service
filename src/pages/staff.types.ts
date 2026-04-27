export const EMPLOYEE_AUTH_URL = "https://functions.poehali.dev/29210248-0b73-4c54-9b9f-acd13668dfea";
export const GOODS_URL = "https://functions.poehali.dev/de4c1e8e-0c7b-4f25-a3fd-155c46fa3399";
export const SALES_URL = "https://functions.poehali.dev/1610b50a-9d00-450f-a2ca-6311f04eafe7";
export const AUTH_CLIENT_URL = "https://functions.poehali.dev/58edd0bc-cce3-4ece-acca-a003e2260758";
export const SMARTLOMBARD_URL = "https://functions.poehali.dev/e628ca7a-012b-4d92-bf0a-2853b05a7f4e";

/** Универсальный proxy-вызов к smartlombard.ru через наш бэкенд. */
export async function smartlombardCall<T = unknown>(opts: {
  token: string;
  path: string;
  method?: "GET" | "POST" | "PUT";
  params?: Record<string, string | number | undefined | null>;
  body?: unknown;
  goods?: boolean;
}): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const cleanParams: Record<string, string> = {};
  Object.entries(opts.params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") cleanParams[k] = String(v);
  });
  try {
    const res = await fetch(`${SMARTLOMBARD_URL}?action=proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": opts.token },
      body: JSON.stringify({
        path: opts.path,
        method: opts.method || "GET",
        params: cleanParams,
        body: opts.body,
        goods: !!opts.goods,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: data?.error || `HTTP ${res.status}` };
    }
    if (data && data.status === false) {
      const errMsg = data.message || data.error || "Ошибка smartlombard";
      return { ok: false, status: res.status, data: null, error: errMsg };
    }
    return { ok: true, status: res.status, data: (data?.result ?? data) as T };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export type Good = { id: number; title: string; category: string; brand: string; model: string; condition: string; color: string; storage: string; imei: string; sell_price: number; purchase_price: number; status: string; description: string };
export type Sale = { id: number; type: string; amount: number; payment: string; contract: string; date: string; client: string; phone: string; employee: string };
export type Analytics = { total_revenue: number; total_deals: number; by_type: Record<string, { sum: number; count: number }>; staff_stats: { name: string; deals: number; revenue: number }[]; daily: { date: string; sum: number }[] };
export type Passport = { series: string; number: string; issued_by: string; issued_date: string; address: string };

export const CATEGORIES = ["Смартфон", "Ноутбук", "Планшет", "Часы", "Наушники", "Другое"];
export const CONDITIONS = ["отличное", "хорошее", "удовлетворительное"];
export const PAYMENT_METHODS = [{ v: "cash", l: "Наличные" }, { v: "card", l: "Карта" }, { v: "transfer", l: "Перевод" }];

export function printPriceTag(item: Good) {
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Ценник</title><style>
    body{font-family:Arial,sans-serif;margin:0;padding:20px}
    .tag{width:280px;border:3px solid #000;padding:20px;text-align:center;margin:0 auto}
    h2{margin:0 0 10px;font-size:16px;line-height:1.3}
    .price{font-size:42px;font-weight:bold;margin:10px 0}
    .info{font-size:13px;color:#555;margin:4px 0}
    .footer{font-size:11px;margin-top:12px;border-top:1px solid #ccc;padding-top:8px;color:#888}
    @media print{body{margin:0}}
  </style></head><body><div class="tag">
    <h2>${item.title}</h2>
    <div class="price">${item.sell_price.toLocaleString("ru-RU")} ₽</div>
    <div class="info">Состояние: <b>${item.condition}</b></div>
    ${item.storage ? `<div class="info">Память: ${item.storage}</div>` : ""}
    ${item.imei ? `<div class="info">IMEI: ${item.imei}</div>` : ""}
    <div class="footer">Скупка24 • Гарантия 14 дней</div>
  </div><script>window.onload=()=>window.print()</` + `script></body></html>`);
}

export function printContract(contractNumber: string, good: Good, clientName: string, clientPhone: string, amount: number, passport?: Passport) {
  const w = window.open("", "_blank", "width=700,height=900");
  if (!w) return;
  const date = new Date().toLocaleDateString("ru-RU");
  const passportLine = passport?.series
    ? `паспорт ${passport.series} ${passport.number}, выдан ${passport.issued_by} ${passport.issued_date}, зарег.: ${passport.address}`
    : "";
  w.document.write(`<!DOCTYPE html><html><head><title>Договор ${contractNumber}</title><style>
    body{font-family:Arial,sans-serif;margin:40px;font-size:14px;line-height:1.6}
    h2{text-align:center;font-size:18px;margin-bottom:4px}
    .sub{text-align:center;color:#555;font-size:13px;margin-bottom:20px}
    .section{margin:16px 0}
    p{margin:6px 0}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    td{padding:6px 8px;border:1px solid #ccc;font-size:13px}
    td:first-child{font-weight:bold;width:40%;background:#f9f9f9}
    .sign{display:flex;justify-content:space-between;margin-top:60px}
    .sign div{width:45%}
    .line{border-bottom:1px solid #000;margin-top:40px;margin-bottom:5px}
    .small{font-size:11px;color:#888}
    @media print{body{margin:20px}}
  </style></head><body>
  <h2>ДОГОВОР КУПЛИ-ПРОДАЖИ № ${contractNumber}</h2>
  <div class="sub">г. Калуга, ${date}</div>
  <div class="section">
    <p><b>Продавец:</b> ИП Скупка24, г. Калуга, ул. Кирова 11, тел. +7 (4842) 27-77-04</p>
    <p><b>Покупатель:</b> ${clientName}</p>
    <p>Телефон: ${clientPhone}</p>
    ${passportLine ? `<p>Паспорт: ${passportLine}</p>` : ""}
  </div>
  <div class="section">
    <p>Продавец продал, а Покупатель купил следующий товар:</p>
    <table>
      <tr><td>Наименование</td><td>${good.title}</td></tr>
      <tr><td>Состояние</td><td>${good.condition}</td></tr>
      ${good.storage ? `<tr><td>Память</td><td>${good.storage}</td></tr>` : ""}
      ${good.color ? `<tr><td>Цвет</td><td>${good.color}</td></tr>` : ""}
      ${good.imei ? `<tr><td>IMEI</td><td>${good.imei}</td></tr>` : ""}
      <tr><td>Стоимость</td><td><b>${amount.toLocaleString("ru-RU")} рублей</b></td></tr>
    </table>
  </div>
  <div class="section">
    <p>Покупатель осмотрел товар, ознакомлен с его техническим состоянием, претензий не имеет.</p>
    <p>Гарантийный срок: <b>14 (четырнадцать) дней</b> с момента передачи товара.</p>
    <p>Товар передан в момент подписания настоящего договора.</p>
  </div>
  <div class="sign">
    <div>
      <p><b>Продавец:</b></p>
      <p class="small">ИП Скупка24</p>
      <div class="line"></div>
      <p class="small">подпись / М.П.</p>
    </div>
    <div>
      <p><b>Покупатель:</b></p>
      <p class="small">${clientName}</p>
      <div class="line"></div>
      <p class="small">подпись</p>
    </div>
  </div>
  <script>window.onload=()=>window.print()</` + `script></body></html>`);
}