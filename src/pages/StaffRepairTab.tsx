import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const REPAIR_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

const STATUSES = [
  { key: "new", label: "Принята", color: "bg-white/10 text-white/70", dot: "bg-white/40" },
  { key: "in_progress", label: "В работе", color: "bg-blue-500/20 text-blue-400", dot: "bg-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть", color: "bg-orange-500/20 text-orange-400", dot: "bg-orange-400" },
  { key: "ready", label: "Готово ✓", color: "bg-yellow-500/20 text-[#FFD700]", dot: "bg-[#FFD700]" },
  { key: "done", label: "Выдано", color: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
  { key: "cancelled", label: "Отменено", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
];

type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
  purchase_amount: number | null; repair_amount: number | null; completed_at: string | null;
};

type DayStat = {
  day: string; total: number; done: number; cancelled: number;
  revenue: number; costs: number; profit: number;
};

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const fmtDay = (day: string) => {
  const d = new Date(day);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", weekday: "short" });
};

const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "" };
const EMPTY_COMPLETE = { purchase_amount: "", repair_amount: "" };

type View = "list" | "stats";

export default function StaffRepairTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("list");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Форма новой заявки
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Редактирование статуса
  const [editing, setEditing] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Завершение ремонта
  const [completing, setCompleting] = useState<number | null>(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
  const [completeSaving, setCompleteSaving] = useState(false);

  const headers = { "Content-Type": "application/json", "X-Employee-Token": token };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const url = filterStatus === "all" ? REPAIR_URL : `${REPAIR_URL}?status=${filterStatus}`;
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${REPAIR_URL}?action=daily_stats`, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setStats(data.stats || []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (view === "list") loadOrders();
    else loadStats();
  }, [view, loadOrders, loadStats]);

  const createOrder = async () => {
    if (!form.name || !form.phone) return;
    setCreating(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
    });
    setCreating(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    loadOrders();
  };

  const updateStatus = async (id: number, status: string, note: string) => {
    setSaving(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ id, status, admin_note: note }),
    });
    setSaving(false);
    setEditing(null);
    loadOrders();
  };

  const completeRepair = async (id: number) => {
    setCompleteSaving(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({
        action: "complete", id,
        purchase_amount: completeForm.purchase_amount ? parseInt(completeForm.purchase_amount) : null,
        repair_amount: completeForm.repair_amount ? parseInt(completeForm.repair_amount) : null,
      }),
    });
    setCompleteSaving(false);
    setCompleting(null);
    setCompleteForm(EMPTY_COMPLETE);
    loadOrders();
  };

  const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
  const lbl = "font-roboto text-white/40 text-[10px] block mb-1";

  return (
    <div>
      {/* Шапка с переключателем вид + кнопки */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#222] flex-wrap">
        <div className="flex gap-1 bg-[#111] p-0.5">
          <button onClick={() => setView("list")}
            className={`font-roboto text-xs px-3 py-1.5 transition-colors ${view === "list" ? "bg-[#FFD700] text-black font-bold" : "text-white/40 hover:text-white"}`}>
            Заявки
          </button>
          <button onClick={() => setView("stats")}
            className={`font-roboto text-xs px-3 py-1.5 transition-colors ${view === "stats" ? "bg-[#FFD700] text-black font-bold" : "text-white/40 hover:text-white"}`}>
            Статистика
          </button>
        </div>

        {view === "list" && (
          <>
            <div className="flex gap-1 flex-wrap flex-1">
              {[{ key: "all", label: "Все" }, ...STATUSES].map(s => (
                <button key={s.key} onClick={() => setFilterStatus(s.key)}
                  className={`font-roboto text-[10px] px-2 py-1 border transition-colors ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={loadOrders} disabled={loading}
                className="text-white/40 hover:text-white transition-colors p-1.5 border border-white/10">
                <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
              </button>
              <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); setEditing(null); setCompleting(null); }}
                className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
                <Icon name={showForm ? "X" : "Plus"} size={12} />
                {showForm ? "Отмена" : "Заявка"}
              </button>
            </div>
          </>
        )}

        {view === "stats" && (
          <button onClick={loadStats} disabled={loading}
            className="ml-auto text-white/40 hover:text-white transition-colors p-1.5 border border-white/10">
            <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {/* Форма создания */}
      {view === "list" && showForm && (
        <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
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
              <label className={lbl}>Примерная стоимость (₽)</label>
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

      {/* СПИСОК ЗАЯВОК */}
      {view === "list" && (
        <div className="px-4 py-3 space-y-2">
          {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
          {!loading && orders.length === 0 && (
            <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
          )}
          {orders.map(o => {
            const st = statusInfo(o.status);
            const isEditing = editing === o.id;
            const isCompleting = completing === o.id;
            const isDone = o.status === "done";

            return (
              <div key={o.id} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                {/* Шапка */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
                    <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    {isDone && o.completed_at && (
                      <span className="font-roboto text-[9px] text-white/25">выдано {fmt(o.completed_at)}</span>
                    )}
                  </div>
                  <span className="font-roboto text-[10px] text-white/30">{fmt(o.created_at)}</span>
                </div>

                {/* Клиент */}
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-roboto text-sm text-white font-medium">{o.name}</span>
                  <a href={`tel:${o.phone}`} className="font-roboto text-sm text-[#FFD700] hover:underline">{o.phone}</a>
                </div>

                {/* Детали ремонта */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {o.model && <span className="font-roboto text-xs text-white/60 bg-white/5 px-2 py-0.5">{o.model}</span>}
                  {o.repair_type && <span className="font-roboto text-xs text-white/40">🔧 {o.repair_type}</span>}
                  {o.price && <span className="ml-auto font-oswald font-bold text-white/50 text-sm">{o.price.toLocaleString("ru-RU")} ₽</span>}
                </div>

                {/* Суммы (если заполнены) */}
                {(o.purchase_amount || o.repair_amount) && (
                  <div className="flex gap-3 mb-1.5 bg-black/30 px-2 py-1.5 mt-1">
                    {o.purchase_amount && (
                      <div className="flex items-center gap-1">
                        <span className="font-roboto text-[10px] text-white/30">Закупка:</span>
                        <span className="font-oswald font-bold text-orange-400 text-xs">{o.purchase_amount.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                    {o.repair_amount && (
                      <div className="flex items-center gap-1">
                        <span className="font-roboto text-[10px] text-white/30">Выручка:</span>
                        <span className="font-oswald font-bold text-green-400 text-xs">{o.repair_amount.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                    {o.purchase_amount && o.repair_amount && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="font-roboto text-[10px] text-white/30">Прибыль:</span>
                        <span className={`font-oswald font-bold text-xs ${o.repair_amount - o.purchase_amount >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                          {(o.repair_amount - o.purchase_amount).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {o.comment && !isEditing && !isCompleting && (
                  <div className="font-roboto text-[10px] text-white/30 italic mb-1">💬 {o.comment}</div>
                )}
                {o.admin_note && !isEditing && !isCompleting && (
                  <div className="font-roboto text-xs text-white/40 border-t border-white/5 pt-1.5 mt-1 mb-1">📝 {o.admin_note}</div>
                )}

                {/* Форма завершения ремонта */}
                {isCompleting && (
                  <div className="border-t border-[#FFD700]/20 pt-3 mt-2">
                    <div className="font-roboto text-[10px] text-[#FFD700]/70 mb-2 uppercase tracking-wide">Завершить ремонт — укажите суммы</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className={lbl}>Сумма закупки (₽)</label>
                        <input type="number" value={completeForm.purchase_amount}
                          onChange={e => setCompleteForm(p => ({ ...p, purchase_amount: e.target.value }))}
                          placeholder="500" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Взято за ремонт (₽)</label>
                        <input type="number" value={completeForm.repair_amount}
                          onChange={e => setCompleteForm(p => ({ ...p, repair_amount: e.target.value }))}
                          placeholder="1500" className={inp} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => completeRepair(o.id)} disabled={completeSaving}
                        className="bg-green-600 hover:bg-green-500 text-white font-oswald font-bold px-4 py-2 uppercase text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        <Icon name="CheckCircle" size={13} />
                        {completeSaving ? "Сохраняю..." : "Завершить ремонт"}
                      </button>
                      <button onClick={() => { setCompleting(null); setCompleteForm(EMPTY_COMPLETE); }}
                        className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Форма смены статуса */}
                {isEditing && !isCompleting && (
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="font-roboto text-[10px] text-white/40 mb-1.5 uppercase tracking-wide">Изменить статус</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {STATUSES.filter(s => s.key !== "done").map(s => (
                        <button key={s.key} onClick={() => updateStatus(o.id, s.key, noteInput)} disabled={saving}
                          className={`font-roboto text-xs px-2.5 py-1 border transition-colors disabled:opacity-50 ${o.status === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
                      placeholder="Заметка для клиента (необязательно)..." rows={2}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors resize-none mb-1.5" />
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(o.id, o.status, noteInput)} disabled={saving}
                        className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
                        {saving ? "..." : "Сохранить"}
                      </button>
                      <button onClick={() => setEditing(null)} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                {!isEditing && !isCompleting && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                    {!isDone && (
                      <>
                        <button onClick={() => { setEditing(o.id); setNoteInput(o.admin_note || ""); setCompleting(null); }}
                          className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors">
                          <Icon name="Pencil" size={11} /> Сменить статус
                        </button>
                        <button onClick={() => { setCompleting(o.id); setCompleteForm(EMPTY_COMPLETE); setEditing(null); }}
                          className="flex items-center gap-1 text-white/30 hover:text-green-400 font-roboto text-[10px] transition-colors ml-auto">
                          <Icon name="CheckCircle" size={11} /> Завершить ремонт
                        </button>
                      </>
                    )}
                    {isDone && (
                      <span className="font-roboto text-[10px] text-green-400/50 flex items-center gap-1">
                        <Icon name="CheckCircle" size={11} /> Ремонт завершён
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* СТАТИСТИКА */}
      {view === "stats" && (
        <div className="px-4 py-3">
          {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
          {!loading && stats.length === 0 && (
            <div className="text-center py-10 text-white/30 font-roboto text-sm">Нет данных за последние 30 дней</div>
          )}
          {!loading && stats.length > 0 && (
            <>
              {/* Итого за период */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Всего заявок", value: stats.reduce((a, s) => a + s.total, 0), unit: "шт", color: "text-white" },
                  { label: "Выручка", value: stats.reduce((a, s) => a + s.revenue, 0).toLocaleString("ru-RU"), unit: "₽", color: "text-green-400" },
                  { label: "Прибыль", value: stats.reduce((a, s) => a + s.profit, 0).toLocaleString("ru-RU"), unit: "₽", color: "text-[#FFD700]" },
                ].map(card => (
                  <div key={card.label} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-center">
                    <div className="font-roboto text-white/30 text-[10px] mb-1">{card.label}</div>
                    <div className={`font-oswald font-bold text-lg ${card.color}`}>{card.value}</div>
                    <div className="font-roboto text-white/30 text-[10px]">{card.unit}</div>
                  </div>
                ))}
              </div>

              {/* Дневная таблица */}
              <div className="bg-[#1A1A1A] border border-[#2A2A2A]">
                <div className="grid grid-cols-6 gap-0 border-b border-[#333] px-3 py-1.5">
                  {["День", "Заявок", "Выдано", "Закупка", "Выручка", "Прибыль"].map(h => (
                    <div key={h} className="font-roboto text-[9px] text-white/30 uppercase tracking-wide text-center">{h}</div>
                  ))}
                </div>
                {stats.map(s => (
                  <div key={s.day} className="grid grid-cols-6 gap-0 border-b border-[#222] px-3 py-2 hover:bg-white/2 transition-colors">
                    <div className="font-roboto text-[11px] text-white/60">{fmtDay(s.day)}</div>
                    <div className="font-roboto text-[11px] text-white text-center">{s.total}</div>
                    <div className="font-roboto text-[11px] text-green-400 text-center">{s.done}</div>
                    <div className="font-roboto text-[11px] text-orange-400 text-center">
                      {s.costs > 0 ? s.costs.toLocaleString("ru-RU") : "—"}
                    </div>
                    <div className="font-roboto text-[11px] text-green-400 text-center">
                      {s.revenue > 0 ? s.revenue.toLocaleString("ru-RU") : "—"}
                    </div>
                    <div className={`font-oswald font-bold text-[11px] text-center ${s.profit > 0 ? "text-[#FFD700]" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                      {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
