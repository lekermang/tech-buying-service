import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  GOLD_URL, GOLD_STATUSES, GoldOrder, GoldAnalytics, GoldDayStat,
  EMPTY_GOLD_FORM, PURITY_OPTIONS, PAYMENT_OPTIONS,
} from "./gold/types";
import GoldAnalyticsView from "./gold/GoldAnalytics";
import GoldOrderCard from "./gold/GoldOrderCard";

type View = "list" | "analytics";
type Period = "day" | "yesterday" | "week" | "month";

type EditForm = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string;
  comment: string; admin_note: string; payment_method: string;
};

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] placeholder:text-white/20";

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

  const loadAnalytics = useCallback(async (p: Period) => {
    setAnalyticsLoading(true);
    const [aRes, sRes] = await Promise.all([
      fetch(`${GOLD_URL}?action=analytics&period=${p}`, { headers: { "X-Employee-Token": token } }),
      fetch(`${GOLD_URL}?action=daily_stats`, { headers: { "X-Employee-Token": token } }),
    ]);
    const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
    setAnalytics(aData);
    setStats(sData.stats || []);
    setAnalyticsLoading(false);
  }, [token]);

  useEffect(() => {
    if (view === "list") loadOrders();
    else loadAnalytics(period);
  }, [view, loadOrders, loadAnalytics, period]);

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
    const body: Record<string, unknown> = {
      id: order.id,
      name: ef.name, phone: ef.phone,
      item_name: ef.item_name || null,
      weight: ef.weight ? parseFloat(ef.weight) : null,
      purity: ef.purity || null,
      buy_price: ef.buy_price ? parseInt(ef.buy_price) : null,
      sell_price: ef.sell_price ? parseInt(ef.sell_price) : null,
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

  const countByStatus = (key: string) => orders.filter(o => o.status === key).length;

  return (
    <div className="flex flex-col h-full">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-[#222] flex items-center gap-3 flex-wrap">
        <div className="flex rounded overflow-hidden border border-[#333]">
          <button onClick={() => setView("list")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "list" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="List" size={13} />Заявки
          </button>
          <button onClick={() => setView("analytics")}
            className={`px-4 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === "analytics" ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
            <Icon name="BarChart2" size={13} />Аналитика
          </button>
        </div>

        {view === "list" && (
          <>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, изделию..."
              className="flex-1 min-w-[150px] bg-[#0D0D0D] border border-[#333] text-white px-3 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                className={`px-2 py-1 font-roboto text-[10px] border transition-colors ${!dateFrom && !dateTo ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>Все</button>
              {[
                { label: "Сегодня", get: () => { const t = new Date().toISOString().slice(0, 10); return [t, t]; } },
                { label: "Неделя", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 6); return [f.toISOString().slice(0, 10), t.toISOString().slice(0, 10)]; } },
                { label: "Месяц", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 29); return [f.toISOString().slice(0, 10), t.toISOString().slice(0, 10)]; } },
              ].map(q => (
                <button key={q.label} onClick={() => { const [f, to] = q.get(); setDateFrom(f); setDateTo(to); }}
                  className="px-2 py-1 font-roboto text-[10px] border border-[#333] text-white/40 hover:text-white transition-colors">{q.label}</button>
              ))}
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
              <span className="text-white/20 text-xs">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
            </div>
            <button onClick={loadOrders} disabled={loading} className="text-white/40 hover:text-white p-1.5 transition-colors">
              <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_GOLD_FORM }); }}
              className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors">
              <Icon name={showForm ? "X" : "Plus"} size={13} />
              {showForm ? "Отмена" : "Заявка"}
            </button>
          </>
        )}
      </div>

      {/* Аналитика */}
      {view === "analytics" && (
        <GoldAnalyticsView
          analytics={analytics}
          loading={analyticsLoading}
          period={period}
          stats={stats}
          onPeriodChange={setPeriod}
          onRefresh={() => loadAnalytics(period)}
        />
      )}

      {/* Список */}
      {view === "list" && (
        <>
          {/* Форма новой заявки */}
          {showForm && (
            <div className="px-4 py-4 bg-[#0A0A0A] border-b border-[#222]">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-3">Новая заявка — Золото</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Имя *</div>
                  <input className={INP} placeholder="Имя клиента" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Телефон *</div>
                  <input className={INP} placeholder="+7..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Изделие</div>
                  <input className={INP} placeholder="Кольцо, цепочка..." value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Проба</div>
                  <select className={INP} value={form.purity} onChange={e => setForm(f => ({ ...f, purity: e.target.value }))}>
                    {PURITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Вес (г)</div>
                  <input type="number" step="0.01" className={INP} placeholder="0.00" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Закупка ₽</div>
                  <input type="number" className={INP} placeholder="0" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} />
                </div>
                <div>
                  <div className="font-roboto text-[10px] text-white/30 mb-0.5">Продажа ₽</div>
                  <input type="number" className={INP} placeholder="0" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <div className="font-roboto text-[10px] text-white/30 mb-0.5">Комментарий</div>
                <input className={INP} placeholder="Комментарий..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
              </div>
              <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 text-sm uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><Icon name="Loader" size={14} className="animate-spin" />Создаю...</> : "Создать заявку"}
              </button>
            </div>
          )}

          {/* Фильтры статусов */}
          <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-[#222]">
            <button onClick={() => setFilterStatus("all")}
              className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${filterStatus === "all" ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
              Все ({orders.length})
            </button>
            {GOLD_STATUSES.map(s => {
              const cnt = countByStatus(s.key);
              return (
                <button key={s.key} onClick={() => setFilterStatus(s.key)}
                  className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors flex items-center gap-1 ${filterStatus === s.key ? s.color + " border-current" : "border-white/10 text-white/40 hover:text-white"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} />{s.label}{cnt > 0 ? ` (${cnt})` : ""}
                </button>
              );
            })}
          </div>

          {/* Список заявок */}
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="text-center py-12 text-white/30 font-roboto text-sm">Загружаю...</div>}
            {!loading && orders.length === 0 && (
              <div className="text-center py-16 text-white/20">
                <Icon name="Gem" size={32} className="mx-auto mb-3 opacity-20" />
                <div className="font-roboto text-sm">Заявок пока нет</div>
              </div>
            )}
            {orders.map(order => (
              <GoldOrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                onStatusChange={onStatusChange}
                onSave={onSave}
                onDelete={onDelete}
                saving={saving}
                saveError={saveError}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}