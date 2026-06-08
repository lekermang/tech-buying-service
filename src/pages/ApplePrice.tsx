import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PUBLIC_PRICE_URL = "https://functions.poehali.dev/b39f271a-3a63-4998-b83b-3c64eeace265";
const SEND_LEAD_URL    = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const PRICE_EMAIL_URL  = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682";
const PRICE_PDF_URL    = "https://functions.poehali.dev/eff3d143-8966-4a6d-bbea-ddc77a6e5373";
const DEFAULT_MARKUP   = 2000;
const REFRESH_MS       = 3 * 60 * 60 * 1000;

interface PriceItem {
  name: string;
  price: string;
  price_num: number | null;
  region: string;
  photo: string | null;
}

// ── SIM-тип по имени модели и региону ─────────────────────────────────────────
function detectSim(name: string, region: string): string {
  const n = name.toLowerCase();
  if (n.includes("macbook") || n.includes("airpod") || n.includes("watch") ||
      n.includes("pencil") || n.includes("кабель") || n.includes("стекло") || n.includes("чехол"))
    return "";
  if (n.match(/^(13|14|se2|se3)/))  return "nano-SIM + eSIM";
  if (n.match(/^(15|16|17|16e|17e)/)) return region === "EU" ? "eSIM" : "nano-SIM + eSIM";
  if (n.includes("ipad")) return region === "EU" ? "eSIM" : "nano-SIM + eSIM";
  if (n.match(/samsung|galaxy|redmi|poco|xiaomi|honor/)) return "Dual SIM";
  return "";
}

function SimBadge({ sim }: { sim: string }) {
  if (!sim) return null;
  const isESim  = sim === "eSIM";
  const isDual  = sim.includes("Dual");
  const isBoth  = sim.includes("+");
  const color   = isESim ? "#10b981" : isDual ? "#8b5cf6" : "#3b82f6";
  const bg      = isESim ? "rgba(16,185,129,0.12)" : isDual ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)";
  const border  = isESim ? "rgba(16,185,129,0.3)"  : isDual ? "rgba(139,92,246,0.3)"  : "rgba(59,130,246,0.3)";
  return (
    <span style={{
      fontSize: 9, padding: "1px 6px", borderRadius: 4, marginLeft: 5,
      verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap",
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {isBoth ? "nano+eSIM" : sim}
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

// ── Модал заказа ───────────────────────────────────────────────────────────────
function OrderModal({ item, onClose }: { item: PriceItem; onClose: () => void }) {
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSend = name.trim().length >= 2 && phoneDigits.length === 11;

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (!d) return "+7";
    if (d.length <= 1) return "+7";
    if (d.length <= 4) return `+7 (${d.slice(1)}`;
    if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
    if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
    return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
  };

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
          category: "Прайс Apple",
          desc: `Хочет купить: ${item.name}${item.price_num ? ` — ${item.price}` : ""}`,
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
              <div className="text-white/50 text-[13px] mb-6">Перезвоним в течение 15 минут</div>
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
                  {item.price_num && (
                    <div className="font-oswald font-black text-[18px] mt-0.5" style={{ color: "#FFD700" }}>
                      {item.price}
                    </div>
                  )}
                </div>
              </div>

              <div className="font-oswald font-bold text-[16px] text-white uppercase tracking-wide mb-4">
                Заказать / уточнить
              </div>

              <div className="space-y-3">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
                <input value={phone} onChange={e => handlePhone(e.target.value)}
                  type="tel" placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
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
                <button onClick={handleSend} disabled={sending || !canSend}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black disabled:opacity-40"
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
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSend = emailOk && name.trim().length >= 2;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      const res = await fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markup: DEFAULT_MARKUP,
          email:  email.trim(),
          only_available: true,
        }),
      });
      const d = await res.json();
      if (d.ok || d.queued) {
        // Также сохраняем лид чтобы сотрудники видели запрос
        fetch(SEND_LEAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: "—",
            category: "Прайс Apple — Email",
            desc: `Запросил прайс на почту: ${email.trim()}`,
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
              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  {name.trim().length >= 2 && (
                    <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                </div>
                <div className="relative">
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none pr-10"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${emailOk && email ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}` }}
                  />
                  {emailOk && (
                    <Icon name="Check" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                </div>
              </div>

              {err && (
                <div className="flex items-center gap-1.5 text-red-400 text-[12px] mt-2">
                  <Icon name="AlertCircle" size={13} /> {err}
                </div>
              )}

              {/* Дисклеймер */}
              <div className="text-white/20 text-[10px] mt-3 leading-relaxed">
                Нажимая кнопку, вы соглашаетесь на получение информации о ценах.
                Мы не рассылаем спам.
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
                  onClick={handleSend}
                  disabled={sending || !canSend}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black disabled:opacity-40 transition-all relative overflow-hidden"
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

// ── Панель «Привезём завтра» ──────────────────────────────────────────────────
function TomorrowPanel({
  groups, open, onClose, onOrder,
}: {
  groups: Record<string, PriceItem[]>;
  open: boolean;
  onClose: () => void;
  onOrder: (item: PriceItem) => void;
}) {
  // Собираем все позиции БЕЗ цены — это «под заказ»
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
                {items.length} позиций под заказ · доставка 1–2 дня
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
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>под заказ</span>
                      </div>
                    </div>

                    {/* Кнопка */}
                    <div style={{ padding: "4px 12px 4px 4px", flexShrink: 0 }}>
                      <button
                        onClick={() => onOrder(item)}
                        style={{
                          padding: "7px 12px", borderRadius: 10,
                          fontSize: 11, fontWeight: 800, cursor: "pointer",
                          color: "#000", border: "none", whiteSpace: "nowrap",
                          background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                          boxShadow: "0 2px 10px rgba(255,215,0,0.35)",
                        }}>
                        Заказать
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
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


// ── SEO-блок ──────────────────────────────────────────────────────────────────
const SEO_MODELS = [
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "MacBook Air M2", "MacBook Air M3", "MacBook Pro 14", "MacBook Pro 16",
  "iPad Air", "iPad Pro", "iPad mini", "Apple Watch Series 9",
  "AirPods Pro 2", "Samsung Galaxy S24", "Samsung Galaxy S23",
];

function SeoBlock() {
  return (
    <section style={{ background: "#0d0d0d", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ color: "#FFD700", fontFamily: "oswald, sans-serif", fontSize: 18, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Купить iPhone и технику Apple в Калуге
        </h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 1.8, marginBottom: 20, maxWidth: 680 }}>
          Скупка24 — официальная продажа новых и б/у iPhone, MacBook, iPad, Apple Watch в Калуге.
          Все устройства проверены, с гарантией. Доставка по Калуге и РФ.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SEO_MODELS.map(m => (
            <span key={m} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12,
              fontWeight: 700, letterSpacing: 0.3,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              cursor: "default",
            }}>{m}</span>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 16 }}>
          Адрес: г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11 · Режим работы: ежедневно 10:00–21:00
        </p>
      </div>
    </section>
  );
}


// ── Главный компонент ─────────────────────────────────────────────────────────
export default function ApplePrice() {
  const [data, setData]               = useState<PriceData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + REFRESH_MS);
  const [timer, setTimer]             = useState("");
  const [orderItem, setOrderItem]     = useState<PriceItem | null>(null);
  const [emailModal, setEmailModal]   = useState(false);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [tomorrowOpen, setTomorrowOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(PRICE_PDF_URL);
      if (!res.ok) throw new Error("Ошибка сервера");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "");
      a.href     = url;
      a.download = `price-skypka24-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Не удалось сформировать PDF. Попробуйте ещё раз.");
    }
    setPdfLoading(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PUBLIC_PRICE_URL}?markup=${DEFAULT_MARKUP}&_t=${Date.now()}`);
      const text = await r.text();
      const d: PriceData = JSON.parse(text);
      if (d.ok) {
        setData(d);
        setNextRefresh(Date.now() + REFRESH_MS);
      } else {
        setError("Не удалось загрузить прайс");
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const tick = () => setTimer(countdown(nextRefresh));
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextRefresh]);

  return (
    <>
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
            <button onClick={load} disabled={loading}
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
              style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", minWidth: 110 }}
            >
              <Icon name={pdfLoading ? "Loader2" : "FileDown"} size={13}
                className={pdfLoading ? "animate-spin" : ""} />
              {pdfLoading ? "Готовим…" : "Скачать PDF"}
            </button>
          </div>
        </div>
        {/* Прогресс-полоска под шапкой при обновлении */}
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

            <div className="space-y-5">
              {Object.entries(data.groups).map(([cat, items]) => {
                const accentColor = CAT_COLORS[cat] || "#FFD700";
                return (
                  <div key={cat}>
                    {/* Заголовок категории */}
                    <div className="flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-xl"
                      style={{ background: `${accentColor}10`, borderLeft: `3px solid ${accentColor}` }}>
                      <span className="text-[16px]">{CAT_EMOJI[cat] || "📦"}</span>
                      <span className="font-oswald font-bold text-[15px] uppercase tracking-wide"
                        style={{ color: accentColor }}>{cat}</span>
                      <span className="text-[11px] text-white/25 ml-1">({items.length} шт.)</span>
                    </div>

                    {/* Строки товаров */}
                    <div>
                      {items.map((item, i) => {
                        const sim = detectSim(item.name, item.region);
                        const inStock = !!item.price_num;
                        return (
                          <div key={i} className="price-row flex items-center gap-0 group"
                            style={{
                              background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              opacity: inStock ? 1 : 0.55,
                            }}>
                            {/* Фото */}
                            <div style={{ width: 52, padding: "3px 6px", flexShrink: 0 }}>
                              {item.photo ? (
                                <img src={item.photo} alt={item.name} width={40} height={40}
                                  style={{ borderRadius: 6, objectFit: "cover", display: "block" }} />
                              ) : (
                                <div style={{
                                  width: 40, height: 40, borderRadius: 6,
                                  background: inStock ? `${accentColor}10` : "rgba(255,255,255,0.04)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 18,
                                }}>{CAT_EMOJI[cat] || "📦"}</div>
                              )}
                            </div>

                            {/* Название + SIM + Регион */}
                            <div style={{ flex: 1, padding: "8px 6px", minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: inStock ? "#e5e7eb" : "#9ca3af", lineHeight: 1.3 }}>
                                  {item.name}
                                </span>
                                {item.region && (
                                  <span style={{
                                    fontSize: 8, marginLeft: 5, padding: "1px 5px", borderRadius: 4,
                                    verticalAlign: "middle", fontWeight: 700, flexShrink: 0,
                                    background: item.region === "EU" ? "rgba(74,222,128,0.15)"
                                      : item.region === "US" ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
                                    color: item.region === "EU" ? "#4ade80"
                                      : item.region === "US" ? "#60a5fa" : "#fbbf24",
                                    border: `1px solid ${item.region === "EU" ? "#4ade8033"
                                      : item.region === "US" ? "#60a5fa33" : "#fbbf2433"}`,
                                  }}>{item.region}</span>
                                )}
                              </div>
                              {sim && (
                                <div style={{ marginTop: 2 }}>
                                  <SimBadge sim={sim} />
                                </div>
                              )}
                            </div>

                            {/* Цена или «под заказ» */}
                            <div style={{
                              padding: "8px 4px 8px 4px", textAlign: "right",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}>
                              {inStock ? (
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#FFD700" }}>
                                  {item.price}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 9, fontWeight: 600, color: "#fb923c",
                                  background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)",
                                  borderRadius: 5, padding: "2px 6px",
                                }}>🚗 заказ</span>
                              )}
                            </div>

                            {/* Кнопка */}
                            <div style={{ padding: "4px 8px 4px 2px", flexShrink: 0 }}>
                              {inStock ? (
                                <button
                                  className="order-btn"
                                  onClick={() => setOrderItem(item)}
                                  style={{
                                    padding: "5px 10px", borderRadius: 8,
                                    fontSize: 11, fontWeight: 700,
                                    color: "#000", cursor: "pointer",
                                    background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                                    border: "none", whiteSpace: "nowrap",
                                    boxShadow: "0 2px 8px rgba(255,215,0,0.3)",
                                  }}>
                                  Заказать
                                </button>
                              ) : (
                                <button
                                  className="order-btn"
                                  onClick={() => setOrderItem(item)}
                                  style={{
                                    padding: "5px 10px", borderRadius: 8,
                                    fontSize: 11, fontWeight: 700,
                                    color: "#fb923c", cursor: "pointer",
                                    background: "rgba(251,146,60,0.1)",
                                    border: "1px solid rgba(251,146,60,0.3)", whiteSpace: "nowrap",
                                  }}>
                                  Заказать
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

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