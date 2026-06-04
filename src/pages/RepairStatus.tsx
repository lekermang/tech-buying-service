import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; step: number }> = {
  new:            { label: "Принято",           color: "text-blue-300",   bg: "bg-blue-500/20 border-blue-500/40",   icon: "ClipboardCheck", step: 1 },
  accepted:       { label: "Принят мастером",   color: "text-violet-300", bg: "bg-violet-500/20 border-violet-500/40", icon: "UserCheck",  step: 2 },
  in_progress:    { label: "В работе",          color: "text-sky-300",    bg: "bg-sky-500/20 border-sky-500/40",     icon: "Wrench",         step: 3 },
  waiting_parts:  { label: "Ждём запчасть",     color: "text-orange-300", bg: "bg-orange-500/20 border-orange-500/40", icon: "Package",     step: 3 },
  pending_approval:{ label: "На согласовании",  color: "text-purple-300", bg: "bg-purple-500/20 border-purple-500/40", icon: "MessageCircle", step: 2 },
  ready:          { label: "Готово! Заберите",  color: "text-[#FFD700]",  bg: "bg-[#FFD700]/15 border-[#FFD700]/40", icon: "CheckCircle",    step: 4 },
  done:           { label: "Выдано",            color: "text-green-300",  bg: "bg-green-500/20 border-green-500/40", icon: "BadgeCheck",     step: 5 },
  warranty:       { label: "На гарантии",       color: "text-teal-300",   bg: "bg-teal-500/20 border-teal-500/40",   icon: "Shield",         step: 4 },
  cancelled:      { label: "Отменено",          color: "text-red-300",    bg: "bg-red-500/20 border-red-500/40",     icon: "XCircle",        step: 0 },
};

const STEPS = ["Принято", "Диагностика", "Ремонт", "Готово", "Выдано"];

type OrderStatus = {
  id: number; name: string; model: string | null; repair_type: string | null;
  price: number | null; status: string; status_label: string;
  admin_note: string | null; created_at: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function OrderCard({ order }: { order: OrderStatus }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} animate-in fade-in slide-in-from-bottom-2`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-oswald font-bold text-white text-xl">Заявка #{order.id}</div>
          <div className="font-roboto text-white/50 text-sm mt-0.5">{order.model || "Устройство"}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold font-roboto ${cfg.bg} ${cfg.color}`}>
          <Icon name={cfg.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
          {cfg.label}
        </div>
      </div>

      {/* Прогресс-бар шагов */}
      {order.status !== "cancelled" && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => {
              const active = cfg.step > i;
              const current = cfg.step === i + 1;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                    ${active ? "bg-[#FFD700] text-black" : current ? "bg-[#FFD700]/30 border-2 border-[#FFD700] text-[#FFD700]" : "bg-white/10 text-white/30"}`}>
                    {active && !current ? <Icon name="Check" size={12} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`absolute`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-0">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={`h-1 w-full rounded-full transition-all ${cfg.step > i ? "bg-[#FFD700]" : "bg-white/10"}`} />
                {i < STEPS.length - 1 && <div className="w-0" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((step, i) => (
              <div key={step} className={`text-[9px] font-roboto text-center flex-1 ${cfg.step > i ? "text-[#FFD700]/80" : "text-white/25"}`}>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Детали */}
      <div className="space-y-2 text-sm font-roboto">
        {order.repair_type && (
          <div className="flex justify-between">
            <span className="text-white/50">Вид работы</span>
            <span className="text-white font-semibold">{order.repair_type}</span>
          </div>
        )}
        {order.price && (
          <div className="flex justify-between">
            <span className="text-white/50">Стоимость</span>
            <span className="text-white font-semibold">{order.price.toLocaleString("ru-RU")} ₽</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/50">Принято</span>
          <span className="text-white/80">{fmt(order.created_at)}</span>
        </div>
      </div>

      {order.admin_note && (
        <div className="mt-3 p-3 bg-black/30 rounded-xl border border-white/10">
          <div className="text-[10px] text-white/40 uppercase tracking-wider font-roboto mb-1">Комментарий мастера</div>
          <div className="text-white/80 text-sm font-roboto">{order.admin_note}</div>
        </div>
      )}

      {order.status === "ready" && (
        <div className="mt-4 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center gap-3">
          <Icon name="MapPin" size={20} className="text-[#FFD700] shrink-0" />
          <div className="text-sm font-roboto">
            <div className="text-[#FFD700] font-bold">Приходите забирать!</div>
            <div className="text-white/60 text-xs mt-0.5">ул. Кирова, 7/47 или ул. Кирова, 11 · Пн–Вс 10:00–21:00</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepairStatus() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [single, setSingle] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Автозаполнение из URL ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setQuery(id);
      search(id);
    }
  }, []);

  const search = async (q?: string) => {
    const val = (q ?? query).trim();
    if (!val) return;
    setLoading(true);
    setError("");
    setOrders([]);
    setSingle(null);
    setSearched(true);
    try {
      const isId = /^\d+$/.test(val);
      const url = isId
        ? `${REPAIR_STATUS_URL}?id=${val}`
        : `${REPAIR_STATUS_URL}?phone=${encodeURIComponent(val)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Заявка не найдена"); return; }
      if (data.orders) setOrders(data.orders);
      else setSingle(data);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div style={{ background: "linear-gradient(135deg,#1a1a1a,#111)", borderBottom: "2px solid #FFD700" }}
        className="px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Icon name="ChevronLeft" size={18} className="text-white/60" />
          </a>
          <div>
            <div className="font-oswald font-bold text-lg text-white tracking-wide">
              СКУПКА<span className="text-[#FFD700]">24</span>
            </div>
            <div className="text-[11px] text-white/40 font-roboto uppercase tracking-widest">Статус ремонта</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Форма поиска */}
        <div className="rounded-2xl border border-[#FFD700]/20 bg-gradient-to-br from-[#1a1a1a] to-[#111] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Search" size={18} className="text-[#FFD700]" />
            <div className="font-oswald font-bold text-white text-base uppercase tracking-wider">Найти заявку</div>
          </div>
          <p className="text-sm text-white/50 font-roboto mb-4">
            Введите <b className="text-white/70">номер заявки</b> (например: 226) или <b className="text-white/70">номер телефона</b>
          </p>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="226 или +7 999..."
              className="flex-1 bg-[#0e0e0e] border border-[#2a2a2a] focus:border-[#FFD700]/60 text-white px-4 py-3 rounded-xl font-roboto text-[15px] outline-none placeholder:text-white/25 transition-colors"
            />
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-[#FFD700] text-black font-bold font-roboto text-sm hover:bg-yellow-400 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Search" size={16} />}
              {loading ? "" : "Найти"}
            </button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-roboto text-sm">
            <Icon name="AlertCircle" size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Один результат */}
        {single && <OrderCard order={single} />}

        {/* Несколько заявок */}
        {orders.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-white/40 font-roboto">Найдено заявок: {orders.length}</div>
            {orders.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        )}

        {/* Пустой результат после поиска */}
        {searched && !loading && !error && !single && orders.length === 0 && (
          <div className="text-center text-white/40 font-roboto text-sm py-8">
            Заявок не найдено
          </div>
        )}

        {/* Контакты */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-sm font-roboto space-y-2">
          <div className="font-bold text-white/60 text-xs uppercase tracking-wider mb-3">Остались вопросы?</div>
          <a href="tel:+79929990333" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <Icon name="Phone" size={15} className="text-[#FFD700] shrink-0" />
            +7 (992) 999-03-33
          </a>
          <a href="https://t.me/Skypkaklgbot" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
            <Icon name="Send" size={15} className="text-[#FFD700] shrink-0" />
            Telegram-бот @Skypkaklgbot
          </a>
          <div className="flex items-start gap-3 text-white/40">
            <Icon name="MapPin" size={15} className="text-[#FFD700] shrink-0 mt-0.5" />
            ул. Кирова, 7/47 и ул. Кирова, 11 · г. Калуга
          </div>
        </div>
      </div>
    </div>
  );
}