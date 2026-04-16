import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

export const STATUSES = [
  { key: "new",           label: "Принята",       color: "bg-white/10 text-white/70",          dot: "bg-white/40" },
  { key: "in_progress",   label: "В работе",      color: "bg-blue-500/20 text-blue-400",        dot: "bg-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть", color: "bg-orange-500/20 text-orange-400",    dot: "bg-orange-400" },
  { key: "ready",         label: "Готово ✓",      color: "bg-yellow-500/20 text-[#FFD700]",     dot: "bg-[#FFD700]" },
  { key: "done",          label: "Выдано",        color: "bg-green-500/20 text-green-400",      dot: "bg-green-400" },
  { key: "cancelled",     label: "Отменено",      color: "bg-red-500/20 text-red-400",          dot: "bg-red-400" },
];

type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
  purchase_amount: number | null; repair_amount: number | null;
  completed_at: string | null; master_income: number | null; parts_name: string | null;
};

type Analytics = {
  period: string; total: number; done: number; cancelled: number;
  ready: number; in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

const statusInfo = (key: string) => STATUSES.find((s) => s.key === key) || STATUSES[0];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "" };
const EMPTY_READY = { purchase_amount: "", repair_amount: "", parts_name: "", admin_note: "" };

const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
const lbl = "font-roboto text-white/40 text-[10px] block mb-1";

type View = "orders" | "analytics";
type Period = "day" | "week" | "month";

export default function RepairTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<number, typeof EMPTY_READY>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [readyModal, setReadyModal] = useState<Order | null>(null);
  const [readyForm, setReadyForm] = useState(EMPTY_READY);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [readySaving, setReadySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let url = ADMIN_URL;
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (search.trim()) ps.push("search=" + encodeURIComponent(search.trim()));
    if (ps.length) url += "?" + ps.join("&");
    const res = await fetch(url, { headers: { ...adminHeaders(token) } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const loadAnalytics = useCallback(async (p: Period) => {
    setAnalyticsLoading(true);
    const res = await fetch(ADMIN_URL + "?action=analytics&period=" + p, { headers: { ...adminHeaders(token) } });
    const data = await res.json();
    setAnalytics(data);
    setAnalyticsLoading(false);
  }, [token]);

  useEffect(() => {
    if (view === "analytics") loadAnalytics(period);
  }, [view, period, loadAnalytics]);

  const updateStatus = async (id: number, status: string, extra?: Partial<typeof EMPTY_READY>) => {
    setSaving(true);
    setSaveError(null);
    const body: Record<string, unknown> = { id, status };
    if (extra) {
      if (extra.admin_note !== undefined) body.admin_note = extra.admin_note;
      if (extra.purchase_amount !== "") body.purchase_amount = parseInt(extra.purchase_amount || "0");
      if (extra.repair_amount !== "") body.repair_amount = parseInt(extra.repair_amount || "0");
      if (extra.parts_name) body.parts_name = extra.parts_name;
    }
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.error) {
      setSaveError(data.error || "Ошибка сохранения");
      return false;
    }
    setExpandedId(null);
    load();
    return true;
  };

  const saveEdit = async (o: Order) => {
    const ef = editForm[o.id] || EMPTY_READY;
    setSaving(true);
    setSaveError(null);
    const body: Record<string, unknown> = { id: o.id };
    if (ef.admin_note !== undefined) body.admin_note = ef.admin_note;
    if (ef.purchase_amount !== "") body.purchase_amount = parseInt(ef.purchase_amount);
    if (ef.repair_amount !== "") body.repair_amount = parseInt(ef.repair_amount);
    if (ef.parts_name) body.parts_name = ef.parts_name;
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.error) { setSaveError(data.error || "Ошибка"); return; }
    setExpandedId(null);
    load();
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Удалить заявку #" + id + "?")) return;
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  };

  const createOrder = async () => {
    if (!form.name || !form.phone) return;
    setCreating(true);
    await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
    });
    setCreating(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const openReadyModal = (o: Order) => {
    setReadyModal(o);
    setReadyForm({
      purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
      repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
      parts_name: o.parts_name || "",
      admin_note: o.admin_note || "",
    });
    setReadyError(null);
  };

  const submitReady = async () => {
    if (!readyModal) return;
    if (!readyForm.purchase_amount) { setReadyError("Укажите сумму закупки запчасти"); return; }
    if (!readyForm.repair_amount) { setReadyError("Укажите выданную сумму за ремонт"); return; }
    if (!readyForm.parts_name) { setReadyError("Укажите купленную запчасть"); return; }
    setReadySaving(true);
    setReadyError(null);
    const ok = await updateStatus(readyModal.id, "ready", readyForm);
    setReadySaving(false);
    if (ok) setReadyModal(null);
  };

  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <div className="h-full flex flex-col">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-[#222] flex items-center gap-3 flex-wrap">
        <div className="flex rounded overflow-hidden border border-[#333]">
          <button onClick={() => setView("orders")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "orders" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="ClipboardList" size={13} />Заявки
          </button>
          <button onClick={() => setView("analytics")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "analytics" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="BarChart2" size={13} />Аналитика
          </button>
        </div>

        {view === "orders" && (
          <>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, модели..."
              className="flex-1 min-w-[180px] bg-[#0D0D0D] border border-[#333] text-white px-3 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
            />
            <button onClick={load} disabled={loading} className="text-white/40 hover:text-white p-1.5 transition-colors">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
              className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
              <Icon name={showForm ? "X" : "Plus"} size={13} />
              {showForm ? "Отмена" : "Новая заявка"}
            </button>
          </>
        )}
      </div>

      {/* АНАЛИТИКА */}
      {view === "analytics" && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Переключатель периода */}
          <div className="flex gap-2 mb-5">
            {(["day", "week", "month"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 font-roboto text-xs border transition-colors ${period === p ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
                {p === "day" ? "Сегодня" : p === "week" ? "7 дней" : "30 дней"}
              </button>
            ))}
            <button onClick={() => loadAnalytics(period)} disabled={analyticsLoading} className="ml-auto text-white/30 hover:text-white transition-colors p-1.5">
              <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={14} className={analyticsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {analyticsLoading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю аналитику...</div>}

          {analytics && !analyticsLoading && (
            <>
              {/* Финансовые KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Выручка</div>
                  <div className="font-oswald font-bold text-[#FFD700] text-xl">{money(analytics.revenue)}</div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Закупка</div>
                  <div className="font-oswald font-bold text-orange-400 text-xl">{money(analytics.costs)}</div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Прибыль</div>
                  <div className={`font-oswald font-bold text-xl ${analytics.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{money(analytics.profit)}</div>
                </div>
                <div className="bg-[#1A1A1A] border border-green-500/20 p-4">
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-1">Доход мастера (50%)</div>
                  <div className="font-oswald font-bold text-green-400 text-xl">{money(analytics.master_total)}</div>
                </div>
              </div>

              {/* Статусы */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                {STATUSES.map(s => (
                  <div key={s.key} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-center">
                    <div className={`font-oswald font-bold text-lg ${s.color.split(" ")[1]}`}>
                      {(analytics as Record<string, unknown>)[s.key === "new" ? "new" : s.key] as number ?? 0}
                    </div>
                    <div className="font-roboto text-white/30 text-[10px] mt-0.5">{s.label.replace(" ✓","")}</div>
                  </div>
                ))}
              </div>

              {/* График по дням */}
              {analytics.daily.length > 1 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-3">Динамика по дням</div>
                  <div className="space-y-1.5">
                    {analytics.daily.slice().reverse().map(d => {
                      const maxRev = Math.max(...analytics.daily.map(x => x.revenue), 1);
                      const barW = Math.round((d.revenue / maxRev) * 100);
                      return (
                        <div key={d.day} className="flex items-center gap-3">
                          <span className="font-roboto text-white/30 text-[10px] w-16 shrink-0">
                            {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                          </span>
                          <div className="flex-1 h-5 bg-[#111] relative">
                            <div className="h-full bg-[#FFD700]/30 transition-all" style={{ width: barW + "%" }} />
                            <div className="h-full bg-green-500/40 absolute top-0 left-0 transition-all"
                              style={{ width: Math.round((d.profit / maxRev) * 100) + "%" }} />
                          </div>
                          <span className="font-roboto text-[10px] text-white/60 w-20 text-right shrink-0">
                            {money(d.revenue)}
                          </span>
                          <span className={`font-roboto text-[10px] w-16 text-right shrink-0 ${d.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {d.profit >= 0 ? "+" : ""}{money(d.profit)}
                          </span>
                          <span className="font-roboto text-white/30 text-[10px] w-8 text-right shrink-0">{d.done}✓</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ЗАЯВКИ */}
      {view === "orders" && (
        <>
          {/* Фильтры по статусу */}
          <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-[#222]">
            <button onClick={() => setFilterStatus("all")}
              className={`font-roboto text-xs px-2.5 py-1 border transition-colors ${filterStatus === "all" ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
              Все ({orders.length})
            </button>
            {STATUSES.map(s => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                className={`font-roboto text-xs px-2.5 py-1 border transition-colors flex items-center gap-1 ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
                {statusCounts[s.key] ? <span className="text-[10px] opacity-60">({statusCounts[s.key]})</span> : null}
              </button>
            ))}
          </div>

          {/* Форма создания */}
          {showForm && (
            <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
              <div className="font-roboto text-white/50 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className={lbl}>Имя клиента *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Телефон *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className={lbl}>Модель устройства</label>
                  <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14, Samsung A54..." className={inp} />
                </div>
                <div>
                  <label className={lbl}>Тип ремонта</label>
                  <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Замена дисплея, зарядка..." className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className={lbl}>Стоимость (₽)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Комментарий</label>
                  <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Разбитый экран..." className={inp} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
                  className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <Icon name="Check" size={13} />{creating ? "Создаю..." : "Создать заявку"}
                </button>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">Отмена</button>
              </div>
            </div>
          )}

          {/* Список заявок */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
            {!loading && orders.length === 0 && (
              <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
            )}
            {orders.map((o) => {
              const st = statusInfo(o.status);
              const isExpanded = expandedId === o.id;
              const ef = editForm[o.id] || {
                purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
                repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
                parts_name: o.parts_name || "",
                admin_note: o.admin_note || "",
              };

              return (
                <div key={o.id} className={`bg-[#1A1A1A] border transition-colors ${isExpanded ? "border-[#FFD700]/40" : "border-[#2A2A2A]"}`}>
                  {/* Шапка карточки */}
                  <div className="p-3 cursor-pointer select-none" onClick={() => {
                    setExpandedId(isExpanded ? null : o.id);
                    setSaveError(null);
                    if (!isExpanded) setEditForm(prev => ({ ...prev, [o.id]: {
                      purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
                      repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
                      parts_name: o.parts_name || "",
                      admin_note: o.admin_note || "",
                    }}));
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
                        <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                        <span className="font-oswald font-bold text-white text-sm">{o.name}</span>
                        <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()} className="text-[#FFD700] hover:text-yellow-400 text-xs font-roboto">{o.phone}</a>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-roboto text-[10px] text-white/30 hidden sm:inline">{fmt(o.created_at)}</span>
                        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-1.5 flex-wrap text-xs font-roboto">
                      {o.model && <span className="text-white/40">📱 {o.model}</span>}
                      {o.repair_type && <span className="text-white/40">🔧 {o.repair_type}</span>}
                      {o.price && <span className="text-[#FFD700]/80 font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
                      {o.repair_amount && <span className="text-green-400 text-[10px]">Выдано: {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
                      {o.master_income && <span className="text-green-300 text-[10px]">Мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
                    </div>
                  </div>

                  {/* Раскрытая часть */}
                  {isExpanded && (
                    <div className="border-t border-[#2A2A2A] p-3 space-y-3">
                      {o.comment && (
                        <div className="p-2 bg-white/5 border border-white/10 text-xs font-roboto text-white/60 italic">"{o.comment}"</div>
                      )}

                      {/* Поля закупки и выдачи */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className={lbl + " text-orange-400/80"}>🛒 Купленная запчасть</label>
                          <input value={ef.parts_name} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, parts_name: e.target.value } }))}
                            placeholder="Дисплей iPhone 14, аккумулятор..." className={inp} />
                        </div>
                        <div>
                          <label className={lbl + " text-orange-400/80"}>💸 Закупка (₽)</label>
                          <input type="number" value={ef.purchase_amount} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, purchase_amount: e.target.value } }))}
                            placeholder="500" className={inp} />
                        </div>
                        <div>
                          <label className={lbl + " text-green-400/80"}>💰 Выдано за ремонт (₽)</label>
                          <input type="number" value={ef.repair_amount} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, repair_amount: e.target.value } }))}
                            placeholder="1500" className={inp} />
                        </div>
                      </div>

                      {/* Расчёт дохода мастера */}
                      {ef.repair_amount && ef.purchase_amount && (
                        <div className="bg-green-500/10 border border-green-500/20 p-2 font-roboto text-xs">
                          <span className="text-green-400/70">Доход мастера (50% от прибыли): </span>
                          <span className="text-green-400 font-bold">
                            {Math.max(0, Math.round((parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                      )}

                      {/* Заметка */}
                      <div>
                        <label className={lbl}>Заметка</label>
                        <textarea value={ef.admin_note} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, admin_note: e.target.value } }))}
                          rows={2} placeholder="Внутренняя заметка..."
                          className={inp + " resize-none"} />
                      </div>

                      {saveError && <div className="text-red-400 font-roboto text-xs">{saveError}</div>}

                      {/* Кнопки управления статусом */}
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUSES.filter(s => s.key !== o.status).map(s => (
                          <button key={s.key}
                            onClick={() => {
                              if (s.key === "ready") {
                                openReadyModal(o);
                              } else {
                                updateStatus(o.id, s.key, ef);
                              }
                            }}
                            disabled={saving}
                            className={`font-roboto text-[10px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${s.color} border-current/30 hover:opacity-80 disabled:opacity-40`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                          </button>
                        ))}
                        <button onClick={() => saveEdit(o)} disabled={saving}
                          className="ml-auto font-roboto text-[10px] px-3 py-1.5 bg-[#FFD700] text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1">
                          <Icon name="Save" size={11} />{saving ? "Сохраняю..." : "Сохранить"}
                        </button>
                        <button onClick={() => deleteOrder(o.id)} className="font-roboto text-[10px] px-2.5 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                          <Icon name="Trash2" size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Модалка перевода в Готово */}
      {readyModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setReadyModal(null)}>
          <div className="bg-[#1A1A1A] border border-[#FFD700]/40 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-7 bg-[#FFD700]" />
              <div>
                <div className="font-oswald font-bold text-base uppercase">Перевод в «Готово»</div>
                <div className="font-roboto text-white/40 text-xs">#{readyModal.id} · {readyModal.name}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={lbl + " text-orange-400/80"}>🛒 Купленная запчасть *</label>
                <input value={readyForm.parts_name} onChange={e => setReadyForm(p => ({ ...p, parts_name: e.target.value }))}
                  placeholder="Дисплей iPhone 14, аккумулятор..." className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl + " text-orange-400/80"}>💸 Закупка (₽) *</label>
                  <input type="number" value={readyForm.purchase_amount} onChange={e => setReadyForm(p => ({ ...p, purchase_amount: e.target.value }))}
                    placeholder="500" className={inp} />
                </div>
                <div>
                  <label className={lbl + " text-green-400/80"}>💰 Выдано за ремонт (₽) *</label>
                  <input type="number" value={readyForm.repair_amount} onChange={e => setReadyForm(p => ({ ...p, repair_amount: e.target.value }))}
                    placeholder="1500" className={inp} />
                </div>
              </div>

              {readyForm.repair_amount && readyForm.purchase_amount && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 font-roboto text-sm text-center">
                  <div className="text-white/50 text-[10px] mb-0.5">Доход мастера (50% от прибыли)</div>
                  <div className="text-green-400 font-bold text-lg">
                    {Math.max(0, Math.round((parseInt(readyForm.repair_amount) - parseInt(readyForm.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              )}

              <div>
                <label className={lbl}>Заметка</label>
                <textarea value={readyForm.admin_note} onChange={e => setReadyForm(p => ({ ...p, admin_note: e.target.value }))}
                  rows={2} placeholder="Внутренняя заметка..." className={inp + " resize-none"} />
              </div>

              {readyError && <div className="text-red-400 font-roboto text-xs">{readyError}</div>}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={submitReady} disabled={readySaving}
                className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Icon name="Check" size={15} />{readySaving ? "Сохраняю..." : "Подтвердить «Готово»"}
              </button>
              <button onClick={() => setReadyModal(null)} className="px-4 text-white/30 font-roboto text-xs hover:text-white transition-colors">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
