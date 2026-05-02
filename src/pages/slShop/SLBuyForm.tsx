import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory, type SLClient, type SLBranch, type SLItem, CONDITION_OPTIONS } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import QuickClientForm from "./QuickClientForm";
import PrintDocsButton from "./PrintDocsButton";
import { printLabelQuick } from "./labelPrinter";

export default function SLBuyForm({ token, onSaved }: { token: string; onSaved: () => void }) {
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [branches, setBranches] = useState<SLBranch[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [specsShort, setSpecsShort] = useState("");
  const [specs, setSpecs] = useState("");
  const [storage, setStorage] = useState("");
  const [ramGb, setRamGb] = useState("");
  const [storageGb, setStorageGb] = useState("");
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
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<number | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const autofillTimer = useRef<number | null>(null);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<SLBranch[]>(token, "branches").then(r => {
      if (r.ok && r.data) {
        setBranches(r.data);
        const def = r.data.find(b => b.is_default) || r.data[0];
        if (def) setBranchId(def.id);
      }
    });
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
        if (!storage && t.default_storage) {
          setStorage(t.default_storage);
          const m = String(t.default_storage).match(/(\d{1,3})\s*\/\s*(\d{2,4})/);
          if (m) {
            if (!ramGb) setRamGb(m[1]);
            if (!storageGb) setStorageGb(m[2]);
          } else {
            const m2 = String(t.default_storage).match(/(\d{2,4})/);
            if (m2 && !storageGb) setStorageGb(m2[1]);
          }
        }
        if (!color && t.default_color) setColor(t.default_color);
        setAutofilled(true);
        window.setTimeout(() => setAutofilled(false), 1500);
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, token]);

  // автоподстановка ОЗУ/Память в название и описание
  useEffect(() => {
    if (!ramGb && !storageGb) return;
    const ram = ramGb ? String(ramGb).trim() : "";
    const stor = storageGb ? String(storageGb).trim() : "";
    const memStr = ram && stor ? `${ram}/${stor}` : (stor || ram);
    if (!memStr) return;

    // Название: заменяем существующий "X/Y" или дописываем
    if (title.trim()) {
      const reFull = /(\d{1,3})\s*\/\s*(\d{2,4})\s*(GB|ГБ|gb|гб)?/;
      const reTail = /\s+(\d{2,4})\s*(GB|ГБ|gb|гб)?\s*$/;
      let next = title;
      if (reFull.test(next)) {
        next = next.replace(reFull, memStr);
      } else if (ram && stor && reTail.test(next)) {
        next = next.replace(reTail, ` ${memStr}`);
      } else if (!next.includes(memStr)) {
        next = `${next.trim()} ${memStr}`;
      }
      if (next !== title) setTitle(next);
    }

    // Краткое описание: подставляем/обновляем X/Y GB
    setSpecsShort(prev => {
      if (!ram || !stor) return prev;
      const target = `${ram}/${stor}GB`;
      const re = /(\d{1,3})\s*\/\s*(\d{2,4})\s*(GB|ГБ)?/i;
      if (!prev || !prev.trim()) return target;
      if (re.test(prev)) {
        const upd = prev.replace(re, target);
        return upd === prev ? prev : upd;
      }
      return prev.includes(target) ? prev : `${prev.trim()} • ${target}`;
    });

    // Полное описание: то же самое
    setSpecs(prev => {
      if (!ram || !stor) return prev;
      const target = `${ram}/${stor}GB`;
      const re = /(\d{1,3})\s*\/\s*(\d{2,4})\s*(GB|ГБ)?/i;
      if (!prev || !prev.trim()) return prev;
      if (re.test(prev)) {
        const upd = prev.replace(re, target);
        return upd === prev ? prev : upd;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ramGb, storageGb]);

  // поиск клиента
  useEffect(() => {
    if (!clientQuery.trim() || clientQuery.trim().length < 2) { setClientResults([]); return; }
    const t = window.setTimeout(async () => {
      const r = await slApi<SLClient[]>(token, "clients", { params: { q: clientQuery } });
      if (r.ok && r.data) setClientResults(r.data);
    }, 300);
    return () => window.clearTimeout(t);
  }, [clientQuery, token]);

  const isPhoneCategory = (() => {
    const cat = cats.find(c => c.id === categoryId);
    const t = `${cat?.path || ""} ${cat?.name || ""} ${title}`.toLowerCase();
    return t.includes("телефон") || t.includes("смартфон") || t.includes("phone") || t.includes("iphone");
  })();

  const submit = async () => {
    if (!title.trim()) { setMsg("Введите наименование"); return; }
    if (isPhoneCategory && (!ramGb || !storageGb)) {
      setMsg("Для смартфона обязательны ОЗУ и Память (ГБ)");
      return;
    }
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
      storage: (ramGb && storageGb) ? `${ramGb}/${storageGb}` : storage,
      ram_gb: ramGb ? Number(ramGb) : null,
      storage_gb: storageGb ? Number(storageGb) : null,
      color, condition, imei, serial_number: serial,
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
      branch_id: branchId || null,
    };
    const r = await slApi<{ id: number; sku: string }>(token, "item_create", { method: "POST", body: payload });
    setSaving(false);
    if (r.ok && r.data) {
      setMsg(`Принято: ${r.data.sku}`);
      setCreatedItemId(r.data.id);
      // Автопечать договора и контрольной бирки сразу после скупки
      if (autoPrint) {
        setTimeout(async () => {
          try {
            const ctxRes = await slApi<{ item: unknown; client: unknown; branch: unknown; requisites: unknown; operation: unknown }>(
              token, "doc_context", { params: { item_id: r.data!.id } }
            );
            const tplRes = await slApi<{ id: number; code: string; name: string }[]>(
              token, "doc_templates", { params: { only_active: "1", op_type: source === "consignment" ? "consignment_in" : "buyout_individual" } }
            );
            if (ctxRes.ok && ctxRes.data && tplRes.ok && tplRes.data && tplRes.data.length > 0) {
              const { printDoc } = await import("./docPrinter");
              // Печатаем первый подходящий документ (договор)
              const tpl = tplRes.data.find(t => t.code === "contract_purchase") || tplRes.data[0];
              printDoc(tpl as never, ctxRes.data as never);
            }
            // Автопечать ценника термо 58×40 после приёмки
            if (ctxRes.ok && ctxRes.data && (ctxRes.data as { item?: SLItem }).item) {
              const item = (ctxRes.data as { item: SLItem }).item;
              setTimeout(() => {
                try { printLabelQuick(item, { size: "58x40" }); }
                catch (err) { console.error("label-print", err); }
              }, 600);
            }
          } catch (e) {
            console.error("auto-print", e);
          }
        }, 300);
      }
    } else {
      setMsg(r.error || "Ошибка");
    }
  };

  return (
    <div className="space-y-3">
      {msg && <div className={`p-2.5 rounded-lg text-sm ${msg.startsWith("Принято") ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>{msg}</div>}

      <Section title="Филиал / склад">
        <div className="grid grid-cols-2 gap-2">
          {branches.map(b => (
            <button key={b.id} onClick={() => setBranchId(b.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                branchId === b.id ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
              }`}>
              <div className="font-bold text-sm flex items-center gap-1">
                <Icon name="MapPin" size={12} />{b.name}
              </div>
              {b.address && <div className="text-[10px] opacity-70 truncate">{b.address}</div>}
            </button>
          ))}
        </div>
      </Section>

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
          <CategoryTreeSelect categories={cats} value={categoryId} onChange={(id) => setCategoryId(id)} />
        </Field>

        <Field label={<>Наименование {autofilled && <span className="text-emerald-400 text-[10px] ml-1">автозаполнено</span>}</>}>
          <input value={title} onChange={e => {
            const v = e.target.value;
            // если модель совпадала со старым title или пуста — синхронизируем
            if (!model || model === title) setModel(v);
            setTitle(v);
          }}
            placeholder="iPhone 13 / Samsung Galaxy S22 / Антикварные часы..."
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/50 outline-none" />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Бренд"><Inp v={brand} s={setBrand} /></Field>
          <Field label="Модель"><Inp v={model} s={setModel} /></Field>
        </div>

        <Field label="Краткие характеристики (для ценника)">
          <input value={specsShort} onChange={e => setSpecsShort(e.target.value)}
            placeholder='6.1" OLED 120Hz, 8/128GB, A16, 48+12MP, 3349mAh'
            maxLength={200}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
          <div className="text-[10px] text-white/30 mt-0.5">{specsShort.length}/200 — будет на ценнике</div>
        </Field>

        <Field label="Полные характеристики (опц.)">
          <textarea value={specs} onChange={e => setSpecs(e.target.value)} rows={2}
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
        </Field>

        <div className="grid grid-cols-4 gap-2">
          <Field label={<>ОЗУ ГБ{isPhoneCategory && <span className="text-red-400 ml-0.5">*</span>}</>}>
            <Inp v={ramGb} s={(v) => setRamGb(v.replace(/\D/g, ""))} ph="4" />
          </Field>
          <Field label={<>Память ГБ{isPhoneCategory && <span className="text-red-400 ml-0.5">*</span>}</>}>
            <Inp v={storageGb} s={(v) => setStorageGb(v.replace(/\D/g, ""))} ph="128" />
          </Field>
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
        {showQuickClient ? (
          <QuickClientForm
            token={token}
            onCreated={(id, name) => {
              setClientId(id);
              setClientQuery(name);
              setShowQuickClient(false);
            }}
            onCancel={() => setShowQuickClient(false)}
          />
        ) : (
          <>
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
            </div>
            <button onClick={() => setShowQuickClient(true)}
              className="w-full bg-gradient-to-br from-[#FFD700]/15 to-transparent border border-[#FFD700]/40 text-[#FFD700] rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#FFD700]/20">
              <Icon name="Camera" size={14} />
              Новый клиент по фото паспорта
            </button>
            {clientId && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded text-[12px]">
                <Icon name="UserCheck" size={11} className="inline mr-1" />
                Клиент: {clientQuery} (ID #{clientId})
              </div>
            )}
          </>
        )}
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

      {!createdItemId ? (
        <>
          <label className="flex items-center justify-between bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 cursor-pointer">
            <div className="flex items-center gap-2">
              <Icon name="Printer" size={14} className="text-[#FFD700]" />
              <span className="text-sm">Печатать договор сразу после приёма</span>
            </div>
            <button onClick={() => setAutoPrint(!autoPrint)}
              className={`w-9 h-5 rounded-full relative transition-colors ${autoPrint ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoPrint ? "left-4" : "left-0.5"}`} />
            </button>
          </label>
          <button onClick={submit} disabled={saving}
            className="w-full bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name={saving ? "Loader" : "Check"} size={16} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохраняю..." : "Принять товар"}
          </button>
        </>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Icon name="CheckCircle2" size={18} />Товар принят #{createdItemId}
          </div>
          <PrintDocsButton token={token} itemId={createdItemId}
            opType={source === "consignment" ? "consignment_in" : "buyout_individual"}
            label="Печать документов" />
          <button onClick={onSaved}
            className="w-full bg-[#FFD700] text-black font-bold py-2.5 rounded-lg">
            Готово, к складу
          </button>
        </div>
      )}
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