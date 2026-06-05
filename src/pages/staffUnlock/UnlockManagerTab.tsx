import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const UNLOCK_URL = "https://functions.poehali.dev/06607e09-1cc5-4df8-bccf-ed619806e834";
const ADMIN_TOKEN = "Mark2015N";

/* ── helpers ─────────────────────────────────────────────────────────────── */
async function apiGet(action: string) {
  const r = await fetch(`${UNLOCK_URL}?action=${action}`, {
    headers: { "X-Admin-Token": ADMIN_TOKEN },
  });
  return r.json();
}
async function apiPost(body: object) {
  const r = await fetch(UNLOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN },
    body: JSON.stringify(body),
  });
  return r.json();
}

/* ── типы ────────────────────────────────────────────────────────────────── */
interface MarkupRow { id: number; category: string; multiplier: string; pct: string; note: string; }
interface StatsRow  { status: string; cnt: string; }
interface Order     {
  id: number; gsm_order_id: string | null; service_name: string;
  imei: string; quantity: number; price_credits: string | null;
  price_client: string | null; status: string; created_at: string;
}
interface Tx {
  id: number; type: string; amount: string; payment_status: string;
  description: string | null; created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  default: "Все остальные",
  icloud:  "iCloud unlock",
  frp:     "FRP / Google",
  server:  "Server unlock",
  imei:    "IMEI check",
};
const CATEGORY_ICONS: Record<string, string> = {
  default: "Settings2",
  icloud:  "Apple",
  frp:     "ShieldOff",
  server:  "Cpu",
  imei:    "Smartphone",
};
const CATEGORY_COLORS: Record<string, string> = {
  default: "#FFD700",
  icloud:  "#fff3a0",
  frp:     "#7dd3fc",
  server:  "#fca5a5",
  imei:    "#86efac",
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
      // Для фиксированной надбавки в рублях сохраняем как специальное значение
      // multiplier < 0 означает фиксированная надбавка в рублях (напр. -100 = +100₽)
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

  const presets = mode === "pct"
    ? ["10", "20", "30", "40", "50", "100"]
    : ["50", "100", "200", "500"];

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg,rgba(12,10,6,0.98),rgba(8,7,10,0.99))",
        border: `1px solid ${color}22`,
        boxShadow: `0 0 0 1px ${color}08,0 12px 28px rgba(0,0,0,0.45)`,
      }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${color}55,transparent)` }} />

      <div className="p-4 sm:p-5">
        {/* Шапка */}
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
          {/* Текущая наценка */}
          <div className="text-right shrink-0">
            <div className="font-oswald font-black text-2xl" style={{ color }}>
              {currentPct > 0 ? `+${currentPct}%` : row.multiplier}
            </div>
            <div className="font-roboto text-[9px] text-white/30">сейчас</div>
          </div>
        </div>

        {/* Переключатель режима */}
        <div className="flex rounded-xl overflow-hidden mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["pct", "rub"] as const).map(m => (
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

        {/* Ввод */}
        <div className="space-y-3">
          <div className="relative">
            {mode === "pct" ? (
              <input
                type="number" min="0" max="999" step="1"
                value={pctInput}
                onChange={e => setPctInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                onFocus={e => (e.currentTarget.style.borderColor = `${color}55`)}
                onBlur={e => (e.currentTarget.style.borderColor = `${color}25`)}
                placeholder="40"
              />
            ) : (
              <input
                type="number" min="0" step="10"
                value={rubInput}
                onChange={e => setRubInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                onFocus={e => (e.currentTarget.style.borderColor = `${color}55`)}
                onBlur={e => (e.currentTarget.style.borderColor = `${color}25`)}
                placeholder="100"
              />
            )}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-oswald font-bold text-sm pointer-events-none"
              style={{ color: `${color}80` }}>
              {mode === "pct" ? "%" : "₽"}
            </div>
          </div>

          {/* Быстрые пресеты */}
          <div className="flex gap-1.5 flex-wrap">
            {presets.map(p => (
              <button key={p}
                onClick={() => mode === "pct" ? setPctInput(p) : setRubInput(p)}
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

          {/* Превью результата */}
          {mode === "pct" && pctInput && !isNaN(parseFloat(pctInput)) && (
            <div className="px-3 py-2 rounded-xl text-xs font-roboto flex items-center justify-between"
              style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Пример: услуга 1000 ₽ → клиент заплатит</span>
              <span className="font-bold" style={{ color }}>
                {(1000 * (1 + parseFloat(pctInput) / 100)).toFixed(0)} ₽
              </span>
            </div>
          )}
          {mode === "rub" && rubInput && !isNaN(parseFloat(rubInput)) && (
            <div className="px-3 py-2 rounded-xl text-xs font-roboto flex items-center justify-between"
              style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Пример: услуга 1000 ₽ → клиент заплатит</span>
              <span className="font-bold" style={{ color }}>
                {(1000 + parseFloat(rubInput)).toFixed(0)} ₽
              </span>
            </div>
          )}

          {/* Сообщение */}
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

          {/* Кнопка */}
          <button onClick={save} disabled={saving}
            className="group relative w-full overflow-hidden py-3 rounded-xl font-oswald font-bold uppercase text-sm text-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(180deg,${color}dd 0%,${color} 50%,${color}99 100%)`,
              boxShadow: `0 0 0 1px ${color}55,0 6px 20px ${color}30`,
            }}>
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.5)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
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
export default function UnlockManagerTab({ token }: { token: string }) {
  const [section, setSection] = useState<"markup" | "orders" | "finance">("markup");
  const [markup, setMarkup]   = useState<MarkupRow[]>([]);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [txs, setTxs]         = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, o, t] = await Promise.all([
      apiGet("getMarkup").catch(() => null),
      fetch(`${UNLOCK_URL}?action=myOrders`, { headers: { "X-Admin-Token": ADMIN_TOKEN } }).then(r=>r.json()).catch(()=>null),
      fetch(`${UNLOCK_URL}?action=getTransactions`, { headers: { "X-Admin-Token": ADMIN_TOKEN } }).then(r=>r.json()).catch(()=>null),
    ]);
    if (m?.markup) setMarkup(m.markup);
    if (o?.orders) setOrders(o.orders);
    if (t?.transactions) setTxs(t.transactions);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalOrders = orders.length;
  const doneOrders  = orders.filter(o => ["completed","approved"].includes(o.status)).length;
  const totalIn     = txs.filter(t => t.type === "deposit").reduce((s,t) => s + parseFloat(t.amount||"0"), 0);
  const totalSpent  = txs.filter(t => t.type === "order_payment").reduce((s,t) => s + parseFloat(t.amount||"0"), 0);

  const SECTIONS = [
    { id: "markup",  icon: "Tag",           label: "Наценки"    },
    { id: "orders",  icon: "ClipboardList", label: "Заказы"     },
    { id: "finance", icon: "Wallet",        label: "Финансы"    },
  ] as const;

  return (
    <div className="p-4 pb-8 max-w-3xl mx-auto">
      {/* Шапка */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)", boxShadow: "0 0 20px rgba(125,211,252,0.35)" }}>
          <Icon name="Unlock" size={18} className="text-black" />
        </div>
        <div>
          <h2 className="font-oswald font-black text-xl uppercase text-white">Управление Unlock</h2>
          <div className="font-roboto text-[10px] text-white/35">Наценки · Заказы · Транзакции</div>
        </div>
        <button onClick={load}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-roboto text-xs text-white/40 hover:text-white/70 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="RefreshCw" size={12} />Обновить
        </button>
      </div>

      {/* Статы */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {[
          { label: "Заказов",    value: String(totalOrders), color: "#7dd3fc" },
          { label: "Выполнено",  value: String(doneOrders),  color: "#6ee7b7" },
          { label: "Пополнено",  value: `${totalIn.toLocaleString("ru-RU")} ₽`, color: "#6ee7b7" },
          { label: "Списано",    value: `${totalSpent.toLocaleString("ru-RU")} ₽`, color: "#fca5a5" },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 rounded-xl"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
            <div className="font-roboto text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{s.label}</div>
            {loading
              ? <div className="h-5 w-14 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
              : <div className="font-oswald font-bold text-base" style={{ color: s.color }}>{s.value}</div>
            }
          </div>
        ))}
      </div>

      {/* Переключатель разделов */}
      <div className="flex rounded-xl overflow-hidden mb-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-roboto text-xs font-medium transition-all"
            style={{
              background: section === s.id ? "rgba(125,211,252,0.12)" : "transparent",
              color: section === s.id ? "#7dd3fc" : "rgba(255,255,255,0.4)",
              borderRight: i < SECTIONS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}>
            <Icon name={s.icon} size={13} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── НАЦЕНКИ ─────────────────────────────────────────────────────── */}
      {section === "markup" && (
        <div>
          <div className="font-roboto text-[11px] text-white/30 mb-4 leading-relaxed">
            Наценка применяется автоматически ко всем услугам при отображении цены клиенту.
            Меняй в процентах (<span className="text-white/60">цена × коэффициент</span>) или фиксированно (<span className="text-white/60">цена + X ₽</span>).
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

      {/* ── ЗАКАЗЫ ──────────────────────────────────────────────────────── */}
      {section === "orders" && (
        <div>
          {loading
            ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}</div>
            : !orders.length
              ? <div className="text-center py-14 text-white/25">
                  <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="font-oswald uppercase text-sm">Заказов ещё нет</div>
                </div>
              : <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[580px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                          {["ID","Клиент/Услуга","IMEI","Дата","Оптом","Розница","Статус"].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-roboto text-[10px] uppercase tracking-widest text-white/25">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => {
                          const sc = STATUS_COLOR[o.status] ?? "#94a3b8";
                          const sl = STATUS_LABEL[o.status] ?? o.status;
                          const profit = o.price_client && o.price_credits
                            ? (parseFloat(o.price_client) - parseFloat(o.price_credits)).toFixed(0)
                            : null;
                          return (
                            <tr key={o.id}
                              className="border-b transition-colors hover:bg-white/[0.015]"
                              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                              <td className="px-4 py-3 font-mono text-xs text-white/35">#{o.id}</td>
                              <td className="px-4 py-3 max-w-[180px]">
                                <div className="font-roboto text-xs text-white/75 truncate">{o.service_name}</div>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-white/40">{o.imei || "—"}</td>
                              <td className="px-4 py-3 font-roboto text-[10px] text-white/30 whitespace-nowrap">
                                {o.created_at ? new Date(o.created_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}) : "—"}
                              </td>
                              <td className="px-4 py-3 font-roboto text-xs text-white/40">
                                {o.price_credits ? `${o.price_credits} ₽` : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                                  {o.price_client ? `${o.price_client} ₽` : "—"}
                                </div>
                                {profit && parseInt(profit) > 0 && (
                                  <div className="font-roboto text-[9px]" style={{ color: "#6ee7b7" }}>+{profit} ₽</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full font-roboto text-[10px] font-bold uppercase tracking-wide"
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
          {loading
            ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}</div>
            : !txs.length
              ? <div className="text-center py-14 text-white/25">
                  <Icon name="CreditCard" size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="font-oswald uppercase text-sm">Транзакций ещё нет</div>
                </div>
              : <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {txs.map((tx, i) => {
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
                          <div className="font-roboto text-sm text-white/70 truncate">{tx.description || typeLabel[tx.type] || tx.type}</div>
                          <div className="font-roboto text-[10px] text-white/30">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}
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
