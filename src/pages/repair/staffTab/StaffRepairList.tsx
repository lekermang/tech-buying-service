import { useMemo, useState, useEffect } from "react";
import { STATUSES, Order, EMPTY_FORM } from "../types";
import { EditForm } from "./staffTabTypes";
import {
  SortMode, GroupMode, TimeGroup,
  ageHours, urgencyLevel, getTimeGroup, TIME_GROUP_META,
} from "./repairListUtils";
import RepairStatusFilter from "./RepairStatusFilter";
import RepairNewOrderForm from "./RepairNewOrderForm";
import RepairSortGroupBar from "./RepairSortGroupBar";
import Icon from "@/components/ui/icon";

type Props = {
  orders: Order[];
  loading: boolean;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  statusCounts: Record<string, number>;
  showForm: boolean;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  creating: boolean;
  createOrder: () => void;
  expandedId: number | null;
  setExpandedId: React.Dispatch<React.SetStateAction<number | null>>;
  editForm: Record<number, EditForm>;
  setEditForm: React.Dispatch<React.SetStateAction<Record<number, EditForm>>>;
  initEditForm: (o: Order) => EditForm;
  saving: boolean;
  saveError: string | null;
  setSaveError: (v: string | null) => void;
  isOwner: boolean;
  token: string;
  changeStatus: (id: number, status: string, extra?: Record<string, unknown>) => Promise<boolean>;
  openReadyModal: (o: Order) => void;
  issueOrder: (o: Order, issuedAt?: string) => void;
  saveCard: (o: Order) => void;
  deleteOrder: (id: number) => void;
  callRobotReady?: (id: number) => Promise<boolean>;
  inviteToMax?: (id: number) => Promise<boolean>;
  cardsView?: "grid" | "list";
  initialUrgentFilter?: boolean;
};

export default function StaffRepairList({
  orders, loading, filterStatus, setFilterStatus, statusCounts,
  showForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder, callRobotReady, inviteToMax,
  cardsView = "list",
  initialUrgentFilter,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("urgency");
  const [groupMode, setGroupMode] = useState<GroupMode>("time");

  // urgentFilter — показывать только критичные (≥ 6ч без движения)
  // если пришли через кнопку СРОЧНО — включаем сразу
  const [urgentFilter, setUrgentFilter] = useState(!!initialUrgentFilter);

  // Если initialUrgentFilter изменится (повторное нажатие баннера) — реагируем
  useEffect(() => {
    if (initialUrgentFilter) setUrgentFilter(true);
  }, [initialUrgentFilter]);

  // Применяем urgentFilter поверх обычных orders
  const filteredOrders = useMemo(() => {
    if (!urgentFilter) return orders;
    return orders.filter(o => urgencyLevel(o) >= 2);
  }, [orders, urgentFilter]);

  const urgentCount = useMemo(
    () => orders.filter(o => urgencyLevel(o) >= 2).length,
    [orders],
  );

  const sortedOrders = useMemo(() => {
    return filteredOrders
      .map((o, i) => ({ o, i }))
      .sort((a, b) => {
        // В режиме urgentFilter — сортируем по дате создания (свежие первые)
        if (urgentFilter) {
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          return tb - ta;
        }
        if (sortMode === "urgency") {
          const la = urgencyLevel(a.o);
          const lb = urgencyLevel(b.o);
          const aIsNew = la >= 0;
          const bIsNew = lb >= 0;
          if (aIsNew && bIsNew) {
            if (lb !== la) return lb - la;
            return ageHours(b.o) - ageHours(a.o);
          }
          if (aIsNew) return -1;
          if (bIsNew) return 1;
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          if (tb !== ta) return tb - ta;
          return a.i - b.i;
        }
        if (sortMode === "date_desc") {
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          return tb - ta;
        }
        if (sortMode === "date_asc") {
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          return ta - tb;
        }
        if (sortMode === "price_desc") {
          const pa = a.o.repair_amount ?? a.o.price ?? 0;
          const pb = b.o.repair_amount ?? b.o.price ?? 0;
          return pb - pa;
        }
        if (sortMode === "price_asc") {
          const pa = a.o.repair_amount ?? a.o.price ?? 0;
          const pb = b.o.repair_amount ?? b.o.price ?? 0;
          return pa - pb;
        }
        return a.i - b.i;
      })
      .map(x => x.o);
  }, [filteredOrders, sortMode, urgentFilter]);

  const groupedOrders = useMemo(() => {
    if (groupMode === "none") {
      return [{ key: "", label: "", color: "", icon: "", desc: "", orders: sortedOrders }];
    }
    if (groupMode === "time") {
      const ORDER: TimeGroup[] = ["critical", "today", "yesterday", "week", "older"];
      const map = new Map<TimeGroup, Order[]>(ORDER.map(k => [k, []]));
      for (const o of sortedOrders) map.get(getTimeGroup(o))!.push(o);
      return ORDER
        .filter(k => map.get(k)!.length > 0)
        .map(k => {
          const meta = TIME_GROUP_META[k];
          return { key: k, label: meta.label, color: meta.color, icon: meta.icon, desc: meta.desc || "", orders: map.get(k)! };
        });
    }
    if (groupMode === "status") {
      const map = new Map<string, Order[]>();
      for (const o of sortedOrders) {
        if (!map.has(o.status)) map.set(o.status, []);
        map.get(o.status)!.push(o);
      }
      return Array.from(map.entries()).map(([key, grpOrders]) => {
        const st = STATUSES.find(s => s.key === key);
        return { key, label: st?.label || key, color: "#888", icon: "Circle", desc: "", orders: grpOrders };
      });
    }
    if (groupMode === "paid") {
      const paid = sortedOrders.filter(o => o.is_paid);
      const unpaid = sortedOrders.filter(o => !o.is_paid);
      return [
        { key: "unpaid", label: "Не оплачено", color: "#fb923c", icon: "Clock", desc: "", orders: unpaid },
        { key: "paid",   label: "Оплачено",    color: "#34d399", icon: "CheckCircle", desc: "", orders: paid },
      ].filter(g => g.orders.length > 0);
    }
    return [{ key: "", label: "", color: "", icon: "", desc: "", orders: sortedOrders }];
  }, [sortedOrders, groupMode]);

  return (
    <>
      {/* ── Баннер срочного фильтра ── */}
      {urgentFilter && (
        <div className="mx-3 mt-2 mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: "linear-gradient(135deg, rgba(220,38,38,0.18), rgba(239,68,68,0.08))",
            border: "1px solid rgba(239,68,68,0.35)",
          }}>
          <Icon name="AlertTriangle" size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span className="font-oswald font-bold uppercase tracking-wide text-[13px]" style={{ color: "#f87171" }}>
            Срочные ремонты — {urgentCount} шт.
          </span>
          <span className="font-roboto text-[11px] ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            · 6+ часов без движения
          </span>
          <button
            onClick={() => setUrgentFilter(false)}
            className="ml-auto flex items-center gap-1 font-roboto text-[11px] rounded-lg px-2 py-1 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}
          >
            <Icon name="X" size={11} />
            Все
          </button>
        </div>
      )}

      <RepairStatusFilter
        orders={orders}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
      />

      {showForm && (
        <RepairNewOrderForm
          form={form}
          setForm={setForm}
          creating={creating}
          createOrder={createOrder}
        />
      )}

      <RepairSortGroupBar
        sortMode={sortMode}
        setSortMode={setSortMode}
        groupMode={groupMode}
        setGroupMode={setGroupMode}
        sortedOrdersCount={sortedOrders.length}
        groupedOrders={groupedOrders}
        loading={loading}
        ordersTotal={orders.length}
        cardsView={cardsView}
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
        callRobotReady={callRobotReady}
        inviteToMax={inviteToMax}
      />
    </>
  );
}