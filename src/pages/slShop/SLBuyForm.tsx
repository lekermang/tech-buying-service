import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory, type SLClient, type SLBranch, type SLItem } from "./types";
import PrintDocsButton from "./PrintDocsButton";
import { printLabelQuick } from "./labelPrinter";
import { Section, Field } from "./SLBuyFormParts";
import SLBuyFormItemSection from "./SLBuyFormItemSection";
import SLBuyFormClientSection from "./SLBuyFormClientSection";
import SLBuyFormPricesAndPlace from "./SLBuyFormPricesAndPlace";
import { SLPageWrap } from "./slUI";

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
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const autofillTimer = useRef<number | null>(null);

  const PHONE_SPECS_AI_URL = "https://functions.poehali.dev/983744a8-1cfc-42d8-a566-bf31dfa328b2";

  const generateSpecsAI = async () => {
    if (aiBusy) return;
    if (!title.trim() && !brand && !model) {
      setAiMsg("Заполните наименование или бренд/модель");
      setTimeout(() => setAiMsg(null), 2500);
      return;
    }
    setAiBusy(true); setAiMsg(null);
    try {
      const res = await fetch(`${PHONE_SPECS_AI_URL}?action=generate_draft&t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          brand: brand.trim(),
          model: model.trim(),
          ram_gb: ramGb ? Number(ramGb) : null,
          storage_gb: storageGb ? Number(storageGb) : null,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        if (j.specs_short) setSpecsShort(j.specs_short);
        if (j.specs) setSpecs(j.specs);
        setAiMsg(j.source === "catalog" ? "Из справочника" : "Сгенерировано ИИ");
        setTimeout(() => setAiMsg(null), 2500);
      } else {
        setAiMsg(j.error || "Ошибка генерации");
      }
    } catch {
      setAiMsg("Ошибка сети");
    } finally {
      setAiBusy(false);
    }
  };

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

  const isAppleDevice = (() => {
    const t = `${brand} ${model} ${title}`.toLowerCase();
    return t.includes("iphone") || t.includes("apple");
  })();

  const submit = async () => {
    if (!title.trim()) { setMsg("Введите наименование"); return; }
    if (isPhoneCategory) {
      if (isAppleDevice) {
        if (!storageGb) { setMsg("Для iPhone обязательна Память (ГБ)"); return; }
        if (!battery) { setMsg("Для iPhone обязателен процент аккумулятора"); return; }
      } else if (!ramGb || !storageGb) {
        setMsg("Для смартфона обязательны ОЗУ и Память (ГБ)");
        return;
      }
    }
    setSaving(true); setMsg(null);
    let buyClientId: number | null = clientId === "" ? null : Number(clientId);
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
              const tpl = tplRes.data.find(t => t.code === "contract_purchase") || tplRes.data[0];
              printDoc(tpl as never, ctxRes.data as never);
            }
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
    <SLPageWrap max="md">
    <div className="space-y-2">
      {msg && (
        <div className={`px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-1.5 ${msg.startsWith("Принято") ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>
          <Icon name={msg.startsWith("Принято") ? "CheckCircle2" : "AlertTriangle"} size={12} />
          {msg}
        </div>
      )}

      <Section title="Филиал / склад">
        <div className="grid grid-cols-2 gap-1.5">
          {branches.map(b => (
            <button key={b.id} onClick={() => setBranchId(b.id)}
              title={`Принять товар в филиал «${b.name}»${b.address ? ` (${b.address})` : ""}`}
              className={`px-2.5 py-2 rounded-md border text-left transition-all active:scale-[0.98] ${
                branchId === b.id
                  ? "bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border-[#FFD700] text-[#FFD700] shadow-[0_2px_10px_rgba(255,215,0,0.18)]"
                  : "bg-[#0E0E0E] border-[#1A1A1A] text-white/60 hover:border-[#FFD700]/30 hover:bg-[#131313]"
              }`}>
              <div className="font-bold text-[12px] flex items-center gap-1 leading-tight">
                <Icon name="MapPin" size={11} />{b.name}
              </div>
              {b.address && <div className="text-[10px] opacity-70 truncate mt-0.5">{b.address}</div>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Тип приёма">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: "buyout", l: "Скупка", d: "купили навсегда", icon: "ShoppingCart", t: "Покупаем у клиента навсегда — товар становится нашим" },
            { v: "consignment", l: "Комиссия", d: "на реализацию", icon: "Handshake", t: "Берём на реализацию — клиент получает деньги после продажи" },
          ].map(o => (
            <button key={o.v} onClick={() => setSource(o.v as "buyout" | "consignment")}
              title={o.t}
              className={`px-2.5 py-2 rounded-md border text-left transition-all active:scale-[0.98] ${
                source === o.v
                  ? "bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border-[#FFD700] text-[#FFD700] shadow-[0_2px_10px_rgba(255,215,0,0.18)]"
                  : "bg-[#0E0E0E] border-[#1A1A1A] text-white/60 hover:border-[#FFD700]/30 hover:bg-[#131313]"
              }`}>
              <Icon name={o.icon} size={14} />
              <div className="font-bold text-[12px] mt-0.5 leading-tight">{o.l}</div>
              <div className="text-[10px] opacity-70 leading-tight">{o.d}</div>
            </button>
          ))}
        </div>
      </Section>

      <SLBuyFormItemSection
        cats={cats}
        categoryId={categoryId} setCategoryId={setCategoryId}
        title={title} setTitle={setTitle}
        model={model} setModel={setModel}
        brand={brand} setBrand={setBrand}
        specsShort={specsShort} setSpecsShort={setSpecsShort}
        specs={specs} setSpecs={setSpecs}
        ramGb={ramGb} setRamGb={setRamGb}
        storageGb={storageGb} setStorageGb={setStorageGb}
        color={color} setColor={setColor}
        battery={battery} setBattery={setBattery}
        condition={condition} setCondition={setCondition}
        imei={imei} setImei={setImei}
        serial={serial} setSerial={setSerial}
        hasBox={hasBox} setHasBox={setHasBox}
        hasCharger={hasCharger} setHasCharger={setHasCharger}
        autofilled={autofilled}
        isPhoneCategory={isPhoneCategory}
        isAppleDevice={isAppleDevice}
        aiBusy={aiBusy} aiMsg={aiMsg}
        generateSpecsAI={generateSpecsAI}
      />

      <SLBuyFormClientSection
        token={token}
        clientQuery={clientQuery} setClientQuery={setClientQuery}
        clientId={clientId} setClientId={setClientId}
        clientResults={clientResults}
        showClientDrop={showClientDrop} setShowClientDrop={setShowClientDrop}
        showQuickClient={showQuickClient} setShowQuickClient={setShowQuickClient}
      />

      <SLBuyFormPricesAndPlace
        source={source}
        buyPrice={buyPrice} setBuyPrice={setBuyPrice}
        sellPrice={sellPrice} setSellPrice={setSellPrice}
        minPrice={minPrice} setMinPrice={setMinPrice}
        consignmentPercent={consignmentPercent} setConsignmentPercent={setConsignmentPercent}
        status={status} setStatus={setStatus}
      />

      <Field label="Описание / заметки">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
      </Field>

      {!createdItemId ? (
        <>
          <label
            className="flex items-center justify-between bg-[#101010] border border-[#1A1A1A] hover:border-[#FFD700]/30 rounded-md px-2.5 py-1.5 cursor-pointer transition"
            title="Откроется окно печати договора в новой вкладке сразу после успешного сохранения"
          >
            <div className="flex items-center gap-1.5">
              <Icon name="Printer" size={12} className="text-[#FFD700]" />
              <span className="text-[12px]">Печатать договор сразу после приёма</span>
            </div>
            <button onClick={() => setAutoPrint(!autoPrint)}
              className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${autoPrint ? "bg-[#FFD700]" : "bg-[#1A1A1A]"}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoPrint ? "left-4" : "left-0.5"}`} />
            </button>
          </label>
          <div className="sticky bottom-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent pt-2 pb-1 -mx-1 px-1">
            <button
              onClick={submit}
              disabled={saving}
              title={saving ? "Сохранение..." : "Принять товар на склад и завершить операцию (Ctrl+Enter)"}
              className="w-full bg-gradient-to-b from-[#FFE34D] to-[#FFD700] text-black font-oswald font-bold uppercase tracking-wider text-[13px] py-3 rounded-lg shadow-[0_4px_18px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_6px_24px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name={saving ? "Loader2" : "Check"} size={15} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохраняю…" : "Принять товар"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/40 rounded-xl p-2.5 space-y-1.5 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[13px]">
            <Icon name="CheckCircle2" size={16} />Товар принят #{createdItemId}
          </div>
          <PrintDocsButton token={token} itemId={createdItemId}
            opType={source === "consignment" ? "consignment_in" : "buyout_individual"}
            label="Печать документов" />
          <button
            onClick={onSaved}
            title="Перейти на вкладку «Склад» и увидеть товар"
            className="w-full bg-gradient-to-b from-[#FFE34D] to-[#FFD700] text-black font-bold py-2 rounded-md uppercase tracking-wider text-[12px] shadow-[0_2px_10px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_4px_18px_rgba(255,215,0,0.45)] transition active:scale-[0.97]"
          >
            Готово, к складу
          </button>
        </div>
      )}
    </div>
    </SLPageWrap>
  );
}