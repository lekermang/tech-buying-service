/**
 * RepairServices — компактный список услуг разблокировки.
 * Дизайн: таб-фильтр + плитка-аккордеон. Без лагов.
 * Нет тяжёлых анимаций на JS, только CSS transitions.
 */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const SKFRP_URL = (funcUrls as Record<string, string>)["skfrp-proxy"];
const CACHE_KEY = "repair_services_v1";
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

/* Кэш в localStorage — работает офлайн и при плохом сигнале */
function readCache(): Service[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}
function writeCache(data: Service[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore */ }
}

/* Fetch с таймаутом и retry */
async function fetchWithRetry(url: string, timeoutMs = 8000, retries = 2): Promise<Service[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      const d = await res.json();
      if (d.ok && Array.isArray(d.services)) {
        return d.services.filter((s: Service) => s.is_active !== false);
      }
      throw new Error(d.error || "bad response");
    } catch (e) {
      clearTimeout(tid);
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
    }
  }
  return [];
}

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  requires_imei?: boolean;
  is_active?: boolean;
};

/* Автоматически определяем категорию по названию */
function getCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("samsung"))    return "Samsung";
  if (n.includes("xiaomi") || n.includes("redmi") || n.includes("poco")) return "Xiaomi";
  if (n.includes("iphone") || n.includes("icloud") || n.includes("apple")) return "Apple";
  if (n.includes("huawei") || n.includes("honor")) return "Huawei";
  if (n.includes("imei"))       return "IMEI";
  if (n.includes("frp") || n.includes("google")) return "FRP";
  return "Другое";
}

const CAT_ICONS: Record<string, string> = {
  Samsung: "Smartphone", Xiaomi: "Smartphone", Apple: "Smartphone",
  Huawei: "Smartphone", IMEI: "Hash", FRP: "Unlock", Другое: "Wrench",
};
const CAT_COLORS: Record<string, string> = {
  Samsung: "#93c5fd", Xiaomi: "#86efac", Apple: "#fff3a0",
  Huawei: "#fca5a5", IMEI: "#fdba74", FRP: "#c4b5fd", Другое: "#6ee7b7",
};

/* Skeleton-карточка */
function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white/[0.04] border border-white/[0.05] h-16" />
  );
}

export default function RepairServices({ onOrder }: { onOrder: () => void }) {
  // Сразу показываем из кэша — мгновенно даже в лесу
  const [services, setServices] = useState<Service[]>(() => readCache() ?? []);
  const [loading,  setLoading]  = useState(() => !readCache());
  const [error,    setError]    = useState(false);
  const [activeTab, setActiveTab] = useState("Все");
  const [expanded, setExpanded]   = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWithRetry(SKFRP_URL, 8000, 2)
      .then(data => {
        if (!alive) return;
        if (data.length > 0) {
          setServices(data);
          writeCache(data);
          setError(false);
        } else if (!readCache()) {
          setError(true);
        }
      })
      .catch(() => { if (alive && !readCache()) setError(true); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  /* Уникальные категории */
  const categories = ["Все", ...Array.from(new Set(services.map(s => getCategory(s.name))))];

  const filtered = activeTab === "Все"
    ? services
    : services.filter(s => getCategory(s.name) === activeTab);

  return (
    <section id="services" className="px-4 sm:px-8 py-10 max-w-4xl mx-auto scroll-mt-20">

      {/* Заголовок */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase leading-tight">
            Наши <span className="text-[#FFD700]">услуги</span>
          </h2>
          <p className="text-white/40 text-xs mt-1 font-roboto">
            {services.length > 0 ? `${services.length} услуг — разблокировка, прошивка, восстановление` : "Разблокировка, прошивка и восстановление устройств"}
          </p>
        </div>
        {!loading && !error && services.length > 0 && (
          <div className="shrink-0 text-right">
            <div className="font-oswald font-bold text-[#FFD700] text-lg leading-none">от 490 ₽</div>
            <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mt-0.5">любая услуга</div>
          </div>
        )}
      </div>

      {/* Таб-фильтр */}
      {!loading && !error && categories.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {categories.map(cat => {
            const color = cat === "Все" ? "#FFD700" : (CAT_COLORS[cat] ?? "#FFD700");
            const active = activeTab === cat;
            return (
              <button key={cat} onClick={() => { setActiveTab(cat); setExpanded(null); }}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg font-roboto text-[11px] font-semibold shrink-0 transition-all active:scale-95"
                style={{
                  background: active ? color + "22" : "rgba(255,255,255,0.04)",
                  color: active ? color : "rgba(255,255,255,0.45)",
                  border: `1px solid ${active ? color + "45" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: active ? `0 0 12px ${color}18` : "none",
                }}>
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* Ошибка */}
      {!loading && error && (
        <div className="text-center py-10 text-white/40">
          <Icon name="WifiOff" size={32} className="mx-auto mb-3 text-white/25" />
          <p className="text-sm">Не удалось загрузить услуги.</p>
          <button onClick={onOrder}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold text-sm px-5 py-2.5 rounded-lg">
            Оставить заявку
          </button>
        </div>
      )}

      {/* Список — аккордеон-стиль */}
      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {filtered.map((s, idx) => {
            const cat   = getCategory(s.name);
            const color = CAT_COLORS[cat] ?? "#FFD700";
            const open  = expanded === s.id;

            return (
              <div key={s.id}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
                  borderColor: open ? color + "40" : "rgba(255,255,255,0.07)",
                  boxShadow: open ? `0 0 20px ${color}0d` : "none",
                  animationDelay: `${idx * 30}ms`,
                }}>

                {/* Строка-заголовок (клик = открыть) */}
                <button
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{ WebkitTapHighlightColor: "transparent" }}>

                  {/* Иконка категории */}
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: color + "15", border: `1px solid ${color}25` }}>
                    <Icon name={CAT_ICONS[cat] ?? "Wrench"} size={14} style={{ color }} />
                  </div>

                  {/* Название + описание-превью */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-oswald font-semibold text-sm sm:text-base uppercase leading-tight text-white">
                        {s.name}
                      </span>
                      {s.requires_imei && (
                        <span className="text-[9px] font-roboto font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: "#fdba7420", color: "#fdba74", border: "1px solid #fdba7430" }}>
                          IMEI
                        </span>
                      )}
                    </div>
                    {!open && s.description && (
                      <p className="text-white/35 text-[11px] font-roboto truncate mt-0.5">{s.description}</p>
                    )}
                  </div>

                  {/* Цена */}
                  <div className="shrink-0 text-right ml-2">
                    <div className="font-oswald font-bold text-base sm:text-lg leading-none"
                      style={{ color }}>
                      {Number(s.price).toLocaleString("ru-RU")} ₽
                    </div>
                  </div>

                  {/* Стрелка */}
                  <Icon name="ChevronDown" size={16} className="shrink-0 text-white/25 transition-transform duration-200"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {/* Раскрытое тело */}
                {open && (
                  <div className="px-4 pb-4 pt-0 border-t"
                    style={{ borderColor: color + "20" }}>
                    {s.description && (
                      <p className="font-roboto text-sm text-white/55 leading-relaxed mb-4 mt-3">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Icon name="BadgeCheck" size={13} className="text-green-400" />
                          <span className="font-roboto text-[11px] text-white/45">Гарантия результата</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon name="Zap" size={13} className="text-[#FFD700]" />
                          <span className="font-roboto text-[11px] text-white/45">Срочно — в день обращения</span>
                        </div>
                      </div>
                      <button onClick={onOrder}
                        className="inline-flex items-center gap-1.5 font-oswald font-bold text-sm px-5 py-2.5 rounded-xl text-black active:scale-95 transition-all"
                        style={{
                          background: `linear-gradient(135deg,${color},${color}cc)`,
                          boxShadow: `0 4px 16px ${color}30`,
                        }}>
                        Заказать
                        <Icon name="ArrowRight" size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA снизу */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.12)" }}>
          <div className="flex items-center gap-2.5">
            <Icon name="MessageCircle" size={16} className="text-[#FFD700]" />
            <span className="font-roboto text-sm text-white/60">
              Нужна помощь с выбором? Мастер подскажет бесплатно.
            </span>
          </div>
          <button onClick={onOrder}
            className="shrink-0 inline-flex items-center gap-1.5 font-oswald font-bold text-sm px-5 py-2.5 rounded-xl text-black active:scale-95 transition-all"
            style={{ background: "linear-gradient(180deg,#fff3a0,#FFD700,#d4a017)", boxShadow: "0 4px 16px rgba(255,215,0,0.25)" }}>
            <Icon name="Zap" size={14} />
            Бесплатная консультация
          </button>
        </div>
      )}
    </section>
  );
}