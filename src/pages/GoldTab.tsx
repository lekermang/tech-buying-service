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
      {/* Premium шапка */}
      <div className="px-3 pt-3 pb-2 border-b border-[#1A1A1A] bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex flex-1 bg-[#141414] border border-[#1F1F1F] rounded-md p-0.5">
            {[
              { k: "list", l: "Заявки", icon: "List" },
              { k: "analytics", l: "Аналитика", icon: "BarChart2" },
            ].map(v => {
              const active = view === v.k;
              return (
                <button key={v.k} onClick={() => setView(v.k as View)}
                  className={`flex-1 py-2 px-2.5 font-roboto text-[11px] rounded-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                    active
                      ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-lg shadow-[#FFD700]/20"
                      : "text-white/50 hover:text-white/80"
                  }`}>
                  <Icon name={v.icon} size={13} />
                  {v.l}
                </button>
              );
            })}
          </div>
          {view === "list" && (
            <button onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_GOLD_FORM }); }}
              className={`flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all shrink-0 active:scale-95 ${
                showForm
                  ? "bg-[#2A2A2A] text-white/60 border border-[#333]"
                  : "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20"
              }`}>
              <Icon name={showForm ? "X" : "Plus"} size={14} />
              {showForm ? "Отмена" : "Заявка"}
            </button>
          )}
        </div>

        {view === "list" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск: имя, телефон, изделие..."
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
                { label: "Все", f: "", t: "" },
                { label: "Сегодня", get: () => { const t = new Date().toISOString().slice(0, 10); return { f: t, t }; } },
                { label: "Неделя", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 6); return { f: f.toISOString().slice(0, 10), t: t.toISOString().slice(0, 10) }; } },
                { label: "Месяц", get: () => { const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - 29); return { f: f.toISOString().slice(0, 10), t: t.toISOString().slice(0, 10) }; } },
              ].map(q => {
                const range = q.get ? q.get() : { f: "", t: "" };
                const active = range.f === dateFrom && range.t === dateTo;
                return (
                  <button key={q.label} onClick={() => { setDateFrom(range.f); setDateTo(range.t); }}
                    className={`px-3 py-1.5 font-roboto text-[11px] rounded-full shrink-0 transition-all active:scale-95 ${
                      active
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
            <div className="mx-3 mt-3 mb-1 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 rounded-lg p-4 shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
              <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Icon name="Gem" size={12} /> Новая заявка — Золото
              </div>
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
                className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 text-sm uppercase rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><Icon name="Loader" size={14} className="animate-spin" />Создаю...</> : <><Icon name="Check" size={15} />Создать заявку</>}
              </button>
            </div>
          )}

          {/* Фильтры статусов — premium chips */}
          <div className="px-3 py-2.5 flex gap-1.5 flex-wrap border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <button onClick={() => setFilterStatus("all")}
              className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
                filterStatus === "all"
                  ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
              }`}>
              <Icon name="Gem" size={11} />
              Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span>
            </button>
            {GOLD_STATUSES.map(s => {
              const cnt = countByStatus(s.key);
              const active = filterStatus === s.key;
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

          {/* Список заявок */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-14 gap-2 text-white/40">
                <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
                <span className="font-roboto text-sm">Загружаю заявки...</span>
              </div>
            )}
            {!loading && orders.length === 0 && (
              <div className="text-center py-14 px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#FFD700]/10 to-[#0D0D0D] border border-[#FFD700]/20 rounded-full flex items-center justify-center">
                  <Icon name="Gem" size={28} className="text-[#FFD700]/50" />
                </div>
                <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">Заявок по золоту нет</div>
                <div className="font-roboto text-white/30 text-xs">Создайте первую заявку кнопкой «+»</div>
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