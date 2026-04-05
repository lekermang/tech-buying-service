import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const PRICES_URL = "https://functions.poehali.dev/cf08a66e-0b80-4105-826b-361e9be7f0f3";

const CATEGORIES = ["Ремонт", "Закупка"];

type PriceItem = {
  id: number; category: string; name: string;
  price_from: number; price_to: number | null; unit: string; sort_order: number;
};

export default function PricesTab({ token }: { token: string }) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("Ремонт");
  const [form, setForm] = useState({ category: "Ремонт", name: "", price_from: "", price_to: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(PRICES_URL);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item: PriceItem) => {
    setEditingId(item.id);
    setForm({ category: item.category, name: item.name, price_from: String(item.price_from), price_to: item.price_to ? String(item.price_to) : "" });
  };

  const startNew = () => {
    setEditingId("new");
    setForm({ category: filterCat, name: "", price_from: "", price_to: "" });
  };

  const cancel = () => { setEditingId(null); };

  const save = async () => {
    if (!form.name || !form.price_from) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      category: form.category, name: form.name,
      price_from: parseInt(form.price_from),
      price_to: form.price_to ? parseInt(form.price_to) : null,
    };
    if (editingId !== "new") body.id = editingId;
    await fetch(PRICES_URL, {
      method: editingId === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditingId(null);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить позицию?")) return;
    await fetch(PRICES_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const filtered = items.filter((i) => i.category === filterCat);

  return (
    <div className="px-4 py-3">
      <div className="flex gap-1.5 mb-4">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`font-roboto text-xs px-3 py-1.5 border transition-colors ${filterCat === c ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
            {c}
          </button>
        ))}
        <button onClick={startNew}
          className="ml-auto flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
          <Icon name="Plus" size={13} /> Добавить
        </button>
      </div>

      {editingId !== null && (
        <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-3 mb-3">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-2">
            {editingId === "new" ? "Новая позиция" : "Редактировать"}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Категория</label>
              <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors appearance-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Название</label>
              <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Замена дисплея..."
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Цена от (₽)</label>
              <input type="number" value={form.price_from} onChange={(e) => setForm(p => ({ ...p, price_from: e.target.value }))}
                placeholder="600"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
            <div>
              <label className="font-roboto text-white/30 text-[10px] block mb-1">Цена до (₽)</label>
              <input type="number" value={form.price_to} onChange={(e) => setForm(p => ({ ...p, price_to: e.target.value }))}
                placeholder="1000 (необязательно)"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name || !form.price_from}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {saving ? "..." : "Сохранить"}
            </button>
            <button onClick={cancel} className="text-white/30 font-roboto text-xs hover:text-white transition-colors">Отмена</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-white/30 font-roboto text-sm">Загружаю...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-white/30 font-roboto text-sm">Нет позиций</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <div key={item.id} className="bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate">{item.name}</div>
                <div className="font-roboto text-[10px] text-white/40">{item.category}</div>
              </div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm shrink-0">
                {item.price_to && item.price_from !== item.price_to
                  ? `${item.price_from.toLocaleString("ru-RU")}–${item.price_to.toLocaleString("ru-RU")} ₽`
                  : `${item.price_from.toLocaleString("ru-RU")} ₽`}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(item)} className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
                  <Icon name="Pencil" size={13} />
                </button>
                <button onClick={() => remove(item.id)} className="text-white/30 hover:text-red-400 transition-colors p-1">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}