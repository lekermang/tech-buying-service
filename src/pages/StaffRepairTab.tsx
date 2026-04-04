import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, STATUSES, Order, DayStat, EMPTY_FORM, EMPTY_COMPLETE } from "./repair/types";
import RepairOrderCard from "./repair/RepairOrderCard";
import RepairCreateForm from "./repair/RepairCreateForm";
import RepairStats from "./repair/RepairStats";

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
    if (!completeForm.purchase_amount || !completeForm.repair_amount) return;
    setCompleteSaving(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({
        action: "complete", id,
        purchase_amount: parseInt(completeForm.purchase_amount),
        repair_amount: parseInt(completeForm.repair_amount),
      }),
    });
    setCompleteSaving(false);
    setCompleting(null);
    setCompleteForm(EMPTY_COMPLETE);
    loadOrders();
  };

  const issueRepair = async (id: number) => {
    setSaving(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({ id, status: "done", admin_note: "" }),
    });
    setSaving(false);
    loadOrders();
  };

  const saveEdit = async (id: number, fields: { name: string; phone: string; model: string; repair_type: string; price: string; comment: string; admin_note: string }) => {
    setSaving(true);
    await fetch(REPAIR_URL, {
      method: "POST", headers,
      body: JSON.stringify({
        action: "update_fields", id,
        name: fields.name, phone: fields.phone,
        model: fields.model || null, repair_type: fields.repair_type || null,
        price: fields.price ? parseInt(fields.price) : null,
        comment: fields.comment || null, admin_note: fields.admin_note || null,
      }),
    });
    setSaving(false);
    setEditing(null);
    loadOrders();
  };

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
        <RepairCreateForm
          form={form}
          creating={creating}
          onChange={setForm}
          onCreate={createOrder}
          onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); }}
        />
      )}

      {/* СПИСОК ЗАЯВОК */}
      {view === "list" && (
        <div className="px-4 py-3 space-y-2">
          {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
          {!loading && orders.length === 0 && (
            <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
          )}
          {orders.map(o => (
            <RepairOrderCard
              key={o.id}
              o={o}
              editing={editing}
              completing={completing}
              noteInput={noteInput}
              saving={saving}
              completeForm={completeForm}
              completeSaving={completeSaving}
              onEditStart={(id, note) => { setEditing(id); setNoteInput(note); setCompleting(null); }}
              onEditCancel={() => setEditing(null)}
              onNoteChange={setNoteInput}
              onUpdateStatus={updateStatus}
              onCompleteStart={(id) => { setCompleting(id); setCompleteForm(EMPTY_COMPLETE); setEditing(null); }}
              onCompleteCancel={() => { setCompleting(null); setCompleteForm(EMPTY_COMPLETE); }}
              onCompleteFormChange={setCompleteForm}
              onCompleteRepair={completeRepair}
              onIssueRepair={issueRepair}
              onSaveEdit={saveEdit}
            />
          ))}
        </div>
      )}

      {/* СТАТИСТИКА */}
      {view === "stats" && (
        <RepairStats loading={loading} stats={stats} />
      )}
    </div>
  );
}