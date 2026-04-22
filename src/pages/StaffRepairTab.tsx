import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, STATUSES, Order, DayStat, EMPTY_FORM, INP, LBL, printReceipt, printAct } from "./repair/types";
import StaffRepairAnalytics from "./repair/StaffRepairAnalytics";
import StaffRepairOrderCard from "./repair/StaffRepairOrderCard";
import StaffRepairReadyModal from "./repair/StaffRepairReadyModal";
import LaborPricesTab from "@/components/admin/repair/LaborPricesTab";
import RepairImportTab from "@/components/admin/repair/RepairImportTab";

type View = "list" | "analytics" | "labor_prices" | "import_parts";
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
  advance: string; is_paid: boolean; payment_method: string;
};

export default function StaffRepairTab({ token, isOwner = false }: { token: string; isOwner?: boolean }) {
  const [view, setView] = useState<View>("list");

  // Список заявок
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (search.trim()) ps.push("search=" + encodeURIComponent(search.trim()));
    if (dateFrom) ps.push("date_from=" + dateFrom);
    if (dateTo) ps.push("date_to=" + dateTo);
    const url = REPAIR_URL + (ps.length ? "?" + ps.join("&") : "");
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus, search, dateFrom, dateTo]);

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
    const res = await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
    });
    const data = await res.json();
    setCreating(false);
    setShowForm(false);
    if (data.order_id) {
      const newOrder: Order = {
        id: data.order_id, name: form.name, phone: form.phone,
        model: form.model || null, repair_type: form.repair_type || null,
        price: form.price ? parseInt(form.price) : null,
        comment: form.comment || null, status: "new",
        admin_note: null, created_at: new Date().toISOString(),
        purchase_amount: null, repair_amount: null,
        completed_at: null, master_income: null, parts_name: null, picked_up_at: null,
        advance: null, is_paid: null, payment_method: null,
      };
      printAct(newOrder);
    }
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
    body.advance = ef.advance ? parseInt(ef.advance) : 0;
    body.is_paid = ef.is_paid;
    body.payment_method = ef.payment_method || null;
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
  const issueOrder = async (o: Order, issuedAt?: string) => {
    const extra = issuedAt ? { picked_up_at: new Date(issuedAt).toISOString() } : {};
    await changeStatus(o.id, "done", extra);
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
    if (!readyForm.repair_amount) { setReadyError("Укажите выданную сумму за ремонт"); return; }
    if (readyForm.purchase_amount === "" || readyForm.purchase_amount == null) { setReadyError("Укажите сумму закупки (можно 0)"); return; }
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
    advance: o.advance != null ? String(o.advance) : "",
    is_paid: o.is_paid ?? false,
    payment_method: o.payment_method || "",
  });

  return (
    <div className="flex flex-col">
      {/* ── Переключатель вид + кнопка новой заявки ── */}
      <div className="px-3 pt-3 pb-2 border-b border-[#222] flex items-center gap-2">
        <div className="flex flex-1 overflow-hidden border border-[#333]">
          <button onClick={() => setView("list")}
            className={`flex-1 py-2 font-roboto text-xs transition-colors flex items-center justify-center gap-1.5 ${view === "list" ? "bg-[#FFD700] text-black font-bold" : "text-white/50"}`}>
            <Icon name="ClipboardList" size={13} /> Заявки
          </button>
          <button onClick={() => setView("analytics")}
            className={`flex-1 py-2 font-roboto text-xs transition-colors flex items-center justify-center gap-1.5 ${view === "analytics" ? "bg-[#FFD700] text-black font-bold" : "text-white/50"}`}>
            <Icon name="BarChart2" size={13} /> Аналитика
          </button>
          {isOwner && (
            <button onClick={() => setView("labor_prices")}
              className={`flex-1 py-2 font-roboto text-xs transition-colors flex items-center justify-center gap-1.5 ${view === "labor_prices" ? "bg-[#FFD700] text-black font-bold" : "text-white/50"}`}>
              <Icon name="Tag" size={13} /> Цены
            </button>
          )}
          {isOwner && (
            <button onClick={() => setView("import_parts")}
              className={`flex-1 py-2 font-roboto text-xs transition-colors flex items-center justify-center gap-1.5 ${view === "import_parts" ? "bg-[#FFD700] text-black font-bold" : "text-white/50"}`}>
              <Icon name="FileUp" size={13} /> Импорт
            </button>
          )}
        </div>
        {view === "list" && (
          <button onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
            className={`flex items-center gap-1 font-oswald font-bold px-3 py-2 text-xs uppercase transition-colors shrink-0 ${showForm ? "bg-[#333] text-white/60" : "bg-[#FFD700] text-black"}`}>
            <Icon name={showForm ? "X" : "Plus"} size={14} />
            {showForm ? "Отмена" : "Заявка"}
          </button>
        )}
      </div>

      {/* ── Поиск + период ── */}
      {view === "list" && (
        <div className="px-3 py-2 border-b border-[#222] space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск: имя, телефон, модель..."
              className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
            />
            <button onClick={loadOrders} disabled={loading} className="text-white/40 active:text-white p-2 transition-colors shrink-0">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { label: "Все",     get: (): [string,string] => ["", ""] },
              { label: "Сегодня", get: (): [string,string] => { const t = new Date().toISOString().slice(0,10); return [t, t]; } },
              { label: "Неделя",  get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-6); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
              { label: "Месяц",   get: (): [string,string] => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate()-29); return [f.toISOString().slice(0,10), t.toISOString().slice(0,10)]; } },
            ].map(q => {
              const [qf, qt] = q.get();
              const isActive = qf === dateFrom && qt === dateTo;
              return (
                <button key={q.label} onClick={() => { setDateFrom(qf); setDateTo(qt); }}
                  className={`px-3 py-1.5 font-roboto text-xs border shrink-0 transition-colors ${isActive ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40"}`}>
                  {q.label}
                </button>
              );
            })}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-[#0D0D0D] border border-[#333] text-white/60 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] shrink-0 w-[120px]" />
            <span className="text-white/20 text-xs shrink-0">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-[#0D0D0D] border border-[#333] text-white/60 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] shrink-0 w-[120px]" />
          </div>
        </div>
      )}

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
            <div className="mx-3 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4 space-y-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest">Новая заявка на ремонт</div>
              <div>
                <label className={LBL}>Имя клиента *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={INP} />
              </div>
              <div>
                <label className={LBL}>Телефон *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={INP} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={LBL}>Модель</label>
                  <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14" className={INP} /></div>
                <div><label className={LBL}>Тип ремонта</label>
                  <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Дисплей..." className={INP} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={LBL}>Стоимость (₽)</label>
                  <input type="number" inputMode="numeric" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={INP} /></div>
                <div><label className={LBL}>Комментарий</label>
                  <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Описание..." className={INP} /></div>
              </div>
              <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Icon name="Check" size={15} />{creating ? "Создаю..." : "Создать заявку"}
              </button>
            </div>
          )}

          {/* Карточки */}
          <div className="px-3 py-3 space-y-2">
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
                  token={token}
                  authHeader="X-Employee-Token"
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

      {/* ── Цены работ (только owner) ── */}
      {view === "labor_prices" && isOwner && (
        <div className="flex-1 overflow-y-auto">
          <LaborPricesTab token={token} authHeader="X-Employee-Token" />
        </div>
      )}

      {/* ── Импорт Excel (только owner) ── */}
      {view === "import_parts" && isOwner && (
        <RepairImportTab token={token} />
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