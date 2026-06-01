import { useEffect } from "react";
import { slApi, type SLCategory, type SLClient, type SLBranch, type SLItem } from "../types";
import { triggerReaction } from "@/components/FunReaction";
import { printLabelQuick } from "../labelPrinter";
import type { SLBuyFormState } from "./useSLBuyFormState";

const PHONE_SPECS_AI_URL = "https://functions.poehali.dev/983744a8-1cfc-42d8-a566-bf31dfa328b2";

/**
 * Эффекты и actions формы скупки (загрузки, автоподстановки, поиск клиента,
 * генерация ИИ, submit). Вынесено из SLBuyForm.tsx 1:1 без изменения логики.
 */
export function useSLBuyFormActions(token: string, st: SLBuyFormState) {
  const {
    setCats, setBranches, setBranchId,
    title, setTitle,
    brand, setBrand,
    model, setModel,
    specsShort, setSpecsShort,
    specs, setSpecs,
    storage, setStorage,
    ramGb, setRamGb,
    storageGb, setStorageGb,
    color, setColor,
    condition,
    imei, serial,
    battery,
    hasBox, hasCharger,
    buyPrice, sellPrice, minPrice,
    quantity,
    source, consignmentPercent, status,
    description,
    categoryId,
    branchId,
    clientQuery,
    clientId,
    setClientResults,
    setAutofilled,
    setSaving, setMsg,
    setCreatedItemId,
    autoPrint,
    autoPrintLabel,
    aiBusy, setAiBusy, setAiMsg,
    autofillTimer,
    isPhoneCategory, isAppleDevice,
  } = st;

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

  // ─── Загрузка справочников: категории и филиалы ─────────────────────────────
  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<SLBranch[]>(token, "branches").then(r => {
      if (r.ok && r.data) {
        setBranches(r.data);
        const def = r.data.find(b => b.is_default) || r.data[0];
        if (def) setBranchId(def.id);
      }
    });
  }, [token, setCats, setBranches, setBranchId]);

  // ─── Автоподстановка характеристик по названию ─────────────────────────────
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

  // ─── Автоподстановка ОЗУ/Память в название и описание ──────────────────────
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

  // ─── Поиск клиента ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clientQuery.trim() || clientQuery.trim().length < 2) { setClientResults([]); return; }
    const t = window.setTimeout(async () => {
      const r = await slApi<SLClient[]>(token, "clients", { params: { q: clientQuery } });
      if (r.ok && r.data) setClientResults(r.data);
    }, 300);
    return () => window.clearTimeout(t);
  }, [clientQuery, token, setClientResults]);

  // ─── Submit ────────────────────────────────────────────────────────────────
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
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
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
      triggerReaction("item_bought", Number(payload.buy_price) || undefined);
      // Автопечать: договор и/или ценник — каждое под своим флагом
      if (autoPrint || autoPrintLabel) {
        setTimeout(async () => {
          try {
            const ctxRes = await slApi<{ item: unknown; client: unknown; branch: unknown; requisites: unknown; operation: unknown }>(
              token, "doc_context", { params: { item_id: r.data!.id } }
            );
            // 1) Договор — если включён autoPrint
            if (autoPrint && ctxRes.ok && ctxRes.data) {
              const tplRes = await slApi<{ id: number; code: string; name: string }[]>(
                token, "doc_templates", { params: { only_active: "1", op_type: source === "consignment" ? "consignment_in" : "buyout_individual" } }
              );
              if (tplRes.ok && tplRes.data && tplRes.data.length > 0) {
                const { printDoc } = await import("../docPrinter");
                const tpl = tplRes.data.find(t => t.code === "contract_purchase") || tplRes.data[0];
                printDoc(tpl as never, ctxRes.data as never);
              }
            }
            // 2) Ценник — печатаем 1 шт сразу, без задержки
            if (autoPrintLabel && ctxRes.ok && ctxRes.data && (ctxRes.data as { item?: SLItem }).item) {
              const item = (ctxRes.data as { item: SLItem }).item;
              try { printLabelQuick(item, { size: "58x40" }); }
              catch (err) { console.error("label-print", err); }
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

  return { generateSpecsAI, submit };
}

export type SLBuyFormActions = ReturnType<typeof useSLBuyFormActions>;