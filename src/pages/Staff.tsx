import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const EMPLOYEE_AUTH_URL = "https://functions.poehali.dev/29210248-0b73-4c54-9b9f-acd13668dfea";
const GOODS_URL = "https://functions.poehali.dev/de4c1e8e-0c7b-4f25-a3fd-155c46fa3399";
const SALES_URL = "https://functions.poehali.dev/1610b50a-9d00-450f-a2ca-6311f04eafe7";
const AUTH_CLIENT_URL = "https://functions.poehali.dev/58edd0bc-cce3-4ece-acca-a003e2260758";

type Good = { id: number; title: string; category: string; brand: string; model: string; condition: string; color: string; storage: string; imei: string; sell_price: number; purchase_price: number; status: string; description: string };
type Sale = { id: number; type: string; amount: number; payment: string; contract: string; date: string; client: string; phone: string; employee: string };
type Analytics = { total_revenue: number; total_deals: number; by_type: Record<string, { sum: number; count: number }>; staff_stats: { name: string; deals: number; revenue: number }[]; daily: { date: string; sum: number }[] };

const CATEGORIES = ["Смартфон", "Ноутбук", "Планшет", "Часы", "Наушники", "Другое"];
const CONDITIONS = ["отличное", "хорошее", "удовлетворительное"];
const PAYMENT_METHODS = [{ v: "cash", l: "Наличные" }, { v: "card", l: "Карта" }, { v: "transfer", l: "Перевод" }];

function printPriceTag(item: Good) {
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

type Passport = { series: string; number: string; issued_by: string; issued_date: string; address: string };

function printContract(contractNumber: string, good: Good, clientName: string, clientPhone: string, amount: number, passport?: Passport) {
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

// ─── Таб Товары ───────────────────────────────────────────────────────────────
function GoodsTab({ token }: { token: string }) {
  const [goods, setGoods] = useState<Good[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", category: "Смартфон", brand: "", model: "", condition: "хорошее", color: "", storage: "", imei: "", purchase_price: "", sell_price: "", description: "" });
  const [addedItem, setAddedItem] = useState<Good | null>(null);
  const [saving, setSaving] = useState(false);
  const [sellModal, setSellModal] = useState<Good | null>(null);
  const [sellForm, setSellForm] = useState({ client_phone: "", discount_pct: "0", payment_method: "cash" });
  const [sellResult, setSellResult] = useState<{ contract_number: string; amount_final: number } | null>(null);
  const [clientFound, setClientFound] = useState<{ id: number; full_name: string; discount_pct: number } | null>(null);
  const [passport, setPassport] = useState<Passport>({ series: "", number: "", issued_by: "", issued_date: "", address: "" });
  const [showPassport, setShowPassport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${GOODS_URL}?status=available`);
    const data = await res.json();
    setGoods(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addGood = async () => {
    if (!addForm.title || !addForm.purchase_price || !addForm.sell_price) return;
    setSaving(true);
    const res = await fetch(GOODS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "add", ...addForm, purchase_price: parseInt(addForm.purchase_price), sell_price: parseInt(addForm.sell_price) }) });
    const data = await res.json();
    setSaving(false);
    if (data.id) {
      setAddedItem({ ...addForm, id: data.id, purchase_price: parseInt(addForm.purchase_price), sell_price: parseInt(addForm.sell_price), status: "available" } as Good);
      setShowAdd(false);
      setAddForm({ title: "", category: "Смартфон", brand: "", model: "", condition: "хорошее", color: "", storage: "", imei: "", purchase_price: "", sell_price: "", description: "" });
      load();
    }
  };

  const searchClient = async (phone: string) => {
    if (phone.length < 6) { setClientFound(null); return; }
    const res = await fetch(`${AUTH_CLIENT_URL}?action=profile&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.id) {
      setClientFound(data);
      // Подставляем паспортные данные из базы если есть
      if (data.passport_series) {
        setShowPassport(true);
        setPassport({
          series: data.passport_series || "",
          number: data.passport_number || "",
          issued_by: data.passport_issued_by || "",
          issued_date: data.passport_issued_date || "",
          address: data.address || "",
        });
      }
    } else setClientFound(null);
  };

  const doSell = async () => {
    if (!sellModal) return;
    const discount = clientFound?.discount_pct || parseInt(sellForm.discount_pct) || 0;
    const res = await fetch(SALES_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "sell", good_id: sellModal.id, client_id: clientFound?.id, amount: sellModal.sell_price, discount_pct: discount, payment_method: sellForm.payment_method }) });
    const data = await res.json();
    if (data.contract_number) {
      setSellResult(data);
      load();
      // Сохраняем паспортные данные клиента если введены
      if (clientFound?.id && passport.series) {
        fetch(AUTH_CLIENT_URL, { method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientFound.id, passport_series: passport.series, passport_number: passport.number, passport_issued_by: passport.issued_by, passport_issued_date: passport.issued_date || null, address: passport.address }) });
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-oswald font-bold uppercase text-sm text-white">Товары в наличии <span className="text-white/40">({goods.length})</span></span>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
          <Icon name="Plus" size={13} /> Добавить
        </button>
      </div>

      {addedItem && (
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 p-3 mb-3 flex items-center justify-between">
          <div className="font-roboto text-xs text-white/70">Товар добавлен: <b>{addedItem.title}</b></div>
          <button onClick={() => printPriceTag(addedItem)} className="flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold px-2 py-1 text-[10px] uppercase">
            <Icon name="Printer" size={11} /> Ценник
          </button>
        </div>
      )}

      {showAdd && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-3">Новый товар</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="col-span-2">
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Название *</label>
              <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} placeholder="iPhone 13 128GB Space Gray"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
            </div>
            {[
              { key: "category", label: "Категория", type: "select", options: CATEGORIES },
              { key: "condition", label: "Состояние", type: "select", options: CONDITIONS },
              { key: "brand", label: "Бренд", placeholder: "Apple" },
              { key: "model", label: "Модель", placeholder: "iPhone 13" },
              { key: "color", label: "Цвет", placeholder: "Чёрный" },
              { key: "storage", label: "Память", placeholder: "128GB" },
              { key: "imei", label: "IMEI", placeholder: "352..." },
            ].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/30 text-[10px] block mb-1">{f.label}</label>
                {f.type === "select" ? (
                  <select value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] appearance-none">
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={(f as {placeholder?: string}).placeholder || ""}
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                )}
              </div>
            ))}
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Закупка ₽ *</label>
              <input type="number" value={addForm.purchase_price} onChange={e => setAddForm(p => ({ ...p, purchase_price: e.target.value }))} placeholder="15000"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
            </div>
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Продажа ₽ *</label>
              <input type="number" value={addForm.sell_price} onChange={e => setAddForm(p => ({ ...p, sell_price: e.target.value }))} placeholder="20000"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
            </div>
            <div className="col-span-2">
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Описание</label>
              <textarea value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Состояние, комплектация..."
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addGood} disabled={saving || !addForm.title || !addForm.purchase_price || !addForm.sell_price}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {saving ? "..." : "Добавить"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> :
        goods.length === 0 ? <div className="text-center py-8 text-white/30 font-roboto text-sm">Нет товаров в наличии</div> :
        <div className="space-y-2">
          {goods.map(g => (
            <div key={g.id} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate">{g.title}</div>
                <div className="font-roboto text-[10px] text-white/40">{g.condition} {g.storage ? `· ${g.storage}` : ""} {g.imei ? `· IMEI: ${g.imei}` : ""}</div>
              </div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm shrink-0">{g.sell_price.toLocaleString("ru-RU")} ₽</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => printPriceTag(g)} className="text-white/30 hover:text-[#FFD700] p-1 transition-colors"><Icon name="Printer" size={13} /></button>
                <button onClick={() => { setSellModal(g); setSellResult(null); setSellForm({ client_phone: "", discount_pct: "0", payment_method: "cash" }); setClientFound(null); setPassport({ series: "", number: "", issued_by: "", issued_date: "", address: "" }); setShowPassport(false); }}
                  className="text-white/30 hover:text-green-400 p-1 transition-colors"><Icon name="ShoppingCart" size={13} /></button>
              </div>
            </div>
          ))}
        </div>}

      {sellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#333] p-5 w-full max-w-sm">
            {sellResult ? (
              <div>
                <div className="text-[#FFD700] font-oswald font-bold text-lg mb-2">Продажа оформлена!</div>
                <div className="font-roboto text-white/60 text-sm mb-1">Договор: <b className="text-white">{sellResult.contract_number}</b></div>
                <div className="font-roboto text-white/60 text-sm mb-4">Сумма: <b className="text-[#FFD700]">{sellResult.amount_final.toLocaleString("ru-RU")} ₽</b></div>
                <div className="flex gap-2">
                  <button onClick={() => printContract(sellResult.contract_number, sellModal, clientFound?.full_name || "Покупатель", sellForm.client_phone, sellResult.amount_final, passport.series ? passport : undefined)}
                    className="flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase">
                    <Icon name="FileText" size={12} /> Договор
                  </button>
                  <button onClick={() => { setSellModal(null); setSellResult(null); }} className="text-white/40 font-roboto text-xs hover:text-white">Закрыть</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-oswald font-bold text-sm uppercase mb-3">Оформить продажу</div>
                <div className="font-roboto text-white/60 text-xs mb-3">{sellModal.title} — <b className="text-[#FFD700]">{sellModal.sell_price.toLocaleString("ru-RU")} ₽</b></div>
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Телефон клиента</label>
                    <input value={sellForm.client_phone} onChange={e => { setSellForm(p => ({ ...p, client_phone: e.target.value })); searchClient(e.target.value); }}
                      placeholder="+7..."
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                    {clientFound && <div className="text-[#FFD700] font-roboto text-[10px] mt-1">✓ {clientFound.full_name} · скидка {clientFound.discount_pct}%</div>}
                  </div>
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Скидка %</label>
                    <input type="number" value={clientFound ? clientFound.discount_pct : sellForm.discount_pct}
                      onChange={e => setSellForm(p => ({ ...p, discount_pct: e.target.value }))} min="0" max="100"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                  </div>
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Способ оплаты</label>
                    <select value={sellForm.payment_method} onChange={e => setSellForm(p => ({ ...p, payment_method: e.target.value }))}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] appearance-none">
                      {PAYMENT_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Паспортные данные */}
                <button onClick={() => setShowPassport(v => !v)}
                  className="flex items-center gap-1 text-white/40 hover:text-[#FFD700] font-roboto text-[10px] transition-colors mb-2">
                  <Icon name={showPassport ? "ChevronUp" : "ChevronDown"} size={11} />
                  {showPassport ? "Скрыть паспортные данные" : "Добавить паспортные данные"}
                </button>

                {showPassport && (
                  <div className="bg-black/20 border border-white/10 p-3 space-y-2 mb-3">
                    <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-1">Паспортные данные покупателя</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Серия</label>
                        <input value={passport.series} onChange={e => setPassport(p => ({ ...p, series: e.target.value }))} placeholder="4520"
                          className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                      </div>
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Номер</label>
                        <input value={passport.number} onChange={e => setPassport(p => ({ ...p, number: e.target.value }))} placeholder="123456"
                          className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                      </div>
                    </div>
                    <div>
                      <label className="font-roboto text-white/30 text-[10px] block mb-1">Кем выдан</label>
                      <input value={passport.issued_by} onChange={e => setPassport(p => ({ ...p, issued_by: e.target.value }))} placeholder="ОУФМС России..."
                        className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Дата выдачи</label>
                        <input type="date" value={passport.issued_date} onChange={e => setPassport(p => ({ ...p, issued_date: e.target.value }))}
                          className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                      </div>
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Адрес регистрации</label>
                        <input value={passport.address} onChange={e => setPassport(p => ({ ...p, address: e.target.value }))} placeholder="г. Калуга..."
                          className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={doSell} className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors">
                    Оформить
                  </button>
                  <button onClick={() => setSellModal(null)} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Таб Продажи ─────────────────────────────────────────────────────────────
function SalesTab({ token }: { token: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SALES_URL}?action=list`, { headers: { "X-Employee-Token": token } })
      .then(r => r.json()).then(d => { setSales(d.sales || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const TYPE_LABELS: Record<string, string> = { goods: "Продажа", repair: "Ремонт", purchase: "Закупка" };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Продажи <span className="text-white/40">({sales.length})</span></div>
      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> :
        sales.length === 0 ? <div className="text-center py-8 text-white/30 font-roboto text-sm">Продаж пока нет</div> :
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">#{s.id}</span>
                  <span className="font-roboto text-[10px] text-white/40 border border-white/10 px-1.5 py-0.5">{TYPE_LABELS[s.type] || s.type}</span>
                </div>
                <span className="font-oswald font-bold text-white">{s.amount.toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="font-roboto text-xs text-white/60">{s.client || "Без клиента"} {s.phone ? `· ${s.phone}` : ""}</div>
              <div className="flex justify-between mt-1">
                <span className="font-roboto text-[10px] text-white/30">{s.contract || "—"}</span>
                <span className="font-roboto text-[10px] text-white/30">{s.date ? new Date(s.date).toLocaleDateString("ru-RU") : ""}</span>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ─── Таб Клиенты ─────────────────────────────────────────────────────────────
function ClientsTab({ token }: { token: string }) {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", phone: "", email: "" });
  const [added, setAdded] = useState(false);

  const search = async () => {
    if (!phone) return;
    setNotFound(false); setFound(null);
    const res = await fetch(`${AUTH_CLIENT_URL}?action=profile&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.id) setFound(data);
    else setNotFound(true);
  };

  const addClient = async () => {
    if (!addForm.phone || !addForm.full_name) return;
    await fetch(AUTH_CLIENT_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...addForm }) });
    setAdded(true); setAddForm({ full_name: "", phone: "", email: "" });
  };

  return (
    <div className="p-4">
      <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Поиск клиента</div>
      <div className="flex gap-2 mb-3">
        <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="+7 (___) ___-__-__"
          className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700]" />
        <button onClick={search} className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400">Найти</button>
      </div>
      {found && (
        <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-3 mb-4">
          <div className="font-oswald font-bold text-[#FFD700] mb-1">{(found as {full_name: string}).full_name}</div>
          <div className="font-roboto text-white/60 text-sm">{(found as {phone: string}).phone} {(found as {email: string}).email ? `· ${(found as {email: string}).email}` : ""}</div>
          <div className="font-roboto text-xs text-white/40 mt-1">Скидка: {(found as {discount_pct: number}).discount_pct}% · Баллы: {(found as {loyalty_points: number}).loyalty_points}</div>
        </div>
      )}
      {notFound && <div className="text-white/40 font-roboto text-sm mb-4">Клиент не найден</div>}

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="font-oswald font-bold uppercase text-sm text-white mb-3">Добавить клиента</div>
        {added ? (
          <div className="text-[#FFD700] font-roboto text-sm flex items-center gap-2"><Icon name="CheckCircle" size={14} /> Клиент добавлен!</div>
        ) : (
          <div className="space-y-2">
            {[{ key: "full_name", label: "ФИО", placeholder: "Иванов Иван Иванович" }, { key: "phone", label: "Телефон *", placeholder: "+7..." }, { key: "email", label: "Email", placeholder: "mail@example.com" }].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/30 text-[10px] block mb-1">{f.label}</label>
                <input value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700]" />
              </div>
            ))}
            <button onClick={addClient} disabled={!addForm.phone || !addForm.full_name}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
              Добавить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Таб Аналитика ───────────────────────────────────────────────────────────
function AnalyticsTab({ token }: { token: string }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${SALES_URL}?action=analytics&period=${period}`, { headers: { "X-Employee-Token": token } });
    const d = await res.json();
    setData(d); setLoading(false);
  }, [period, token]);

  useEffect(() => { load(); }, [load]);

  const PERIODS = [{ v: "today", l: "Сегодня" }, { v: "week", l: "Неделя" }, { v: "month", l: "Месяц" }, { v: "year", l: "Год" }];
  const TYPE_LABELS: Record<string, string> = { goods: "Продажи", repair: "Ремонт", purchase: "Закупка" };

  return (
    <div className="p-4">
      <div className="flex gap-1 mb-4 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.v} onClick={() => setPeriod(p.v)}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${period === p.v ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
            {p.l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-white/30 text-sm">Загружаю...</div> : data && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 text-center">
              <div className="font-oswald font-bold text-2xl text-[#FFD700]">{(data.total_revenue || 0).toLocaleString("ru-RU")} ₽</div>
              <div className="font-roboto text-white/40 text-xs mt-1">Выручка</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 text-center">
              <div className="font-oswald font-bold text-2xl text-white">{data.total_deals || 0}</div>
              <div className="font-roboto text-white/40 text-xs mt-1">Сделок</div>
            </div>
          </div>

          {Object.entries(data.by_type || {}).length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 mb-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">По направлениям</div>
              {Object.entries(data.by_type).map(([type, stat]) => (
                <div key={type} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="font-roboto text-sm text-white/70">{TYPE_LABELS[type] || type}</span>
                  <div className="text-right">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm">{(stat.sum || 0).toLocaleString("ru-RU")} ₽</span>
                    <span className="font-roboto text-white/30 text-[10px] ml-2">{stat.count} сд.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.staff_stats?.length > 0 && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">Мотивация сотрудников</div>
              {data.staff_stats.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Icon name="Trophy" size={12} className="text-[#FFD700]" />}
                    <span className="font-roboto text-sm text-white/80">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-oswald font-bold text-[#FFD700] text-sm">{(s.revenue || 0).toLocaleString("ru-RU")} ₽</div>
                    <div className="font-roboto text-white/30 text-[10px]">{s.deals} сделок</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function Staff() {
  const [token, setToken] = useState(() => localStorage.getItem("employee_token") || "");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [empName, setEmpName] = useState(() => localStorage.getItem("employee_name") || "");
  const [empRole, setEmpRole] = useState(() => localStorage.getItem("employee_role") || "");
  const [tab, setTab] = useState<"goods" | "sales" | "clients" | "analytics">("goods");

  useEffect(() => {
    if (!token) return;
    fetch(EMPLOYEE_AUTH_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => { if (d.id) { setAuthed(true); setEmpName(d.full_name); setEmpRole(d.role); } else { localStorage.removeItem("employee_token"); setToken(""); } })
      .catch(() => {});
  }, [token]);

  const login = async () => {
    if (!loginForm.login || !loginForm.password) { setLoginError("Введите логин и пароль"); return; }
    const res = await fetch(EMPLOYEE_AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", ...loginForm }) });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("employee_token", data.token);
      localStorage.setItem("employee_name", data.full_name);
      localStorage.setItem("employee_role", data.role);
      setToken(data.token); setEmpName(data.full_name); setEmpRole(data.role); setAuthed(true);
    } else setLoginError(data.error || "Неверный логин или пароль");
  };

  const logout = () => {
    localStorage.removeItem("employee_token"); localStorage.removeItem("employee_name"); localStorage.removeItem("employee_role");
    setToken(""); setAuthed(false); setEmpName(""); setEmpRole("");
  };

  if (!authed) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
            <Icon name="Users" size={16} className="text-black" />
          </div>
          <span className="font-oswald font-bold text-white uppercase tracking-wide">Панель сотрудника</span>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333] p-5 space-y-3">
          {[{ key: "login", label: "Логин", placeholder: "admin", type: "text" }, { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" }].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">{f.label}</label>
              <input type={f.type} value={(loginForm as Record<string,string>)[f.key]}
                onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder={f.placeholder}
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          ))}
          {loginError && <div className="text-red-400 font-roboto text-xs">{loginError}</div>}
          <button onClick={login} className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
            Войти
          </button>
          <div className="font-roboto text-white/30 text-[10px] text-center">Первый вход: введите логин и новый пароль</div>
        </div>
      </div>
    </div>
  );

  const TABS = [
    { k: "goods", l: "Товары", icon: "Package" },
    { k: "sales", l: "Продажи", icon: "ShoppingCart" },
    { k: "clients", l: "Клиенты", icon: "Users" },
    { k: "analytics", l: "Аналитика", icon: "BarChart2" },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="border-b border-[#222] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Users" size={11} className="text-black" />
          </div>
          <span className="font-oswald font-bold uppercase text-sm">{empName}</span>
          {empRole === "admin" && <span className="bg-[#FFD700] text-black font-roboto text-[10px] px-1.5 py-0.5">admin</span>}
        </div>
        <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors"><Icon name="LogOut" size={15} /></button>
      </div>

      <div className="flex border-b border-[#222] overflow-x-auto">
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
            className={`flex items-center gap-1.5 font-roboto text-xs px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${tab === t.k ? "border-[#FFD700] text-[#FFD700]" : "border-transparent text-white/40 hover:text-white"}`}>
            <Icon name={t.icon} size={13} /> {t.l}
          </button>
        ))}
      </div>

      {tab === "goods" && <GoodsTab token={token} />}
      {tab === "sales" && <SalesTab token={token} />}
      {tab === "clients" && <ClientsTab token={token} />}
      {tab === "analytics" && <AnalyticsTab token={token} />}
    </div>
  );
}