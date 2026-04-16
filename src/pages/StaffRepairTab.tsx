import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, STATUSES, Order, DayStat, EMPTY_FORM, INP, LBL, fmt, fmtDay, printReceipt } from "./repair/types";

type View = "list" | "analytics";
type Period = "day" | "week" | "month";

type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

const EMPTY_READY = { purchase_amount: "", repair_amount: "", parts_name: "", admin_note: "" };

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

const money = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("ru-RU") + " ₽" : "—";

export default function StaffRepairTab({ token, isOwner = false }: { token: string; isOwner?: boolean }) {
  const [view, setView] = useState<View>("list");

  // Список заявок
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Карточки
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<number, {
    name: string; phone: string; model: string; repair_type: string;
    price: string; comment: string; admin_note: string;
    purchase_amount: string; repair_amount: string; parts_name: string;
  }>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Форма новой заявки
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Модалка «Готово»
  const [readyModal, setReadyModal] = useState<Order | null>(null);
  const [readyForm, setReadyForm] = useState(EMPTY_READY);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [readySaving, setReadySaving] = useState(false);

  // Аналитика
  const [analytics, setAnalytics] = useState<RepairAnalytics | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Статистика (старая, для совместимости)
  const [stats, setStats] = useState<DayStat[]>([]);

  const headers = { "Content-Type": "application/json", "X-Employee-Token": token };

  // ─── Загрузка заявок ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoading(true);
    let url = REPAIR_URL;
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (search.trim()) ps.push("search=" + encodeURIComponent(search.trim()));
    if (ps.length) url += "?" + ps.join("&");
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus, search]);

  // ─── Загрузка аналитики ───────────────────────────────────────────────────────
  const loadAnalytics = useCallback(async (p: Period) => {
    setAnalyticsLoading(true);
    const [analyticsRes, statsRes] = await Promise.all([
      fetch(`${REPAIR_URL}?action=analytics&period=${p}`, { headers: { "X-Employee-Token": token } }),
      fetch(`${REPAIR_URL}?action=daily_stats`, { headers: { "X-Employee-Token": token } }),
    ]);
    const [analyticsD, statsD] = await Promise.all([analyticsRes.json(), statsRes.json()]);
    setAnalytics(analyticsD);
    setStats(statsD.stats || []);
    setAnalyticsLoading(false);
  }, [token]);

  useEffect(() => {
    if (view === "list") loadOrders();
    else loadAnalytics(period);
  }, [view, loadOrders, loadAnalytics, period]);

  // ─── Создать заявку ───────────────────────────────────────────────────────────
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

  // ─── Сохранить поля карточки ─────────────────────────────────────────────────
  const saveCard = async (o: Order) => {
    const ef = editForm[o.id];
    if (!ef) return;
    setSaving(true);
    setSaveError(null);
    const body: Record<string, unknown> = { id: o.id };
    if (ef.admin_note !== undefined) body.admin_note = ef.admin_note;
    if (ef.purchase_amount !== "") body.purchase_amount = parseInt(ef.purchase_amount);
    if (ef.repair_amount !== "") body.repair_amount = parseInt(ef.repair_amount);
    if (ef.parts_name) body.parts_name = ef.parts_name;
    // Поля заявки
    body.name = ef.name; body.phone = ef.phone;
    body.model = ef.model || null; body.repair_type = ef.repair_type || null;
    body.price = ef.price ? parseInt(ef.price) : null;
    body.comment = ef.comment || null;
    const res = await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.error) { setSaveError(data.error || "Ошибка"); return; }
    setExpandedId(null);
    loadOrders();
  };

  // ─── Изменить статус ─────────────────────────────────────────────────────────
  const changeStatus = async (id: number, status: string, extra?: Record<string, unknown>) => {
    setSaving(true);
    setSaveError(null);
    const res = await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ id, status, ...(extra || {}) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.error) { setSaveError(data.error || "Ошибка"); return false; }
    loadOrders();
    return true;
  };

  // ─── Выдать клиенту ──────────────────────────────────────────────────────────
  const issueOrder = async (o: Order) => {
    await changeStatus(o.id, "done");
    printReceipt({ ...o, status: "done" });
  };

  // ─── Удалить заявку ──────────────────────────────────────────────────────────
  const deleteOrder = async (id: number) => {
    if (!confirm(`Удалить заявку #${id}?`)) return;
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ action: "delete", id }),
    });
    loadOrders();
  };

  // ─── Открыть модалку «Готово» ────────────────────────────────────────────────
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

  // ─── Подтвердить «Готово» ────────────────────────────────────────────────────
  const submitReady = async () => {
    if (!readyModal) return;
    if (!readyForm.parts_name.trim()) { setReadyError("Укажите купленную запчасть"); return; }
    if (!readyForm.purchase_amount) { setReadyError("Укажите сумму закупки"); return; }
    if (!readyForm.repair_amount) { setReadyError("Укажите выданную сумму за ремонт"); return; }
    setReadySaving(true);
    const ok = await changeStatus(readyModal.id, "ready", {
      purchase_amount: parseInt(readyForm.purchase_amount),
      repair_amount: parseInt(readyForm.repair_amount),
      parts_name: readyForm.parts_name,
      admin_note: readyForm.admin_note,
    });
    setReadySaving(false);
    if (ok) { setReadyModal(null); setExpandedId(null); }
    else setReadyError("Ошибка сохранения");
  };

  // ─── Счётчики статусов ───────────────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  // ─── Инициализация формы редактирования ──────────────────────────────────────
  const initEditForm = (o: Order) => ({
    name: o.name, phone: o.phone,
    model: o.model || "", repair_type: o.repair_type || "",
    price: o.price ? String(o.price) : "",
    comment: o.comment || "", admin_note: o.admin_note || "",
    purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
    repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
    parts_name: o.parts_name || "",
  });

  return (
    <div className="flex flex-col">
      {/* ── Переключатель вид ── */}
      <div className="px-4 py-2.5 border-b border-[#222] flex items-center gap-3 flex-wrap">
        <div className="flex rounded overflow-hidden border border-[#333]">
          <button onClick={() => setView("list")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="ClipboardList" size={13} /> Заявки
          </button>
          <button onClick={() => setView("analytics")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "analytics" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="BarChart2" size={13} /> Аналитика
          </button>
        </div>

        {view === "list" && (
          <>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск: имя, телефон, модель..."
              className="flex-1 min-w-[160px] bg-[#0D0D0D] border border-[#333] text-white px-3 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
            />
            <button onClick={loadOrders} disabled={loading} className="text-white/40 hover:text-white p-1.5 transition-colors">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
              className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors shrink-0">
              <Icon name={showForm ? "X" : "Plus"} size={12} />
              {showForm ? "Отмена" : "Заявка"}
            </button>
          </>
        )}
      </div>

      {/* ── АНАЛИТИКА ── */}
      {view === "analytics" && (
        <div className="p-4 overflow-y-auto">
          <div className="flex gap-2 mb-4 items-center">
            {(["day", "week", "month"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 font-roboto text-xs border transition-colors ${period === p ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
                {p === "day" ? "Сегодня" : p === "week" ? "7 дней" : "30 дней"}
              </button>
            ))}
            <button onClick={() => loadAnalytics(period)} disabled={analyticsLoading} className="ml-auto text-white/30 hover:text-white p-1.5 transition-colors">
              <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={13} className={analyticsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {analyticsLoading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю...</div>}

          {analytics && !analyticsLoading && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                  <div className="font-roboto text-white/30 text-[10px] mb-0.5">Выручка</div>
                  <div className="font-oswald font-bold text-[#FFD700] text-xl">{money(analytics.revenue)}</div>
                  <div className="font-roboto text-orange-400/60 text-[10px]">закупка: {money(analytics.costs)}</div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                  <div className="font-roboto text-white/30 text-[10px] mb-0.5">Прибыль</div>
                  <div className={`font-oswald font-bold text-xl ${analytics.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {money(analytics.profit)}
                  </div>
                  <div className="font-roboto text-white/20 text-[10px]">
                    {analytics.revenue > 0 ? Math.round((analytics.profit / analytics.revenue) * 100) : 0}% маржа
                  </div>
                </div>
              </div>

              {/* Доход мастера */}
              {analytics.master_total > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-roboto text-green-400/60 text-[10px] uppercase tracking-wide mb-0.5">Доход мастера (50% прибыли)</div>
                    <div className="font-oswald font-bold text-green-400 text-2xl">{money(analytics.master_total)}</div>
                  </div>
                  <span className="text-3xl opacity-40">🏆</span>
                </div>
              )}

              {/* Счётчики статусов */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {STATUSES.map(s => {
                  const val = (analytics as Record<string, unknown>)[s.key === "new" ? "new" : s.key] as number ?? 0;
                  return (
                    <div key={s.key} className="bg-[#1A1A1A] border border-[#2A2A2A] p-2 text-center">
                      <div className={`font-oswald font-bold text-lg ${s.color.split(" ")[1]}`}>{val}</div>
                      <div className="font-roboto text-white/30 text-[9px]">{s.label.replace(" ✓", "")}</div>
                    </div>
                  );
                })}
              </div>

              {/* График по дням */}
              {analytics.daily.length > 1 && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
                  <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2">Динамика по дням</div>
                  <div className="space-y-1.5">
                    {analytics.daily.slice().reverse().map(d => {
                      const maxRev = Math.max(...analytics.daily.map(x => x.revenue), 1);
                      const barW = Math.round((d.revenue / maxRev) * 100);
                      const profitW = Math.round((Math.max(0, d.profit) / maxRev) * 100);
                      return (
                        <div key={d.day} className="flex items-center gap-2">
                          <span className="font-roboto text-[9px] text-white/30 w-10 shrink-0">
                            {new Date(d.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                          </span>
                          <div className="flex-1 h-4 bg-[#111] relative overflow-hidden">
                            <div className="h-full bg-[#FFD700]/25 absolute left-0 top-0 transition-all" style={{ width: barW + "%" }} />
                            <div className="h-full bg-green-500/35 absolute left-0 top-0 transition-all" style={{ width: profitW + "%" }} />
                          </div>
                          <span className="font-roboto text-[9px] text-white/40 w-16 text-right shrink-0">
                            {d.revenue > 0 ? d.revenue.toLocaleString("ru-RU") + "₽" : "—"}
                          </span>
                          <span className={`font-roboto text-[9px] w-12 text-right shrink-0 ${d.profit > 0 ? "text-green-400" : d.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                            {d.profit !== 0 ? (d.profit > 0 ? "+" : "") + d.profit.toLocaleString("ru-RU") : "—"}
                          </span>
                          <span className="font-roboto text-white/20 text-[9px] w-5 text-right shrink-0">{d.done}✓</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Итого */}
                  <div className="flex gap-4 mt-3 pt-2 border-t border-[#333] text-xs font-roboto">
                    <span className="text-white/30">Итого: <span className="text-white font-bold">{analytics.total}</span> заявок</span>
                    <span className="text-white/30">Выдано: <span className="text-green-400 font-bold">{analytics.done}</span></span>
                  </div>
                </div>
              )}

              {/* Таблица по дням (30 дней) */}
              {stats.length > 0 && (
                <div className="mt-3 bg-[#1A1A1A] border border-[#2A2A2A] overflow-x-auto">
                  <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide px-3 py-2 border-b border-[#333]">
                    Таблица за 30 дней
                  </div>
                  <div className="grid px-3 py-1.5 border-b border-[#333]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                    {["День","Всего","Выдано","Закупка","Выручка","Прибыль","Мастеру"].map(h => (
                      <div key={h} className="font-roboto text-[9px] text-white/25 text-center uppercase">{h}</div>
                    ))}
                  </div>
                  {stats.map(s => (
                    <div key={s.day} className="grid px-3 py-1.5 border-b border-[#222] last:border-0 hover:bg-white/2"
                      style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                      <div className="font-roboto text-[10px] text-white/50">{fmtDay(s.day)}</div>
                      <div className="font-roboto text-[10px] text-white text-center">{s.total}</div>
                      <div className="font-roboto text-[10px] text-green-400 text-center">{s.done}</div>
                      <div className="font-roboto text-[10px] text-orange-400 text-center">{s.costs > 0 ? s.costs.toLocaleString("ru-RU") : "—"}</div>
                      <div className="font-roboto text-[10px] text-green-400 text-center">{s.revenue > 0 ? s.revenue.toLocaleString("ru-RU") : "—"}</div>
                      <div className={`font-oswald font-bold text-[10px] text-center ${s.profit > 0 ? "text-[#FFD700]" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                        {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
                      </div>
                      <div className="font-roboto text-[10px] text-green-300 text-center font-bold">
                        {(s.master_income || 0) > 0 ? s.master_income!.toLocaleString("ru-RU") : "—"}
                      </div>
                    </div>
                  ))}
                  {/* Итого строка */}
                  <div className="grid px-3 py-2 bg-white/3 border-t border-[#333]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                    <div className="font-roboto text-[10px] text-white/40 font-bold">Итого</div>
                    <div className="font-roboto text-[10px] text-white text-center font-bold">{stats.reduce((a,s)=>a+s.total,0)}</div>
                    <div className="font-roboto text-[10px] text-green-400 text-center font-bold">{stats.reduce((a,s)=>a+s.done,0)}</div>
                    <div className="font-roboto text-[10px] text-orange-400 text-center font-bold">{stats.reduce((a,s)=>a+s.costs,0).toLocaleString("ru-RU")}</div>
                    <div className="font-roboto text-[10px] text-green-400 text-center font-bold">{stats.reduce((a,s)=>a+s.revenue,0).toLocaleString("ru-RU")}</div>
                    <div className="font-oswald font-bold text-[10px] text-center text-[#FFD700]">{stats.reduce((a,s)=>a+s.profit,0).toLocaleString("ru-RU")}</div>
                    <div className="font-roboto text-[10px] text-green-300 text-center font-bold">{stats.reduce((a,s)=>a+(s.master_income||0),0).toLocaleString("ru-RU")}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── СПИСОК ЗАЯВОК ── */}
      {view === "list" && (
        <>
          {/* Фильтры статуса */}
          <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-[#222]">
            <button onClick={() => setFilterStatus("all")}
              className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${filterStatus === "all" ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
              Все ({orders.length})
            </button>
            {STATUSES.map(s => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)}
                className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors flex items-center gap-1 ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
                {statusCounts[s.key] ? <span className="opacity-60">({statusCounts[s.key]})</span> : null}
              </button>
            ))}
          </div>

          {/* Форма новой заявки */}
          {showForm && (
            <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={LBL}>Имя клиента *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={INP} /></div>
                <div><label className={LBL}>Телефон *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={INP} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={LBL}>Модель устройства</label>
                  <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14..." className={INP} /></div>
                <div><label className={LBL}>Тип ремонта</label>
                  <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Замена дисплея..." className={INP} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className={LBL}>Стоимость (₽)</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={INP} /></div>
                <div><label className={LBL}>Комментарий</label>
                  <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Описание поломки..." className={INP} /></div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
                  className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                  <Icon name="Check" size={13} />{creating ? "Создаю..." : "Создать заявку"}
                </button>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-white/30 font-roboto text-xs hover:text-white px-2 transition-colors">Отмена</button>
              </div>
            </div>
          )}

          {/* Карточки */}
          <div className="px-4 py-3 space-y-2">
            {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
            {!loading && orders.length === 0 && (
              <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
            )}
            {orders.map(o => {
              const st = statusInfo(o.status);
              const isExpanded = expandedId === o.id;
              const ef = editForm[o.id] || initEditForm(o);

              return (
                <div key={o.id} className={`bg-[#1A1A1A] border transition-colors ${isExpanded ? "border-[#FFD700]/40" : "border-[#2A2A2A]"}`}>
                  {/* Шапка карточки — клик раскрывает */}
                  <div className="p-3 cursor-pointer select-none"
                    onClick={() => {
                      const opening = expandedId !== o.id;
                      setExpandedId(opening ? o.id : null);
                      setSaveError(null);
                      if (opening) setEditForm(prev => ({ ...prev, [o.id]: initEditForm(o) }));
                    }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-oswald font-bold text-[#FFD700] text-sm shrink-0">#{o.id}</span>
                        <span className={`font-roboto text-[10px] px-1.5 py-0.5 flex items-center gap-1 shrink-0 ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                        <span className="font-roboto text-sm text-white font-medium truncate">{o.name}</span>
                        <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
                          className="font-roboto text-xs text-[#FFD700] hover:underline shrink-0">{o.phone}</a>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="font-roboto text-[9px] text-white/25 hidden sm:inline">{fmt(o.created_at)}</span>
                        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={13} className="text-white/25" />
                      </div>
                    </div>

                    {/* Краткая инфо */}
                    <div className="flex gap-2 mt-1 flex-wrap text-[10px] font-roboto">
                      {o.model && <span className="text-white/40">📱 {o.model}</span>}
                      {o.repair_type && <span className="text-white/40">🔧 {o.repair_type}</span>}
                      {o.price && <span className="text-[#FFD700]/70 font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
                      {o.repair_amount != null && <span className="text-green-400">▸ выдано {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
                      {o.master_income != null && <span className="text-green-300">мастеру {o.master_income.toLocaleString("ru-RU")} ₽</span>}
                    </div>
                  </div>

                  {/* Раскрытая часть */}
                  {isExpanded && (
                    <div className="border-t border-[#2A2A2A] p-3 space-y-3">
                      {o.comment && (
                        <div className="p-2 bg-white/5 border border-white/8 text-[10px] font-roboto text-white/55 italic">"{o.comment}"</div>
                      )}

                      {/* Блок запчасть + суммы */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть</label>
                          <input value={ef.parts_name}
                            onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, parts_name: e.target.value } }))}
                            placeholder="Дисплей iPhone 14..." className={INP} />
                        </div>
                        <div>
                          <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽)</label>
                          <input type="number" value={ef.purchase_amount}
                            onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, purchase_amount: e.target.value } }))}
                            placeholder="500" className={INP} />
                        </div>
                        <div>
                          <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽)</label>
                          <input type="number" value={ef.repair_amount}
                            onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, repair_amount: e.target.value } }))}
                            placeholder="1500" className={INP} />
                        </div>
                      </div>

                      {/* Расчёт дохода мастера */}
                      {ef.repair_amount && ef.purchase_amount && (
                        <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 flex gap-4 text-xs font-roboto">
                          <span className="text-white/40">Прибыль:
                            <span className={`font-bold ml-1 ${parseInt(ef.repair_amount) - parseInt(ef.purchase_amount) >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                              {(parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)).toLocaleString("ru-RU")} ₽
                            </span>
                          </span>
                          <span className="text-white/40">Доход мастера:
                            <span className="text-green-400 font-bold ml-1">
                              {Math.max(0, Math.round((parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Заметка + поля заявки */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={LBL}>Имя</label>
                          <input value={ef.name} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, name: e.target.value } }))} className={INP} placeholder="Иван" />
                        </div>
                        <div>
                          <label className={LBL}>Телефон</label>
                          <input value={ef.phone} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, phone: e.target.value } }))} className={INP} placeholder="+7..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={LBL}>Модель</label>
                          <input value={ef.model} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, model: e.target.value } }))} className={INP} placeholder="iPhone 14" />
                        </div>
                        <div>
                          <label className={LBL}>Тип ремонта</label>
                          <input value={ef.repair_type} onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, repair_type: e.target.value } }))} className={INP} placeholder="Замена дисплея" />
                        </div>
                      </div>
                      <div>
                        <label className={LBL}>Заметка</label>
                        <textarea value={ef.admin_note}
                          onChange={e => setEditForm(p => ({ ...p, [o.id]: { ...ef, admin_note: e.target.value } }))}
                          rows={2} placeholder="Внутренняя заметка..."
                          className={INP + " resize-none"} />
                      </div>

                      {saveError && <div className="text-red-400 font-roboto text-[10px]">{saveError}</div>}

                      {/* Кнопки статусов */}
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUSES.filter(s => s.key !== o.status).map(s => (
                          <button key={s.key}
                            onClick={() => {
                              if (s.key === "ready") { openReadyModal(o); }
                              else if (s.key === "done") { issueOrder(o); }
                              else { changeStatus(o.id, s.key, { admin_note: ef.admin_note }); setExpandedId(null); }
                            }}
                            disabled={saving}
                            className={`font-roboto text-[10px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${s.color} border-current/20 hover:opacity-80 disabled:opacity-40`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                          </button>
                        ))}
                        <button onClick={() => saveCard(o)} disabled={saving}
                          className="ml-auto font-roboto text-[10px] px-3 py-1.5 bg-[#FFD700] text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1">
                          <Icon name="Save" size={11} />{saving ? "Сохраняю..." : "Сохранить"}
                        </button>
                        <button onClick={() => { printReceipt(o); }}
                          className="font-roboto text-[10px] px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-white transition-colors flex items-center gap-1">
                          <Icon name="Printer" size={11} />
                        </button>
                        {isOwner && (
                          <button onClick={() => deleteOrder(o.id)}
                            className="font-roboto text-[10px] px-2.5 py-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                            <Icon name="Trash2" size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Модалка «Готово» ── */}
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
                <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть *</label>
                <input value={readyForm.parts_name}
                  onChange={e => setReadyForm(p => ({ ...p, parts_name: e.target.value }))}
                  placeholder="Дисплей iPhone 14, аккумулятор..." className={INP} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽) *</label>
                  <input type="number" value={readyForm.purchase_amount}
                    onChange={e => setReadyForm(p => ({ ...p, purchase_amount: e.target.value }))}
                    placeholder="500" className={INP} />
                </div>
                <div>
                  <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽) *</label>
                  <input type="number" value={readyForm.repair_amount}
                    onChange={e => setReadyForm(p => ({ ...p, repair_amount: e.target.value }))}
                    placeholder="1500" className={INP} />
                </div>
              </div>

              {readyForm.repair_amount && readyForm.purchase_amount && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 font-roboto text-sm text-center">
                  <div className="text-white/40 text-[10px] mb-0.5">Доход мастера (50% от прибыли)</div>
                  <div className="text-green-400 font-bold text-xl">
                    {Math.max(0, Math.round((parseInt(readyForm.repair_amount) - parseInt(readyForm.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-white/30 text-[10px] mt-0.5">
                    прибыль: {(parseInt(readyForm.repair_amount) - parseInt(readyForm.purchase_amount)).toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              )}

              <div>
                <label className={LBL}>Заметка</label>
                <textarea value={readyForm.admin_note}
                  onChange={e => setReadyForm(p => ({ ...p, admin_note: e.target.value }))}
                  rows={2} placeholder="Внутренняя заметка..." className={INP + " resize-none"} />
              </div>

              {readyError && <div className="text-red-400 font-roboto text-xs">{readyError}</div>}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={submitReady} disabled={readySaving}
                className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Icon name="Check" size={15} />{readySaving ? "Сохраняю..." : "Подтвердить"}
              </button>
              <button onClick={() => setReadyModal(null)}
                className="px-4 text-white/30 font-roboto text-xs hover:text-white transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
