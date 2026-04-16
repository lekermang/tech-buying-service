import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, STATUSES, Order, DayStat, EMPTY_FORM, INP, LBL, printReceipt } from "./repair/types";
import StaffRepairAnalytics from "./repair/StaffRepairAnalytics";
import StaffRepairOrderCard from "./repair/StaffRepairOrderCard";
import StaffRepairReadyModal from "./repair/StaffRepairReadyModal";

type View = "list" | "analytics";
type Period = "day" | "week" | "month";

type RepairAnalytics = {
  total: number; done: number; cancelled: number; ready: number;
  in_progress: number; waiting_parts: number; new: number;
  revenue: number; costs: number; profit: number; master_total: number;
  daily: { day: string; total: number; done: number; revenue: number; costs: number; profit: number }[];
};

const EMPTY_READY = { purchase_amount: "", repair_amount: "", parts_name: "", admin_note: "" };

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
};

export default function StaffRepairTab({ token, isOwner = false }: { token: string; isOwner?: boolean }) {
  const [view, setView] = useState<View>("list");

  // Список заявок
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Карточки
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<number, EditForm>>({});
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
  const initEditForm = (o: Order): EditForm => ({
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
        <StaffRepairAnalytics
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          period={period}
          stats={stats}
          onPeriodChange={setPeriod}
          onRefresh={() => loadAnalytics(period)}
        />
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
              const isExpanded = expandedId === o.id;
              const ef = editForm[o.id] || initEditForm(o);
              return (
                <StaffRepairOrderCard
                  key={o.id}
                  o={o}
                  isExpanded={isExpanded}
                  ef={ef}
                  saving={saving}
                  saveError={saveError}
                  isOwner={isOwner}
                  onToggle={() => {
                    const opening = expandedId !== o.id;
                    setExpandedId(opening ? o.id : null);
                    setSaveError(null);
                    if (opening) setEditForm(prev => ({ ...prev, [o.id]: initEditForm(o) }));
                  }}
                  onEditFormChange={(id, newEf) => setEditForm(prev => ({ ...prev, [id]: newEf }))}
                  onChangeStatus={(id, status, extra) => {
                    changeStatus(id, status, extra);
                    setExpandedId(null);
                  }}
                  onOpenReadyModal={openReadyModal}
                  onIssueOrder={issueOrder}
                  onSaveCard={saveCard}
                  onDelete={deleteOrder}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── Модалка «Готово» ── */}
      {readyModal && (
        <StaffRepairReadyModal
          order={readyModal}
          form={readyForm}
          error={readyError}
          saving={readySaving}
          onFormChange={setReadyForm}
          onSubmit={submitReady}
          onClose={() => setReadyModal(null)}
        />
      )}
    </div>
  );
}
