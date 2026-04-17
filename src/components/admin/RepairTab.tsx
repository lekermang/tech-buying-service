import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import {
  ADMIN_URL, STATUSES, Order, Analytics, EditForm,
  EMPTY_FORM, EMPTY_READY,
} from "./repair/repairTypes";

const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";
import RepairAnalytics from "./repair/RepairAnalytics";
import RepairOrderCard from "./repair/RepairOrderCard";
import RepairReadyModal from "./repair/RepairReadyModal";

export { STATUSES } from "./repair/repairTypes";

type View = "orders" | "analytics";
type Period = "day" | "week" | "month";

export default function RepairTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

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

  const syncParts = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(REPAIR_PARTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
      });
      const data = await res.json();
      setSyncResult(data.synced != null ? `Загружено ${data.synced} запчастей` : "Ошибка синхронизации");
    } catch {
      setSyncResult("Ошибка соединения");
    }
    setSyncing(false);
  };

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

  const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
  const lbl = "font-roboto text-white/40 text-[10px] block mb-1";

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
            <div className="flex items-center gap-1.5">
              <button
                onClick={syncParts}
                disabled={syncing}
                title="Синхронизировать каталог запчастей из МойСклад"
                className="flex items-center gap-1.5 border border-[#333] text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 font-roboto text-xs transition-colors disabled:opacity-40"
              >
                <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Синхронизация..." : "Запчасти"}
              </button>
              {syncResult && (
                <span className="font-roboto text-[10px] text-green-400">{syncResult}</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* АНАЛИТИКА */}
      {view === "analytics" && (
        <RepairAnalytics
          analytics={analytics}
          analyticsLoading={analyticsLoading}
          period={period}
          onPeriodChange={setPeriod}
          onRefresh={() => loadAnalytics(period)}
        />
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
              const isExpanded = expandedId === o.id;
              const ef = editForm[o.id] || {
                purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
                repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
                parts_name: o.parts_name || "",
                admin_note: o.admin_note || "",
              };
              return (
                <RepairOrderCard
                  key={o.id}
                  o={o}
                  isExpanded={isExpanded}
                  ef={ef}
                  saving={saving}
                  saveError={saveError}
                  onToggle={() => {
                    setExpandedId(isExpanded ? null : o.id);
                    setSaveError(null);
                    if (!isExpanded) setEditForm(prev => ({ ...prev, [o.id]: {
                      purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
                      repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
                      parts_name: o.parts_name || "",
                      admin_note: o.admin_note || "",
                    }}));
                  }}
                  onEditFormChange={(id, newEf) => setEditForm(prev => ({ ...prev, [id]: newEf }))}
                  onUpdateStatus={updateStatus}
                  onOpenReadyModal={openReadyModal}
                  onSaveEdit={saveEdit}
                  onDelete={deleteOrder}
                />
              );
            })}
          </div>
        </>
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
    </div>
  );
}