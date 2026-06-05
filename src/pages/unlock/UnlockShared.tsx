import { useState } from "react";
import Icon from "@/components/ui/icon";
import PayButton from "@/components/payment/PayButton";
import { INP, STATUS_COLOR, STATUS_LABEL, apiCall } from "./unlockConstants";

/* ── Shared UI ───────────────────────────────────────────────────────────── */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(145deg,rgba(14,11,6,0.97) 0%,rgba(8,8,12,0.99) 100%)",
        border: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "0 0 0 1px rgba(255,215,0,0.04),0 20px 48px rgba(0,0,0,0.55)",
      }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.45),transparent)" }} />
      {children}
    </div>
  );
}

export function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.3)" }}>{children}</span>;
}

export function Skeleton({ h = "h-8", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: "rgba(255,215,0,0.07)" }} />;
}

export function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLOR[status?.toLowerCase()] ?? "#94a3b8";
  const sl = STATUS_LABEL[status?.toLowerCase()] ?? status;
  return (
    <span className="px-2.5 py-1 rounded-full font-roboto text-[10px] uppercase tracking-wider font-bold whitespace-nowrap"
      style={{ background: `${sc}18`, border: `1px solid ${sc}35`, color: sc }}>
      {sl}
    </span>
  );
}

/* ── Таблица заказов ─────────────────────────────────────────────────────── */
export function OrdersTable({ orders, loading, onRefresh }: {
  orders: Record<string, string>[]; loading: boolean; onRefresh?: (o: Record<string, string>) => void;
}) {
  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} h="h-12" />)}</div>;
  if (!orders.length) return (
    <div className="text-center py-12 text-white/25">
      <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
      <div className="font-oswald uppercase tracking-wide text-sm">Заказов пока нет</div>
    </div>
  );
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "rgba(255,215,0,0.1)" }}>
            {["ID", "Услуга", "IMEI", "Дата", "Сумма", "Статус", ""].map(h => (
              <th key={h} className="pb-3 pr-4 text-left font-roboto text-[10px] uppercase tracking-widest text-white/30">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id ?? o.orderid ?? i}
              className="border-b transition-colors hover:bg-white/[0.015]"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <td className="py-3 pr-4 font-mono text-xs text-white/35">#{o.id ?? o.orderid}</td>
              <td className="py-3 pr-4 text-white/75 max-w-[200px] truncate leading-snug">{o.service_name ?? o.servicename ?? "—"}</td>
              <td className="py-3 pr-4 font-mono text-xs text-white/45">{o.imei ?? "—"}</td>
              <td className="py-3 pr-4 font-roboto text-xs text-white/35 whitespace-nowrap">
                {o.created_at ? new Date(o.created_at).toLocaleDateString("ru-RU") : o.orderdate ?? "—"}
              </td>
              <td className="py-3 pr-4 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                {o.price_credits ?? o.credits ? `${o.price_credits ?? o.credits} ₽` : "—"}
              </td>
              <td className="py-3 pr-4"><StatusBadge status={o.status ?? "unknown"} /></td>
              <td className="py-3">
                {onRefresh && o.gsm_order_id && (
                  <button onClick={() => onRefresh(o)}
                    className="text-white/20 hover:text-[#FFD700] transition-colors"
                    title="Обновить статус">
                    <Icon name="RefreshCw" size={12} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Карточка услуги ─────────────────────────────────────────────────────── */
export function ServiceCard({ s, onOrder }: { s: Record<string, string>; onOrder: (s: Record<string, string>) => void }) {
  const accent = "#FFD700";
  const clientPrice = s.price_client ?? s.credits;
  const hasMarkup = s.price_client && s.credits && s.price_client !== s.credits;
  return (
    <button onClick={() => onOrder(s)}
      className="group text-left rounded-xl p-4 transition-all duration-200 flex flex-col gap-2 w-full"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,215,0,0.06)"; el.style.borderColor = "rgba(255,215,0,0.25)"; el.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.025)"; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.transform = "translateY(0)"; }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-roboto text-sm text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-2">
            {s.title ?? s.servicename ?? "Услуга"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {s.time && (
              <div className="flex items-center gap-1 font-roboto text-[10px] text-white/30">
                <Icon name="Clock" size={9} />{s.time}
              </div>
            )}
            {s.markup_pct && s.markup_pct !== "—" && (
              <span className="font-roboto text-[9px] px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }}>
                наценка {s.markup_pct}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-oswald font-bold text-base" style={{ color: accent }}>
            {clientPrice ? `${parseFloat(clientPrice).toLocaleString("ru-RU")} ₽` : "—"}
          </div>
          {hasMarkup && (
            <div className="font-roboto text-[10px] line-through text-white/20">
              {parseFloat(s.credits).toLocaleString("ru-RU")} ₽
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Icon name="ShoppingCart" size={10} style={{ color: accent }} />
        <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,215,0,0.7)" }}>Заказать</span>
      </div>
    </button>
  );
}

/* ── Форма заказа ────────────────────────────────────────────────────────── */
export function OrderForm({ services, prefill, onSuccess, onCancel }: {
  services: Record<string, string>[];
  prefill: Record<string, string> | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [svcId, setSvcId] = useState(prefill?.serviceid ?? prefill?.id ?? "");
  const [imei, setImei] = useState("");
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selected = services.find(s => (s.serviceid ?? s.id) === svcId);

  async function submit() {
    if (!svcId || !imei.trim()) return;
    setLoading(true); setResult(null);
    const d = await apiCall("createOrder", {
      serviceid: svcId,
      service_name: selected?.title ?? selected?.servicename ?? "",
      imei: imei.trim(),
      quantity: parseInt(qty) || 1,
      price_credits: selected?.credits ?? null,
      price_client: selected?.price_client ?? selected?.credits ?? null,
    }, "POST");
    if (d.success) {
      setResult({ ok: true, msg: `Заказ #${d.gsm_order_id || d.local_id} успешно создан!` });
      setTimeout(onSuccess, 1500);
    } else {
      setResult({ ok: false, msg: d.message || d.error || "Ошибка при создании заказа" });
    }
    setLoading(false);
  }

  const clientPrice = selected?.price_client ?? selected?.credits;
  const total = clientPrice ? parseFloat(clientPrice) * (parseInt(qty) || 1) : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/35 mb-2">Услуга</label>
        <div className="relative">
          <select value={svcId} onChange={e => setSvcId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none appearance-none cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <option value="" disabled style={{ background: "#0a0a0a" }}>Выберите услугу...</option>
            {services.map(s => (
              <option key={s.serviceid ?? s.id} value={s.serviceid ?? s.id} style={{ background: "#0a0a0a" }}>
                {s.title ?? s.servicename} {s.credits ? `— ${s.credits} ₽` : ""}
              </option>
            ))}
          </select>
          <Icon name="ChevronDown" size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/35 mb-2">IMEI / номер</label>
        <input value={imei} onChange={e => setImei(e.target.value)}
          placeholder="Введите IMEI (15 цифр)" maxLength={20}
          className={INP + " font-mono"} />
        <div className="mt-1 font-roboto text-[10px] text-white/20">Наберите *#06# для получения IMEI</div>
      </div>

      <div>
        <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/35 mb-2">Количество</label>
        <input type="number" min="1" max="100" value={qty} onChange={e => setQty(e.target.value)}
          className={INP + " w-28"} />
      </div>

      {total !== null && imei && (
        <div className="px-4 py-3 rounded-xl"
          style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.18)" }}>
          <div className="flex items-center justify-between">
            <div className="font-roboto text-xs text-white/40">К оплате клиенту</div>
            <div className="font-oswald font-bold text-xl" style={{ color: "#FFD700" }}>
              {total.toLocaleString("ru-RU")} ₽
            </div>
          </div>
          {selected?.markup_pct && selected.markup_pct !== "—" && (
            <div className="flex items-center justify-between mt-1">
              <div className="font-roboto text-[10px] text-white/25">Наценка</div>
              <div className="font-roboto text-[10px]" style={{ color: "#6ee7b7" }}>{selected.markup_pct}</div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{
            background: result.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
            border: `1px solid ${result.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
          }}>
          <Icon name={result.ok ? "CheckCircle" : "AlertCircle"} size={15}
            style={{ color: result.ok ? "#6ee7b7" : "#fca5a5", flexShrink: 0 }} />
          <span className="font-roboto text-sm" style={{ color: result.ok ? "#6ee7b7" : "#fca5a5" }}>{result.msg}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-roboto text-sm text-white/40 hover:text-white/70 transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          Отмена
        </button>
        <button onClick={submit} disabled={loading || !svcId || !imei.trim()}
          className="flex-1 py-3 rounded-xl font-oswald font-bold uppercase text-sm text-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 8px 24px rgba(255,215,0,0.3)",
          }}>
          {loading ? <><Icon name="Loader" size={15} className="animate-spin" />Отправляем...</> : <><Icon name="Send" size={15} />Создать заказ</>}
        </button>
      </div>
    </div>
  );
}

/* ── Пополнение баланса ──────────────────────────────────────────────────── */
const TOPUP_PRESETS = [500, 1000, 2000, 5000, 10000];

export function TopupModal({ client, onClose }: { client: { full_name: string; phone: string; email: string }; onClose: () => void }) {
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const finalAmount = useCustom ? (parseInt(custom) || 0) : amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg,rgba(14,11,6,0.99) 0%,rgba(8,8,12,1) 100%)",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.08),0 30px 60px rgba(0,0,0,0.7)",
        }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)" }} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
                <Icon name="Wallet" size={18} className="text-black" />
              </div>
              <div>
                <div className="font-oswald font-bold text-lg uppercase text-white">Пополнить баланс</div>
                <div className="font-roboto text-[10px] text-white/35">Баланс зачислится на 3gsm.ru</div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <Icon name="X" size={15} />
            </button>
          </div>

          <div className="mb-4">
            <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-3">Выберите сумму</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {TOPUP_PRESETS.map(p => (
                <button key={p}
                  onClick={() => { setAmount(p); setUseCustom(false); setCustom(""); }}
                  className="py-2.5 rounded-xl font-oswald font-bold text-sm transition-all"
                  style={{
                    background: !useCustom && amount === p ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${!useCustom && amount === p ? "rgba(255,215,0,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: !useCustom && amount === p ? "#FFD700" : "rgba(255,255,255,0.5)",
                    boxShadow: !useCustom && amount === p ? "0 0 12px rgba(255,215,0,0.15)" : "none",
                  }}>
                  {p >= 1000 ? `${p / 1000}k` : p}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number" min="100" max="100000"
                placeholder="Своя сумма (мин. 100 ₽)"
                value={custom}
                onChange={e => { setCustom(e.target.value); setUseCustom(true); }}
                onFocus={() => setUseCustom(true)}
                className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all pr-10"
                style={{
                  background: useCustom ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${useCustom ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.1)"}`,
                }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-roboto text-xs text-white/30">₽</span>
            </div>
          </div>

          {finalAmount >= 100 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)" }}>
              <div>
                <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35">К оплате</div>
                <div className="font-oswald font-bold text-2xl" style={{ color: "#FFD700" }}>
                  {finalAmount.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div className="text-right">
                <div className="font-roboto text-[10px] text-white/30">Зачислится на</div>
                <div className="font-roboto text-xs text-white/55">3gsm.ru · {client.email}</div>
              </div>
            </div>
          )}

          {finalAmount >= 100 ? (
            <PayButton
              purpose="unlock_topup"
              amount={finalAmount}
              description={`Пополнение баланса 3gsm · ${client.email}`}
              contactInfo={client.phone || client.email}
              returnUrl={window.location.href}
              icon="Wallet"
              confirm={false}
              className="w-full"
            >
              Пополнить на {finalAmount.toLocaleString("ru-RU")} ₽
            </PayButton>
          ) : (
            <div className="w-full py-3.5 rounded-xl text-center font-oswald font-bold text-sm opacity-30"
              style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}>
              Минимум 100 ₽
            </div>
          )}

          <div className="mt-3 text-center font-roboto text-[10px] text-white/20 leading-relaxed">
            После оплаты свяжитесь с поддержкой для зачисления на 3gsm.ru<br />
            или пополняйте напрямую через личный кабинет сервиса
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Строка транзакции ───────────────────────────────────────────────────── */
export function TransactionRow({ tx }: { tx: Record<string, string> }) {
  const isIn = tx.type === "deposit";
  const color = isIn ? "#6ee7b7" : "#fca5a5";
  const icon = isIn ? "ArrowDownLeft" : "ArrowUpRight";
  const label: Record<string, string> = { deposit: "Пополнение", order_payment: "Оплата заказа", refund: "Возврат" };
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
        <Icon name={icon} size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-roboto text-sm text-white/75 truncate">{tx.description || label[tx.type] || tx.type}</div>
        <div className="font-roboto text-[10px] text-white/30">
          {tx.created_at ? new Date(tx.created_at).toLocaleString("ru-RU", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
        </div>
      </div>
      <div className="font-oswald font-bold text-base shrink-0" style={{ color }}>
        {isIn ? "+" : "−"}{parseFloat(tx.amount || "0").toLocaleString("ru-RU")} ₽
      </div>
    </div>
  );
}
