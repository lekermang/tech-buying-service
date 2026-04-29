import { useState, useEffect, useCallback } from "react";
import { REPAIR_URL, Order, DayStat, EMPTY_FORM, printReceipt, printAct } from "./repair/types";
import StaffRepairAnalytics from "./repair/StaffRepairAnalytics";
import StaffRepairReadyModal from "./repair/StaffRepairReadyModal";
import StatusOrdersModal from "./repair/StatusOrdersModal";
import LaborPricesTab from "@/components/admin/repair/LaborPricesTab";
import RepairImportTab from "@/components/admin/repair/RepairImportTab";
import RepairHistoryModal from "@/components/admin/repair/RepairHistoryModal";
import StaffRepairToolbar from "./repair/staffTab/StaffRepairToolbar";
import StaffRepairSearchBar from "./repair/staffTab/StaffRepairSearchBar";
import StaffRepairList from "./repair/staffTab/StaffRepairList";
import { View, Period, RepairAnalytics, EditForm, EMPTY_READY } from "./repair/staffTab/staffTabTypes";
import { useStaffToast } from "./staff/StaffToast";

export default function StaffRepairTab({ token, isOwner = false }: { token: string; isOwner?: boolean }) {
  const toast = useStaffToast();
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
    if (!form.name || !form.phone) {
      toast.warning("Укажите имя клиента и телефон");
      return;
    }
    setCreating(true);
    const tid = toast.loading("Создаю заявку...");
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
      });
      const data = await res.json();
      if (data.order_id) {
        toast.update(tid, { kind: "success", message: `Заявка #${data.order_id} создана`, duration: 3000 });
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
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadOrders();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось создать заявку", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при создании", duration: 5000 });
    } finally {
      setCreating(false);
    }
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
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveError(data.error || "Ошибка");
        toast.error(data.error || "Не удалось сохранить заявку");
        return;
      }
      toast.success(`Заявка #${o.id} сохранена`);
      setExpandedId(null);
      loadOrders();
    } catch {
      setSaveError("Ошибка сети");
      toast.error("Сбой сети при сохранении");
    } finally {
      setSaving(false);
    }
  };

  // ─── Изменить статус ─────────────────────────────────────────────────────────
  const STATUS_LABELS: Record<string, string> = {
    new: "Новая", in_progress: "В работе", waiting_parts: "Ждёт запчасть",
    ready: "Готова к выдаче", done: "Выдана клиенту", cancelled: "Отменена", refused: "Отказ",
  };
  const changeStatus = async (id: number, status: string, extra?: Record<string, unknown>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ id, status, ...(extra || {}) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveError(data.error || "Ошибка");
        toast.error(data.error || "Не удалось изменить статус");
        return false;
      }
      toast.success(`#${id}: ${STATUS_LABELS[status] || status}`);
      loadOrders();
      return true;
    } catch {
      setSaveError("Ошибка сети");
      toast.error("Сбой сети при смене статуса");
      return false;
    } finally {
      setSaving(false);
    }
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
    const tid = toast.loading(`Удаляю заявку #${id}...`);
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.error == null) {
        toast.update(tid, { kind: "success", message: `Заявка #${id} удалена`, duration: 3000 });
        loadOrders();
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось удалить заявку", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Сбой сети при удалении", duration: 5000 });
    }
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
    if (!readyForm.repair_amount) {
      setReadyError("Укажите выданную сумму за ремонт");
      toast.warning("Укажите выданную сумму за ремонт");
      return;
    }
    if (readyForm.purchase_amount === "" || readyForm.purchase_amount == null) {
      setReadyError("Укажите сумму закупки (можно 0)");
      toast.warning("Укажите сумму закупки (можно 0)");
      return;
    }
    setReadySaving(true);
    const ok = await changeStatus(readyModal.id, "ready", {
      purchase_amount: parseInt(readyForm.purchase_amount),
      repair_amount: parseInt(readyForm.repair_amount),
      parts_name: readyForm.parts_name,
      admin_note: readyForm.admin_note,
    });
    setReadySaving(false);
    if (ok) {
      setReadyModal(null);
      setExpandedId(null);
    } else {
      setReadyError("Ошибка сохранения");
    }
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
      {/* ── Premium переключатель вида ── */}
      <StaffRepairToolbar
        view={view}
        setView={setView}
        isOwner={isOwner}
        showForm={showForm}
        setShowForm={setShowForm}
        setForm={setForm}
      />

      {/* ── Поиск + период ── */}
      {view === "list" && (
        <StaffRepairSearchBar
          search={search}
          setSearch={setSearch}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          loading={loading}
          loadOrders={loadOrders}
        />
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
          onOrderClick={(orderId) => {
            setOrdersModal(null);
            setFilterStatus("all");
            setSearch("");
            setDateFrom("");
            setDateTo("");
            setView("list");
            setExpandedId(orderId);
            setTimeout(() => {
              const el = document.getElementById(`order-${orderId}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 350);
          }}
        />
      )}

      {/* ── СПИСОК ЗАЯВОК ── */}
      {view === "list" && (
        <StaffRepairList
          orders={orders}
          loading={loading}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          statusCounts={statusCounts}
          showForm={showForm}
          form={form}
          setForm={setForm}
          creating={creating}
          createOrder={createOrder}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          editForm={editForm}
          setEditForm={setEditForm}
          initEditForm={initEditForm}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          isOwner={isOwner}
          token={token}
          changeStatus={changeStatus}
          openReadyModal={openReadyModal}
          issueOrder={issueOrder}
          saveCard={saveCard}
          deleteOrder={deleteOrder}
        />
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