import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import PrintDocsButton from "./PrintDocsButton";
import { Row, Inp2 } from "./SLItemsCommon";

export default function SLItemDetail({ token, item, isOwner, onClose, onUpdated, onSell }: { token: string; item: SLItem; isOwner?: boolean; onClose: () => void; onUpdated: () => void; onSell: () => void }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({ ...item });
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string; address?: string | null }[]>([]);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<{ id: number; name: string; address?: string | null }[]>(token, "branches").then(r => {
      if (r.ok && r.data) setBranches(r.data);
    });
  }, [token]);

  const save = async () => {
    setSaving(true);
    const r = await slApi(token, "item_update", { method: "POST", body: {
      id: item.id,
      title: data.title,
      category_id: data.category_id || null,
      brand: data.brand,
      model: data.model,
      specs_short: data.specs_short,
      specs: data.specs,
      storage: data.storage,
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
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between z-10">
          <div className="font-bold text-sm truncate">{item.title}</div>
          <button onClick={onClose} className="text-white/40 p-1"><Icon name="X" size={16} /></button>
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
              <Row k="Память / Цвет" v={`${item.storage || "-"} / ${item.color || "-"}`} />
              <Row k="Состояние" v={item.condition || "-"} />
              <Row k="IMEI" v={item.imei || "-"} />
              <Row k="Закупка" v={`${fmt(item.buy_price)} ₽`} />
              <Row k="Продажа" v={`${fmt(item.sell_price)} ₽`} />
              <Row k="Мин. цена" v={`${fmt(item.min_price)} ₽`} />
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
                {item.status !== "sold" && item.status !== "returned" && (
                  <button onClick={onSell} className="flex-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-2 rounded-lg text-sm font-bold">Продать</button>
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
              <div className="grid grid-cols-3 gap-2">
                <Inp2 l="Память" v={data.storage || ""} s={v => setData({ ...data, storage: v })} />
                <Inp2 l="Цвет" v={data.color || ""} s={v => setData({ ...data, color: v })} />
                <Inp2 l="Состояние" v={data.condition || ""} s={v => setData({ ...data, condition: v })} />
              </div>
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
    </div>
  );
}
