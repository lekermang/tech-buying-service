import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { slGet, slPost, fmtMoney, CONDITIONS, PAYMENT_METHODS, type SLCategory, type SLClient } from "./types";
import SpecsAutocomplete from "./SpecsAutocomplete";

type Props = { token: string; onDone?: () => void };

export default function SLBuyout({ token, onDone }: Props) {
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [specs, setSpecs] = useState("");
  const [condition, setCondition] = useState("хорошее");
  const [color, setColor] = useState("");
  const [storage, setStorage] = useState("");
  const [imei, setImei] = useState("");
  const [serial, setSerial] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [contractNumber, setContractNumber] = useState("");
  const [description, setDescription] = useState("");

  // Клиент — поиск или новый
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<SLClient[]>([]);
  const [pickedClient, setPickedClient] = useState<SLClient | null>(null);
  const [newClient, setNewClient] = useState({ full_name: "", phone: "", passport_series: "", passport_number: "" });

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<null | { id: number }>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    slGet<{ items: SLCategory[] }>(token, "categories").then((r) => {
      setCats(r.items || []);
      const phones = r.items.find((c) => c.slug === "phones");
      if (phones) setCategoryId(phones.id);
    }).catch(() => {});
  }, [token]);

  // Парсим название → бренд/модель/память (примитивно)
  useEffect(() => {
    const t = title.trim();
    if (!t) return;
    const lower = t.toLowerCase();
    if (!brand) {
      if (lower.includes("iphone")) setBrand("Apple");
      else if (lower.includes("galaxy") || lower.includes("samsung")) setBrand("Samsung");
      else if (lower.includes("redmi") || lower.includes("xiaomi") || lower.includes("poco")) setBrand("Xiaomi");
      else if (lower.includes("realme")) setBrand("Realme");
      else if (lower.includes("honor")) setBrand("Honor");
      else if (lower.includes("tecno")) setBrand("Tecno");
      else if (lower.includes("infinix")) setBrand("Infinix");
    }
    // Память
    if (!storage) {
      const m = t.match(/(\d{2,4})\s*(гб|gb|тб|tb)/i);
      if (m) setStorage(m[1] + " ГБ");
    }
    // Модель — берём как title если короткий
    if (!model && t.length < 50) setModel(t);
  }, [title, brand, model, storage]);

  // Поиск клиента
  useEffect(() => {
    const q = clientQuery.trim();
    if (q.length < 2) { setClientResults([]); return; }
    const t = window.setTimeout(() => {
      slGet<{ items: SLClient[] }>(token, "clients", { q }).then((r) => setClientResults(r.items || [])).catch(() => {});
    }, 250);
    return () => window.clearTimeout(t);
  }, [clientQuery, token]);

  const reset = () => {
    setTitle(""); setBrand(""); setModel(""); setSpecs(""); setCondition("хорошее");
    setColor(""); setStorage(""); setImei(""); setSerial("");
    setPurchasePrice(""); setSellPrice(""); setContractNumber(""); setDescription("");
    setPickedClient(null); setClientQuery("");
    setNewClient({ full_name: "", phone: "", passport_series: "", passport_number: "" });
    setDone(null); setErr(null);
  };

  const submit = async () => {
    setErr(null);
    if (!title.trim()) { setErr("Укажите наименование"); return; }
    if (!purchasePrice) { setErr("Укажите цену закупки"); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        category_id: categoryId || null,
        title: title.trim(), brand, model, specs, condition,
        color, storage, imei, serial_number: serial,
        description, purchase_price: Number(purchasePrice),
        sell_price: Number(sellPrice || 0),
        payment_method: paymentMethod,
        contract_number: contractNumber,
      };
      if (pickedClient) body.client_id = pickedClient.id;
      else if (newClient.full_name.trim()) body.client = newClient;
      const r = await slPost<{ id: number }>(token, "buyout", body);
      setDone({ id: r.id });
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="p-4 space-y-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
          <Icon name="CheckCircle2" size={32} className="text-green-400 mx-auto mb-2" />
          <div className="font-oswald font-bold text-lg">Скупка оформлена</div>
          <div className="text-sm text-white/60">Товар №{done.id} добавлен на склад</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={reset} className="bg-[#FFD700] text-black font-bold py-3 rounded-lg">
            <Icon name="Plus" size={14} className="inline mr-1" /> Ещё скупка
          </button>
          <button onClick={() => onDone?.()} className="bg-[#1A1A1A] border border-[#333] text-white font-bold py-3 rounded-lg">
            На склад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-20 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="ShoppingCart" size={18} className="text-blue-400" />
        <div className="font-oswald font-bold uppercase">Новая скупка</div>
      </div>

      {/* Категория */}
      <div>
        <label className="text-[11px] uppercase tracking-wider text-white/50 font-roboto block mb-1">Категория</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm">
          <option value="">— не выбрана —</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wider text-white/50 font-roboto block mb-1">Наименование *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="iPhone 13 Pro 128 ГБ"
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/40 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Бренд</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Модель</label>
          <input value={model} onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <SpecsAutocomplete token={token} title={title} brand={brand} model={model}
        value={specs} onChange={setSpecs}
        onPickTemplate={(t) => { if (!brand && t.brand) setBrand(t.brand); if (!model && t.model) setModel(t.model); }} />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Цвет</label>
          <input value={color} onChange={(e) => setColor(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Память</label>
          <input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="128 ГБ"
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Состояние</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm">
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">IMEI</label>
          <input value={imei} onChange={(e) => setImei(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Серийный №</label>
          <input value={serial} onChange={(e) => setSerial(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
      </div>

      {/* Цены */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-3 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] uppercase text-blue-400 font-bold block mb-1">Закупка *</label>
          <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number"
            placeholder="0"
            className="w-full bg-[#0A0A0A] border border-blue-500/30 rounded-lg px-3 py-2 text-lg font-bold text-blue-300" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-green-400 font-bold block mb-1">Цена на витрине</label>
          <input value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} type="number" placeholder="0"
            className="w-full bg-[#0A0A0A] border border-green-500/30 rounded-lg px-3 py-2 text-lg font-bold text-green-300" />
        </div>
        {sellPrice && purchasePrice && (
          <div className="col-span-2 text-[11px] text-[#FFD700]">
            Маржа: {fmtMoney(Number(sellPrice) - Number(purchasePrice))} ({Math.round(((Number(sellPrice) - Number(purchasePrice)) / Number(sellPrice)) * 100)}%)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Способ оплаты</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm">
            {PAYMENT_METHODS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">№ договора</label>
          <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="text-[11px] uppercase text-white/50 font-roboto block mb-1">Заметка</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm resize-none" />
      </div>

      {/* Клиент */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-white/60 text-[11px] uppercase">
          <Icon name="User" size={12} /> Продавец товара
        </div>
        {pickedClient ? (
          <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-lg p-2">
            <Icon name="UserCheck" size={14} className="text-green-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{pickedClient.full_name}</div>
              <div className="text-[10px] text-white/50">{pickedClient.phone || "без телефона"}</div>
            </div>
            <button onClick={() => setPickedClient(null)} className="text-white/40 hover:text-red-400">
              <Icon name="X" size={14} />
            </button>
          </div>
        ) : (
          <>
            <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Поиск по имени или телефону..."
              className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
            {clientResults.length > 0 && (
              <div className="bg-[#0A0A0A] border border-[#222] rounded-lg max-h-40 overflow-y-auto">
                {clientResults.map((c) => (
                  <button key={c.id} onClick={() => { setPickedClient(c); setClientQuery(""); setClientResults([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-[#FFD700]/10 border-b border-[#1F1F1F] last:border-b-0">
                    <div className="text-sm">{c.full_name}</div>
                    <div className="text-[10px] text-white/40">{c.phone || "—"}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="text-[10px] uppercase text-white/40 pt-2 border-t border-[#1F1F1F]">или новый клиент</div>
            <input value={newClient.full_name} onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
              placeholder="ФИО"
              className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="Телефон"
                className="bg-[#0A0A0A] border border-[#222] rounded-lg px-2 py-2 text-xs" />
              <input value={newClient.passport_series} onChange={(e) => setNewClient({ ...newClient, passport_series: e.target.value })}
                placeholder="Серия"
                className="bg-[#0A0A0A] border border-[#222] rounded-lg px-2 py-2 text-xs" />
              <input value={newClient.passport_number} onChange={(e) => setNewClient({ ...newClient, passport_number: e.target.value })}
                placeholder="Номер"
                className="bg-[#0A0A0A] border border-[#222] rounded-lg px-2 py-2 text-xs" />
            </div>
          </>
        )}
      </div>

      {err && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-2 rounded-lg">
          {err}
        </div>
      )}

      <button onClick={submit} disabled={saving}
        className="w-full bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black font-bold py-3 rounded-lg shadow-lg shadow-[#FFD700]/20 active:scale-95 disabled:opacity-60">
        {saving ? <><Icon name="Loader" size={14} className="inline mr-1 animate-spin" /> Сохраняю...</>
                : <><Icon name="Check" size={14} className="inline mr-1" /> Оформить скупку</>}
      </button>
    </div>
  );
}
