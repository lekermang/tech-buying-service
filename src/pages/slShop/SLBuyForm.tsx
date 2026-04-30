import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory, type SLClient, CONDITION_OPTIONS } from "./types";

export default function SLBuyForm({ token, onSaved }: { token: string; onSaved: () => void }) {
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [specsShort, setSpecsShort] = useState("");
  const [specs, setSpecs] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [imei, setImei] = useState("");
  const [serial, setSerial] = useState("");
  const [battery, setBattery] = useState("");
  const [hasBox, setHasBox] = useState(false);
  const [hasCharger, setHasCharger] = useState(false);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [source, setSource] = useState<"buyout" | "consignment">("buyout");
  const [consignmentPercent, setConsignmentPercent] = useState("");
  const [status, setStatus] = useState<"stock" | "showcase" | "consignment">("stock");
  const [description, setDescription] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [clientResults, setClientResults] = useState<SLClient[]>([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const autofillTimer = useRef<number | null>(null);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
  }, [token]);

  // автоподстановка характеристик по названию
  useEffect(() => {
    if (autofillTimer.current) window.clearTimeout(autofillTimer.current);
    if (!title.trim() || title.trim().length < 3) return;
    autofillTimer.current = window.setTimeout(async () => {
      const r = await slApi<{ found: boolean; template?: { brand?: string; model?: string; specs_short?: string; specs_full?: string; default_storage?: string; default_color?: string } }>(
        token, "autofill_specs", { method: "POST", body: { title } }
      );
      if (r.ok && r.data?.found && r.data.template) {
        const t = r.data.template;
        if (!brand && t.brand) setBrand(t.brand);
        if (!model && t.model) setModel(t.model);
        if (!specsShort && t.specs_short) setSpecsShort(t.specs_short);
        if (!specs && t.specs_full) setSpecs(t.specs_full);
        if (!storage && t.default_storage) setStorage(t.default_storage);
        if (!color && t.default_color) setColor(t.default_color);
        setAutofilled(true);
        window.setTimeout(() => setAutofilled(false), 1500);
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, token]);

  // поиск клиента
  useEffect(() => {
    if (!clientQuery.trim() || clientQuery.trim().length < 2) { setClientResults([]); return; }
    const t = window.setTimeout(async () => {
      const r = await slApi<SLClient[]>(token, "clients", { params: { q: clientQuery } });
      if (r.ok && r.data) setClientResults(r.data);
    }, 300);
    return () => window.clearTimeout(t);
  }, [clientQuery, token]);

  const submit = async () => {
    if (!title.trim()) { setMsg("Введите наименование"); return; }
    setSaving(true); setMsg(null);
    let buyClientId: number | null = clientId === "" ? null : Number(clientId);
    // если ввели имя клиента, но не выбрали из списка — создадим
    if (!buyClientId && clientQuery.trim()) {
      const r = await slApi<{ id: number }>(token, "client_save", { method: "POST", body: { full_name: clientQuery.trim() } });
      if (r.ok && r.data) buyClientId = r.data.id;
    }
    const finalStatus = source === "consignment" ? "consignment" : status;
    const payload: Record<string, unknown> = {
      title: title.trim(),
      category_id: categoryId || null,
      brand, model, specs_short: specsShort, specs,
      storage, color, condition, imei, serial_number: serial,
      battery_health: battery ? Number(battery) : null,
      has_box: hasBox, has_charger: hasCharger,
      description, source,
      buy_price: source === "consignment" ? 0 : (Number(buyPrice) || 0),
      sell_price: Number(sellPrice) || 0,
      min_price: Number(minPrice) || 0,
      status: finalStatus,
      buy_client_id: buyClientId,
      consignment_percent: source === "consignment" ? (Number(consignmentPercent) || 0) : null,
      consignment_owner_id: source === "consignment" ? buyClientId : null,
    };
    const r = await slApi<{ id: number; sku: string }>(token, "item_create", { method: "POST", body: payload });
    setSaving(false);
    if (r.ok) {
      setMsg(`Принято: ${r.data?.sku}`);
      window.setTimeout(() => onSaved(), 800);
    } else {
      setMsg(r.error || "Ошибка");
    }
  };

  return (
    <div className="space-y-3">
      {msg && <div className={`p-2.5 rounded-lg text-sm ${msg.startsWith("Принято") ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>{msg}</div>}

      <Section title="Тип приёма">
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "buyout", l: "Скупка", d: "купили навсегда", icon: "ShoppingCart" },
            { v: "consignment", l: "Комиссия", d: "на реализацию", icon: "Handshake" },
          ].map(o => (
            <button key={o.v} onClick={() => setSource(o.v as "buyout" | "consignment")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                source === o.v ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
              }`}>
              <Icon name={o.icon} size={16} />
              <div className="font-bold text-sm mt-1">{o.l}</div>
              <div className="text-[10px] opacity-70">{o.d}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Товар">
        <Field label="Категория">
          <select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm">
            <option value="">— выбрать —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label={<>Наименование {autofilled && <span className="text-emerald-400 text-[10px] ml-1">автозаполнено</span>}</>}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="iPhone 13 / Samsung Galaxy S22 / Антикварные часы..."
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/50 outline-none" />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Бренд"><Inp v={brand} s={setBrand} /></Field>
          <Field label="Модель"><Inp v={model} s={setModel} /></Field>
        </div>

        <Field label="Краткие характеристики (для ценника)">
          <input value={specsShort} onChange={e => setSpecsShort(e.target.value)}
            placeholder='6.1" 4/128GB, 90Hz'
            maxLength={100}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
          <div className="text-[10px] text-white/30 mt-0.5">{specsShort.length}/100 — будет на ценнике</div>
        </Field>

        <Field label="Полные характеристики (опц.)">
          <textarea value={specs} onChange={e => setSpecs(e.target.value)} rows={2}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <Field label="Память"><Inp v={storage} s={setStorage} ph="128GB" /></Field>
          <Field label="Цвет"><Inp v={color} s={setColor} ph="Чёрный" /></Field>
          <Field label="АКБ %"><Inp v={battery} s={setBattery} ph="100" /></Field>
        </div>

        <Field label="Состояние">
          <div className="flex gap-1 flex-wrap">
            {CONDITION_OPTIONS.map(c => (
              <button key={c} onClick={() => setCondition(c)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                  condition === c ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                }`}>{c}</button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="IMEI"><Inp v={imei} s={setImei} /></Field>
          <Field label="Серийный номер"><Inp v={serial} s={setSerial} /></Field>
        </div>

        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={hasBox} onChange={e => setHasBox(e.target.checked)} />
            <span>Коробка</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={hasCharger} onChange={e => setHasCharger(e.target.checked)} />
            <span>Зарядка</span>
          </label>
        </div>
      </Section>

      <Section title="Клиент (продавец)">
        <div className="relative">
          <input value={clientQuery} onChange={e => { setClientQuery(e.target.value); setClientId(""); setShowClientDrop(true); }}
            onFocus={() => setShowClientDrop(true)}
            placeholder="ФИО или телефон"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
          {showClientDrop && clientResults.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-[#141414] border border-[#1F1F1F] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {clientResults.map(c => (
                <button key={c.id} onClick={() => { setClientId(c.id); setClientQuery(c.full_name); setShowClientDrop(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-[#1F1F1F] last:border-0">
                  <div className="font-medium">{c.full_name}</div>
                  {c.phone && <div className="text-[11px] text-white/40">{c.phone}</div>}
                </button>
              ))}
            </div>
          )}
          <div className="text-[10px] text-white/30 mt-1">Если клиента нет — будет создан автоматически</div>
        </div>
      </Section>

      <Section title="Цены">
        <div className="grid grid-cols-3 gap-2">
          {source === "buyout" && (
            <Field label="Закупка ₽"><Inp v={buyPrice} s={setBuyPrice} ph="0" /></Field>
          )}
          <Field label="Продажа ₽"><Inp v={sellPrice} s={setSellPrice} ph="0" /></Field>
          <Field label="Мин. цена ₽"><Inp v={minPrice} s={setMinPrice} ph="0" /></Field>
          {source === "consignment" && (
            <Field label="Комиссия %"><Inp v={consignmentPercent} s={setConsignmentPercent} ph="20" /></Field>
          )}
        </div>
      </Section>

      {source === "buyout" && (
        <Section title="Куда поставить">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "stock", l: "На склад" },
              { v: "showcase", l: "На витрину" },
            ].map(o => (
              <button key={o.v} onClick={() => setStatus(o.v as "stock" | "showcase")}
                className={`p-2 rounded-lg border text-sm font-bold transition-all ${
                  status === o.v ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
                }`}>{o.l}</button>
            ))}
          </div>
        </Section>
      )}

      <Field label="Описание / заметки">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
      </Field>

      <button onClick={submit} disabled={saving}
        className="w-full bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
        <Icon name={saving ? "Loader" : "Check"} size={16} className={saving ? "animate-spin" : ""} />
        {saving ? "Сохраняю..." : "Принять товар"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold tracking-wide text-white/40 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Inp({ v, s, ph }: { v: string; s: (x: string) => void; ph?: string }) {
  return (
    <input value={v} onChange={e => s(e.target.value)} placeholder={ph}
      className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/50 outline-none" />
  );
}
