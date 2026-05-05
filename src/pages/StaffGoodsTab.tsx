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
    <div className="p-3 sm:p-4">
      {/* Премиум-шапка */}
      <div className="relative rounded-xl overflow-hidden mb-4">
        <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-50" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.12),transparent 70%)", filter: "blur(12px)" }} />
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/20 p-3 rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.05)] overflow-hidden flex items-center gap-3">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <span aria-hidden className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
          {/* Conic-медальон */}
          <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.4)] shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
              <Icon name="ShoppingBag" size={16} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="font-oswald font-bold uppercase text-base bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Товары в наличии</div>
            <div className="font-roboto text-white/55 text-[10px] uppercase tracking-wider">{goods.length} {goods.length === 1 ? "позиция" : goods.length < 5 ? "позиции" : "позиций"}</div>
          </div>
          <button
            onClick={() => setShowAdd(v => !v)}
            title={showAdd ? "Отменить добавление" : "Добавить новый товар"}
            className={`relative inline-flex items-center gap-1 font-oswald font-bold px-3 py-2 text-xs uppercase rounded-md transition-all active:scale-95 ${
              showAdd
                ? "bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] text-white/70 border border-[#333] hover:border-red-500/40 hover:text-red-300"
                : "btn-gold-premium !py-2 !px-3"
            }`}
          >
            <Icon name={showAdd ? "X" : "Plus"} size={13} /> {showAdd ? "Отмена" : "Добавить"}
          </button>
        </div>
      </div>

      {addedItem && (
        <div className="relative bg-gradient-to-r from-emerald-500/15 via-[#FFD700]/8 to-transparent border border-emerald-500/40 rounded-lg p-3 mb-3 flex items-center justify-between gap-2 shadow-[0_0_14px_rgba(16,185,129,0.18)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <div className="font-roboto text-xs text-white/85 flex items-center gap-1.5 min-w-0">
            <Icon name="CheckCircle2" size={13} className="text-emerald-300 shrink-0 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
            Товар добавлен: <b className="text-[#FFD700] truncate">{addedItem.title}</b>
          </div>
          <button onClick={() => printPriceTag(addedItem)}
            title="Распечатать ценник"
            className="btn-gold-premium !py-1 !px-2 text-[10px] shrink-0">
            <Icon name="Printer" size={11} /> Ценник
          </button>
        </div>
      )}

      {showAdd && (
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/25 rounded-xl p-4 mb-4 shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.05)] overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <span aria-hidden className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.08)" }} />
          <div className="relative font-oswald font-bold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Icon name="PackagePlus" size={12} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
            <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Новый товар</span>
          </div>
          <div className="relative grid grid-cols-2 gap-2 mb-2">
            <div className="col-span-2">
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Название *</label>
              <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} placeholder="iPhone 13 128GB Space Gray"
                className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
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
                    className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all appearance-none">
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={(addForm as Record<string,string>)[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={(f as {placeholder?: string}).placeholder || ""}
                    className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                )}
              </div>
            ))}
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Закупка ₽ *</label>
              <input type="number" value={addForm.purchase_price} onChange={e => setAddForm(p => ({ ...p, purchase_price: e.target.value }))} placeholder="15000"
                className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
            </div>
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Продажа ₽ *</label>
              <input type="number" value={addForm.sell_price} onChange={e => setAddForm(p => ({ ...p, sell_price: e.target.value }))} placeholder="20000"
                className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
            </div>
            <div className="col-span-2">
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Описание</label>
              <textarea value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Состояние, комплектация..."
                className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all resize-none" />
            </div>
          </div>
          <div className="relative flex gap-2 mt-1">
            <button onClick={addGood}
              disabled={saving || !addForm.title || !addForm.purchase_price || !addForm.sell_price}
              title="Сохранить новый товар"
              className="btn-gold-premium !py-2 !px-4 disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon name={saving ? "Loader" : "Check"} size={13} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохраняю..." : "Добавить"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-md bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border border-[#333] hover:border-red-500/40 text-white/70 hover:text-red-300 font-roboto text-xs transition-all active:scale-95"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-12 text-white/40">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
            <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
          </div>
          <span className="font-roboto text-sm">Загружаю товары…</span>
        </div>
      ) : goods.length === 0 ? (
        <div className="text-center py-14">
          <div className="relative inline-block">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/15 blur-2xl pointer-events-none" />
            <div className="relative w-16 h-16 mx-auto mb-3 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.3)]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="Package" size={26} className="text-[#FFD700]/70" />
              </div>
            </div>
          </div>
          <div className="font-oswald font-bold uppercase text-base bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer mb-1">
            Нет товаров в наличии
          </div>
          <div className="font-roboto text-white/40 text-xs">Добавь первую позицию кнопкой «Добавить»</div>
        </div>
      ) : (
        <div className="space-y-2">
          {goods.map(g => (
            <div key={g.id} className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] rounded-lg p-3 flex items-center gap-3 hover:border-[#FFD700]/30 hover:shadow-[0_0_14px_rgba(255,215,0,0.15)] transition-all overflow-hidden group">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate font-medium">{g.title}</div>
                <div className="font-roboto text-[10px] text-white/45">{g.condition} {g.storage ? `· ${g.storage}` : ""} {g.imei ? `· IMEI: ${g.imei}` : ""}</div>
              </div>
              <div className="relative font-oswald font-bold text-[#FFD700] text-base shrink-0 tabular-nums drop-shadow-[0_0_4px_rgba(255,215,0,0.3)]">
                {g.sell_price.toLocaleString("ru-RU")} <span className="text-[#FFD700]/70 text-sm">₽</span>
              </div>
              <div className="relative flex gap-1 shrink-0">
                <button onClick={() => printPriceTag(g)}
                  title="Распечатать ценник"
                  className="text-white/40 hover:text-[#FFD700] p-1.5 rounded-md hover:bg-[#FFD700]/10 hover:shadow-[0_0_8px_rgba(255,215,0,0.25)] active:scale-90 transition-all">
                  <Icon name="Printer" size={14} />
                </button>
                <button
                  onClick={() => {
                    const raw = window.prompt(
                      `Печать со скидкой\n\nТовар: ${g.title}\nСтарая цена: ${g.sell_price.toLocaleString("ru-RU")} ₽\n\nВведите новую цену (₽):`,
                      "",
                    );
                    if (!raw) return;
                    const newP = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
                    if (!Number.isFinite(newP) || newP <= 0) {
                      alert("Введите корректную сумму, например 9990");
                      return;
                    }
                    if (newP >= g.sell_price) {
                      alert("Новая цена должна быть меньше старой.");
                      return;
                    }
                    printPriceTag(g, { enabled: true, oldPrice: g.sell_price, newPrice: newP });
                  }}
                  title="Распечатать ценник со скидкой (старая зачёркнута)"
                  className="text-white/40 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.25)] active:scale-90 transition-all">
                  <Icon name="Tag" size={14} />
                </button>
                <button onClick={() => { setSellModal(g); setSellResult(null); setSellForm({ client_phone: "", discount_pct: "0", payment_method: "cash" }); setClientFound(null); setPassport({ series: "", number: "", issued_by: "", issued_date: "", address: "" }); setShowPassport(false); }}
                  title="Оформить продажу"
                  className="text-white/40 hover:text-emerald-300 p-1.5 rounded-md hover:bg-emerald-500/10 hover:shadow-[0_0_8px_rgba(16,185,129,0.25)] active:scale-90 transition-all">
                  <Icon name="ShoppingCart" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sellModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm">
            <span aria-hidden className="absolute -inset-2 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.25),transparent 75%)", filter: "blur(18px)" }} />
            <div className="relative p-[1.5px] rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.7)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.7)_360deg)] shadow-[0_12px_40px_rgba(255,215,0,0.20)]">
              <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] p-5 rounded-2xl overflow-hidden">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent" />
                <span aria-hidden className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
            {sellResult ? (
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.5)] shrink-0">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                      <Icon name="CheckCircle2" size={16} className="text-emerald-300 drop-shadow-[0_0_5px_rgba(16,185,129,0.7)]" />
                    </div>
                  </div>
                  <div className="font-oswald font-bold text-lg uppercase bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Продажа оформлена!</div>
                </div>
                <div className="font-roboto text-white/70 text-sm mb-1">Договор: <b className="text-white">{sellResult.contract_number}</b></div>
                <div className="font-roboto text-white/70 text-sm mb-4">Сумма: <b className="text-[#FFD700] tabular-nums drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">{sellResult.amount_final.toLocaleString("ru-RU")} ₽</b></div>
                <div className="flex gap-2">
                  <button onClick={() => printContract(sellResult.contract_number, sellModal, clientFound?.full_name || "Покупатель", sellForm.client_phone, sellResult.amount_final, passport.series ? passport : undefined)}
                    title="Распечатать договор купли-продажи"
                    className="btn-gold-premium !py-2 !px-3 text-xs">
                    <Icon name="FileText" size={12} /> Договор
                  </button>
                  <button onClick={() => { setSellModal(null); setSellResult(null); }}
                    className="px-4 py-2 rounded-md bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border border-[#333] hover:border-[#FFD700]/30 text-white/70 hover:text-[#FFD700] font-roboto text-xs transition-all active:scale-95">
                    Закрыть
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative w-9 h-9 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_12px_rgba(255,215,0,0.4)] shrink-0">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                      <Icon name="ShoppingCart" size={14} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
                    </div>
                  </div>
                  <div className="font-oswald font-bold text-sm uppercase bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Оформить продажу</div>
                </div>
                <div className="font-roboto text-white/60 text-xs mb-3">{sellModal.title} — <b className="text-[#FFD700]">{sellModal.sell_price.toLocaleString("ru-RU")} ₽</b></div>
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Телефон клиента</label>
                    <input value={sellForm.client_phone} onChange={e => { setSellForm(p => ({ ...p, client_phone: e.target.value })); searchClient(e.target.value); }}
                      placeholder="+7..."
                      className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                    {clientFound && <div className="text-[#FFD700] font-roboto text-[10px] mt-1">✓ {clientFound.full_name} · скидка {clientFound.discount_pct}%</div>}
                  </div>
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Скидка %</label>
                    <input type="number" value={clientFound ? clientFound.discount_pct : sellForm.discount_pct}
                      onChange={e => setSellForm(p => ({ ...p, discount_pct: e.target.value }))} min="0" max="100"
                      className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="font-roboto text-white/30 text-[10px] block mb-1">Способ оплаты</label>
                    <select value={sellForm.payment_method} onChange={e => setSellForm(p => ({ ...p, payment_method: e.target.value }))}
                      className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all appearance-none">
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
                          className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Номер</label>
                        <input value={passport.number} onChange={e => setPassport(p => ({ ...p, number: e.target.value }))} placeholder="123456"
                          className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="font-roboto text-white/30 text-[10px] block mb-1">Кем выдан</label>
                      <input value={passport.issued_by} onChange={e => setPassport(p => ({ ...p, issued_by: e.target.value }))} placeholder="ОУФМС России..."
                        className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Дата выдачи</label>
                        <input type="date" value={passport.issued_date} onChange={e => setPassport(p => ({ ...p, issued_date: e.target.value }))}
                          className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="font-roboto text-white/30 text-[10px] block mb-1">Адрес регистрации</label>
                        <input value={passport.address} onChange={e => setPassport(p => ({ ...p, address: e.target.value }))} placeholder="г. Калуга..."
                          className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-2 py-1.5 font-roboto text-xs rounded-md focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative flex gap-2">
                  <button onClick={doSell}
                    title="Оформить продажу и сгенерировать договор"
                    className="btn-gold-premium !py-2 !px-4 text-xs">
                    <Icon name="Check" size={13} /> Оформить
                  </button>
                  <button onClick={() => setSellModal(null)}
                    className="px-4 py-2 rounded-md bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border border-[#333] hover:border-red-500/40 text-white/70 hover:text-red-300 font-roboto text-xs transition-all active:scale-95">
                    Отмена
                  </button>
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}