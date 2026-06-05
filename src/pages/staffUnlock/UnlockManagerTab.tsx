import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiGet, apiPost, MarkupRow, Order, Tx, Client } from "@/pages/staffUnlock/unlockTypes";
import {
  MarkupSection,
  ServicesSection,
  ClientsSection,
  OrdersSection,
  FinanceSection,
} from "@/pages/staffUnlock/UnlockSections";

type Section = "markup" | "orders" | "clients" | "finance" | "services";

export default function UnlockManagerTab({ token: _token }: { token: string }) {
  const [section, setSection] = useState<Section>("markup");
  const [markup, setMarkup]   = useState<MarkupRow[]>([]);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [txs, setTxs]         = useState<Tx[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Синхронизация услуг
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number; sample?: object[] } | null>(null);
  const [syncRaw, setSyncRaw] = useState<string | null>(null);
  const [htmlSource, setHtmlSource] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [m, o, t, cl] = await Promise.all([
      apiGet("getMarkup").catch(() => null),
      apiGet("adminGetOrders").catch(() => null),
      apiGet("adminGetTransactions").catch(() => null),
      apiGet("adminGetClients").catch(() => null),
    ]);
    if (m?.markup) setMarkup(m.markup);
    if (o?.orders) setOrders(o.orders);
    if (t?.transactions) setTxs(t.transactions);
    if (cl?.clients) setClients(cl.clients);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true); setSyncResult(null); setSyncRaw(null);
    const payload: Record<string, unknown> = { action: "syncServices" };
    if (htmlSource.trim()) payload.html_source = htmlSource.trim();
    const d = await apiPost(payload);
    if (d.ok) {
      setSyncResult({ count: d.count, sample: d.sample });
      setHtmlSource("");
    } else {
      const msg = d.hint || d.error || JSON.stringify(d.diag || {}).slice(0, 300);
      setSyncRaw(msg);
    }
    setSyncing(false);
  }

  const totalOrders = orders.length;
  const doneOrders  = orders.filter(o => ["completed","approved"].includes(o.status)).length;
  const totalIn     = txs.filter(t => t.type === "deposit").reduce((s,t) => s + parseFloat(t.amount||"0"), 0);
  const totalSpent  = txs.filter(t => t.type === "order_payment").reduce((s,t) => s + parseFloat(t.amount||"0"), 0);
  const totalProfit = orders.reduce((s,o) => {
    if (o.price_client && o.price_credits)
      return s + (parseFloat(o.price_client) - parseFloat(o.price_credits));
    return s;
  }, 0);

  const SECTIONS: { id: Section; icon: string; label: string }[] = [
    { id: "markup",   icon: "Tag",           label: "Наценки"  },
    { id: "services", icon: "RefreshCcw",    label: "Услуги"   },
    { id: "clients",  icon: "Users",         label: "Клиенты"  },
    { id: "orders",   icon: "ClipboardList", label: "Заказы"   },
    { id: "finance",  icon: "Wallet",        label: "Финансы"  },
  ];

  return (
    <div className="p-4 pb-8 max-w-4xl mx-auto">
      {/* Шапка */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)", boxShadow: "0 0 20px rgba(125,211,252,0.35)" }}>
          <Icon name="Unlock" size={18} className="text-black" />
        </div>
        <div>
          <h2 className="font-oswald font-black text-xl uppercase text-white">Управление Unlock</h2>
          <div className="font-roboto text-[10px] text-white/35">skypka24.com/unlock · Полное управление</div>
        </div>
        <button onClick={load}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-roboto text-xs text-white/40 hover:text-white/70 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="RefreshCw" size={12} />Обновить
        </button>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {[
          { label: "Клиентов",   value: String(clients.length),                       color: "#7dd3fc" },
          { label: "Заказов",    value: String(totalOrders),                          color: "#7dd3fc" },
          { label: "Выполнено",  value: String(doneOrders),                           color: "#6ee7b7" },
          { label: "Прибыль",    value: `${totalProfit.toLocaleString("ru-RU")} ₽`,   color: "#6ee7b7" },
          { label: "Пополнено",  value: `${totalIn.toLocaleString("ru-RU")} ₽`,       color: "#FFD700" },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 rounded-xl"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
            <div className="font-roboto text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{s.label}</div>
            {loading
              ? <div className="h-5 w-14 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
              : <div className="font-oswald font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* Навигация по разделам */}
      <div className="flex rounded-xl overflow-hidden mb-5 flex-wrap gap-px"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-roboto text-xs font-medium transition-all min-w-[70px]"
            style={{
              background: section === s.id ? "rgba(125,211,252,0.12)" : "transparent",
              color: section === s.id ? "#7dd3fc" : "rgba(255,255,255,0.4)",
              borderRight: i < SECTIONS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
            <Icon name={s.icon} size={13} />
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {section === "markup" && (
        <MarkupSection loading={loading} markup={markup} onSaved={load} />
      )}

      {section === "services" && (
        <ServicesSection
          syncing={syncing}
          syncResult={syncResult}
          syncRaw={syncRaw}
          htmlSource={htmlSource}
          onHtmlSourceChange={setHtmlSource}
          onSync={handleSync}
        />
      )}

      {section === "clients" && (
        <ClientsSection loading={loading} clients={clients} />
      )}

      {section === "orders" && (
        <OrdersSection loading={loading} orders={orders} totalProfit={totalProfit} />
      )}

      {section === "finance" && (
        <FinanceSection
          loading={loading}
          txs={txs}
          totalIn={totalIn}
          totalSpent={totalSpent}
          totalProfit={totalProfit}
        />
      )}
    </div>
  );
}
