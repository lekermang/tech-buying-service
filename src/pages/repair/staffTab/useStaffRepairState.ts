import { useState, useCallback } from "react";
import { Order, DayStat, EMPTY_FORM } from "../types";
import { View, Period, RepairAnalytics, EditForm, EMPTY_READY } from "./staffTabTypes";
import useDebouncedValue from "@/hooks/useDebouncedValue";

/**
 * Полный набор состояний вкладки StaffRepair.
 * Вынесено из StaffRepairTab.tsx 1:1 без изменения логики.
 */
export function useStaffRepairState() {
  const [view, setView] = useState<View>("list");

  // Режим отображения карточек (сетка / список) — сохраняется в localStorage
  const [cardsView, setCardsViewState] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "list";
    const saved = window.localStorage.getItem("staffRepair.cardsView");
    return saved === "grid" || saved === "list" ? saved : "list";
  });
  const setCardsView = useCallback((v: "grid" | "list") => {
    setCardsViewState(v);
    try { window.localStorage.setItem("staffRepair.cardsView", v); } catch { /* ignore */ }
  }, []);

  // Список заявок
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
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
  // Произвольный диапазон для period === 'custom' (формат YYYY-MM-DD)
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState<string>("");
  const [analyticsDateTo, setAnalyticsDateTo] = useState<string>("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Модалка с заказами по статусу/метрике
  const [ordersModal, setOrdersModal] = useState<{ statuses: string[]; title: string; accent: "revenue" | "costs" | "master" | "profit" | "status" } | null>(null);

  // Статистика (старая, для совместимости)
  const [stats, setStats] = useState<DayStat[]>([]);

  return {
    view, setView,
    cardsView, setCardsView,
    orders, setOrders,
    loading, setLoading,
    filterStatus, setFilterStatus,
    search, setSearch,
    debouncedSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    expandedId, setExpandedId,
    editForm, setEditForm,
    saving, setSaving,
    saveError, setSaveError,
    showForm, setShowForm,
    form, setForm,
    creating, setCreating,
    readyModal, setReadyModal,
    readyForm, setReadyForm,
    readyError, setReadyError,
    readySaving, setReadySaving,
    analytics, setAnalytics,
    period, setPeriod,
    analyticsDateFrom, setAnalyticsDateFrom,
    analyticsDateTo, setAnalyticsDateTo,
    analyticsLoading, setAnalyticsLoading,
    showHistory, setShowHistory,
    ordersModal, setOrdersModal,
    stats, setStats,
  };
}

export type StaffRepairState = ReturnType<typeof useStaffRepairState>;