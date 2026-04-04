import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

export const STATUSES = [
  { key: "new", label: "Принята", color: "bg-white/10 text-white/70" },
  { key: "in_progress", label: "В работе", color: "bg-blue-500/20 text-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть", color: "bg-orange-500/20 text-orange-400" },
  { key: "ready", label: "Готово ✓", color: "bg-yellow-500/20 text-[#FFD700]" },
  { key: "done", label: "Выдано", color: "bg-green-500/20 text-green-400" },
  { key: "cancelled", label: "Отменено", color: "bg-red-500/20 text-red-400" },
];

type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
};

const statusInfo = (key: string) => STATUSES.find((s) => s.key === key) || STATUSES[0];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "" };

export default function RepairTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filterStatus === "all" ? ADMIN_URL : ADMIN_URL + "?status=" + filterStatus;
    const res = await fetch(url, { headers: { "X-Admin-Token": token } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string, note: string) => {
    setSaving(true);
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ id, status, admin_note: note }),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const createOrder = async () => {
    if (!form.name || !form.phone) return;
    setCreating(true);
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": token },
      body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
    });
    setCreating(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
  const lbl = "font-roboto text-white/40 text-[10px] block mb-1";

  return (
    <div>
      {/* Фильтры + кнопка создания */}
      <div className="px-4 py-2 flex gap-1.5 flex-wrap items-center border-b border-[#222]">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {[{ key: "all", label: "Все" }, ...STATUSES].map((s) => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              className={`font-roboto text-xs px-2.5 py-1 border transition-colors ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={load} disabled={loading}
            className="text-white/40 hover:text-white transition-colors p-1.5">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
            className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
            <Icon name={showForm ? "X" : "Plus"} size={13} />
            {showForm ? "Отмена" : "Новая заявка"}
          </button>
        </div>
      </div>

      {/* Форма создания заявки */}
      {showForm && (
        <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
          <div className="font-roboto text-white/50 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Имя клиента *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Иван Иванов" className={inp} />
            </div>
            <div>
              <label className={lbl}>Телефон *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+7 999 123-45-67" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Модель устройства</label>
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                placeholder="iPhone 14, Samsung A54..." className={inp} />
            </div>
            <div>
              <label className={lbl}>Тип ремонта</label>
              <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))}
                placeholder="Замена дисплея, зарядка..." className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Стоимость (₽)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="1500" className={inp} />
            </div>
            <div>
              <label className={lbl}>Комментарий</label>
              <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Разбитый экран, не включается..." className={inp} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
              className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Icon name="Check" size={13} />
              {creating ? "Создаю..." : "Создать заявку"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список заявок */}
      <div className="px-4 py-3 space-y-2">
        {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
        {!loading && orders.length === 0 && (
          <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
        )}
        {orders.map((o) => {
          const st = statusInfo(o.status);
          const isEditing = editing === o.id;
          return (
            <div key={o.id} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              {/* Шапка карточки */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
                  <span className={`font-roboto text-[10px] px-2 py-0.5 ${st.color}`}>{st.label}</span>
                </div>
                <span className="font-roboto text-[10px] text-white/30">{fmt(o.created_at)}</span>
              </div>

              {/* Клиент */}
              <div className="flex items-center gap-3 mb-1.5">
                <span className="font-roboto text-sm text-white">{o.name}</span>
                <a href={`tel:${o.phone}`} className="font-roboto text-sm text-[#FFD700] hover:underline">{o.phone}</a>
              </div>

              {/* Детали */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {o.model && <span className="font-roboto text-xs text-white/60">{o.model}</span>}
                {o.repair_type && <span className="font-roboto text-xs text-white/40">· {o.repair_type}</span>}
                {o.price && <span className="ml-auto font-oswald font-bold text-white/70 text-sm">{o.price.toLocaleString("ru-RU")} ₽</span>}
              </div>
              {o.comment && !isEditing && (
                <div className="font-roboto text-[10px] text-white/30 mb-1 italic">💬 {o.comment}</div>
              )}
              {o.admin_note && !isEditing && (
                <div className="font-roboto text-xs text-white/40 border-t border-white/5 pt-1.5 mt-1 mb-2">📝 {o.admin_note}</div>
              )}

              {/* Редактирование статуса */}
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
                  className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors mt-1">
                  <Icon name="Pencil" size={11} /> Изменить статус
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
