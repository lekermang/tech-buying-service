import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import PrintDocsButton from "./PrintDocsButton";
import { Row, Inp2, fmtRamStorage, parseStorageStr } from "./SLItemsCommon";
import { printLabelQuick, LABEL_SIZES, getLastLabelSize, setLastLabelSize } from "./labelPrinter";
import { shareToChat, formatSlItemShare } from "@/lib/shareToChat";

const PHONE_SPECS_AI_URL = "https://functions.poehali.dev/983744a8-1cfc-42d8-a566-bf31dfa328b2";

export default function SLItemDetail({ token, item: itemProp, isOwner, onClose, onUpdated, onSell }: { token: string; item: SLItem; isOwner?: boolean; onClose: () => void; onUpdated: () => void; onSell: () => void }) {
  const [editing, setEditing] = useState(false);
  const [item, setItem] = useState<SLItem>(itemProp);
  const [data, setData] = useState({ ...itemProp });
  useEffect(() => { setItem(itemProp); setData({ ...itemProp }); }, [itemProp]);
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [labelMenu, setLabelMenu] = useState(false);
  const [labelSize, setLabelSize] = useState<string>(() => getLastLabelSize());

  // ── Скидка на ценнике: чекбокс + старая/новая цена ─────────────────────────
  const [discountOn, setDiscountOn] = useState(false);
  const [oldPrice, setOldPrice] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const discountOpts = discountOn
    ? {
        enabled: true,
        oldPrice: oldPrice !== "" ? Number(oldPrice) : Number(item.sell_price) || 0,
        newPrice: newPrice !== "" ? Number(newPrice) : 0,
      }
    : undefined;
  const [branches, setBranches] = useState<{ id: number; name: string; address?: string | null }[]>([]);

  const isPhone = (() => {
    const t = `${item.category_path || ""} ${item.category_name || ""} ${item.title || ""}`.toLowerCase();
    return t.includes("телефон") || t.includes("смартфон") || t.includes("phone") || t.includes("iphone");
  })();
  const isAppleDevice = (() => {
    const t = `${data.brand || ""} ${data.model || ""} ${data.title || item.title || ""}`.toLowerCase();
    return t.includes("iphone") || t.includes("apple");
  })();

  const generateSpecs = async () => {
    setAiBusy(true);
    setAiMsg(null);
    try {
      const r = await fetch(`${PHONE_SPECS_AI_URL}?action=generate_one&t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });
      const j = await r.json();
      if (j.ok) {
        // Сразу обновляем локальный state — пользователь видит результат мгновенно
        setItem(prev => ({ ...prev, specs_short: j.specs_short ?? prev.specs_short, specs: j.specs ?? prev.specs }));
        setData(prev => ({ ...prev, specs_short: j.specs_short ?? prev.specs_short, specs: j.specs ?? prev.specs }));
        setAiMsg("Характеристики обновлены");
        // И параллельно обновляем родительский список
        onUpdated();
      } else {
        setAiMsg(j.error || "Ошибка генерации");
      }
    } catch (e) {
      setAiMsg("Ошибка сети");
    } finally {
      setAiBusy(false);
    }
  };

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<{ id: number; name: string; address?: string | null }[]>(token, "branches").then(r => {
      if (r.ok && r.data) setBranches(r.data);
    });
  }, [token]);

  const save = async () => {
    if (isPhone) {
      if (isAppleDevice) {
        if (!data.storage_gb) {
          alert("Для iPhone обязательна Память (ГБ)");
          return;
        }
      } else if (!data.ram_gb || !data.storage_gb) {
        alert("Для смартфона обязательны ОЗУ и Память (ГБ)");
        return;
      }
    }
    const ramStr = fmtRamStorage(data.ram_gb, data.storage_gb, null);
    setSaving(true);
    const r = await slApi(token, "item_update", { method: "POST", body: {
      id: item.id,
      title: data.title,
      category_id: data.category_id || null,
      brand: data.brand,
      model: data.model,
      specs_short: data.specs_short,
      specs: data.specs,
      storage: ramStr || data.storage,
      ram_gb: data.ram_gb || null,
      storage_gb: data.storage_gb || null,
      color: data.color,
      condition: data.condition,
      imei: data.imei,
      serial_number: data.serial_number,
      buy_price: data.buy_price,
      sell_price: data.sell_price,
      min_price: data.min_price,
      description: data.description,
      branch_id: data.branch_id || null,
    }});
    setSaving(false);
    if (r.ok) onUpdated();
  };
  const changeStatus = async (status: string) => {
    const r = await slApi(token, "item_status", { method: "POST", body: { item_id: item.id, status } });
    if (r.ok) onUpdated();
  };
  const stCfg = STATUS_LABEL[item.status] || STATUS_LABEL.stock;
  const currentCat = cats.find(c => c.id === item.category_id);

  const [shareToast, setShareToast] = useState<string | null>(null);
  const shareItem = async () => {
    const ok = await shareToChat(token, formatSlItemShare({
      id: item.id,
      brand: item.brand,
      model: item.model,
      imei: item.imei,
      buy_price: item.buy_price != null ? Number(item.buy_price) : null,
      sell_price: item.sell_price != null ? Number(item.sell_price) : null,
      status: STATUS_LABEL[item.status]?.l || item.status,
      notes: item.specs_short,
    }));
    setShareToast(ok ? "✅ Отправлено в чат" : "❌ Не удалось");
    setTimeout(() => setShareToast(null), 2000);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md overflow-y-auto"
        style={{ maxHeight: "calc(92dvh - env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between z-10 gap-2">
          <div className="font-bold text-sm truncate min-w-0 flex-1">
            {item.title}
            {(item.ram_gb || item.storage_gb) && (
              <span className="ml-1.5 text-[#FFD700]">
                {item.ram_gb && item.storage_gb ? `${item.ram_gb}/${item.storage_gb}` : (item.storage_gb || item.ram_gb)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!editing && item.status !== "sold" && item.status !== "returned" && (
              <button
                onClick={onSell}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-[12px] transition-all shadow-lg shadow-emerald-500/30"
              >
                <Icon name="ShoppingCart" size={13} />
                Продать
              </button>
            )}
            <button
              onClick={shareItem}
              title="Отправить карточку в чат сотрудников"
              className="text-white/60 hover:text-blue-300 p-1.5 rounded hover:bg-blue-500/10">
              <Icon name="MessageSquareShare" fallback="Send" size={16} />
            </button>
            <button
              onClick={() => printLabelQuick(item, { size: labelSize, discount: discountOpts })}
              title={`Печать ценника (${LABEL_SIZES.find(s => s.code === labelSize)?.name || labelSize})`}
              className="text-white/60 hover:text-[#FFD700] p-1.5 rounded hover:bg-[#FFD700]/10">
              <Icon name="Printer" size={16} />
            </button>
            <button onClick={onClose} className="text-white/40 p-1"><Icon name="X" size={16} /></button>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
            {item.sku && <span className="text-[11px] text-white/40">{item.sku}</span>}
          </div>
          {!editing ? (
            <>
              <Row k="Категория" v={currentCat?.path || currentCat?.name || item.category_name || "— не указана —"} />
              <Row k="Филиал" v={item.branch_name || "—"} />
              <Row k="Бренд / Модель" v={`${item.brand || "-"} ${item.model || ""}`} />
              <Row k="Характеристики" v={item.specs_short || "-"} />
              <Row k="ОЗУ / Память" v={fmtRamStorage(item.ram_gb, item.storage_gb, item.storage) || "—"} />
              <Row k="Цвет" v={item.color || "—"} />
              <Row k="Состояние" v={item.condition || "-"} />
              <Row k="IMEI" v={item.imei || "-"} />
              <Row k="Закупка" v={`${fmt(item.buy_price)} ₽`} />
              <Row k="Продажа" v={`${fmt(item.sell_price)} ₽`} />
              <Row k="Мин. цена" v={`${fmt(item.min_price)} ₽`} />
              {(item.quantity ?? 1) > 1 && (
                <Row k="Остаток на складе" v={`${item.quantity} шт`} />
              )}
              <Row k="Клиент" v={item.buy_client_name || "-"} />
              <div className="grid grid-cols-3 gap-1 mt-3">
                {["stock", "showcase", "consignment", "hidden"].map(s => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className="text-[10px] py-1.5 bg-[#141414] border border-[#1F1F1F] rounded hover:border-[#FFD700]/40">
                    {STATUS_LABEL[s]?.l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(true)} className="flex-1 bg-[#141414] border border-[#1F1F1F] py-2 rounded-lg text-sm">Редактировать</button>
              </div>
              {isPhone && (
                <button onClick={generateSpecs} disabled={aiBusy}
                  className="w-full mt-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  {aiBusy
                    ? <><Icon name="Loader" size={13} className="inline mr-1 animate-spin" />Генерирую...</>
                    : <><Icon name="Sparkles" size={13} className="inline mr-1" />Сгенерировать характеристики ИИ</>}
                </button>
              )}
              {aiMsg && <div className="text-[11px] text-center text-white/60 mt-1">{aiMsg}</div>}

              {/* ── Скидка на ценнике ─────────────────────────────── */}
              <div className="mt-2 bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={discountOn}
                    onChange={e => {
                      const on = e.target.checked;
                      setDiscountOn(on);
                      if (on && oldPrice === "") setOldPrice(String(item.sell_price || ""));
                    }}
                    className="accent-[#FFD700] w-3.5 h-3.5"
                  />
                  <span className="text-[12px] font-bold text-white">Печатать со скидкой</span>
                  <span className="text-[10px] text-white/40">старая цена будет зачёркнута</span>
                </label>
                {discountOn && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="block">
                      <div className="text-[10px] uppercase text-white/40 mb-0.5">Старая цена</div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={oldPrice}
                        onChange={e => setOldPrice(e.target.value)}
                        placeholder={String(item.sell_price || "")}
                        className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm text-white/80 line-through decoration-red-500"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[10px] uppercase text-[#FFD700] mb-0.5">Новая цена</div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        placeholder="напр. 9 990"
                        autoFocus
                        className="w-full bg-[#141414] border border-[#FFD700]/40 rounded px-2 py-1.5 text-sm font-bold text-[#FFD700]"
                      />
                    </label>
                    {oldPrice && newPrice && Number(newPrice) > 0 && Number(newPrice) < Number(oldPrice) && (
                      <div className="col-span-2 text-[10px] text-emerald-400 text-center">
                        Скидка {Math.round((1 - Number(newPrice) / Number(oldPrice)) * 100)}% — экономия {(Number(oldPrice) - Number(newPrice)).toLocaleString("ru-RU")}₽
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative mt-2">
                <div className="flex gap-0">
                  <button
                    onClick={() => printLabelQuick(item, { size: labelSize, discount: discountOpts })}
                    className="flex-1 bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/50 text-white py-2 rounded-l-lg text-sm font-bold flex items-center justify-center gap-1.5">
                    <Icon name="Printer" size={14} /> Печать ценника
                    <span className="text-[10px] text-[#FFD700]/80 ml-1">
                      {LABEL_SIZES.find(s => s.code === labelSize)?.name || labelSize}
                    </span>
                  </button>
                  <button
                    onClick={() => setLabelMenu(v => !v)}
                    title="Выбрать размер ценника"
                    className="bg-[#141414] border border-l-0 border-[#1F1F1F] hover:border-[#FFD700]/50 text-white px-3 py-2 rounded-r-lg">
                    <Icon name={labelMenu ? "ChevronUp" : "ChevronDown"} size={14} />
                  </button>
                </div>
                {labelMenu && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg shadow-xl overflow-hidden">
                    <div className="text-[10px] uppercase font-bold text-white/40 px-3 py-1.5 border-b border-[#1F1F1F]">
                      Размер ценника
                    </div>
                    {LABEL_SIZES.map(s => (
                      <button
                        key={s.code}
                        onClick={() => {
                          setLabelSize(s.code);
                          setLastLabelSize(s.code);
                          setLabelMenu(false);
                          printLabelQuick(item, { size: s.code, discount: discountOpts });
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#FFD700]/10 flex items-center justify-between border-b border-[#1F1F1F]/50 last:border-0 ${labelSize === s.code ? "text-[#FFD700]" : "text-white"}`}>
                        <span>{s.name}</span>
                        <span className="text-[10px] text-white/40">
                          {s.w}×{s.h} мм
                          {labelSize === s.code && <Icon name="Check" size={11} className="inline ml-1" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <PrintDocsButton token={token} itemId={item.id}
                  opType={item.status === "sold" ? "sell" : (item.source === "consignment" ? "consignment_in" : "buyout_individual")}
                  label="Документы по товару" />
              </div>
              {(isOwner || item.status !== "sold") && (
                <button
                  onClick={async () => {
                    const isSold = item.status === "sold";
                    const txt = isSold
                      ? "Удалить ПРОДАННЫЙ товар? Это действие необратимо."
                      : "Удалить товар? Это действие необратимо.";
                    if (!confirm(txt)) return;
                    const r = await slApi(token, "item_remove", { method: "POST", body: { id: item.id } });
                    if (r.ok) onUpdated();
                    else alert(r.error || "Ошибка удаления");
                  }}
                  className="w-full mt-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2 rounded-lg text-sm font-bold">
                  <Icon name="Trash2" size={13} className="inline mr-1" />
                  Удалить товар{item.status === "sold" ? " (проданный)" : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <Inp2 l="Наименование" v={data.title} s={v => setData({ ...data, title: v })} />
              <div>
                <div className="text-[11px] text-white/50 mb-0.5">Филиал / склад</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {branches.map(b => (
                    <button key={b.id} onClick={() => setData({ ...data, branch_id: b.id })}
                      className={`text-[11px] px-2 py-1.5 rounded border transition-all ${
                        data.branch_id === b.id ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
                      }`}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-white/50 mb-0.5">Категория</div>
                <CategoryTreeSelect categories={cats} value={data.category_id ?? ""} onChange={(id) => setData({ ...data, category_id: id || null })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Inp2 l="Бренд" v={data.brand || ""} s={v => setData({ ...data, brand: v })} />
                <Inp2 l="Модель" v={data.model || ""} s={v => setData({ ...data, model: v })} />
              </div>
              <Inp2 l="Краткие характеристики" v={data.specs_short || ""} s={v => setData({ ...data, specs_short: v })} />
              <div className="grid grid-cols-4 gap-2">
                <Inp2 l="ОЗУ ГБ" v={data.ram_gb ? String(data.ram_gb) : ""}
                  s={v => setData({ ...data, ram_gb: v ? Number(v.replace(/\D/g, "")) || null : null })}
                  required={isPhone && !isAppleDevice} invalid={isPhone && !isAppleDevice && !data.ram_gb} />
                <Inp2 l="Память ГБ" v={data.storage_gb ? String(data.storage_gb) : ""}
                  s={v => {
                    const n = v ? Number(v.replace(/\D/g, "")) || null : null;
                    setData({ ...data, storage_gb: n, storage: fmtRamStorage(data.ram_gb, n, null) || data.storage });
                  }}
                  required={isPhone} invalid={isPhone && !data.storage_gb} />
                <Inp2 l="Цвет" v={data.color || ""} s={v => setData({ ...data, color: v })} />
                <Inp2 l="Состояние" v={data.condition || ""} s={v => setData({ ...data, condition: v })} />
              </div>
              {data.storage && !data.ram_gb && !data.storage_gb && (
                <button type="button"
                  onClick={() => {
                    const p = parseStorageStr(data.storage);
                    setData({ ...data, ram_gb: p.ram ?? null, storage_gb: p.storage ?? null });
                  }}
                  className="text-[11px] text-[#FFD700]/70 hover:text-[#FFD700] underline">
                  Распознать «{data.storage}» → ОЗУ/Память
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Inp2 l="IMEI" v={data.imei || ""} s={v => setData({ ...data, imei: v })} />
                <Inp2 l="Серийный №" v={data.serial_number || ""} s={v => setData({ ...data, serial_number: v })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Inp2 l="Закупка ₽" v={String(data.buy_price || "")} s={v => setData({ ...data, buy_price: v })} />
                <Inp2
                  l={`Продажа ₽${item.status === "sold" && !isOwner ? " (только владелец)" : ""}`}
                  v={String(data.sell_price || "")}
                  s={v => setData({ ...data, sell_price: v })}
                  disabled={item.status === "sold" && !isOwner}
                />
                <Inp2 l="Мин. ₽" v={String(data.min_price || "")} s={v => setData({ ...data, min_price: v })} />
              </div>
              <div className="flex gap-2 sticky bottom-0 bg-[#0A0A0A] py-2 -mx-3 px-3">
                <button onClick={() => { setEditing(false); setData({ ...item }); }} className="flex-1 bg-[#141414] py-2 rounded-lg text-sm">Отмена</button>
                <button onClick={save} disabled={saving} className="flex-1 bg-[#FFD700] text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? "..." : "Сохранить"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
      {shareToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[210] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-2xl shadow-blue-500/30">
          {shareToast}
        </div>
      )}
    </div>
  );
}