import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import PageSEO, { LOCAL_BUSINESS_SCHEMA } from "@/components/seo/PageSEO";

const PUBLIC_PRICE_URL = "https://functions.poehali.dev/eff3d143-8966-4a6d-bbea-ddc77a6e5373";
const SEND_LEAD_URL    = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const PRICE_EMAIL_URL  = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682";
const PRICE_PDF_URL    = "https://functions.poehali.dev/eff3d143-8966-4a6d-bbea-ddc77a6e5373";
const DEFAULT_MARKUP   = 2000;
const REFRESH_MS       = 3 * 60 * 60 * 1000;
const CACHE_KEY        = "apple_price_v3";

interface PriceItem {
  name: string;
  price: string;
  price_num: number | null;
  region: string;
  sim?: string;
  photo: string | null;
}

function detectSim(name: string, region: string): string {
  const n   = name.toLowerCase();
  const reg = (region || "").toUpperCase();
  if (/macbook|airpod|watch|pencil|кабель|стекло|чехол|magsafe/.test(n)) return "";
  if (/samsung|galaxy|redmi|poco|xiaomi|honor/.test(n)) return "Dual SIM (nano)";
  const isApple = /^(13|14|15|16|17|se2|se3|16e|17e|iphone|ipad)/.test(n);
  if (isApple) {
    if (reg === "CN") return "Dual SIM (nano)";
    if (reg === "" && /^(14|15|16|17|se3|16e|17e)/.test(n)) return "eSIM only";
    return "nano-SIM + eSIM";
  }
  return "";
}

function SimBadge({ sim }: { sim: string }) {
  if (!sim) return null;

  if (sim === "eSIM only") {
    return (
      <span title="Только eSIM — физической nano-SIM нет. США версия (LL/A)" style={{
        fontSize: 9, padding: "1px 6px", borderRadius: 4, marginLeft: 5,
        verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap",
        color: "#f97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)",
        cursor: "help",
      }}>
        eSIM only ⚠
      </span>
    );
  }
  if (sim === "Dual SIM (nano)") {
    return (
      <span title="Два физических слота nano-SIM. Китайская версия (CH/A) — без поддержки eSIM" style={{
        fontSize: 9, padding: "1px 6px", borderRadius: 4, marginLeft: 5,
        verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap",
        color: "#8b5cf6", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
        cursor: "help",
      }}>
        2×nano SIM
      </span>
    );
  }
  if (sim === "nano-SIM + eSIM") {
    return (
      <span title="Физическая nano-SIM + eSIM. Европа, ОАЭ, Россия и другие регионы" style={{
        fontSize: 9, padding: "1px 6px", borderRadius: 4, marginLeft: 5,
        verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap",
        color: "#3b82f6", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)",
        cursor: "help",
      }}>
        nano+eSIM
      </span>
    );
  }
  // fallback
  return (
    <span style={{
      fontSize: 9, padding: "1px 6px", borderRadius: 4, marginLeft: 5,
      verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap",
      color: "#6b7280", background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)",
    }}>
      {sim}
    </span>
  );
}

interface PriceData {
  ok: boolean;
  total: number;
  markup: number;
  generated_at: string;
  groups: Record<string, PriceItem[]>;
}

const CAT_EMOJI: Record<string, string> = {
  "iPhone": "📱", "MacBook": "💻", "iPad": "🖥️",
  "Apple Watch": "⌚", "AirPods": "🎧",
  "Смартфоны Samsung": "📲", "Смартфоны Xiaomi": "📲", "Смартфоны Honor": "📲",
  "Наушники": "🎧", "Планшеты": "📋", "Умные часы": "⌚",
  "Игровые консоли": "🎮", "Аксессуары Apple": "🔌",
  "Аксессуары": "🔌", "Прочее": "📦",
};

const CAT_COLORS: Record<string, string> = {
  "iPhone": "#60a5fa", "MacBook": "#a78bfa", "iPad": "#34d399",
  "Apple Watch": "#f472b6", "AirPods": "#fbbf24",
  "Смартфоны Samsung": "#22d3ee", "Смартфоны Xiaomi": "#f97316",
};

function todayStr() {
  return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}
function countdown(nextMs: number) {
  const diff = Math.max(0, nextMs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}ч ${m}мин`;
}

// ── Общая утилита: форматирование телефона ────────────────────────────────────
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "+7";
  if (d.length <= 1) return "+7";
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
}

// ── Модал заказа ───────────────────────────────────────────────────────────────
function OrderModal({ item, onClose }: { item: PriceItem; onClose: () => void }) {
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameOk  = name.trim().length >= 2;
  const phoneOk = phoneDigits.length === 11;
  const canSend = nameOk && phoneOk;

  const handlePhoneChange = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    setTouched(true);
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     name.trim(),
          phone:    phoneDigits,
          category: "Прайс Apple",
          desc:     `Хочет купить: ${item.name}${item.price_num ? ` — ${item.price}` : " (под заказ)"}`,
        }),
      });
      setDone(true);
    } catch {
      setErr("Ошибка сети, попробуйте ещё раз");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#0f0f0f)",
          border: "1px solid rgba(255,215,0,0.2)",
          boxShadow: "0 -8px 60px rgba(255,215,0,0.12)",
        }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-oswald font-bold text-[20px] text-white uppercase mb-2">Заявка принята!</div>
              <div className="text-white/50 text-[13px] mb-1">Перезвоним в течение 15 минут</div>
              <div className="text-white/30 text-[11px] mb-6">на номер {phone}</div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Товар */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} width={52} height={52}
                    style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "rgba(255,215,0,0.08)" }}>📱</div>
                )}
                <div>
                  <div className="font-bold text-white text-[14px] leading-tight">{item.name}</div>
                  {item.price_num ? (
                    <div className="font-oswald font-black text-[18px] mt-0.5" style={{ color: "#FFD700" }}>{item.price}</div>
                  ) : (
                    <div className="text-[11px] mt-0.5" style={{ color: "#fb923c" }}>🚗 Под заказ · привезём за 1–2 дня</div>
                  )}
                </div>
              </div>

              <div className="font-oswald font-bold text-[16px] text-white uppercase tracking-wide mb-1">
                Заказать / уточнить
              </div>
              <div className="text-[11px] text-white/30 mb-4">Перезвоним в течение 15 минут</div>

              <div className="space-y-3">
                {/* Имя */}
                <div className="relative">
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${touched && !nameOk ? "rgba(239,68,68,0.6)" : nameOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}`,
                    }} />
                  {nameOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !nameOk && (
                  <div className="text-red-400 text-[11px] -mt-1 px-1">Введите имя (минимум 2 символа)</div>
                )}

                {/* Телефон */}
                <div className="relative">
                  <input value={phone} onChange={e => handlePhoneChange(e.target.value)}
                    type="tel" placeholder="+7 (___) ___-__-__ *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${touched && !phoneOk ? "rgba(239,68,68,0.6)" : phoneOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}`,
                    }} />
                  {phoneOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !phoneOk && (
                  <div className="text-red-400 text-[11px] -mt-1 px-1">Введите номер телефона полностью</div>
                )}
              </div>

              {err && (
                <div className="text-red-400 text-[12px] mt-2 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={13} /> {err}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase text-white/40"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button onClick={handleSend} disabled={sending}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", boxShadow: "0 4px 20px rgba(255,215,0,0.35)" }}>
                  <Icon name={sending ? "Loader2" : "Phone"} size={16} className={sending ? "animate-spin" : ""} />
                  {sending ? "Отправка…" : "Перезвоните мне"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Модал «Получить прайс на email» ───────────────────────────────────────────
function EmailPriceModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]     = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const nameOk  = name.trim().length >= 2;
  const phoneOk = phoneDigits.length === 11;
  const canSend = emailOk && nameOk && phoneOk;

  const handlePhoneChange = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    setTouched(true);
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      const res = await fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markup:         DEFAULT_MARKUP,
          email:          email.trim(),
          only_available: true,
        }),
      });
      const d = await res.json();
      if (d.ok || d.queued) {
        fetch(SEND_LEAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:     name.trim(),
            phone:    phoneDigits,
            category: "Прайс Apple — Email",
            desc:     `Запросил прайс на почту: ${email.trim()}`,
          }),
        }).catch(() => {});
        setDone(true);
      } else {
        setErr(d.error || "Не удалось отправить");
      }
    } catch {
      setErr("Ошибка сети, попробуйте ещё раз");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#0f0f0f)",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "0 -12px 60px rgba(255,215,0,0.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">📬</div>
              <div className="font-oswald font-bold text-[20px] text-white uppercase tracking-wide mb-2">
                Отправлено!
              </div>
              <div className="text-white/40 text-[13px] mb-1">
                Прайс-лист отправлен на
              </div>
              <div className="text-[#FFD700] font-bold text-[14px] mb-6">{email}</div>
              <div className="text-white/30 text-[11px] mb-6">
                Проверьте папку «Входящие» и «Спам». Письмо придёт в течение 1–2 минут.
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}
              >
                Отлично!
              </button>
            </div>
          ) : (
            <>
              {/* Иконка и заголовок */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,215,0,0.06))", border: "1px solid rgba(255,215,0,0.3)" }}>
                  <Icon name="Mail" size={22} className="text-[#FFD700]" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-[17px] text-white uppercase tracking-wide">
                    Получить прайс
                  </div>
                  <div className="text-[11px] text-white/40">
                    Отправим актуальные цены на вашу почту
                  </div>
                </div>
              </div>

              {/* Преимущества */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { icon: "Zap",      label: "Актуальные\nцены" },
                  { icon: "Shield",   label: "Гарантия\nна всё" },
                  { icon: "Truck",    label: "Доставка\nпо РФ" },
                ].map(f => (
                  <div key={f.icon} className="flex flex-col items-center gap-1 py-2 rounded-xl text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Icon name={f.icon as "Zap"} size={14} className="text-[#FFD700]" />
                    <span className="text-[10px] text-white/50 whitespace-pre-line leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Форма */}
              <div className="space-y-2">
                {/* Имя */}
                <div className="relative">
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${touched && !nameOk ? "rgba(239,68,68,0.6)" : nameOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }}
                  />
                  {nameOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !nameOk && <div className="text-red-400 text-[11px] px-1">Введите имя</div>}

                {/* Телефон */}
                <div className="relative">
                  <input value={phone} onChange={e => handlePhoneChange(e.target.value)}
                    type="tel" placeholder="+7 (___) ___-__-__ *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${touched && !phoneOk ? "rgba(239,68,68,0.6)" : phoneOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }}
                  />
                  {phoneOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !phoneOk && <div className="text-red-400 text-[11px] px-1">Введите номер телефона полностью</div>}

                {/* Email */}
                <div className="relative">
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    type="email" placeholder="email@example.com *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${touched && !emailOk ? "rgba(239,68,68,0.6)" : emailOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }}
                  />
                  {emailOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !emailOk && <div className="text-red-400 text-[11px] px-1">Введите корректный email</div>}
              </div>

              {err && (
                <div className="flex items-center gap-1.5 text-red-400 text-[12px] mt-2">
                  <Icon name="AlertCircle" size={13} /> {err}
                </div>
              )}

              <div className="text-white/20 text-[10px] mt-3 leading-relaxed">
                Нажимая кнопку, вы соглашаетесь на получение информации о ценах. Мы не рассылаем спам.
              </div>

              {/* Кнопки */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase text-white/40 transition-all hover:text-white/60"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => { setTouched(true); handleSend(); }}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black disabled:opacity-60 transition-all relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#FFD700,#f59e0b,#d97706)",
                    boxShadow: canSend ? "0 4px 24px rgba(255,215,0,0.4)" : "none",
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <Icon
                    name={sending ? "Loader2" : "Send"}
                    size={16}
                    className={`relative z-10 ${sending ? "animate-spin" : ""}`}
                  />
                  <span className="relative z-10">
                    {sending ? "Отправляю…" : "Отправить прайс"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const TOMORROW_MARKUP = 3000;

// ── Панель «Привезём завтра» ──────────────────────────────────────────────────
function TomorrowPanel({
  groups, open, onClose, onOrder,
}: {
  groups: Record<string, PriceItem[]>;
  open: boolean;
  onClose: () => void;
  onOrder: (item: PriceItem) => void;
}) {
  const [priceMap, setPriceMap]         = useState<Record<string, string>>({});
  const [priceNumMap, setPriceNumMap]   = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [clarifyItem, setClarifyItem]   = useState<(PriceItem & { cat: string }) | null>(null);

  // Загружаем цены с наценкой +3000 когда панель открывается
  useEffect(() => {
    if (!open) return;
    setLoadingPrices(true);
    fetch(`${PUBLIC_PRICE_URL}?format=json&markup=${TOMORROW_MARKUP}&_t=${Date.now()}`)
      .then(r => r.json())
      .then((d: PriceData) => {
        if (!d.ok) return;
        const map: Record<string, string> = {};
        const numMap: Record<string, number> = {};
        for (const list of Object.values(d.groups)) {
          for (const item of list) {
            if (item.price_num) {
              map[item.name]    = item.price;
              numMap[item.name] = item.price_num;
            }
          }
        }
        setPriceMap(map);
        setPriceNumMap(numMap);
      })
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, [open]);

  // Собираем все позиции БЕЗ цены в основном прайсе — это «под заказ»
  const items = Object.entries(groups).flatMap(([cat, list]) =>
    list
      .filter(it => !it.price_num)
      .map(it => ({ ...it, cat }))
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 48,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* Панель снизу */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 49,
        maxHeight: "82dvh",
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg,#141414,#0d0d0d)",
        borderTop: "2px solid #FFD700",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -12px 60px rgba(255,215,0,0.18), 0 -4px 20px rgba(0,0,0,0.6)",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.38s cubic-bezier(0.32,0.72,0,1)",
      }}>
        {/* Ручка */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,215,0,0.3)" }} />
        </div>

        {/* Шапка */}
        <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,165,0,0.08))",
              border: "1px solid rgba(255,215,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>🚗</div>
            <div>
              <div style={{ fontFamily: "var(--font-oswald,oswald,sans-serif)", fontWeight: 900, fontSize: 17, color: "#FFD700", textTransform: "uppercase", letterSpacing: 1, lineHeight: 1.1 }}>
                Привезём завтра
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {items.length} позиций · цены с доставкой{loadingPrices ? " · загружаю…" : ""}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        {/* Список */}
        <div style={{ overflowY: "auto", flex: 1, paddingBottom: "env(safe-area-inset-bottom,12px)" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Все позиции сейчас в наличии 🎉
            </div>
          ) : (
            <div>
              {items.map((item, i) => {
                const sim = detectSim(item.name, item.region);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 0,
                    padding: "0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  }}>
                    {/* Иконка категории */}
                    <div style={{ width: 48, padding: "8px 6px", flexShrink: 0, textAlign: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, margin: "0 auto",
                        background: "rgba(255,215,0,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                      }}>
                        {CAT_EMOJI[item.cat] || "📦"}
                      </div>
                    </div>

                    {/* Название + SIM + Регион */}
                    <div style={{ flex: 1, padding: "10px 6px", minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb", lineHeight: 1.3 }}>
                        {item.name}
                        {item.region && (
                          <span style={{
                            fontSize: 8, marginLeft: 5, padding: "1px 5px", borderRadius: 3,
                            verticalAlign: "middle", fontWeight: 700,
                            background: item.region === "EU" ? "rgba(74,222,128,0.15)" : item.region === "US" ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
                            color: item.region === "EU" ? "#4ade80" : item.region === "US" ? "#60a5fa" : "#fbbf24",
                            border: `1px solid ${item.region === "EU" ? "#4ade8033" : item.region === "US" ? "#60a5fa33" : "#fbbf2433"}`,
                          }}>{item.region}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        {sim && (
                          <span style={{
                            fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600,
                            color: sim === "eSIM" ? "#10b981" : sim.includes("Dual") ? "#8b5cf6" : "#3b82f6",
                            background: sim === "eSIM" ? "rgba(16,185,129,0.1)" : sim.includes("Dual") ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                            border: `1px solid ${sim === "eSIM" ? "rgba(16,185,129,0.25)" : sim.includes("Dual") ? "rgba(139,92,246,0.25)" : "rgba(59,130,246,0.25)"}`,
                          }}>
                            {sim.includes("+") ? "nano+eSIM" : sim}
                          </span>
                        )}
                        {loadingPrices ? (
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>загружаю…</span>
                        ) : priceMap[item.name] ? (
                          <span style={{ fontSize: 13, fontWeight: 900, color: "#FFD700" }}>
                            {priceMap[item.name]}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                            color: "#fb923c", background: "rgba(251,146,60,0.1)",
                            border: "1px solid rgba(251,146,60,0.25)",
                          }}>цену уточняем</span>
                        )}
                      </div>
                    </div>

                    {/* Кнопка: Заказать или Уточнить цену */}
                    <div style={{ padding: "4px 12px 4px 4px", flexShrink: 0 }}>
                      {priceNumMap[item.name] ? (
                        <button
                          onClick={() => onOrder({ ...item, price: priceMap[item.name], price_num: priceNumMap[item.name] })}
                          style={{
                            padding: "7px 12px", borderRadius: 10,
                            fontSize: 11, fontWeight: 800, cursor: "pointer",
                            color: "#000", border: "none", whiteSpace: "nowrap",
                            background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                            boxShadow: "0 2px 10px rgba(255,215,0,0.35)",
                          }}>
                          Заказать
                        </button>
                      ) : !loadingPrices ? (
                        <button
                          onClick={() => setClarifyItem(item)}
                          style={{
                            padding: "7px 10px", borderRadius: 10,
                            fontSize: 11, fontWeight: 800, cursor: "pointer",
                            color: "#fb923c", border: "1px solid rgba(251,146,60,0.4)",
                            background: "rgba(251,146,60,0.1)", whiteSpace: "nowrap",
                          }}>
                          Уточнить цену
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Мини-модал «Уточнить цену» */}
      {clarifyItem && (
        <ClarifyModal
          item={clarifyItem}
          onClose={() => setClarifyItem(null)}
        />
      )}
    </>
  );
}

// ── Модал «Уточнить цену» ─────────────────────────────────────────────────────
function ClarifyModal({ item, onClose }: { item: PriceItem & { cat?: string }; onClose: () => void }) {
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameOk  = name.trim().length >= 2;
  const phoneOk = phoneDigits.length === 11;

  const handlePhoneChange = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    setSending(true); setErr(null);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     name.trim(),
          phone:    phoneDigits,
          category: "Уточнить цену — Привезём завтра",
          desc:     `Уточнить цену: ${item.name}${item.region ? ` [${item.region}]` : ""} · под заказ`,
        }),
      });
      setDone(true);
    } catch {
      setErr("Ошибка сети, попробуйте ещё раз");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 60 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1c1410,#110d0a)",
          border: "1px solid rgba(251,146,60,0.35)",
          boxShadow: "0 -8px 50px rgba(251,146,60,0.18)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(251,146,60,0.3)" }} />
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📞</div>
              <div className="font-oswald font-bold text-[20px] text-white uppercase mb-2">Заявка принята!</div>
              <div className="text-white/50 text-[13px] mb-1">
                Перезвоним и сообщим точную цену на
              </div>
              <div className="font-bold text-[14px] mb-1" style={{ color: "#FFD700" }}>{item.name}</div>
              <div className="text-white/35 text-[12px] mb-6">на номер {phone}</div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase text-black"
                style={{ background: "linear-gradient(135deg,#fb923c,#ea580c)" }}>
                Отлично, жду звонка!
              </button>
            </div>
          ) : (
            <>
              {/* Товар */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
                style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "rgba(251,146,60,0.1)" }}>🚗</div>
                <div>
                  <div className="font-bold text-white text-[14px] leading-tight">{item.name}</div>
                  {item.region && (
                    <span style={{
                      fontSize: 9, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
                      background: item.region === "EU" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                      color: item.region === "EU" ? "#4ade80" : "#60a5fa",
                      border: `1px solid ${item.region === "EU" ? "#4ade8033" : "#60a5fa33"}`,
                    }}>{item.region}</span>
                  )}
                  <div className="text-[11px] mt-1" style={{ color: "#fb923c" }}>
                    Цену уточним при звонке · привезём за 1–2 дня
                  </div>
                </div>
              </div>

              <div className="font-oswald font-bold text-[16px] text-white uppercase tracking-wide mb-1">
                Уточнить цену
              </div>
              <div className="text-[11px] text-white/30 mb-4">
                Оставьте имя и телефон — перезвоним и назовём точную цену
              </div>

              <div className="space-y-2">
                {/* Имя */}
                <div className="relative">
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${touched && !nameOk ? "rgba(239,68,68,0.6)" : nameOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }} />
                  {nameOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !nameOk && <div className="text-red-400 text-[11px] px-1">Введите имя</div>}

                {/* Телефон */}
                <div className="relative">
                  <input value={phone} onChange={e => handlePhoneChange(e.target.value)}
                    type="tel" placeholder="+7 (___) ___-__-__ *"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${touched && !phoneOk ? "rgba(239,68,68,0.6)" : phoneOk ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }} />
                  {phoneOk
                    ? <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                    : touched && <Icon name="AlertCircle" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                  }
                </div>
                {touched && !phoneOk && <div className="text-red-400 text-[11px] px-1">Введите номер полностью</div>}
              </div>

              {err && (
                <div className="flex items-center gap-1.5 text-red-400 text-[12px] mt-2">
                  <Icon name="AlertCircle" size={13} /> {err}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase text-white/40"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button onClick={handleSend} disabled={sending}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-white disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#fb923c,#ea580c)",
                    boxShadow: "0 4px 20px rgba(251,146,60,0.4)",
                  }}>
                  <Icon name={sending ? "Loader2" : "Phone"} size={16} className={sending ? "animate-spin" : ""} />
                  {sending ? "Отправляю…" : "Перезвоните мне"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Скелетон-загрузка ─────────────────────────────────────────────────────────
function SkeletonLoader() {
  const rows = [8, 12, 7, 10, 6, 9, 5];
  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-6">
      {/* Прогресс-полоска */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,215,0,0.1)" }}>
        <div className="h-full rounded-full animate-progress-bar"
          style={{ background: "linear-gradient(90deg,#FFD700,#f59e0b,#FFD700)", backgroundSize: "200% 100%" }} />
      </div>
      <div className="text-center text-white/30 text-[13px] tracking-wide">Загружаем актуальные цены…</div>
      {rows.map((count, ci) => (
        <div key={ci}>
          <div className="h-8 rounded-lg mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "30%" }} />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div className="w-10 h-10 rounded-lg animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="flex-1 h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="w-20 h-4 rounded animate-pulse" style={{ background: "rgba(255,215,0,0.08)" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}


// ── SEO константы ─────────────────────────────────────────────────────────────
const SEO_PRICE_TABLE = [
  { model: "iPhone 16 128GB", price: "от 50 000 ₽" },
  { model: "iPhone 16 256GB", price: "от 55 000 ₽" },
  { model: "iPhone 16 Pro 128GB", price: "от 75 000 ₽" },
  { model: "iPhone 16 Pro Max 256GB", price: "от 90 000 ₽" },
  { model: "iPhone 15 128GB", price: "от 47 000 ₽" },
  { model: "iPhone 15 Pro 128GB", price: "от 65 000 ₽" },
  { model: "iPhone 14 128GB", price: "от 38 000 ₽" },
  { model: "iPhone 13 128GB", price: "от 28 000 ₽" },
  { model: "MacBook Air M2", price: "от 75 000 ₽" },
  { model: "MacBook Air M3", price: "от 90 000 ₽" },
  { model: "iPad Air M2", price: "от 55 000 ₽" },
  { model: "Apple Watch Series 9", price: "от 22 000 ₽" },
];

const SEO_FAQ = [
  { q: "Где купить iPhone в Калуге с гарантией?", a: "В Скупка24 на Кирова 7/47 и Кирова 11. Продаём новые и б/у iPhone с гарантией от 3 до 12 месяцев. Работаем ежедневно 10:00–21:00." },
  { q: "Есть ли в наличии iPhone 17 в Калуге?", a: "Да, iPhone 17 и 17 Pro Max можно заказать через раздел «Привезём завтра». Доставка 1–2 дня, цену уточняйте по телефону +7 (992) 990-33-33." },
  { q: "Можно ли купить iPhone в рассрочку?", a: "Да, оформляем рассрочку 0% через наших партнёров. Уточните условия у менеджера по телефону или в магазине." },
  { q: "Как проверить iPhone перед покупкой?", a: "Все телефоны проверяем при вас: диагностика АКБ, IMEI, iCloud. Вы видите весь процесс проверки." },
  { q: "Принимаете ли старый iPhone в зачёт?", a: "Да! Принимаем ваш старый iPhone, MacBook или другой смартфон в счёт оплаты нового. Оценка бесплатно — 15 минут." },
  { q: "Есть ли доставка iPhone по Калуге?", a: "Да, доставляем по Калуге курьером. Подробности уточняйте по телефону +7 (992) 990-33-33." },
];

const SEO_MODELS_FULL = [
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Plus", "iPhone 17",
  "iPhone 16e", "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
  "MacBook Pro M4", "MacBook Pro M3", "MacBook Pro M2", "MacBook Air M3", "MacBook Air M2",
  "iPad Pro M4", "iPad Air M2", "iPad mini 7", "iPad 10",
  "Apple Watch Ultra 2", "Apple Watch Series 10", "Apple Watch Series 9",
  "AirPods Pro 2", "AirPods 4",
  "Samsung Galaxy S25 Ultra", "Samsung Galaxy S25", "Samsung Galaxy S24",
  "Xiaomi 15 Pro", "Xiaomi 14",
];

const SEO_KEYWORDS_CLOUD = [
  "купить iPhone Калуга", "iPhone Калуга цена", "магазин Apple Калуга",
  "купить MacBook Калуга", "iPad купить Калуга", "Apple Watch Калуга",
  "iPhone 16 Pro Калуга", "iPhone 15 купить", "iPhone 17 Калуга",
  "б/у iPhone Калуга", "новый iPhone Калуга", "скупка iPhone Калуга",
  "обмен iPhone Калуга", "iPhone в рассрочку Калуга", "AirPods Калуга",
];

function SeoBlock() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <footer aria-label="SEO информация" style={{ background: "#080808", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

      {/* 1. Почему мы */}
      <section style={{ padding: "48px 16px 0", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "oswald,sans-serif", fontWeight: 900, fontSize: 22, color: "#FFD700",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Купить iPhone и технику Apple в Калуге — Скупка24
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.9, maxWidth: 740, marginBottom: 24 }}>
          Скупка24 — магазин Apple-техники в Калуге с живым актуальным прайсом. Продаём новые и
          проверенные б/у <strong style={{ color: "rgba(255,255,255,0.75)" }}>iPhone, MacBook, iPad, Apple Watch, AirPods</strong>.
          Все устройства с гарантией от 3 до 12 месяцев. Принимаем старые телефоны в зачёт.
          Два офиса: <strong style={{ color: "rgba(255,255,255,0.75)" }}>ул. Кирова 7/47 и ул. Кирова 11</strong>.
        </p>

        {/* Преимущества */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 40 }}>
          {[
            { icon: "⚡", title: "Актуальные цены", desc: "Обновляются каждые 3 часа автоматически" },
            { icon: "✅", title: "Гарантия", desc: "От 3 до 12 месяцев на каждое устройство" },
            { icon: "🚗", title: "Под заказ", desc: "Любую модель привезём за 1–2 дня" },
            { icon: "🔄", title: "Trade-in", desc: "Принимаем ваш старый телефон в зачёт" },
            { icon: "🔍", title: "Проверка при вас", desc: "Диагностика АКБ, IMEI, iCloud" },
            { icon: "📞", title: "Работаем 24/7", desc: "+7 (992) 990-33-33" },
          ].map(f => (
            <div key={f.title} style={{
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Таблица цен */}
      <section style={{ padding: "0 16px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "oswald,sans-serif", fontWeight: 800, fontSize: 17, color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
          Примерные цены на iPhone в Калуге
        </h2>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          {SEO_PRICE_TABLE.map((row, i) => (
            <div key={row.model} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 16px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderBottom: i < SEO_PRICE_TABLE.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{row.model}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#FFD700", whiteSpace: "nowrap" }}>{row.price}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
          * Цены ориентировочные. Актуальный прайс обновляется автоматически в таблице выше.
        </p>
      </section>

      {/* 3. FAQ */}
      <section style={{ padding: "0 16px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "oswald,sans-serif", fontWeight: 800, fontSize: 17, color: "rgba(255,255,255,0.7)",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
          Частые вопросы
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SEO_FAQ.map((item, i) => (
            <div key={i} style={{
              borderRadius: 12, overflow: "hidden",
              border: `1px solid ${openFaq === i ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.08)"}`,
              background: openFaq === i ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.02)",
              transition: "border-color 0.2s, background 0.2s",
            }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", textAlign: "left", padding: "13px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "none", border: "none", cursor: "pointer", gap: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                  {item.q}
                </span>
                <span style={{
                  fontSize: 18, color: openFaq === i ? "#FFD700" : "rgba(255,255,255,0.3)",
                  transform: openFaq === i ? "rotate(45deg)" : "none",
                  transition: "transform 0.2s, color 0.2s", flexShrink: 0,
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Облако моделей */}
      <section style={{ padding: "0 16px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h3 style={{ fontFamily: "oswald,sans-serif", fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Все модели в наличии и под заказ
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SEO_MODELS_FULL.map(m => (
            <span key={m} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11,
              fontWeight: 700, letterSpacing: 0.2,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
            }}>{m}</span>
          ))}
        </div>
      </section>

      {/* 5. Ключевые слова (скрытые для поисковиков — мелкий серый текст) */}
      <section style={{ padding: "0 16px 32px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SEO_KEYWORDS_CLOUD.map(k => (
            <span key={k} style={{ fontSize: 10, color: "rgba(255,255,255,0.12)" }}>{k}</span>
          ))}
        </div>
      </section>

      {/* 6. Контакты и адрес */}
      <section style={{
        padding: "20px 16px", maxWidth: 960, margin: "0 auto",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Адрес</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
            г. Калуга, ул. Кирова, 7/47<br />
            г. Калуга, ул. Кирова, 11
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Телефон</div>
          <a href="tel:+79929903333" style={{ fontSize: 14, fontWeight: 800, color: "#FFD700", textDecoration: "none" }}>
            +7 (992) 990-33-33
          </a>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Режим работы</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
            Ежедневно 10:00 – 21:00<br />
            Без выходных
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Сайт</div>
          <a href="https://skypka24.com" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            skypka24.com
          </a>
        </div>
      </section>

      {/* Копирайт */}
      <div style={{ textAlign: "center", padding: "12px 16px 20px", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
        © {new Date().getFullYear()} Скупка24 · Прайс Apple · Калуга · Все цены актуальны на сегодня
      </div>
    </footer>
  );
}


// ── Главный компонент ─────────────────────────────────────────────────────────
export default function ApplePrice() {
  const qs = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [data, setData]               = useState<PriceData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + REFRESH_MS);
  const [timer, setTimer]             = useState("");
  const [orderItem, setOrderItem]     = useState<PriceItem | null>(null);
  const [emailModal, setEmailModal]   = useState(() => qs.get("modal") === "price");
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [printPdfLoading, setPrintPdfLoading] = useState(false);
  const [tomorrowOpen, setTomorrowOpen] = useState(false);
  const [search, setSearch]             = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const downloadPdf = useCallback(async (printMode: boolean) => {
    const setter = printMode ? setPrintPdfLoading : setPdfLoading;
    setter(true);
    try {
      const url = printMode ? `${PRICE_PDF_URL}?print=1` : PRICE_PDF_URL;
      const res  = await fetch(url);
      if (!res.ok) throw new Error("Ошибка сервера");
      const blob = await res.blob();
      const burl = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "");
      a.href     = burl;
      a.download = printMode ? `price-skypka24-print-${date}.pdf` : `price-skypka24-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(burl);
    } catch {
      alert("Не удалось сформировать PDF. Попробуйте ещё раз.");
    }
    setter(false);
  }, []);

  const handleDownloadPdf = useCallback(() => downloadPdf(false), [downloadPdf]);

  const fetchFresh = useCallback(async () => {
    const r = await fetch(`${PUBLIC_PRICE_URL}?format=json&markup=${DEFAULT_MARKUP}`);
    const d: PriceData = await r.json();
    if (d.ok) {
      setData(d);
      setNextRefresh(Date.now() + REFRESH_MS);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d, ts: Date.now() })); } catch { /**/ }
    }
    return d;
  }, []);

  const load = useCallback(async () => {
    // Пробуем кеш — показываем мгновенно (только если данные новые и содержат sim)
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { d, ts } = JSON.parse(raw);
        const firstItem = Object.values(d?.groups || {})?.[0]?.[0];
        const hasSimField = firstItem && "sim" in firstItem;
        if (d?.ok && hasSimField && Date.now() - ts < REFRESH_MS) {
          setData(d);
          setNextRefresh(ts + REFRESH_MS);
          setLoading(false);
          // Фоновое обновление без лоадера
          fetchFresh().catch(() => {});
          return;
        }
      }
    } catch { /**/ }
    // Кеша нет — грузим с лоадером
    setLoading(true);
    setError(null);
    try {
      await fetchFresh();
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  }, [fetchFresh]);

  useEffect(() => {
    load();
    const id = setInterval(() => fetchFresh().catch(() => {}), REFRESH_MS);
    return () => clearInterval(id);
  }, [load, fetchFresh]);

  // Авто-действия по URL-параметрам (?pdf=1 или ?modal=price)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("pdf") === "1") {
      downloadPdf(false);
    }
    // Убираем параметры из адресной строки без перезагрузки
    if (p.get("modal") || p.get("pdf")) {
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => setTimer(countdown(nextRefresh));
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextRefresh]);

  const seoSchemas = [
    LOCAL_BUSINESS_SCHEMA,
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Прайс-лист Apple техники в Калуге",
      "description": "Актуальные цены на iPhone, MacBook, iPad, Apple Watch в Скупка24 Калуга",
      "url": "https://skypka24.com/Apple",
      "numberOfItems": data?.total ?? 0,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": SEO_FAQ.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://skypka24.com/" },
        { "@type": "ListItem", "position": 2, "name": "Прайс Apple", "item": "https://skypka24.com/Apple" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Прайс Apple — купить iPhone в Калуге | Скупка24",
      "description": "Актуальный прайс-лист iPhone, MacBook, iPad. Цены обновляются каждые 3 часа. Под заказ любая модель за 1–2 дня.",
      "url": "https://skypka24.com/Apple",
      "inLanguage": "ru-RU",
      "dateModified": new Date().toISOString().slice(0, 10),
      "publisher": {
        "@type": "Organization",
        "name": "Скупка24",
        "url": "https://skypka24.com",
        "telephone": "+79929903333",
        "logo": { "@type": "ImageObject", "url": "https://skypka24.com/og-main.jpg" },
      },
    },
  ];

  return (
    <>
      <PageSEO
        title="Прайс Apple в Калуге — iPhone, MacBook, iPad | Скупка24"
        description="Актуальный прайс на iPhone 16, 17, MacBook, iPad в Калуге. Цены обновляются каждые 3 часа. Покупаем и продаём 24/7. Два магазина: Кирова 7/47 и Кирова 11. ☎ +7 (992) 990-33-33"
        keywords="прайс iPhone Калуга, купить iPhone Калуга, цены iPhone 16 Калуга, MacBook Калуга купить, iPad цена Калуга, Apple Watch Калуга, iPhone 17 Калуга, скупка iPhone Калуга, обмен iPhone Калуга, магазин Apple Калуга"
        url="https://skypka24.com/Apple"
        ogImage="https://skypka24.com/og-main.jpg"
        schema={seoSchemas}
      />
      <style>{`
        @keyframes progressBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-bar {
          animation: progressBar 1.6s ease-in-out infinite;
        }
        .order-btn {
          opacity: 0;
          transform: translateX(6px);
          transition: opacity 0.18s, transform 0.18s;
        }
        .price-row:hover .order-btn {
          opacity: 1;
          transform: translateX(0);
        }
        @media (max-width: 640px) {
          .order-btn { opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10"
        style={{ background: "linear-gradient(135deg,#111,#0d0d0d)", borderBottom: "2px solid #FFD700" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
              <span className="text-black font-black text-[18px]">С</span>
            </div>
            <div>
              <div className="font-oswald font-black text-white text-[18px] uppercase tracking-wide leading-tight">
                Скупка24 — Прайс Apple
              </div>
              <div className="text-[11px] text-white/40">
                {loading && !data ? "Обновляем цены…"
                  : data ? `${data.total} позиций · ${data.generated_at}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timer && !loading && (
              <span className="text-[11px] text-white/25 hidden sm:block">
                обновление через {timer}
              </span>
            )}
            {data && (
              <button
                onClick={() => setTomorrowOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
                style={{ background: "rgba(255,165,0,0.12)", border: "1px solid rgba(255,165,0,0.35)", color: "#fb923c" }}
              >
                <span>🚗</span>
                <span className="hidden sm:inline">Привезём завтра</span>
              </button>
            )}
            <button onClick={() => { try { localStorage.removeItem(CACHE_KEY); } catch {/***/} load(); }} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={13}
                className={loading ? "animate-spin" : ""} />
              Обновить
            </button>
            <button
              onClick={() => setEmailModal(true)}
              disabled={!data}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
            >
              <Icon name="Mail" size={13} />
              <span className="hidden sm:inline">На почту</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-black transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", minWidth: 90 }}
            >
              <Icon name={pdfLoading ? "Loader2" : "FileDown"} size={13}
                className={pdfLoading ? "animate-spin" : ""} />
              {pdfLoading ? "Готовим…" : "PDF"}
            </button>
            <button
              onClick={() => downloadPdf(true)}
              disabled={printPdfLoading}
              title="PDF с белым фоном — для цветного принтера"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", minWidth: 90 }}
            >
              <Icon name={printPdfLoading ? "Loader2" : "Printer"} size={13}
                className={printPdfLoading ? "animate-spin" : ""} />
              {printPdfLoading ? "Готовим…" : "Печать"}
            </button>
          </div>
        </div>
        {/* Прогресс-полоска под шапкой при обновлении */}
        {/* Строка поиска */}
        <div className="max-w-5xl mx-auto px-4 pb-2.5">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по модели, памяти, цвету…"
              className="w-full pl-8 pr-8 py-2 text-[13px] text-white outline-none rounded-lg transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: search ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <Icon name="X" size={13} />
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="h-[3px] overflow-hidden" style={{ background: "rgba(255,215,0,0.1)" }}>
            <div className="h-full animate-progress-bar"
              style={{ background: "linear-gradient(90deg,transparent,#FFD700,transparent)", width: "40%" }} />
          </div>
        )}
      </div>

      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>

        {/* Загрузка — скелетон */}
        {loading && !data && <SkeletonLoader />}

        {/* Ошибка */}
        {error && (
          <div className="max-w-5xl mx-auto px-4 pt-12">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={18} className="text-red-400 shrink-0" />
              <div>
                <div className="text-red-300 text-[13px] font-semibold">{error}</div>
                <button onClick={load} className="text-red-400/60 text-[11px] underline mt-1">Попробовать снова</button>
              </div>
            </div>
          </div>
        )}

        {/* Данные */}
        {data && (
          <div className="max-w-5xl mx-auto px-3 py-4">
            {/* Заголовок даты */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-1 mb-4">
              <div className="text-white/25 text-[12px]">{todayStr()}</div>
              <a href="https://skypka24.com" className="text-white/20 text-[11px] hover:text-white/40 transition-colors">
                skypka24.com
              </a>
            </div>

            {(() => {
              const q = search.trim().toLowerCase();

              // Фильтрация по поиску
              const filteredGroups = Object.entries(data.groups).reduce<[string, PriceItem[]][]>((acc, [cat, items]) => {
                if (!q) { acc.push([cat, items]); return acc; }
                const filtered = items.filter(it =>
                  it.name.toLowerCase().includes(q) ||
                  cat.toLowerCase().includes(q) ||
                  (it.region || "").toLowerCase().includes(q)
                );
                if (filtered.length) acc.push([cat, filtered]);
                return acc;
              }, []);

              if (q && filteredGroups.length === 0) {
                return (
                  <div className="text-center py-16 text-white/30">
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="font-oswald text-[15px] uppercase tracking-wide">Ничего не найдено</div>
                    <div className="text-[12px] mt-1">Попробуйте другой запрос</div>
                  </div>
                );
              }

              // Приоритет SIM для сортировки: nano+eSIM → eSIM only → Dual → остальные
              const simOrder = (sim: string) => {
                if (sim === "nano-SIM + eSIM") return 0;
                if (sim === "eSIM only")        return 1;
                if (sim === "Dual SIM (nano)")  return 2;
                return 3;
              };

              // Карточка товара
              const renderCard = (item: PriceItem, i: number, accentColor: string, cat: string) => {
                const sim = item.sim ?? detectSim(item.name, item.region);
                const inStock = !!item.price_num;
                return (
                  <div key={i} className="price-row flex items-center gap-2 rounded-xl px-3 py-2.5 group"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      opacity: inStock ? 1 : 0.55,
                      minWidth: 0,
                    }}>
                    {/* Фото / иконка */}
                    <div style={{ flexShrink: 0 }}>
                      {item.photo ? (
                        <img src={item.photo} alt={item.name} width={36} height={36}
                          style={{ borderRadius: 8, objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, fontSize: 18,
                          background: inStock ? `${accentColor}15` : "rgba(255,255,255,0.04)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{CAT_EMOJI[cat] || "📦"}</div>
                      )}
                    </div>
                    {/* Инфо */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: inStock ? "#e5e7eb" : "#9ca3af", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                        {sim && <SimBadge sim={sim} />}
                        {item.region && (
                          <span style={{
                            fontSize: 8, padding: "1px 4px", borderRadius: 3, fontWeight: 700,
                            background: item.region === "EU" ? "rgba(74,222,128,0.15)" : item.region === "CN" ? "rgba(251,191,36,0.15)" : "rgba(96,165,250,0.15)",
                            color: item.region === "EU" ? "#4ade80" : item.region === "CN" ? "#fbbf24" : "#60a5fa",
                            border: `1px solid ${item.region === "EU" ? "#4ade8033" : item.region === "CN" ? "#fbbf2433" : "#60a5fa33"}`,
                          }}>{item.region}</span>
                        )}
                      </div>
                    </div>
                    {/* Цена + кнопка */}
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      {inStock ? (
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#FFD700", whiteSpace: "nowrap" }}>{item.price}</div>
                      ) : (
                        <div style={{ fontSize: 9, color: "#fb923c", fontWeight: 600, whiteSpace: "nowrap" }}>🚗 заказ</div>
                      )}
                      <button className="order-btn mt-1" onClick={() => setOrderItem(item)} style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        cursor: "pointer", border: "none", whiteSpace: "nowrap", display: "block",
                        ...(inStock
                          ? { color: "#000", background: "linear-gradient(135deg,#FFD700,#f59e0b)" }
                          : { color: "#fb923c", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)" }
                        ),
                      }}>Заказать</button>
                    </div>
                  </div>
                );
              };

              // SIM-группа: заголовок + сетка карточек
              const renderSimGroup = (label: string, labelColor: string, labelBg: string, items: PriceItem[], accentColor: string, cat: string) => (
                <div key={label} className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 mb-2 rounded-lg" style={{ background: labelBg }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: labelColor, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>({items.length})</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 6 }}>
                    {items.map((item, i) => renderCard(item, i, accentColor, cat))}
                  </div>
                </div>
              );

              return (
                <div className="space-y-6">
                  {filteredGroups.map(([cat, items]) => {
                    const accentColor = CAT_COLORS[cat] || "#FFD700";

                    // Сортируем товары по SIM-типу
                    const sorted = [...items].sort((a, b) => {
                      const sa = a.sim ?? detectSim(a.name, a.region);
                      const sb = b.sim ?? detectSim(b.name, b.region);
                      return simOrder(sa) - simOrder(sb);
                    });

                    // Группируем по SIM
                    const bySim: Record<string, PriceItem[]> = {};
                    sorted.forEach(item => {
                      const s = item.sim ?? detectSim(item.name, item.region);
                      const key = s || "Другое";
                      if (!bySim[key]) bySim[key] = [];
                      bySim[key].push(item);
                    });

                    const simGroups = Object.keys(bySim).sort((a, b) => simOrder(a) - simOrder(b));
                    const hasSplit = simGroups.length > 1;

                    const SIM_META: Record<string, { label: string; color: string; bg: string }> = {
                      "nano-SIM + eSIM": { label: "nano-SIM + eSIM", color: "#60a5fa", bg: "rgba(59,130,246,0.08)" },
                      "eSIM only":       { label: "eSIM only (США)",  color: "#f97316", bg: "rgba(249,115,22,0.08)" },
                      "Dual SIM (nano)": { label: "Dual SIM (Китай)", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
                      "Другое":          { label: "Другое",           color: "#9ca3af", bg: "rgba(156,163,175,0.06)" },
                    };

                    return (
                      <div key={cat}>
                        {/* Заголовок категории */}
                        <div className="flex items-center gap-2 px-3 py-2.5 mb-3 rounded-xl"
                          style={{ background: `${accentColor}12`, borderLeft: `3px solid ${accentColor}` }}>
                          <span className="text-[17px]">{CAT_EMOJI[cat] || "📦"}</span>
                          <span className="font-oswald font-bold text-[16px] uppercase tracking-wide" style={{ color: accentColor }}>{cat}</span>
                          <span className="text-[11px] text-white/25 ml-1">· {items.length} шт.</span>
                        </div>

                        {hasSplit ? (
                          simGroups.map(simKey => {
                            const meta = SIM_META[simKey] || SIM_META["Другое"];
                            return renderSimGroup(meta.label, meta.color, meta.bg, bySim[simKey], accentColor, cat);
                          })
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 6 }}>
                            {sorted.map((item, i) => renderCard(item, i, accentColor, cat))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* CTA-блок */}
            <div className="mt-10 p-6 rounded-3xl text-center"
              style={{
                background: "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03))",
                border: "1px solid rgba(255,215,0,0.2)",
              }}>
              <div className="font-oswald font-black text-[22px] text-white uppercase tracking-wide mb-2">
                Не нашли нужное?
              </div>
              <div className="text-white/50 text-[13px] mb-5">
                Позвоните — найдём любую модель за 1–3 дня. Скупаем и покупаем 24/7.
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setTomorrowOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-oswald font-bold text-[16px] uppercase transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,rgba(251,146,60,0.15),rgba(251,146,60,0.05))",
                    border: "2px solid rgba(251,146,60,0.5)",
                    color: "#fb923c",
                    boxShadow: "0 4px 20px rgba(251,146,60,0.2)",
                  }}>
                  <span style={{ fontSize: 20 }}>🚗</span>
                  Привезём завтра
                </button>
                <a href="tel:+79929903333"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-oswald font-bold text-[16px] uppercase text-black"
                  style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", boxShadow: "0 4px 24px rgba(255,215,0,0.35)" }}>
                  <Icon name="Phone" size={18} />
                  +7 (992) 990-33-33
                </a>
                <button
                  onClick={() => setEmailModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-oswald font-bold text-[15px] uppercase transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
                >
                  <Icon name="Mail" size={17} />
                  Прайс на почту
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-oswald font-bold text-[15px] uppercase transition-all disabled:opacity-50"
                  style={{ border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700", background: "rgba(255,215,0,0.07)" }}
                >
                  <Icon name={pdfLoading ? "Loader2" : "FileDown"} size={17}
                    className={pdfLoading ? "animate-spin" : ""} />
                  {pdfLoading ? "Готовим…" : "Скачать PDF"}
                </button>
              </div>
              <div className="text-white/25 text-[11px] mt-4">
                г. Калуга, ул. Кирова 7/47 и ул. Кирова 11
              </div>
            </div>
          </div>
        )}

        {/* SEO-блок */}
        <SeoBlock />
      </div>

      {/* Модал заказа */}
      {orderItem && <OrderModal item={orderItem} onClose={() => setOrderItem(null)} />}

      {/* Модал отправки прайса на email */}
      {emailModal && <EmailPriceModal onClose={() => setEmailModal(false)} />}

      {/* Панель «Привезём завтра» */}
      {data && (
        <TomorrowPanel
          groups={data.groups}
          open={tomorrowOpen}
          onClose={() => setTomorrowOpen(false)}
          onOrder={(item) => { setTomorrowOpen(false); setOrderItem(item); }}
        />
      )}
    </>
  );
}