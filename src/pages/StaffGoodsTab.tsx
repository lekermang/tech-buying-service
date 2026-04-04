import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  GOODS_URL, SALES_URL, AUTH_CLIENT_URL,
  CATEGORIES, CONDITIONS, PAYMENT_METHODS,
  printPriceTag, printContract,
  type Good, type Passport,
} from "./staff.types";

export default function GoodsTab({ token }: { token: string }) {
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
