import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";
const PRICES_URL = "https://functions.poehali.dev/cf08a66e-0b80-4105-826b-361e9be7f0f3";

const STATUSES = [
  { key: "new", label: "Принята", color: "bg-white/10 text-white/70" },
  { key: "in_progress", label: "В работе", color: "bg-blue-500/20 text-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть", color: "bg-orange-500/20 text-orange-400" },
  { key: "ready", label: "Готово ✓", color: "bg-yellow-500/20 text-[#FFD700]" },
  { key: "done", label: "Выдано", color: "bg-green-500/20 text-green-400" },
  { key: "cancelled", label: "Отменено", color: "bg-red-500/20 text-red-400" },
];

const CATEGORIES = ["Ремонт", "Закупка"];

type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string;
};

type PriceItem = {
  id: number; category: string; name: string;
  price_from: number; price_to: number | null; unit: string; sort_order: number;
};

const statusInfo = (key: string) => STATUSES.find((s) => s.key === key) || STATUSES[0];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

// ─── Вкладка Цены ───────────────────────────────────────────────────────────
function PricesTab({ token }: { token: string }) {
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
      category: form.category,
      name: form.name,
      price_from: parseInt(form.price_from),
      price_to: form.price_to ? parseInt(form.price_to) : null,
    };
    if (editingId !== "new") body.id = editingId;

    await fetch(PRICES_URL, {
      method: editingId === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
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
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const filtered = items.filter((i) => i.category === filterCat);

  return (
    <div className="px-4 py-3">
      {/* Фильтр категории */}
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

      {/* Форма добавления/редактирования */}
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
              <label className="font-roboto text-white/30 text-[10px] block mb-1">
                {filterCat === "Закупка" ? "Цена от (₽)" : "Цена от (₽)"}
              </label>
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

      {/* Список позиций */}
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

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"orders" | "prices">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    const url = filterStatus === "all" ? ADMIN_URL : ADMIN_URL + "?status=" + filterStatus;
    const res = await fetch(url, { headers: { "X-Admin-Token": tok } });
    if (res.status === 401) { setAuthed(false); setError("Неверный токен"); setLoading(false); return; }
    const data = await res.json();
    setOrders(data.orders || []);
    setAuthed(true);
    setLoading(false);
  }, [filterStatus]);

  const login = async () => {
    const tok = tokenInput.trim();
    if (!tok) return;
    localStorage.setItem("admin_token", tok);
    setToken(tok);
    await loadOrders(tok);
  };

  useEffect(() => {
    if (token) loadOrders(token);
  }, [token, loadOrders]);

  const updateStatus = async (id: number, status: string, note: string) => {
    setSaving(true);
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id, status, admin_note: note }),
    });
    setSaving(false);
    setEditing(null);
    loadOrders(token);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-[#FFD700] flex items-center justify-center">
              <Icon name="Lock" size={13} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide">Панель управления</span>
          </div>
          <div className="bg-[#1A1A1A] border border-[#333] p-5">
            <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Токен доступа</label>
            <input type="password" value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Введите токен..."
              className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors mb-3"
            />
            {error && <div className="text-red-400 font-roboto text-xs mb-3">{error}</div>}
            <button onClick={login}
              className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
              Войти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div className="border-b border-[#222] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={11} className="text-black" />
          </div>
          <div className="flex gap-1">
            {[
              { key: "orders", label: "Заявки", icon: "ClipboardList" },
              { key: "prices", label: "Цены", icon: "Tag" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                className={`flex items-center gap-1.5 font-oswald font-bold uppercase text-xs px-3 py-1.5 transition-colors ${tab === t.key ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white"}`}>
                <Icon name={t.icon} size={12} />
                {t.label}
                {t.key === "orders" && <span className="font-roboto font-normal">{orders.length > 0 ? ` (${orders.length})` : ""}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === "orders" && (
            <button onClick={() => loadOrders(token)} disabled={loading} className="text-white/40 hover:text-white transition-colors">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={15} className={loading ? "animate-spin" : ""} />
            </button>
          )}
          <button onClick={() => { localStorage.removeItem("admin_token"); setToken(""); setAuthed(false); setTokenInput(""); }}
            className="text-white/30 hover:text-red-400 transition-colors">
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </div>

      {/* Вкладка Заявки */}
      {tab === "orders" && (
        <>
          <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-[#222]">
            {[{ key: "all", label: "Все" }, ...STATUSES].map((s) => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                className={`font-roboto text-xs px-2.5 py-1 border transition-colors ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 space-y-2">
            {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
            {!loading && orders.length === 0 && <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>}
            {orders.map((o) => {
              const st = statusInfo(o.status);
              const isEditing = editing === o.id;
              return (
                <div key={o.id} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
                      <span className={`font-roboto text-[10px] px-2 py-0.5 rounded-sm ${st.color}`}>{st.label}</span>
                    </div>
                    <span className="font-roboto text-[10px] text-white/30">{fmt(o.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-roboto text-sm text-white">{o.name}</span>
                    <a href={`tel:${o.phone}`} className="font-roboto text-sm text-[#FFD700] hover:underline">{o.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {o.model && <span className="font-roboto text-xs text-white/60">{o.model}</span>}
                    {o.repair_type && <span className="font-roboto text-xs text-white/40">· {o.repair_type}</span>}
                    {o.price && <span className="ml-auto font-oswald font-bold text-white/70 text-sm">{o.price.toLocaleString("ru-RU")} ₽</span>}
                  </div>
                  {o.admin_note && !isEditing && (
                    <div className="font-roboto text-xs text-white/40 border-t border-white/5 pt-1.5 mb-2">{o.admin_note}</div>
                  )}
                  {isEditing ? (
                    <div className="border-t border-white/10 pt-2 mt-1">
                      <div className="font-roboto text-[10px] text-white/40 mb-1.5 uppercase tracking-wide">Изменить статус</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {STATUSES.map((s) => (
                          <button key={s.key} onClick={() => updateStatus(o.id, s.key, noteInput)} disabled={saving}
                            className={`font-roboto text-xs px-2.5 py-1 border transition-colors disabled:opacity-50 ${o.status === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Комментарий клиенту (необязательно)..." rows={2}
                        className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors resize-none mb-1.5" />
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(o.id, o.status, noteInput)} disabled={saving}
                          className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
                          {saving ? "..." : "Сохранить"}
                        </button>
                        <button onClick={() => setEditing(null)} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(o.id); setNoteInput(o.admin_note || ""); }}
                      className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors">
                      <Icon name="Pencil" size={11} /> Изменить статус
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Вкладка Цены */}
      {tab === "prices" && <PricesTab token={token} />}
    </div>
  );
}
