import { useState, useEffect, useCallback } from "react";
import { adminHeaders } from "@/lib/adminFetch";
import {
  ADMIN_URL, Order, Analytics, EditForm,
  EMPTY_FORM, EMPTY_READY,
} from "./repair/repairTypes";
import { printAct } from "@/pages/repair/types";
import RepairAnalytics from "./repair/RepairAnalytics";
import RepairReadyModal from "./repair/RepairReadyModal";
import LaborPricesTab from "./repair/LaborPricesTab";
import RepairTabHeader from "./repair/RepairTabHeader";
import RepairOrdersView from "./repair/RepairOrdersView";
import RepairImportTab from "./repair/RepairImportTab";
import RepairHistoryModal from "./repair/RepairHistoryModal";
import StatusOrdersModal from "@/pages/repair/StatusOrdersModal";

export { STATUSES } from "./repair/repairTypes";

const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";

type View = "orders" | "analytics" | "labor_prices" | "import_parts";
type Period = "day" | "yesterday" | "week" | "month";

export default function RepairTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<number, EditForm>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [readyModal, setReadyModal] = useState<Order | null>(null);
  const [readyForm, setReadyForm] = useState<EditForm>(EMPTY_READY);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [readySaving, setReadySaving] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [ordersModal, setOrdersModal] = useState<{ statuses: string[]; title: string; accent: "revenue" | "costs" | "master" | "profit" | "status" } | null>(null);

  const syncParts = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(REPAIR_PARTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      });
      const data = await res.json();
      setSyncResult(data.synced != null ? `Загружено ${data.synced} запчастей` : `Ошибка: ${data.error || "нет ответа от МойСклад"}`);
    } catch {
      setSyncResult("Ошибка соединения");
    }
    setSyncing(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (search.trim()) ps.push("search=" + encodeURIComponent(search.trim()));
    if (dateFrom) ps.push("date_from=" + dateFrom);
    if (dateTo) ps.push("date_to=" + dateTo);
    const url = ADMIN_URL + (ps.length ? "?" + ps.join("&") : "");
    const res = await fetch(url, { headers: { ...adminHeaders(token) } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus, search, dateFrom, dateTo]);

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

  const updateStatus = async (id: number, status: string, extra?: Partial<EditForm>) => {
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
    const res = await fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      body: JSON.stringify({ action: "create", ...form, price: form.price ? parseInt(form.price) : null }),
    });
    const data = await res.json();
    setCreating(false);
    setShowForm(false);
    if (data.id) {
      const newOrder: Order = {
        id: data.id, name: form.name, phone: form.phone,
        model: form.model || null, repair_type: form.repair_type || null,
        price: form.price ? parseInt(form.price) : null,
        comment: form.comment || null, status: "new",
        admin_note: null, created_at: new Date().toISOString(),
        purchase_amount: null, repair_amount: null,
        completed_at: null, master_income: null, parts_name: null, picked_up_at: null,
      };
      printAct(newOrder);
    }
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

  return (
    <div className="h-full flex flex-col">
      {/* Шапка */}
      <RepairTabHeader
        view={view}
        setView={setView}
        search={search}
        setSearch={setSearch}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        loading={loading}
        onRefresh={load}
        showForm={showForm}
        setShowForm={setShowForm}
        setForm={setForm}
        syncing={syncing}
        syncResult={syncResult}
        syncParts={syncParts}
        onShowHistory={() => setShowHistory(true)}
      />

      {/* АНАЛИТИКА */}
      {view === "analytics" && (
        <RepairAnalytics
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={() => loadAnalytics(period)}
          onShowOrders={(p) => setOrdersModal(p)}
        />
      )}

      {ordersModal && (
        <StatusOrdersModal
          period={period}
          statuses={ordersModal.statuses}
          title={ordersModal.title}
          accent={ordersModal.accent}
          fetchUrl={ADMIN_URL}
          fetchHeaders={adminHeaders(token)}
          onClose={() => setOrdersModal(null)}
        />
      )}

      {/* ЗАЯВКИ */}
      {view === "orders" && (
        <RepairOrdersView
          orders={orders}
          loading={loading}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          creating={creating}
          createOrder={createOrder}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          editForm={editForm}
          setEditForm={setEditForm}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          token={token}
          updateStatus={updateStatus}
          openReadyModal={openReadyModal}
          saveEdit={saveEdit}
          deleteOrder={deleteOrder}
        />
      )}

      {/* Цены работ */}
      {view === "labor_prices" && (
        <div className="flex-1 overflow-y-auto">
          <LaborPricesTab token={token} authHeader="X-Admin-Token" />
        </div>
      )}

      {/* Импорт Excel */}
      {view === "import_parts" && (
        <RepairImportTab token={token} />
      )}

      {/* Модалка перевода в Готово */}
      {readyModal && (
        <RepairReadyModal
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