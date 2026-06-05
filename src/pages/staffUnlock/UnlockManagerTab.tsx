import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const UNLOCK_URL = "https://functions.poehali.dev/06607e09-1cc5-4df8-bccf-ed619806e834";
const ADMIN_TOKEN = "Mark2015N";

// Все запросы через POST с токеном в body — обходим фильтрацию заголовков платформой
async function apiPost(body: object) {
  const r = await fetch(UNLOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN },
    body: JSON.stringify({ ...body, admin_token: ADMIN_TOKEN }),
  });
  return r.json();
}
async function apiGet(action: string) {
  return apiPost({ action });
}

interface MarkupRow { id: number; category: string; multiplier: string; pct: string; note: string; }
interface Order {
  id: number; gsm_order_id: string | null; service_name: string;
  imei: string; quantity: number; price_credits: string | null;
  price_client: string | null; status: string; created_at: string;
  client_name?: string; client_email?: string; client_id?: number;
}
interface Tx {
  id: number; type: string; amount: string; payment_status: string;
  description: string | null; created_at: string;
  client_name?: string; client_email?: string; client_id?: number;
}
interface Client {
  id: number; full_name: string; email: string; phone: string;
  registered_at: string; order_count: number; total_spent: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  default: "Все остальные", icloud: "iCloud unlock",
  frp: "FRP / Google", server: "Server unlock", imei: "IMEI check",
};
const CATEGORY_COLORS: Record<string, string> = {
  default: "#FFD700", icloud: "#fff3a0", frp: "#7dd3fc",
  server: "#fca5a5", imei: "#86efac",
};
const CATEGORY_ICONS: Record<string, string> = {
  default: "Settings2", icloud: "Apple", frp: "ShieldOff",
  server: "Cpu", imei: "Smartphone",
};
const STATUS_COLOR: Record<string, string> = {
  sent: "#7dd3fc", completed: "#6ee7b7", approved: "#6ee7b7",
  pending: "#FFD700", processing: "#c4b5fd", error: "#fca5a5",
};
const STATUS_LABEL: Record<string, string> = {
  sent: "Отправлен", completed: "Выполнен", approved: "Одобрен",
  pending: "Ожидает", processing: "В работе", error: "Ошибка",
};

/* ── Карточка наценки ────────────────────────────────────────────────────── */
function MarkupCard({ row, onSaved }: { row: MarkupRow; onSaved: () => void }) {
  const color = CATEGORY_COLORS[row.category] ?? "#FFD700";
  const currentPct = Math.round((parseFloat(row.multiplier) - 1) * 100);
  const [mode, setMode] = useState<"pct" | "rub">("pct");
  const [pctInput, setPctInput] = useState(String(currentPct));
  const [rubInput, setRubInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    let newMult: number;
    if (mode === "pct") {
      const p = parseFloat(pctInput);
      if (isNaN(p) || p < 0 || p > 999) return;
      newMult = 1 + p / 100;
    } else {
      const rub = parseFloat(rubInput);
      if (isNaN(rub) || rub < 0) return;
      newMult = -Math.abs(rub);
    }
    setSaving(true); setMsg(null);
    const d = await apiPost({ action: "setMarkup", category: row.category, multiplier: newMult });
    if (d.ok) {
      setMsg({ ok: true, text: "Сохранено!" });
      setTimeout(() => { setMsg(null); onSaved(); }, 1200);
    } else {
      setMsg({ ok: false, text: d.error || "Ошибка" });
    }
    setSaving(false);
  }

  const presets = mode === "pct" ? ["10","20","30","40","50","100"] : ["50","100","200","500"];

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(145deg,rgba(12,10,6,0.98),rgba(8,7,10,0.99))", border: `1px solid ${color}22` }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${color}55,transparent)` }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}16`, border: `1px solid ${color}28` }}>
            <Icon name={CATEGORY_ICONS[row.category] ?? "Tag"} size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold text-base uppercase text-white/90">
              {CATEGORY_LABELS[row.category] ?? row.category}
            </div>
            <div className="font-roboto text-[10px] text-white/35 mt-0.5">{row.note}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-oswald font-black text-2xl" style={{ color }}>
              {currentPct > 0 ? `+${currentPct}%` : row.multiplier}
            </div>
            <div className="font-roboto text-[9px] text-white/30">сейчас</div>
          </div>
        </div>
        <div className="flex rounded-xl overflow-hidden mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["pct","rub"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMsg(null); }}
              className="flex-1 py-2 font-roboto text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              style={{
                background: mode === m ? `${color}18` : "transparent",
                color: mode === m ? color : "rgba(255,255,255,0.4)",
                borderRight: m === "pct" ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
              <Icon name={m === "pct" ? "Percent" : "RussianRuble"} size={11} />
              {m === "pct" ? "В процентах" : "+ фиксированно ₽"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div className="relative">
            {mode === "pct" ? (
              <input type="number" min="0" max="999" step="1" value={pctInput}
                onChange={e => setPctInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                placeholder="40" />
            ) : (
              <input type="number" min="0" step="10" value={rubInput}
                onChange={e => setRubInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                placeholder="100" />
            )}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-oswald font-bold text-sm pointer-events-none"
              style={{ color: `${color}80` }}>{mode === "pct" ? "%" : "₽"}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {presets.map(p => (
              <button key={p} onClick={() => mode === "pct" ? setPctInput(p) : setRubInput(p)}
                className="px-2.5 py-1 rounded-lg font-oswald font-bold text-xs transition-all"
                style={{
                  background: (mode === "pct" ? pctInput : rubInput) === p ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${(mode === "pct" ? pctInput : rubInput) === p ? `${color}45` : "rgba(255,255,255,0.08)"}`,
                  color: (mode === "pct" ? pctInput : rubInput) === p ? color : "rgba(255,255,255,0.4)",
                }}>
                {mode === "pct" ? `+${p}%` : `+${p}₽`}
              </button>
            ))}
          </div>
          {mode === "pct" && pctInput && !isNaN(parseFloat(pctInput)) && (
            <div className="px-3 py-2 rounded-xl text-xs font-roboto flex items-center justify-between"
              style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Пример: услуга 1000 ₽ → клиент</span>
              <span className="font-bold" style={{ color }}>{(1000*(1+parseFloat(pctInput)/100)).toFixed(0)} ₽</span>
            </div>
          )}
          {msg && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs"
              style={{
                background: msg.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
                border: `1px solid ${msg.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
                color: msg.ok ? "#6ee7b7" : "#fca5a5",
              }}>
              <Icon name={msg.ok ? "CheckCircle" : "AlertCircle"} size={13} />
              {msg.text}
            </div>
          )}
          <button onClick={save} disabled={saving}
            className="group relative w-full overflow-hidden py-3 rounded-xl font-oswald font-bold uppercase text-sm text-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(180deg,${color}dd 0%,${color} 50%,${color}99 100%)` }}>
            {saving
              ? <><Icon name="Loader" size={14} className="animate-spin relative" />Сохраняю...</>
              : <><Icon name="Save" size={14} className="relative" />Сохранить наценку</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Основной компонент ──────────────────────────────────────────────────── */
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

      {/* ── НАЦЕНКИ ─────────────────────────────────────────────────────── */}
      {section === "markup" && (
        <div>
          <div className="font-roboto text-[11px] text-white/30 mb-4 leading-relaxed">
            Наценка применяется автоматически ко всем услугам при отображении цены клиенту.
          </div>
          {loading
            ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}
              </div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {markup.map(row => <MarkupCard key={row.id} row={row} onSaved={load} />)}
              </div>
          }
        </div>
      )}

      {/* ── УСЛУГИ 3GSM ─────────────────────────────────────────────────── */}
      {section === "services" && (
        <div>
          <div className="rounded-2xl overflow-hidden mb-4"
            style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(125,211,252,0.15)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between gap-3"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div>
                <div className="font-oswald font-bold text-base text-white uppercase">Синхронизация услуг</div>
                <div className="font-roboto text-[10px] text-white/35 mt-0.5">
                  Загружает актуальный каталог из 3gsm.ru → сохраняет в кэш → клиенты видят свежие цены
                </div>
              </div>
              <button onClick={handleSync} disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-oswald font-bold text-xs uppercase text-black transition-all disabled:opacity-40 shrink-0"
                style={{ background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)" }}>
                <Icon name={syncing ? "Loader" : "RefreshCcw"} size={14} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Синхронизирую..." : "Синхронизировать"}
              </button>
            </div>
            <div className="px-5 py-4">
              {syncResult && (
                <div className="flex items-start gap-3 p-3 rounded-xl mb-3"
                  style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.25)" }}>
                  <Icon name="CheckCircle" size={16} className="text-[#6ee7b7] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-oswald font-bold text-sm text-[#6ee7b7]">
                      Загружено {syncResult.count} услуг из 3gsm.ru
                    </div>
                    {syncResult.sample && syncResult.sample.length > 0 && (
                      <div className="font-roboto text-[10px] text-white/40 mt-1">
                        Примеры: {(syncResult.sample as Record<string,string>[]).slice(0,2).map(s => s.title || s.serviceid).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {syncRaw && (
                <div className="p-3 rounded-xl mb-3"
                  style={{ background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.2)" }}>
                  <div className="font-roboto text-xs text-[#fca5a5] font-bold mb-1">API 3gsm недоступен. Используй ручную загрузку ↓</div>
                  <div className="font-mono text-[10px] text-white/30 truncate">{syncRaw.slice(0,200)}</div>
                </div>
              )}

              {/* Ручная загрузка HTML */}
              <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)" }}>
                <div className="font-oswald font-bold text-sm text-white/70 uppercase mb-1 flex items-center gap-2">
                  <Icon name="Code" size={14} style={{ color: "#FFD700" }} />
                  Загрузить HTML вручную
                </div>
                <div className="font-roboto text-[10px] text-white/35 mb-3 leading-relaxed">
                  1. Открой <a href="https://3gsm.ru/resellerplaceorder/imei" target="_blank" className="text-[#7dd3fc] underline">3gsm.ru/resellerplaceorder/imei</a><br />
                  2. Нажми F12 → Elements → найди <code className="text-[#FFD700]">&lt;select id="service_id"&gt;</code><br />
                  3. Правой кнопкой → «Copy → OuterHTML» → вставь сюда
                </div>
                <textarea
                  value={htmlSource}
                  onChange={e => setHtmlSource(e.target.value)}
                  placeholder='<select id="service_id">...<optgroup label="IMEI Check">...<option value="45c48..." data-price="0.018">Apple FMI check - 0.018 usd</option>...'
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg font-mono text-[10px] text-white/70 outline-none resize-none mb-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button
                  onClick={handleSync}
                  disabled={syncing || !htmlSource.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-oswald font-bold text-xs uppercase text-black disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)" }}>
                  <Icon name={syncing ? "Loader" : "Upload"} size={13} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Загружаю..." : "Загрузить и сохранить"}
                </button>
              </div>

              <div className="mt-3 font-roboto text-[10px] text-white/20 leading-relaxed">
                Кэш хранится 1 час · После загрузки услуги сразу появятся на /unlock · Наценки применяются автоматически
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── КЛИЕНТЫ ─────────────────────────────────────────────────────── */}
      {section === "clients" && (
        <div>
          {loading
            ? <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
            : !clients.length
              ? <div className="text-center py-14 text-white/25">
                  <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30"/>
                  <div className="font-oswald uppercase text-sm">Клиентов ещё нет</div>
                </div>
              : <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="px-4 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <Icon name="Users" size={14} style={{ color: "#7dd3fc" }} />
                    <span className="font-oswald font-bold text-sm uppercase text-white">
                      {clients.length} клиентов
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                          {["#","Имя / Email","Телефон","Зарегистрирован","Заказов","Потрачено"].map(h=>(
                            <th key={h} className="px-4 py-3 text-left font-roboto text-[10px] uppercase tracking-widest text-white/25">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map(cl => (
                          <tr key={cl.id} className="border-b transition-colors hover:bg-white/[0.015]"
                            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                            <td className="px-4 py-3 font-mono text-xs text-white/30">#{cl.id}</td>
                            <td className="px-4 py-3">
                              <div className="font-roboto text-sm text-white/80">{cl.full_name || "—"}</div>
                              <div className="font-roboto text-[10px] text-white/35">{cl.email}</div>
                            </td>
                            <td className="px-4 py-3 font-roboto text-xs text-white/40">{cl.phone || "—"}</td>
                            <td className="px-4 py-3 font-roboto text-[10px] text-white/30 whitespace-nowrap">
                              {cl.registered_at ? new Date(cl.registered_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-oswald font-bold text-sm" style={{ color: "#7dd3fc" }}>
                                {cl.order_count}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                              {parseFloat(cl.total_spent || "0") > 0
                                ? `${parseFloat(cl.total_spent).toLocaleString("ru-RU")} ₽`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
          }
        </div>
      )}

      {/* ── ЗАКАЗЫ (все клиенты) ────────────────────────────────────────── */}
      {section === "orders" && (
        <div>
          {loading
            ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
            : !orders.length
              ? <div className="text-center py-14 text-white/25">
                  <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30"/>
                  <div className="font-oswald uppercase text-sm">Заказов ещё нет</div>
                </div>
              : <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="px-4 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <Icon name="ClipboardList" size={14} style={{ color: "#7dd3fc" }} />
                    <span className="font-oswald font-bold text-sm uppercase text-white">
                      {orders.length} заказов · прибыль {totalProfit.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                          {["ID","Клиент","Услуга","IMEI","Дата","3gsm","Клиент","Прибыль","Статус"].map(h=>(
                            <th key={h} className="px-3 py-3 text-left font-roboto text-[10px] uppercase tracking-widest text-white/25">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => {
                          const sc = STATUS_COLOR[o.status] ?? "#94a3b8";
                          const sl = STATUS_LABEL[o.status] ?? o.status;
                          const profit = o.price_client && o.price_credits
                            ? parseFloat(o.price_client) - parseFloat(o.price_credits) : 0;
                          return (
                            <tr key={o.id} className="border-b transition-colors hover:bg-white/[0.015]"
                              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                              <td className="px-3 py-3 font-mono text-xs text-white/30">#{o.id}</td>
                              <td className="px-3 py-3 max-w-[120px]">
                                <div className="font-roboto text-xs text-white/70 truncate">{o.client_name || "—"}</div>
                                <div className="font-roboto text-[9px] text-white/30 truncate">{o.client_email}</div>
                              </td>
                              <td className="px-3 py-3 max-w-[160px]">
                                <div className="font-roboto text-xs text-white/75 truncate">{o.service_name}</div>
                              </td>
                              <td className="px-3 py-3 font-mono text-xs text-white/40">{o.imei || "—"}</td>
                              <td className="px-3 py-3 font-roboto text-[10px] text-white/30 whitespace-nowrap">
                                {o.created_at ? new Date(o.created_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}) : "—"}
                              </td>
                              <td className="px-3 py-3 font-roboto text-xs text-white/40">
                                {o.price_credits ? `${o.price_credits}₽` : "—"}
                              </td>
                              <td className="px-3 py-3 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                                {o.price_client ? `${o.price_client}₽` : "—"}
                              </td>
                              <td className="px-3 py-3">
                                {profit > 0
                                  ? <span className="font-oswald font-bold text-sm" style={{ color: "#6ee7b7" }}>+{profit.toFixed(0)}₽</span>
                                  : <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-3 py-3">
                                <span className="px-2 py-1 rounded-full font-roboto text-[10px] font-bold uppercase"
                                  style={{ background: `${sc}18`, border: `1px solid ${sc}35`, color: sc }}>
                                  {sl}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
          }
        </div>
      )}

      {/* ── ФИНАНСЫ ─────────────────────────────────────────────────────── */}
      {section === "finance" && (
        <div>
          {/* Сводка */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: "Всего пополнено",   value: `${totalIn.toLocaleString("ru-RU")} ₽`,     color: "#6ee7b7" },
              { label: "Всего списано",      value: `${totalSpent.toLocaleString("ru-RU")} ₽`,  color: "#fca5a5" },
              { label: "Прибыль (заказы)",   value: `${totalProfit.toLocaleString("ru-RU")} ₽`, color: "#FFD700" },
            ].map(s => (
              <div key={s.label} className="px-4 py-3 rounded-xl"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-1 text-white/35">{s.label}</div>
                <div className="font-oswald font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {loading
            ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
            : !txs.length
              ? <div className="text-center py-14 text-white/25">
                  <Icon name="CreditCard" size={32} className="mx-auto mb-2 opacity-30"/>
                  <div className="font-oswald uppercase text-sm">Транзакций нет</div>
                </div>
              : <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {txs.map(tx => {
                    const isIn = tx.type === "deposit";
                    const color = isIn ? "#6ee7b7" : "#fca5a5";
                    const typeLabel: Record<string,string> = { deposit:"Пополнение", order_payment:"Заказ", refund:"Возврат" };
                    return (
                      <div key={tx.id}
                        className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                          <Icon name={isIn ? "ArrowDownLeft" : "ArrowUpRight"} size={14} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-roboto text-sm text-white/70 truncate">
                            {tx.description || typeLabel[tx.type] || tx.type}
                          </div>
                          <div className="font-roboto text-[10px] text-white/30 flex items-center gap-2">
                            <span>{tx.created_at ? new Date(tx.created_at).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                            {tx.client_name && <span className="text-white/20">· {tx.client_name}</span>}
                          </div>
                        </div>
                        <div className="font-oswald font-bold text-base shrink-0" style={{ color }}>
                          {isIn ? "+" : "−"}{parseFloat(tx.amount||"0").toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    );
                  })}
                </div>
          }
        </div>
      )}
    </div>
  );
}