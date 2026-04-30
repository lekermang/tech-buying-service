import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLCategory, STATUS_LABEL, PAYMENT_METHODS } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";

const STATUS_FILTERS = [
  { v: "", l: "Все" },
  { v: "stock", l: "Склад" },
  { v: "showcase", l: "Витрина" },
  { v: "consignment", l: "Реализация" },
  { v: "sold", l: "Проданные" },
  { v: "returned", l: "Возвраты" },
];

export default function SLItemsList({ token }: { token: string }) {
  const [items, setItems] = useState<SLItem[]>([]);
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<SLItem | null>(null);
  const [sellOpen, setSellOpen] = useState<SLItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLItem[]>(token, "items", {
      params: { status: filter, q, category_id: catFilter || undefined },
    });
    if (r.ok && r.data) setItems(r.data);
    setLoading(false);
  }, [token, filter, q, catFilter]);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Поиск */}
      <div className="relative mb-2">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Поиск по названию / IMEI / SKU"
          className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg pl-9 pr-3 py-2 text-sm focus:border-[#FFD700]/40 outline-none" />
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-full ${
              filter === f.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
            }`}>{f.l}</button>
        ))}
      </div>

      {/* Категории — корневые быстрым доступом + дерево */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
        <button onClick={() => setCatFilter("")}
          className={`shrink-0 text-[10px] px-2 py-1 rounded-full ${
            catFilter === "" ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
          }`}>Все категории</button>
        {cats.filter(c => !c.parent_id).map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)}
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
              catFilter === c.id ? "bg-white/15 text-white" : "bg-[#141414] text-white/40"
            }`}>
            <Icon name={c.icon} size={10} />{c.name}
          </button>
        ))}
      </div>
      <div className="mb-2">
        <CategoryTreeSelect categories={cats} value={catFilter} onChange={(id) => setCatFilter(id)} placeholder="Выбрать подкатегорию из дерева..." emptyLabel="Все категории" />
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center"><Icon name="Loader" size={14} className="animate-spin inline mr-1" />Загрузка...</div>}

      {!loading && items.length === 0 && (
        <div className="text-white/30 text-sm py-8 text-center">Нет товаров</div>
      )}

      <div className="space-y-1.5">
        {items.map(it => {
          const stCfg = STATUS_LABEL[it.status] || STATUS_LABEL.stock;
          return (
            <div key={it.id}
              className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 hover:border-[#FFD700]/30 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0" onClick={() => setOpen(it)} role="button">
                  <div className="font-bold text-sm truncate">{it.title}</div>
                  {it.specs_short && <div className="text-[11px] text-white/50 truncate">{it.specs_short}</div>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
                    {it.sku && <span className="text-[10px] text-white/30">{it.sku}</span>}
                    {it.imei && <span className="text-[10px] text-white/30">IMEI: {it.imei}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[#FFD700] font-bold text-sm">{fmt(it.sell_price)} ₽</div>
                  {it.status !== "sold" && it.status !== "returned" && (
                    <button onClick={() => setSellOpen(it)}
                      className="mt-1 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Продать
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <ItemDetail token={token} item={open} onClose={() => setOpen(null)} onUpdated={() => { setOpen(null); load(); }} onSell={() => { setSellOpen(open); setOpen(null); }} />}
      {sellOpen && <SellModal token={token} item={sellOpen} onClose={() => setSellOpen(null)} onDone={() => { setSellOpen(null); load(); }} />}
    </div>
  );
}

function ItemDetail({ token, item, onClose, onUpdated, onSell }: { token: string; item: SLItem; onClose: () => void; onUpdated: () => void; onSell: () => void }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({ ...item });
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
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
        <div className="p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${stCfg.color}`}>{stCfg.l}</span>
            {item.sku && <span className="text-[11px] text-white/40">{item.sku}</span>}
          </div>
          {!editing ? (
            <>
              <Row k="Категория" v={currentCat?.path || currentCat?.name || item.category_name || "— не указана —"} />
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
            </>
          ) : (
            <>
              <Inp2 l="Наименование" v={data.title} s={v => setData({ ...data, title: v })} />
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
                <Inp2 l="Продажа ₽" v={String(data.sell_price || "")} s={v => setData({ ...data, sell_price: v })} />
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

function SellModal({ token, item, onClose, onDone }: { token: string; item: SLItem; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(item.sell_price || ""));
  const [payment, setPayment] = useState("cash");
  const [contract, setContract] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setErr("Укажите сумму"); return; }
    setSaving(true); setErr(null);
    const r = await slApi(token, "item_sell", { method: "POST", body: {
      item_id: item.id, amount: Number(amount), payment_method: payment, contract_number: contract, note,
    }});
    setSaving(false);
    if (r.ok) onDone();
    else setErr(r.error || "Ошибка");
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-[#1F1F1F] flex items-center justify-between">
          <div className="font-bold">Продажа</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-[#141414] rounded-lg p-2.5 text-sm">
            <div className="font-bold">{item.title}</div>
            <div className="text-white/40 text-xs">{item.specs_short}</div>
          </div>
          <Inp2 l="Сумма ₽" v={amount} s={setAmount} />
          <div>
            <div className="text-[11px] text-white/50 mb-1">Способ оплаты</div>
            <div className="flex gap-1">
              {PAYMENT_METHODS.map(p => (
                <button key={p.v} onClick={() => setPayment(p.v)}
                  className={`flex-1 text-[11px] py-1.5 rounded ${payment === p.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <Inp2 l="Договор №" v={contract} s={setContract} />
          <Inp2 l="Примечание" v={note} s={setNote} />
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button onClick={submit} disabled={saving}
            className="w-full bg-emerald-500 text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
            {saving ? "..." : "Продать"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-[#1F1F1F]/60 last:border-0">
      <div className="text-white/50 text-[12px]">{k}</div>
      <div className="text-right text-[13px] truncate max-w-[60%]">{v}</div>
    </div>
  );
}

function Inp2({ l, v, s }: { l: string; v: string; s: (x: string) => void }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)}
        className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
    </div>
  );
}