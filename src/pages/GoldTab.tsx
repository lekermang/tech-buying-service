import { useState, useEffect, useCallback } from "react";
import {
  GOLD_URL, GoldOrder, GoldAnalytics, GoldDayStat,
  EMPTY_GOLD_FORM,
} from "./gold/types";
import GoldAnalyticsView from "./gold/GoldAnalytics";
import GoldTabHeader from "./gold/GoldTabHeader";
import GoldTabStatusFilter from "./gold/GoldTabStatusFilter";
import GoldTabCreateForm from "./gold/GoldTabCreateForm";
import GoldTabList from "./gold/GoldTabList";

type View = "list" | "analytics";
type Period = "day" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

type EditForm = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string;
  sell_price_per_gram: string;
  comment: string; admin_note: string; payment_method: string;
};

export default function GoldTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("list");
  const [orders, setOrders] = useState<GoldOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_GOLD_FORM });
  const [creating, setCreating] = useState(false);

  const [analytics, setAnalytics] = useState<GoldAnalytics | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [stats, setStats] = useState<GoldDayStat[]>([]);

  const headers = { "Content-Type": "application/json", "X-Employee-Token": token };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (search.trim()) ps.push("search=" + encodeURIComponent(search.trim()));
    if (dateFrom) ps.push("date_from=" + dateFrom);
    if (dateTo) ps.push("date_to=" + dateTo);
    const url = GOLD_URL + (ps.length ? "?" + ps.join("&") : "");
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [token, filterStatus, search, dateFrom, dateTo]);

  const loadAnalytics = useCallback(async (p: Period, from: string, to: string) => {
    setAnalyticsLoading(true);
    let url = `${GOLD_URL}?action=analytics&period=${p}`;
    if (p === "custom") {
      if (from) url += `&date_from=${from}`;
      if (to) url += `&date_to=${to}`;
    }
    const [aRes, sRes] = await Promise.all([
      fetch(url, { headers: { "X-Employee-Token": token } }),
      fetch(`${GOLD_URL}?action=daily_stats`, { headers: { "X-Employee-Token": token } }),
    ]);
    const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
    setAnalytics(aData);
    setStats(sData.stats || []);
    setAnalyticsLoading(false);
  }, [token]);

  useEffect(() => {
    if (view === "list") loadOrders();
    else loadAnalytics(period, periodFrom, periodTo);
  }, [view, loadOrders, loadAnalytics, period, periodFrom, periodTo]);

  const createOrder = async () => {
    if (!form.name || !form.phone) return;
    setCreating(true);
    const body: Record<string, unknown> = {
      action: "create",
      name: form.name, phone: form.phone,
      item_name: form.item_name || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      purity: form.purity || null,
      buy_price: form.buy_price ? parseInt(form.buy_price) : null,
      sell_price: form.sell_price ? parseInt(form.sell_price) : null,
      comment: form.comment || null,
    };
    const res = await fetch(GOLD_URL, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    setCreating(false);
    if (data.order_id) {
      setShowForm(false);
      setForm({ ...EMPTY_GOLD_FORM });
      loadOrders();
    }
  };

  const onStatusChange = async (id: number, status: string) => {
    setSaving(true);
    setSaveError(null);
    await fetch(GOLD_URL, { method: "POST", headers, body: JSON.stringify({ id, status }) });
    setSaving(false);
    loadOrders();
  };

  const onSave = async (order: GoldOrder, ef: EditForm) => {
    setSaving(true);
    setSaveError(null);
    // Если задана цена за грамм — отдаём её, бэкенд сам пересчитает sell_price.
    // Если её нет, но есть sell_price (старые записи) — оставляем как есть.
    const spg = ef.sell_price_per_gram ? parseFloat(ef.sell_price_per_gram.replace(",", ".")) : null;
    const w = ef.weight ? parseFloat(ef.weight.replace(",", ".")) : null;
    let sellTotal: number | null = ef.sell_price ? parseInt(ef.sell_price) : null;
    if (spg && spg > 0 && w && w > 0) {
      sellTotal = Math.round(spg * w);
    }

    const body: Record<string, unknown> = {
      id: order.id,
      name: ef.name, phone: ef.phone,
      item_name: ef.item_name || null,
      weight: w,
      purity: ef.purity || null,
      buy_price: ef.buy_price ? parseInt(ef.buy_price) : null,
      sell_price: sellTotal,
      sell_price_per_gram: spg,
      comment: ef.comment || null,
      admin_note: ef.admin_note || null,
      payment_method: ef.payment_method || null,
    };
    const res = await fetch(GOLD_URL, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setExpandedId(null);
      loadOrders();
    } else {
      setSaveError(data.error || "Ошибка сохранения");
    }
  };

  const onDelete = async (id: number) => {
    setSaving(true);
    await fetch(GOLD_URL, { method: "POST", headers, body: JSON.stringify({ action: "delete", id }) });
    setSaving(false);
    setExpandedId(null);
    loadOrders();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Premium шапка */}
      <GoldTabHeader
        view={view}
        onViewChange={setView}
        showForm={showForm}
        onToggleForm={() => { setShowForm(!showForm); setForm({ ...EMPTY_GOLD_FORM }); }}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        onRefresh={loadOrders}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Аналитика */}
      {view === "analytics" && (
        <GoldAnalyticsView
          analytics={analytics}
          loading={analyticsLoading}
          period={period}
          stats={stats}
          onPeriodChange={setPeriod}
          periodFrom={periodFrom}
          periodTo={periodTo}
          onPeriodFromChange={setPeriodFrom}
          onPeriodToChange={setPeriodTo}
          onRefresh={() => loadAnalytics(period, periodFrom, periodTo)}
          token={token}
          onSold={() => loadAnalytics(period, periodFrom, periodTo)}
        />
      )}

      {/* Список */}
      {view === "list" && (
        <>
          {/* Форма новой заявки */}
          {showForm && (
            <GoldTabCreateForm
              form={form}
              onFormChange={setForm}
              creating={creating}
              onCreate={createOrder}
            />
          )}

          {/* Фильтры статусов — premium chips */}
          <GoldTabStatusFilter
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            orders={orders}
          />

          {/* Список заявок */}
          <GoldTabList
            orders={orders}
            loading={loading}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
            onStatusChange={onStatusChange}
            onSave={onSave}
            onDelete={onDelete}
            saving={saving}
            saveError={saveError}
          />
        </>
      )}
    </div>
  );
}