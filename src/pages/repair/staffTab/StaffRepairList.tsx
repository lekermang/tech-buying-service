import { useMemo, useState } from "react";
import { STATUSES, Order, EMPTY_FORM } from "../types";
import { EditForm } from "./staffTabTypes";
import {
  SortMode, GroupMode, TimeGroup,
  ageHours, urgencyLevel, getTimeGroup, TIME_GROUP_META,
} from "./repairListUtils";
import RepairStatusFilter from "./RepairStatusFilter";
import RepairNewOrderForm from "./RepairNewOrderForm";
import RepairSortGroupBar from "./RepairSortGroupBar";

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
};

export default function StaffRepairList({
  orders, loading, filterStatus, setFilterStatus, statusCounts,
  showForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder, callRobotReady, inviteToMax,
  cardsView = "list",
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("urgency");
  const [groupMode, setGroupMode] = useState<GroupMode>("time");

  const sortedOrders = useMemo(() => {
    return orders
      .map((o, i) => ({ o, i }))
      .sort((a, b) => {
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
  }, [orders, sortMode]);

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
