import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/7caeef6b-7cb0-458d-9104-a9eddc754c18";

/* ── Утилиты ────────────────────────────────────────────────────────────── */
async function gsmCall(action: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ action, ...extra });
  const res = await fetch(`${API_URL}?${params}`);
  const json = await res.json();
  return json.raw;
}

function parseXmlField(xml: string, tag: string): string {
  const m = xml.match(new RegExp("<" + tag + "[^>]*>([^<]*)</" + tag + ">"));
  return m ? m[1] : "";
}

function parseXmlItems(xml: string, tag: string): Record<string, string>[] {
  const items: Record<string, string>[] = [];
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "g");
  const matches = xml.match(re) || [];
  for (const block of matches) {
    const fieldRe = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
    const obj: Record<string, string> = {};
    let m: RegExpExecArray | null;
    while ((m = fieldRe.exec(block)) !== null) obj[m[1]] = m[2];
    if (Object.keys(obj).length) items.push(obj);
  }
  return items;
}

/* ── Типы ───────────────────────────────────────────────────────────────── */
type Tab = "dashboard" | "services" | "orders" | "neworder";

interface Service { serviceid: string; title: string; credits: string; time: string; }
interface Order { orderid: string; servicename: string; imei: string; status: string; credits: string; orderdate: string; }

/* ── Цвета статусов ─────────────────────────────────────────────────────── */
const STATUS_COLOR: Record<string, string> = {
  completed: "#6ee7b7", approved: "#6ee7b7", success: "#6ee7b7",
  pending: "#FFD700", processing: "#7dd3fc", inprogress: "#7dd3fc",
  error: "#fca5a5", failed: "#fca5a5", rejected: "#fca5a5",
  queued: "#c4b5fd",
};
function statusColor(s: string) {
  return STATUS_COLOR[s?.toLowerCase()] ?? "#94a3b8";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    completed: "Выполнен", approved: "Одобрен", success: "Успешно",
    pending: "Ожидает", processing: "В обработке", inprogress: "В работе",
    error: "Ошибка", failed: "Не выполнен", rejected: "Отклонён",
    queued: "В очереди",
  };
  return map[s?.toLowerCase()] ?? s;
}

/* ── Компоненты карточек ────────────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(145deg,rgba(14,11,6,0.97) 0%,rgba(8,8,12,0.99) 100%)",
        border: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "0 0 0 1px rgba(255,215,0,0.04),0 20px 40px rgba(0,0,0,0.5)",
      }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.4),transparent)" }} />
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, accent = "#FFD700", loading }: {
  icon: string; label: string; value: string; accent?: string; loading?: boolean;
}) {
  return (
    <Card>
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30`, boxShadow: `0 0 20px ${accent}20` }}>
          <Icon name={icon} size={22} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-0.5">{label}</div>
          {loading
            ? <div className="h-6 w-24 rounded-lg animate-pulse" style={{ background: "rgba(255,215,0,0.12)" }} />
            : <div className="font-oswald font-bold text-2xl" style={{ color: accent, textShadow: `0 0 20px ${accent}50` }}>{value}</div>
          }
        </div>
      </div>
    </Card>
  );
}

/* ── Таблица заказов ────────────────────────────────────────────────────── */
function OrdersTable({ orders, loading }: { orders: Order[]; loading: boolean }) {
  if (loading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,215,0,0.06)" }} />
      ))}
    </div>
  );
  if (!orders.length) return (
    <div className="text-center py-14 text-white/30">
      <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
      <div className="font-oswald uppercase tracking-wide">Заказов пока нет</div>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="text-left border-b" style={{ borderColor: "rgba(255,215,0,0.1)" }}>
            {["ID", "Услуга", "IMEI/Номер", "Дата", "Стоимость", "Статус"].map(h => (
              <th key={h} className="pb-3 pr-4 font-roboto text-[10px] uppercase tracking-widest text-white/35">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => {
            const sc = statusColor(o.status);
            return (
              <tr key={o.orderid ?? idx}
                className="border-b transition-colors hover:bg-white/[0.02]"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <td className="py-3 pr-4 font-mono text-xs text-white/40">#{o.orderid}</td>
                <td className="py-3 pr-4 font-roboto text-sm text-white/80 max-w-[180px] truncate">{o.servicename}</td>
                <td className="py-3 pr-4 font-mono text-xs text-white/50">{o.imei || "—"}</td>
                <td className="py-3 pr-4 font-roboto text-xs text-white/40 whitespace-nowrap">{o.orderdate || "—"}</td>
                <td className="py-3 pr-4 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                  {o.credits ? `${o.credits} ₽` : "—"}
                </td>
                <td className="py-3">
                  <span className="px-2.5 py-1 rounded-full font-roboto text-[10px] uppercase tracking-wider font-bold"
                    style={{ background: `${sc}18`, border: `1px solid ${sc}35`, color: sc }}>
                    {statusLabel(o.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Список услуг ────────────────────────────────────────────────────────── */
function ServicesList({ services, loading, onSelect }: {
  services: Service[]; loading: boolean; onSelect: (s: Service) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = services.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,215,0,0.06)" }} />
      ))}
    </div>
  );

  return (
    <div>
      {/* Поиск */}
      <div className="relative mb-4">
        <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск услуги..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl font-roboto text-sm text-white/80 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,215,0,0.12)",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.35)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.12)")}
        />
      </div>

      {!filtered.length && (
        <div className="text-center py-10 text-white/30 font-roboto text-sm">Ничего не найдено</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map((s) => (
          <button key={s.serviceid}
            onClick={() => onSelect(s)}
            className="group text-left rounded-xl p-4 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,215,0,0.06)"; el.style.borderColor = "rgba(255,215,0,0.25)"; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.03)"; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.transform = "translateY(0)"; }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white/85 leading-snug group-hover:text-white transition-colors line-clamp-2">
                  {s.title}
                </div>
                {s.time && (
                  <div className="font-roboto text-[10px] text-white/30 mt-1 flex items-center gap-1">
                    <Icon name="Clock" size={10} />{s.time}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-oswald font-bold text-base" style={{ color: "#FFD700" }}>
                  {s.credits ? `${s.credits} ₽` : "—"}
                </div>
                <div className="font-roboto text-[10px] text-white/25 mt-0.5">за ед.</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="Plus" size={11} style={{ color: "#FFD700" }} />
              <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,215,0,0.7)" }}>
                Создать заказ
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Форма нового заказа ─────────────────────────────────────────────────── */
function NewOrderForm({ services, prefill, onSuccess }: {
  services: Service[]; prefill?: Service | null; onSuccess: () => void;
}) {
  const [serviceId, setServiceId] = useState(prefill?.serviceid ?? "");
  const [imei, setImei] = useState("");
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selected = services.find(s => s.serviceid === serviceId);

  async function submit() {
    if (!serviceId || !imei.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const raw = await gsmCall("createOrder", {
        serviceid: serviceId,
        imei: imei.trim(),
        quantity: qty,
      });
      const isXml = typeof raw === "string";
      if (isXml) {
        const status = parseXmlField(raw, "status");
        const orderid = parseXmlField(raw, "orderid");
        const msg = parseXmlField(raw, "message") || parseXmlField(raw, "error");
        if (status === "1" || orderid) {
          setResult({ ok: true, msg: `Заказ #${orderid} успешно создан!` });
          setImei(""); setQty("1"); setServiceId("");
          setTimeout(onSuccess, 1500);
        } else {
          setResult({ ok: false, msg: msg || "Ошибка при создании заказа" });
        }
      } else {
        const obj = raw as Record<string, unknown>;
        if (obj.orderid || obj.status === "1") {
          setResult({ ok: true, msg: `Заказ #${obj.orderid} создан!` });
          setTimeout(onSuccess, 1500);
        } else {
          setResult({ ok: false, msg: String(obj.message || obj.error || "Ошибка") });
        }
      }
    } catch {
      setResult({ ok: false, msg: "Ошибка сети" });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Выбор услуги */}
      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-2">
          Услуга
        </label>
        <div className="relative">
          <select
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none appearance-none transition-all cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${serviceId ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.1)"}`,
            }}>
            <option value="" disabled style={{ background: "#0a0a0a" }}>Выберите услугу...</option>
            {services.map(s => (
              <option key={s.serviceid} value={s.serviceid} style={{ background: "#0a0a0a" }}>
                {s.title} {s.credits ? `— ${s.credits} ₽` : ""}
              </option>
            ))}
          </select>
          <Icon name="ChevronDown" size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
        {selected && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-white/40 font-roboto">
            {selected.time && <span className="flex items-center gap-1"><Icon name="Clock" size={10} />{selected.time}</span>}
            {selected.credits && <span style={{ color: "#FFD700" }}>{selected.credits} ₽ за заказ</span>}
          </div>
        )}
      </div>

      {/* IMEI */}
      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-2">
          IMEI / Номер устройства
        </label>
        <input
          value={imei}
          onChange={e => setImei(e.target.value)}
          placeholder="Введите IMEI (15 цифр)..."
          maxLength={20}
          className="w-full px-4 py-3 rounded-xl font-mono text-sm text-white/85 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${imei.length >= 15 ? "rgba(110,231,183,0.35)" : "rgba(255,255,255,0.1)"}`,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.35)")}
          onBlur={e => (e.currentTarget.style.borderColor = imei.length >= 15 ? "rgba(110,231,183,0.35)" : "rgba(255,255,255,0.1)")}
        />
        <div className="mt-1 font-roboto text-[10px] text-white/25">
          *#06# → набери на телефоне для получения IMEI
        </div>
      </div>

      {/* Количество */}
      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-2">
          Количество
        </label>
        <input
          type="number"
          min="1" max="100"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-28 px-4 py-3 rounded-xl font-mono text-sm text-white/85 outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.35)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* Итог */}
      {selected && imei && (
        <div className="rounded-xl p-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.18)" }}>
          <div>
            <div className="font-roboto text-xs text-white/40 mb-0.5">К списанию</div>
            <div className="font-oswald font-bold text-xl" style={{ color: "#FFD700" }}>
              {selected.credits ? `${parseFloat(selected.credits) * parseInt(qty || "1")} ₽` : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-roboto text-xs text-white/40 mb-0.5">Услуга</div>
            <div className="font-roboto text-xs text-white/60 max-w-[200px] leading-snug">{selected.title}</div>
          </div>
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: result.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
            border: `1px solid ${result.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
          }}>
          <Icon name={result.ok ? "CheckCircle" : "XCircle"} size={18}
            style={{ color: result.ok ? "#6ee7b7" : "#fca5a5", flexShrink: 0 }} />
          <span className="font-roboto text-sm" style={{ color: result.ok ? "#6ee7b7" : "#fca5a5" }}>
            {result.msg}
          </span>
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={submit}
        disabled={loading || !serviceId || !imei.trim()}
        className="group relative w-full overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-7 py-4 rounded-xl text-sm transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        style={{
          background: "linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.6),0 10px 30px rgba(255,215,0,0.35)",
        }}>
        <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        {loading
          ? <><Icon name="Loader" size={16} className="relative animate-spin" />Отправляем...</>
          : <><Icon name="Send" size={16} className="relative" />Создать заказ</>
        }
      </button>
    </div>
  );
}

/* ── Главная страница ────────────────────────────────────────────────────── */
export default function Unlock() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState("₽");
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [prefillService, setPrefillService] = useState<Service | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const raw = await gsmCall("getBalance");
      if (typeof raw === "string") {
        const credits = parseXmlField(raw, "credits") || parseXmlField(raw, "balance");
        const curr = parseXmlField(raw, "currency");
        setBalance(credits || "—");
        if (curr) setCurrency(curr);
      } else if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        setBalance(String(obj.credits ?? obj.balance ?? "—"));
        if (obj.currency) setCurrency(String(obj.currency));
      }
    } catch { setBalance("—"); }
    setLoadingBalance(false);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const raw = await gsmCall("getServices");
      if (typeof raw === "string") {
        const items = parseXmlItems(raw, "service");
        setServices(items as unknown as Service[]);
      } else if (Array.isArray(raw)) {
        setServices(raw as Service[]);
      }
    } catch { /* ignore */ }
    setLoadingServices(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const raw = await gsmCall("getOrderList");
      if (typeof raw === "string") {
        const items = parseXmlItems(raw, "order");
        setOrders(items as unknown as Order[]);
      } else if (Array.isArray(raw)) {
        setOrders(raw as Order[]);
      }
    } catch { /* ignore */ }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchServices();
    fetchOrders();
  }, [fetchBalance, fetchServices, fetchOrders]);

  function handleSelectService(s: Service) {
    setPrefillService(s);
    setTab("neworder");
  }

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Дашборд" },
    { id: "services",  icon: "Grid3X3",         label: "Услуги"  },
    { id: "orders",    icon: "ClipboardList",    label: "Заказы"  },
    { id: "neworder",  icon: "Plus",             label: "Заказ"   },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#060406" }}>
      {/* Фоновый градиент */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,215,0,0.06) 0%,transparent 60%)" }} />

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* ── Шапка ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 font-roboto text-[10px] uppercase tracking-[0.2em]"
              style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.75)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
              </span>
              3gsm.ru · iCloud & FRP
            </div>
            <h1 className="font-oswald font-black text-3xl sm:text-4xl uppercase text-white leading-tight">
              Кабинет{" "}
              <span style={{ color: "#FFD700", textShadow: "0 0 30px rgba(255,215,0,0.3)" }}>
                разблокировки
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-1 font-roboto">
              Снятие iCloud · FRP · Unlock IMEI
            </p>
          </div>

          {/* Баланс в шапке */}
          <div className="shrink-0 text-right hidden sm:block">
            <div className="font-roboto text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Баланс</div>
            {loadingBalance
              ? <div className="h-7 w-20 rounded-lg animate-pulse ml-auto" style={{ background: "rgba(255,215,0,0.1)" }} />
              : <div className="font-oswald font-bold text-2xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
                  {balance} {currency}
                </div>
            }
          </div>
        </div>

        {/* ── Навигация ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-roboto text-sm font-medium transition-all whitespace-nowrap shrink-0"
              style={{
                background: tab === t.id ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${tab === t.id ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.07)"}`,
                color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.45)",
                boxShadow: tab === t.id ? "0 0 16px rgba(255,215,0,0.12)" : "none",
              }}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
          <button onClick={() => { fetchBalance(); fetchOrders(); }}
            className="ml-auto flex items-center gap-2 px-3 py-2.5 rounded-xl font-roboto text-xs transition-all shrink-0"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <Icon name="RefreshCw" size={13} />
            Обновить
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ДАШБОРД
            ══════════════════════════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div className="space-y-5">
            {/* Стат-карточки */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon="Wallet" label="Баланс" value={balance ? `${balance} ${currency}` : "—"} loading={loadingBalance} />
              <StatCard icon="Package" label="Всего заказов" value={loadingOrders ? "…" : String(orders.length)} accent="#7dd3fc" loading={loadingOrders} />
              <StatCard icon="CheckCircle" label="Выполнено"
                value={loadingOrders ? "…" : String(orders.filter(o => ["completed","approved","success"].includes(o.status?.toLowerCase())).length)}
                accent="#6ee7b7" loading={loadingOrders} />
              <StatCard icon="Clock" label="В работе"
                value={loadingOrders ? "…" : String(orders.filter(o => ["pending","processing","inprogress","queued"].includes(o.status?.toLowerCase())).length)}
                accent="#c4b5fd" loading={loadingOrders} />
            </div>

            {/* Последние заказы */}
            <Card>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                      <Icon name="ClipboardList" size={15} style={{ color: "#FFD700" }} />
                    </div>
                    <span className="font-oswald font-bold text-lg uppercase text-white">Последние заказы</span>
                  </div>
                  <button onClick={() => setTab("orders")}
                    className="font-roboto text-[11px] uppercase tracking-widest flex items-center gap-1 transition-colors"
                    style={{ color: "rgba(255,215,0,0.45)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.85)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                    Все <Icon name="ChevronRight" size={11} />
                  </button>
                </div>
                <OrdersTable orders={orders.slice(0, 5)} loading={loadingOrders} />
              </div>
            </Card>

            {/* Быстрые услуги */}
            <Card>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(125,211,252,0.1)", border: "1px solid rgba(125,211,252,0.2)" }}>
                      <Icon name="Zap" size={15} style={{ color: "#7dd3fc" }} />
                    </div>
                    <span className="font-oswald font-bold text-lg uppercase text-white">Популярные услуги</span>
                  </div>
                  <button onClick={() => setTab("services")}
                    className="font-roboto text-[11px] uppercase tracking-widest flex items-center gap-1 transition-colors"
                    style={{ color: "rgba(255,215,0,0.45)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.85)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                    Все <Icon name="ChevronRight" size={11} />
                  </button>
                </div>
                <ServicesList services={services.slice(0, 6)} loading={loadingServices} onSelect={handleSelectService} />
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            УСЛУГИ
            ══════════════════════════════════════════════════════════ */}
        {tab === "services" && (
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.4)" }}>
                  <Icon name="Grid3X3" size={17} className="text-black" />
                </div>
                <div>
                  <h2 className="font-oswald font-bold text-xl uppercase text-white">Каталог услуг</h2>
                  <div className="font-roboto text-[10px] text-white/35 mt-0.5">
                    {loadingServices ? "Загрузка..." : `${services.length} услуг доступно`}
                  </div>
                </div>
              </div>
              <ServicesList services={services} loading={loadingServices} onSelect={handleSelectService} />
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ЗАКАЗЫ
            ══════════════════════════════════════════════════════════ */}
        {tab === "orders" && (
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(125,211,252,0.12)", border: "1px solid rgba(125,211,252,0.25)" }}>
                    <Icon name="ClipboardList" size={17} style={{ color: "#7dd3fc" }} />
                  </div>
                  <div>
                    <h2 className="font-oswald font-bold text-xl uppercase text-white">История заказов</h2>
                    <div className="font-roboto text-[10px] text-white/35 mt-0.5">
                      {loadingOrders ? "Загрузка..." : `${orders.length} заказов`}
                    </div>
                  </div>
                </div>
                <button onClick={fetchOrders}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                  <Icon name="RefreshCw" size={12} />Обновить
                </button>
              </div>
              <OrdersTable orders={orders} loading={loadingOrders} />
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════
            НОВЫЙ ЗАКАЗ
            ══════════════════════════════════════════════════════════ */}
        {tab === "neworder" && (
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#6ee7b7,#059669)", boxShadow: "0 0 16px rgba(110,231,183,0.3)" }}>
                  <Icon name="Plus" size={17} className="text-black" />
                </div>
                <div>
                  <h2 className="font-oswald font-bold text-xl uppercase text-white">Создать заказ</h2>
                  <div className="font-roboto text-[10px] text-white/35 mt-0.5">Отправить IMEI на разблокировку</div>
                </div>
              </div>
              <NewOrderForm
                services={services}
                prefill={prefillService}
                onSuccess={() => { fetchOrders(); fetchBalance(); setTab("orders"); }}
              />
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}