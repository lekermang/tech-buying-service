import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import PayButton from "@/components/payment/PayButton";

/* ── URLs ───────────────────────────────────────────────────────────────── */
const AUTH_URL   = "https://functions.poehali.dev/420ad7e7-26c9-4540-9369-6bca5d26d3aa";
const UNLOCK_URL = "https://functions.poehali.dev/06607e09-1cc5-4df8-bccf-ed619806e834";
const AI_URL     = "https://functions.poehali.dev/fe968c8f-eb07-4a9c-9993-341972bfef48";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem("unlock_token") || ""; }
function setToken(t: string) { localStorage.setItem("unlock_token", t); }
function clearToken() { localStorage.removeItem("unlock_token"); }

async function aiCall(body: object) {
  const r = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Token": getToken() },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function authCall(body: object) {
  const r = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function apiCall(action: string, params: Record<string, unknown> = {}, method: "GET" | "POST" = "GET") {
  const token = getToken();
  if (method === "GET") {
    const qs = new URLSearchParams({ action });
    const r = await fetch(`${UNLOCK_URL}?${qs}`, {
      headers: { "X-Client-Token": token },
    });
    return r.json();
  }
  const r = await fetch(UNLOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Token": token },
    body: JSON.stringify({ action, ...params }),
  });
  return r.json();
}

/* ── Стили ───────────────────────────────────────────────────────────────── */
const INP = [
  "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all",
  "bg-white/[0.04] border border-white/10",
  "focus:border-[rgba(255,215,0,0.4)] focus:bg-white/[0.06]",
  "placeholder:text-white/25",
].join(" ");

const STATUS_COLOR: Record<string, string> = {
  completed: "#6ee7b7", approved: "#6ee7b7", success: "#6ee7b7",
  sent: "#7dd3fc", processing: "#7dd3fc", inprogress: "#7dd3fc",
  pending: "#FFD700", queued: "#c4b5fd",
  error: "#fca5a5", failed: "#fca5a5",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "Выполнен", approved: "Одобрен", sent: "Отправлен",
  processing: "В обработке", inprogress: "В работе", pending: "Ожидает",
  queued: "В очереди", error: "Ошибка", failed: "Не выполнен",
};

/* ── Shared UI ───────────────────────────────────────────────────────────── */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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

function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.3)" }}>{children}</span>;
}

function Skeleton({ h = "h-8", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} rounded-xl animate-pulse`} style={{ background: "rgba(255,215,0,0.07)" }} />;
}

function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLOR[status?.toLowerCase()] ?? "#94a3b8";
  const sl = STATUS_LABEL[status?.toLowerCase()] ?? status;
  return (
    <span className="px-2.5 py-1 rounded-full font-roboto text-[10px] uppercase tracking-wider font-bold whitespace-nowrap"
      style={{ background: `${sc}18`, border: `1px solid ${sc}35`, color: sc }}>
      {sl}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ЭКРАН ВХОДА / РЕГИСТРАЦИИ
   ══════════════════════════════════════════════════════════════════════════ */
type AuthMode = "login" | "register" | "reset";

function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ email: "", password: "", new_password: "", full_name: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    setLoading(true); setMsg(null);
    try {
      if (mode === "login") {
        const d = await authCall({ action: "login", email: form.email, password: form.password });
        if (d.token) { setToken(d.token); onAuth(); }
        else setMsg({ ok: false, text: d.error || "Неверный email или пароль" });

      } else if (mode === "register") {
        if (form.password !== form.confirm) { setMsg({ ok: false, text: "Пароли не совпадают" }); setLoading(false); return; }
        if (!form.full_name.trim()) { setMsg({ ok: false, text: "Введите имя" }); setLoading(false); return; }
        // Используем register_unlock — без обязательного телефона, без SMTP
        const d = await authCall({ action: "register_unlock", email: form.email, password: form.password, full_name: form.full_name });
        if (d.token) { setToken(d.token); onAuth(); }
        else setMsg({ ok: false, text: d.error || "Ошибка регистрации" });

      } else {
        // Сброс пароля напрямую — без писем
        if (!form.new_password || form.new_password.length < 6) {
          setMsg({ ok: false, text: "Введите новый пароль (мин. 6 символов)" });
          setLoading(false); return;
        }
        const d = await authCall({ action: "request_reset_direct", email: form.email, new_password: form.new_password });
        if (d.token) {
          setToken(d.token);
          setMsg({ ok: true, text: "Пароль изменён! Входим..." });
          setTimeout(onAuth, 900);
        } else {
          setMsg({ ok: false, text: d.error || "Аккаунт не найден" });
        }
      }
    } catch { setMsg({ ok: false, text: "Ошибка сети" }); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#060406" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(255,215,0,0.07) 0%,transparent 65%)" }} />

      <div className="relative w-full max-w-md">
        {/* Лого */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}>
              <Icon name="Unlock" size={22} className="text-black" />
            </div>
            <div className="text-left">
              <div className="font-oswald font-black text-2xl uppercase text-white">Unlock</div>
              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35">Скупка24 · Разблокировки</div>
            </div>
          </div>
          <p className="text-white/40 text-sm font-roboto">
            {mode === "login" ? "Войдите в личный кабинет" : mode === "register" ? "Создайте аккаунт" : "Сброс пароля"}
          </p>
        </div>

        <Panel>
          <div className="p-6 sm:p-8 space-y-4">
            {/* Переключатель вход/регистрация */}
            {mode !== "reset" && (
              <div className="flex rounded-xl overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {(["login", "register"] as AuthMode[]).map(m => (
                  <button key={m} onClick={() => { setMode(m); setMsg(null); }}
                    className="flex-1 py-2.5 font-roboto text-sm font-medium transition-all"
                    style={{
                      background: mode === m ? "rgba(255,215,0,0.12)" : "transparent",
                      color: mode === m ? "#FFD700" : "rgba(255,255,255,0.4)",
                      borderRight: m === "login" ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}>
                    {m === "login" ? "Войти" : "Регистрация"}
                  </button>
                ))}
              </div>
            )}

            {/* Поля */}
            {mode === "register" && (
              <input className={INP} placeholder="Имя *" value={form.full_name} onChange={set("full_name")} autoComplete="name" />
            )}
            <input className={INP} placeholder="Email *" value={form.email} onChange={set("email")} type="email" autoComplete="email" />
            {mode === "login" && (
              <input className={INP} placeholder="Пароль *" value={form.password} onChange={set("password")} type="password" autoComplete="current-password" />
            )}
            {mode === "register" && (
              <>
                <input className={INP} placeholder="Пароль * (мин. 6 символов)" value={form.password} onChange={set("password")} type="password" autoComplete="new-password" />
                <input className={INP} placeholder="Повторите пароль *" value={form.confirm} onChange={set("confirm")} type="password" />
              </>
            )}
            {mode === "reset" && (
              <>
                <input className={INP} placeholder="Новый пароль * (мин. 6 символов)" value={form.new_password} onChange={set("new_password")} type="password" autoComplete="new-password" />
                <div className="font-roboto text-[11px] text-white/30 -mt-2 px-1">
                  Введи новый пароль — он сразу применится без письма на почту
                </div>
              </>
            )}

            {/* Сообщение */}
            {msg && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: msg.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
                  border: `1px solid ${msg.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
                }}>
                <Icon name={msg.ok ? "CheckCircle" : "AlertCircle"} size={15}
                  style={{ color: msg.ok ? "#6ee7b7" : "#fca5a5", flexShrink: 0 }} />
                <span className="font-roboto text-sm" style={{ color: msg.ok ? "#6ee7b7" : "#fca5a5" }}>{msg.text}</span>
              </div>
            )}

            {/* Кнопка */}
            <button onClick={submit} disabled={loading}
              className="group relative w-full overflow-hidden py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-sm text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                boxShadow: "0 0 0 1px rgba(255,215,0,0.6),0 10px 30px rgba(255,215,0,0.3)",
              }}>
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {loading
                ? <><Icon name="Loader" size={15} className="animate-spin relative" />Загрузка...</>
                : <span className="relative">{mode === "login" ? "Войти" : mode === "register" ? "Создать аккаунт" : "Сменить пароль"}</span>
              }
            </button>

            {/* Ссылки */}
            <div className="flex items-center justify-between pt-1">
              {mode === "login" && (
                <button onClick={() => { setMode("reset"); setMsg(null); }}
                  className="font-roboto text-xs text-white/30 hover:text-white/60 transition-colors">
                  Забыли пароль?
                </button>
              )}
              {mode === "reset" && (
                <button onClick={() => { setMode("login"); setMsg(null); }}
                  className="font-roboto text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                  <Icon name="ArrowLeft" size={11} />Назад
                </button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   КАБИНЕТ — КОМПОНЕНТЫ
   ══════════════════════════════════════════════════════════════════════════ */

/* Таблица заказов */
function OrdersTable({ orders, loading, onRefresh }: {
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

/* Карточка услуги */
function ServiceCard({ s, onOrder }: { s: Record<string, string>; onOrder: (s: Record<string, string>) => void }) {
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

/* Форма заказа */
function OrderForm({ services, prefill, onSuccess, onCancel }: {
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

  // Считаем итог по цене клиента (с наценкой)
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

/* ══════════════════════════════════════════════════════════════════════════
   ПОПОЛНЕНИЕ БАЛАНСА
   ══════════════════════════════════════════════════════════════════════════ */
const TOPUP_PRESETS = [500, 1000, 2000, 5000, 10000];

function TopupModal({ client, onClose }: { client: { full_name: string; phone: string; email: string }; onClose: () => void }) {
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
          {/* Шапка */}
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

          {/* Пресеты */}
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

            {/* Своя сумма */}
            <div className="relative">
              <input
                type="number"
                min="100"
                max="100000"
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

          {/* Итого */}
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

          {/* Кнопка оплаты */}
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

/* ══════════════════════════════════════════════════════════════════════════
   AI ЧАТ ВИДЖЕТ
   ══════════════════════════════════════════════════════════════════════════ */
interface ChatMsg { role: "user" | "assistant"; content: string; }

function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "👋 Привет! Я AI-ассистент Skypka24.\n\nПомогу выбрать услугу разблокировки, объясню как оформить заказ и отвечу на вопросы.\n\nС чего начнём?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs(p => [...p, { role: "user", content: text }]);
    setLoading(true);
    try {
      const d = await aiCall({ action: "chat", message: text, session_id: sessionId });
      if (d.reply) {
        setMsgs(p => [...p, { role: "assistant", content: d.reply }]);
        if (d.session_id) setSessionId(d.session_id);
      } else {
        setMsgs(p => [...p, { role: "assistant", content: "Ошибка: " + (d.error || "нет ответа") }]);
      }
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Ошибка соединения. Попробуйте снова." }]);
    }
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const QUICK = ["Как разблокировать iPhone?", "Что такое FRP?", "Как найти IMEI?", "Статус заказа"];

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="fixed bottom-24 right-5 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open ? "rgba(20,16,8,0.95)" : "linear-gradient(135deg,#FFD700,#b8860b)",
          border: open ? "2px solid rgba(255,215,0,0.4)" : "2px solid transparent",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.3),0 8px 32px rgba(255,215,0,0.35)",
        }}
        title="AI-ассистент">
        <Icon name={open ? "X" : "MessageCircle"} size={22}
          style={{ color: open ? "#FFD700" : "#000" }} />
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#6ee7b7", color: "#000" }}>AI</span>
        )}
      </button>

      {/* Окно чата */}
      {open && (
        <div className="fixed bottom-44 right-4 lg:bottom-24 lg:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(145deg,rgba(12,9,5,0.98) 0%,rgba(6,6,10,0.99) 100%)",
            border: "1px solid rgba(255,215,0,0.2)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.06),0 24px 60px rgba(0,0,0,0.7)",
            maxHeight: "70vh",
          }}>
          {/* Шапка */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0"
            style={{ borderColor: "rgba(255,215,0,0.12)", background: "rgba(255,215,0,0.04)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
              <Icon name="Bot" size={15} className="text-black" />
            </div>
            <div className="flex-1">
              <div className="font-oswald font-bold text-sm uppercase text-white">Sky AI</div>
              <div className="font-roboto text-[9px] text-white/35 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse inline-block" />
                DeepSeek · Онлайн
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/25 hover:text-white/60 transition-colors">
              <Icon name="X" size={15} />
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.25)" }}>
                    <Icon name="Bot" size={11} style={{ color: "#FFD700" }} />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl font-roboto text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "text-white/90 rounded-tr-sm"
                    : "text-white/80 rounded-tl-sm"
                }`}
                  style={{
                    background: m.role === "user"
                      ? "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.08))"
                      : "rgba(255,255,255,0.05)",
                    border: m.role === "user"
                      ? "1px solid rgba(255,215,0,0.25)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.25)" }}>
                  <Icon name="Bot" size={11} style={{ color: "#FFD700" }} />
                </div>
                <div className="px-3 py-2.5 rounded-xl rounded-tl-sm flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Быстрые вопросы */}
          {msgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0); }}
                  className="px-2.5 py-1 rounded-lg font-roboto text-[10px] transition-all"
                  style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.18)", color: "rgba(255,215,0,0.7)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,215,0,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,215,0,0.07)")}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Ввод */}
          <div className="p-3 border-t shrink-0 flex gap-2 items-end"
            style={{ borderColor: "rgba(255,215,0,0.1)" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Спросите AI... (Enter — отправить)"
              rows={1}
              className="flex-1 resize-none px-3 py-2.5 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,215,0,0.15)",
                maxHeight: "80px",
                lineHeight: "1.4",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.15)")}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#FFD700,#b8860b)",
                boxShadow: "0 0 12px rgba(255,215,0,0.3)",
              }}>
              <Icon name="Send" size={16} className="text-black" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Таблица транзакций ──────────────────────────────────────────────────── */
function TransactionRow({ tx }: { tx: Record<string, string> }) {
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

/* ══════════════════════════════════════════════════════════════════════════
   КАБИНЕТ
   ══════════════════════════════════════════════════════════════════════════ */
type Tab = "dashboard" | "services" | "orders" | "neworder" | "profile" | "transactions";

interface Client { id: number; full_name: string; email: string; phone: string; email_verified: boolean; }

function Cabinet({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [client, setClient] = useState<Client | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState("₽");
  const [services, setServices] = useState<Record<string, string>[]>([]);
  const [myOrders, setMyOrders] = useState<Record<string, string>[]>([]);
  const [gsmOrders, setGsmOrders] = useState<Record<string, string>[]>([]);
  const [transactions, setTransactions] = useState<Record<string, string>[]>([]);
  const [loadBal, setLoadBal] = useState(true);
  const [loadSvc, setLoadSvc] = useState(true);
  const [loadOrd, setLoadOrd] = useState(true);
  const [loadTx, setLoadTx] = useState(false);
  const [prefillSvc, setPrefillSvc] = useState<Record<string, string> | null>(null);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoadBal(true);
    const d = await apiCall("getBalance").catch(() => null);
    if (d?.credits) { setBalance(d.credits); if (d.currency) setCurrency(d.currency); }
    setLoadBal(false);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadSvc(true);
    const d = await apiCall("getServices").catch(() => null);
    if (d?.services) setServices(d.services);
    setLoadSvc(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadOrd(true);
    const [my, gsm] = await Promise.all([
      apiCall("myOrders", {}, "GET").catch(() => null),
      apiCall("getOrderList", {}, "GET").catch(() => null),
    ]);
    if (my?.orders) setMyOrders(my.orders);
    if (gsm?.orders) setGsmOrders(gsm.orders);
    setLoadOrd(false);
  }, []);

  const fetchClient = useCallback(async () => {
    const d = await authCall({ action: "me" }).catch(() => null);
    if (d?.id) setClient(d);
    else { clearToken(); onLogout(); }
  }, [onLogout]);

  const fetchTransactions = useCallback(async () => {
    setLoadTx(true);
    const d = await apiCall("getTransactions", {}, "GET").catch(() => null);
    if (d?.transactions) setTransactions(d.transactions);
    setLoadTx(false);
  }, []);

  useEffect(() => {
    fetchClient();
    fetchBalance();
    fetchServices();
    fetchOrders();
  }, [fetchClient, fetchBalance, fetchServices, fetchOrders]);

  // Загружаем транзакции при открытии вкладки
  useEffect(() => {
    if (tab === "transactions" && transactions.length === 0) fetchTransactions();
    if (tab === "profile" && transactions.length === 0) fetchTransactions();
  }, [tab, transactions.length, fetchTransactions]);

  async function refreshOrderStatus(o: Record<string, string>) {
    if (!o.gsm_order_id) return;
    const d = await apiCall("refreshStatus", { gsm_order_id: o.gsm_order_id, local_id: o.id }, "POST");
    if (d.status) {
      setMyOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: d.status } : x));
    }
  }

  const filteredSvc = services.filter(s =>
    (s.title ?? s.servicename ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const allOrders = myOrders.length ? myOrders : gsmOrders;

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "dashboard",    icon: "LayoutDashboard", label: "Главная"  },
    { id: "services",     icon: "Grid3X3",         label: "Услуги"   },
    { id: "orders",       icon: "ClipboardList",   label: "Заказы"   },
    { id: "neworder",     icon: "PlusCircle",      label: "Заказать" },
    { id: "transactions", icon: "ArrowLeftRight",  label: "Финансы"  },
    { id: "profile",      icon: "User",            label: "Профиль"  },
  ];

  const completedCnt = allOrders.filter(o => ["completed","approved","success"].includes((o.status ?? "").toLowerCase())).length;
  const pendingCnt   = allOrders.filter(o => ["pending","processing","inprogress","queued","sent"].includes((o.status ?? "").toLowerCase())).length;

  return (
    <div className="min-h-screen" style={{ background: "#060406" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 35% at 50% 0%,rgba(255,215,0,0.06) 0%,transparent 60%)" }} />

      {/* Модалка пополнения */}
      {showTopup && client && (
        <TopupModal client={client} onClose={() => setShowTopup(false)} />
      )}

      {/* AI виджет — плавающий чат */}
      <AiChatWidget />

      {/* ── Шапка ──────────────────────────────────────────────────────── */}
      <header className="relative z-20 border-b" style={{ borderColor: "rgba(255,215,0,0.1)", background: "rgba(6,4,6,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
              <Icon name="Unlock" size={17} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-black text-base uppercase text-white leading-none">Unlock</div>
              <div className="font-roboto text-[9px] uppercase tracking-widest text-white/30">Скупка24</div>
            </div>
          </div>

          {/* Баланс + кнопка пополнить */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.18)" }}>
              <Icon name="Wallet" size={14} style={{ color: "#FFD700" }} />
              {loadBal
                ? <div className="h-4 w-16 rounded animate-pulse" style={{ background: "rgba(255,215,0,0.2)" }} />
                : <span className="font-oswald font-bold text-base" style={{ color: "#FFD700" }}>{balance ?? "—"} {currency}</span>
              }
            </div>
            <button onClick={() => setShowTopup(true)}
              className="group relative overflow-hidden flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase tracking-wide text-black transition-all"
              style={{
                background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 4px 12px rgba(255,215,0,0.25)",
              }}>
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.6)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Icon name="Plus" size={13} className="relative" />
              <span className="relative">Пополнить</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {client && (
              <div className="hidden sm:block text-right">
                <div className="font-roboto text-xs text-white/70">{client.full_name}</div>
                <div className="font-roboto text-[10px] text-white/30">{client.email}</div>
              </div>
            )}
            {/* Пополнить — только мобильный */}
            <button onClick={() => setShowTopup(true)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase text-black"
              style={{
                background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                boxShadow: "0 0 0 1px rgba(255,215,0,0.5)",
              }}>
              <Icon name="Plus" size={13} />
              Пополнить
            </button>
            <button onClick={() => { clearToken(); onLogout(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-roboto text-xs text-white/40 hover:text-white/70 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon name="LogOut" size={13} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* ── Сайдбар ────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0 sticky top-6 self-start">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-roboto text-sm font-medium"
              style={{
                background: tab === t.id ? "rgba(255,215,0,0.1)" : "transparent",
                color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.4)",
                border: `1px solid ${tab === t.id ? "rgba(255,215,0,0.3)" : "transparent"}`,
              }}>
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <button onClick={() => { clearToken(); onLogout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left font-roboto text-sm text-white/30 hover:text-white/60 transition-colors">
              <Icon name="LogOut" size={16} />
              Выйти
            </button>
          </div>
        </aside>

        {/* ── Мобильные вкладки ───────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t"
          style={{ background: "rgba(6,4,6,0.97)", borderColor: "rgba(255,215,0,0.12)", backdropFilter: "blur(12px)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
              style={{ color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.3)" }}>
              <Icon name={t.icon} size={18} />
              <span className="font-roboto text-[9px]">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Контент ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">

          {/* ДАШБОРД */}
          {tab === "dashboard" && (
            <div className="space-y-5">
              {/* Приветствие */}
              <div>
                <h1 className="font-oswald font-black text-2xl sm:text-3xl uppercase text-white">
                  Привет, <Gold>{client?.full_name?.split(" ")[0] ?? "..."}</Gold> 👋
                </h1>
                <p className="text-white/35 text-sm font-roboto mt-1">Кабинет разблокировки · 3gsm.ru</p>
              </div>

              {/* Статы */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: "Wallet",       label: "Баланс",    value: balance ? `${balance} ${currency}` : "—", accent: "#FFD700", loading: loadBal },
                  { icon: "Package",      label: "Заказов",   value: String(allOrders.length),                  accent: "#7dd3fc", loading: loadOrd },
                  { icon: "CheckCircle",  label: "Выполнено", value: String(completedCnt),                      accent: "#6ee7b7", loading: loadOrd },
                  { icon: "Clock",        label: "В работе",  value: String(pendingCnt),                        accent: "#c4b5fd", loading: loadOrd },
                ].map(({ icon, label, value, accent, loading: ld }) => (
                  <Panel key={label}>
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                        <Icon name={icon} size={18} style={{ color: accent }} />
                      </div>
                      <div>
                        <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35">{label}</div>
                        {ld ? <Skeleton h="h-5" w="w-16" /> : <div className="font-oswald font-bold text-lg" style={{ color: accent }}>{value}</div>}
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>

              {/* Последние заказы */}
              <Panel>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(125,211,252,0.1)", border: "1px solid rgba(125,211,252,0.2)" }}>
                        <Icon name="ClipboardList" size={14} style={{ color: "#7dd3fc" }} />
                      </div>
                      <span className="font-oswald font-bold text-lg uppercase text-white">Последние заказы</span>
                    </div>
                    <button onClick={() => setTab("orders")}
                      className="font-roboto text-[11px] flex items-center gap-1 transition-colors"
                      style={{ color: "rgba(255,215,0,0.45)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.8)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                      Все <Icon name="ChevronRight" size={11} />
                    </button>
                  </div>
                  <OrdersTable orders={allOrders.slice(0, 5)} loading={loadOrd} onRefresh={refreshOrderStatus} />
                </div>
              </Panel>

              {/* Быстрый доступ к услугам */}
              <Panel>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                        <Icon name="Zap" size={14} style={{ color: "#FFD700" }} />
                      </div>
                      <span className="font-oswald font-bold text-lg uppercase text-white">Популярные услуги</span>
                    </div>
                    <button onClick={() => setTab("services")}
                      className="font-roboto text-[11px] flex items-center gap-1 transition-colors"
                      style={{ color: "rgba(255,215,0,0.45)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.8)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                      Все <Icon name="ChevronRight" size={11} />
                    </button>
                  </div>
                  {loadSvc
                    ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} h="h-20" />)}</div>
                    : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.slice(0, 6).map(s => (
                          <ServiceCard key={s.serviceid ?? s.id} s={s} onOrder={svc => { setPrefillSvc(svc); setTab("neworder"); }} />
                        ))}
                      </div>
                  }
                </div>
              </Panel>
            </div>
          )}

          {/* УСЛУГИ */}
          {tab === "services" && (
            <Panel>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
                    <Icon name="Grid3X3" size={17} className="text-black" />
                  </div>
                  <div>
                    <h2 className="font-oswald font-bold text-xl uppercase text-white">Каталог услуг</h2>
                    <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                      {loadSvc ? "Загрузка..." : `${services.length} услуг`}
                    </div>
                  </div>
                </div>

                {/* Поиск */}
                <div className="relative mb-4">
                  <Icon name="Search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Поиск услуги..."
                    className={INP + " pl-9"} />
                </div>

                {loadSvc
                  ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} h="h-20" />)}</div>
                  : filteredSvc.length
                    ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                        {filteredSvc.map(s => (
                          <ServiceCard key={s.serviceid ?? s.id} s={s} onOrder={svc => { setPrefillSvc(svc); setTab("neworder"); }} />
                        ))}
                      </div>
                    : <div className="text-center py-10 text-white/25 font-roboto text-sm">Ничего не найдено</div>
                }
              </div>
            </Panel>
          )}

          {/* ЗАКАЗЫ */}
          {tab === "orders" && (
            <Panel>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(125,211,252,0.12)", border: "1px solid rgba(125,211,252,0.25)" }}>
                      <Icon name="ClipboardList" size={17} style={{ color: "#7dd3fc" }} />
                    </div>
                    <div>
                      <h2 className="font-oswald font-bold text-xl uppercase text-white">История заказов</h2>
                      <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                        {loadOrd ? "Загрузка..." : `${allOrders.length} заказов`}
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
                <OrdersTable orders={allOrders} loading={loadOrd} onRefresh={refreshOrderStatus} />
              </div>
            </Panel>
          )}

          {/* НОВЫЙ ЗАКАЗ */}
          {tab === "neworder" && (
            <Panel>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#6ee7b7,#059669)", boxShadow: "0 0 16px rgba(110,231,183,0.3)" }}>
                    <Icon name="PlusCircle" size={17} className="text-black" />
                  </div>
                  <div>
                    <h2 className="font-oswald font-bold text-xl uppercase text-white">Создать заказ</h2>
                    <div className="font-roboto text-[10px] text-white/30 mt-0.5">Отправить IMEI на разблокировку</div>
                  </div>
                </div>
                <div className="max-w-lg">
                  <OrderForm
                    services={services}
                    prefill={prefillSvc}
                    onSuccess={() => { fetchOrders(); fetchBalance(); setTab("orders"); }}
                    onCancel={() => setTab("dashboard")}
                  />
                </div>
              </div>
            </Panel>
          )}

          {/* ТРАНЗАКЦИИ */}
          {tab === "transactions" && (
            <Panel>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#6ee7b7,#059669)", boxShadow: "0 0 16px rgba(110,231,183,0.3)" }}>
                      <Icon name="ArrowLeftRight" size={17} className="text-black" />
                    </div>
                    <div>
                      <h2 className="font-oswald font-bold text-xl uppercase text-white">Финансы</h2>
                      <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                        {loadTx ? "Загрузка..." : `${transactions.length} операций`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowTopup(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase text-black transition-all"
                      style={{
                        background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                        boxShadow: "0 0 0 1px rgba(255,215,0,0.5)",
                      }}>
                      <Icon name="Plus" size={13} />Пополнить
                    </button>
                    <button onClick={fetchTransactions}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                      <Icon name="RefreshCw" size={12} />
                    </button>
                  </div>
                </div>

                {/* Сводка */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Пополнено", value: transactions.filter(t=>t.type==="deposit").reduce((s,t)=>s+parseFloat(t.amount||"0"),0), color: "#6ee7b7" },
                    { label: "Потрачено", value: transactions.filter(t=>t.type==="order_payment").reduce((s,t)=>s+parseFloat(t.amount||"0"),0), color: "#fca5a5" },
                    { label: "Операций", value: transactions.length, color: "#FFD700", noRub: true },
                  ].map(({ label, value, color, noRub }) => (
                    <div key={label} className="px-4 py-3 rounded-xl"
                      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
                      {loadTx
                        ? <Skeleton h="h-6" w="w-16" />
                        : <div className="font-oswald font-bold text-xl" style={{ color }}>
                            {noRub ? value : `${(value as number).toLocaleString("ru-RU")} ₽`}
                          </div>
                      }
                    </div>
                  ))}
                </div>

                {/* Список транзакций */}
                {loadTx
                  ? <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} h="h-14"/>)}</div>
                  : transactions.length
                    ? <div>{transactions.map(tx=><TransactionRow key={tx.id} tx={tx}/>)}</div>
                    : <div className="text-center py-12 text-white/25">
                        <Icon name="CreditCard" size={36} className="mx-auto mb-3 opacity-30"/>
                        <div className="font-oswald uppercase tracking-wide text-sm">Операций пока нет</div>
                        <button onClick={()=>setShowTopup(true)}
                          className="mt-4 px-4 py-2 rounded-xl font-roboto text-xs transition-all"
                          style={{ background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.2)", color:"rgba(255,215,0,0.7)" }}>
                          Пополнить баланс
                        </button>
                      </div>
                }
              </div>
            </Panel>
          )}

          {/* ПРОФИЛЬ */}
          {tab === "profile" && client && (
            <div className="space-y-4">
              <Panel>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-oswald font-bold"
                      style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.05))", border: "2px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
                      {client.full_name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <div className="font-oswald font-bold text-xl text-white">{client.full_name}</div>
                      <div className="font-roboto text-sm text-white/45">{client.email}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: client.email_verified ? "#6ee7b7" : "#fca5a5" }} />
                        <span className="font-roboto text-[10px] uppercase tracking-widest"
                          style={{ color: client.email_verified ? "#6ee7b7" : "#fca5a5" }}>
                          {client.email_verified ? "Email подтверждён" : "Email не подтверждён"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Имя", value: client.full_name },
                      { label: "Email", value: client.email },
                      { label: "Телефон", value: client.phone || "—" },
                      { label: "ID клиента", value: `#${client.id}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="px-4 py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="font-roboto text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</div>
                        <div className="font-roboto text-sm text-white/80">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* Баланс + пополнение */}
              <Panel>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-1">Баланс 3gsm.ru</div>
                      {loadBal
                        ? <Skeleton h="h-7" w="w-24" />
                        : <div className="font-oswald font-bold text-3xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.3)" }}>
                            {balance ?? "—"} {currency}
                          </div>
                      }
                    </div>
                    <button onClick={fetchBalance}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                      style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.7)" }}>
                      <Icon name="RefreshCw" size={12} />Обновить
                    </button>
                  </div>

                  {/* Пресеты быстрого пополнения */}
                  <div className="font-roboto text-[10px] uppercase tracking-widest text-white/30 mb-3">Быстрое пополнение</div>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {TOPUP_PRESETS.map(p => (
                      <button key={p}
                        onClick={() => setShowTopup(true)}
                        className="py-2.5 rounded-xl font-oswald font-bold text-xs transition-all hover:scale-105"
                        style={{
                          background: "rgba(255,215,0,0.07)",
                          border: "1px solid rgba(255,215,0,0.15)",
                          color: "rgba(255,215,0,0.7)",
                        }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,215,0,0.14)"; el.style.borderColor = "rgba(255,215,0,0.35)"; el.style.color = "#FFD700"; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(255,215,0,0.07)"; el.style.borderColor = "rgba(255,215,0,0.15)"; el.style.color = "rgba(255,215,0,0.7)"; }}>
                        {p >= 1000 ? `${p/1000}k` : p} ₽
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setShowTopup(true)}
                    className="group relative overflow-hidden w-full py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-sm text-black transition-all flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                      boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 8px 24px rgba(255,215,0,0.3)",
                    }}>
                    <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <Icon name="Plus" size={16} className="relative" />
                    <span className="relative">Пополнить баланс</span>
                  </button>
                </div>
              </Panel>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════════════════ */
export default function Unlock() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthed(false); return; }
    authCall({ action: "me" }).then(d => {
      if (d?.id) setAuthed(true);
      else { clearToken(); setAuthed(false); }
    }).catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060406" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)" }}>
            <Icon name="Unlock" size={22} className="text-black" />
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "#FFD700", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;
  return <Cabinet onLogout={() => setAuthed(false)} />;
}