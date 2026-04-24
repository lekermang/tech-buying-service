import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, STATUSES, Order, DayStat, EMPTY_FORM, INP, LBL, printReceipt, printAct } from "./repair/types";
import StaffRepairAnalytics from "./repair/StaffRepairAnalytics";
import StaffRepairOrderCard from "./repair/StaffRepairOrderCard";
import StaffRepairReadyModal from "./repair/StaffRepairReadyModal";
import StatusOrdersModal from "./repair/StatusOrdersModal";
import LaborPricesTab from "@/components/admin/repair/LaborPricesTab";
import RepairImportTab from "@/components/admin/repair/RepairImportTab";
import RepairHistoryModal from "@/components/admin/repair/RepairHistoryModal";

type View = "list" | "analytics" | "labor_prices" | "import_parts";
type Period = "day" | "yesterday" | "week" | "month";

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
  const [showHistory, setShowHistory] = useState(false);

  // Модалка с заказами по статусу/метрике
  const [ordersModal, setOrdersModal] = useState<{ statuses: string[]; title: string; accent: "revenue" | "costs" | "master" | "profit" | "status" } | null>(null);

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

  const VIEWS: { k: View; l: string; icon: string; ownerOnly?: boolean }[] = [
    { k: "list", l: "Заявки", icon: "ClipboardList" },
    { k: "analytics", l: "Аналитика", icon: "BarChart2" },
    { k: "labor_prices", l: "Цены", icon: "Tag", ownerOnly: true },
    { k: "import_parts", l: "Импорт", icon: "FileUp", ownerOnly: true },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Premium переключатель вида ── */}
      <div className="px-3 pt-3 pb-2 border-b border-[#1A1A1A] bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 bg-[#141414] border border-[#1F1F1F] rounded-md p-0.5 overflow-x-auto scrollbar-none">
            {VIEWS.filter(v => !v.ownerOnly || isOwner).map(v => {
              const active = view === v.k;
              return (
                <button
                  key={v.k}
                  onClick={() => setView(v.k)}
                  className={`flex-1 min-w-[72px] py-2 px-2.5 font-roboto text-[11px] rounded-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                    active
                      ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-lg shadow-[#FFD700]/20"
                      : "text-white/50 hover:text-white/80"
                  }`}>
                  <Icon name={v.icon} size={13} />
                  <span className="whitespace-nowrap">{v.l}</span>
                </button>
              );
            })}
          </div>
          {view === "list" && (
            <button onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
              className={`flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all shrink-0 active:scale-95 ${
                showForm
                  ? "bg-[#2A2A2A] text-white/60 border border-[#333]"
                  : "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40"
              }`}>
              <Icon name={showForm ? "X" : "Plus"} size={14} />
              {showForm ? "Отмена" : "Заявка"}
            </button>
          )}
        </div>
      </div>

      {/* ── Поиск + период ── */}
      {view === "list" && (
        <div className="px-3 py-2.5 border-b border-[#1A1A1A] space-y-2 bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск: имя, телефон, модель..."
                className="w-full bg-[#141414] border border-[#1F1F1F] text-white pl-9 pr-9 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#1A1A1A] placeholder:text-white/25 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
            <button onClick={loadOrders} disabled={loading}
              className="text-white/40 hover:text-[#FFD700] active:scale-90 p-2.5 rounded-md transition-all shrink-0 hover:bg-white/5">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
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
                  className={`px-3 py-1.5 font-roboto text-[11px] rounded-full shrink-0 transition-all active:scale-95 ${
                    isActive
                      ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                      : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
                  }`}>
                  {q.label}
                </button>
              );
            })}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
            <span className="text-white/20 text-xs shrink-0">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-[#141414] border border-[#1F1F1F] text-white/60 px-2 py-1.5 font-roboto text-[11px] rounded focus:outline-none focus:border-[#FFD700]/50 shrink-0 w-[120px]" />
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
          onShowHistory={() => setShowHistory(true)}
          onShowOrders={(p) => setOrdersModal(p)}
        />
      )}

      {ordersModal && (
        <StatusOrdersModal
          token={token}
          period={period}
          statuses={ordersModal.statuses}
          title={ordersModal.title}
          accent={ordersModal.accent}
          onClose={() => setOrdersModal(null)}
        />
      )}

      {/* ── СПИСОК ЗАЯВОК ── */}
      {view === "list" && (
        <>
          {/* Фильтры статуса — premium chips */}
          <div className="px-3 py-2.5 flex gap-1.5 flex-wrap border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <button onClick={() => setFilterStatus("all")}
              className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
                filterStatus === "all"
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
              }`}>
              <Icon name="Inbox" size={11} />
              Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span>
            </button>
            {STATUSES.map(s => {
              const active = filterStatus === s.key;
              const cnt = statusCounts[s.key] || 0;
              return (
                <button key={s.key} onClick={() => setFilterStatus(s.key)}
                  className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
                    active
                      ? `${s.color} ring-1 ring-current font-bold`
                      : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? "animate-pulse" : ""}`} />
                  {s.label}
                  {cnt > 0 && <span className={active ? "opacity-70" : "opacity-50"}>({cnt})</span>}
                </button>
              );
            })}
          </div>

          {/* Форма новой заявки */}
          {showForm && (
            <div className="mx-3 mt-3 mb-1 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 p-4 space-y-3 rounded-lg shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
              <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Icon name="FilePlus" size={12} /> Новая заявка на ремонт
              </div>
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
            {loading && (
              <div className="flex items-center justify-center py-14 gap-2 text-white/40">
                <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
                <span className="font-roboto text-sm">Загружаю заявки...</span>
              </div>
            )}
            {!loading && orders.length === 0 && (
              <div className="text-center py-14 px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#222] rounded-full flex items-center justify-center">
                  <Icon name="Inbox" size={28} className="text-white/20" />
                </div>
                <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">Заявок нет</div>
                <div className="font-roboto text-white/30 text-xs">Попробуйте изменить фильтры или создать новую заявку</div>
              </div>
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

      {showHistory && (
        <RepairHistoryModal token={token} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}