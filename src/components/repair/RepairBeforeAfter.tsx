import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

/* ─────────────────────────────────────────────────────────────────────────
   Данные кейсов
   ───────────────────────────────────────────────────────────────────────── */
const CASES = [
  {
    id: "screen",
    tag: "iPhone",
    service: "Замена экрана",
    time: "40 мин",
    price: "890 ₽",
    before: { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/880ce7a4-54ef-4e06-97a0-8f34b017dfd2.jpg", label: "Разбитое стекло, нет сенсора" },
    after:  { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6d407093-3c2e-4673-ad60-eaa80f34d8c4.jpg", label: "Новый дисплей, идеальный сенсор" },
    accent: "#FFD700",
  },
  {
    id: "water",
    tag: "Xiaomi",
    service: "Ремонт после воды",
    time: "1–2 дня",
    price: "990 ₽",
    before: { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e8420907-9119-4969-a22e-0fa45826a419.jpg", label: "Окисление платы, не включался" },
    after:  { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0c3ed702-2fc1-487a-be00-4fe0a1ad6564.jpg", label: "УЗ-промывка, восстановлен полностью" },
    accent: "#7dd3fc",
  },
  {
    id: "glass",
    tag: "Samsung",
    service: "Замена стекла",
    time: "60 мин",
    price: "690 ₽",
    before: { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b425933a-d3af-4615-9ddd-95a186819eb7.jpg", label: "Трещины по всему стеклу" },
    after:  { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/16158ca4-760a-44f7-b257-6e0bc8c0e863.jpg", label: "Переклейка, заводской вид" },
    accent: "#86efac",
  },
  {
    id: "battery",
    tag: "Android",
    service: "Замена аккумулятора",
    time: "30 мин",
    price: "490 ₽",
    before: { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/92bc82b2-68c3-4d5b-bf6e-1828d8253bf5.jpg", label: "Вздутый аккумулятор, опасно" },
    after:  { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/63ec636a-da70-4b1b-97c0-eda99441610d.jpg", label: "Новый аккумулятор, полная ёмкость" },
    accent: "#6ee7b7",
  },
  {
    id: "bga",
    tag: "Плата",
    service: "BGA-пайка",
    time: "1–3 дня",
    price: "от 1500 ₽",
    before: { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/369b83a8-a4af-4b8d-aac0-e30c0b69d073.jpg", label: "Сгоревший чип, короткое замыкание" },
    after:  { img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/7c13d945-a262-45a5-bced-a0b36e9592a0.jpg", label: "Новый чип, плата работает" },
    accent: "#fca5a5",
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   SEO-ссылки
   ───────────────────────────────────────────────────────────────────────── */
const SEO_LINKS = [
  { href: "/remont-iphone-kaluga",        icon: "Smartphone",      label: "Ремонт iPhone в Калуге",  keywords: "ремонт айфона калуга · замена экрана · аккумулятор", accent: "#fff3a0" },
  { href: "/remont-samsung-kaluga",       icon: "Smartphone",      label: "Ремонт Samsung в Калуге", keywords: "ремонт samsung galaxy калуга · снятие frp",           accent: "#93c5fd" },
  { href: "/remont-xiaomi-kaluga",        icon: "Smartphone",      label: "Ремонт Xiaomi в Калуге",  keywords: "ремонт xiaomi redmi poco калуга",                     accent: "#86efac" },
  { href: "/zamena-stekla-kaluga",        icon: "Layers",          label: "Замена стекла в Калуге",  keywords: "переклейка тачскрина калуга · oca-клей",              accent: "#c4b5fd" },
  { href: "/zamena-akkumulyatora-kaluga", icon: "BatteryCharging", label: "Замена аккумулятора",     keywords: "замена аккумулятора телефона калуга",                 accent: "#6ee7b7" },
  { href: "/remont-posle-vody-kaluga",    icon: "Droplets",        label: "Ремонт после воды",       keywords: "ремонт утопленника калуга · уз-промывка",             accent: "#7dd3fc" },
  { href: "/bga-pajka-kaluga",            icon: "Cpu",             label: "BGA-пайка в Калуге",      keywords: "bga пайка компонентный ремонт калуга",                accent: "#fca5a5" },
  { href: "/snyatie-frp-kaluga",          icon: "Unlock",          label: "Снятие FRP и iCloud",     keywords: "снятие frp samsung xiaomi · разблокировка icloud",    accent: "#fdba74" },
];

/* ─────────────────────────────────────────────────────────────────────────
   Drag-слайдер До/После
   ───────────────────────────────────────────────────────────────────────── */
function Slider({ before, after, accent }: {
  before: { img: string; label: string };
  after:  { img: string; label: string };
  accent: string;
}) {
  const [pos, setPos] = useState(50);
  const [moved, setMoved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getPos = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (e: MouseEvent) => { setPos(getPos(e.clientX)); setMoved(true); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const onMove = (e: TouchEvent) => { setPos(getPos(e.touches[0].clientX)); setMoved(true); };
    const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  };

  return (
    <div ref={ref}
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{ aspectRatio: "4/3", cursor: "col-resize" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* ПОСЛЕ — полный фон */}
      <img src={after.img} alt={after.label}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />

      {/* ДО — clip слева */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: `${pos}%` }}>
        <img src={before.img} alt={before.label}
          className="absolute inset-0 h-full object-cover"
          style={{ width: `${10000 / pos}%`, maxWidth: "none" }}
          draggable={false} />
      </div>

      {/* Разделительная линия */}
      <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{ left: `${pos}%`, width: "2px", background: accent, boxShadow: `0 0 16px ${accent}cc, 0 0 4px ${accent}` }}>
        {/* Ручка */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto"
          style={{
            background: "linear-gradient(135deg,#1a1400,#0a0a0a)",
            border: `2.5px solid ${accent}`,
            boxShadow: `0 0 24px ${accent}99, 0 4px 16px rgba(0,0,0,0.7)`,
            cursor: "col-resize",
          }}>
          <div className="flex items-center gap-0.5">
            <Icon name="ChevronLeft"  size={11} style={{ color: accent }} />
            <Icon name="ChevronRight" size={11} style={{ color: accent }} />
          </div>
        </div>
      </div>

      {/* Лейблы ДО / ПОСЛЕ */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <span className="font-oswald font-bold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(239,68,68,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
          ДО
        </span>
      </div>
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <span className="font-oswald font-bold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-lg"
          style={{ background: `${accent}dd`, color: "#000", backdropFilter: "blur(4px)" }}>
          ПОСЛЕ
        </span>
      </div>

      {/* Подсказка */}
      {!moved && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full font-roboto text-[11px] uppercase tracking-widest"
            style={{
              background: "rgba(0,0,0,0.72)",
              border: `1px solid ${accent}50`,
              color: `${accent}ee`,
              backdropFilter: "blur(8px)",
              boxShadow: `0 0 20px ${accent}20`,
            }}>
            <Icon name="ArrowLeftRight" size={13} />
            Потяни для сравнения
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Карточка кейса
   ───────────────────────────────────────────────────────────────────────── */
function CaseCard({ c }: { c: typeof CASES[0] }) {
  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(145deg,rgba(14,11,6,0.97) 0%,rgba(8,8,12,0.99) 100%)",
        border: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "0 0 0 1px rgba(255,215,0,0.04),0 24px 48px rgba(0,0,0,0.55)",
      }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg,transparent,${c.accent}70,transparent)` }} />
      {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],
        ["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos, border]) => (
        <span key={pos} className={`absolute w-4 h-4 pointer-events-none ${pos} ${border}`}
          style={{ borderColor: `${c.accent}30` }} />
      ))}

      <div className="p-3 pb-0">
        <Slider before={c.before} after={c.after} accent={c.accent} />
      </div>

      <div className="px-3 py-2 grid grid-cols-2 gap-2">
        <div className="flex items-start gap-1.5">
          <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-400/60" />
          <span className="font-roboto text-[10px] text-white/45 leading-snug">{c.before.label}</span>
        </div>
        <div className="flex items-start gap-1.5 justify-end text-right">
          <span className="font-roboto text-[10px] text-white/45 leading-snug">{c.after.label}</span>
          <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
        </div>
      </div>

      <div className="p-3 pt-0 flex items-center gap-2 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}25`, color: c.accent }}>
          {c.tag}
        </span>
        <span className="font-oswald font-bold text-sm uppercase text-white/85 flex-1 truncate">{c.service}</span>
        <div className="text-right shrink-0">
          <div className="font-oswald font-bold text-sm" style={{ color: c.accent }}>{c.price}</div>
          <div className="font-roboto text-[9px] text-white/30 flex items-center gap-0.5 justify-end">
            <Icon name="Clock" size={8} />{c.time}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SEO-блок ссылок
   ───────────────────────────────────────────────────────────────────────── */
function RepairServiceLinks() {
  return (
    <div className="relative rounded-2xl overflow-hidden mt-5"
      style={{
        background: "linear-gradient(145deg,rgba(10,8,4,0.97) 0%,rgba(8,8,12,0.98) 100%)",
        border: "1px solid rgba(255,215,0,0.1)",
        boxShadow: "0 0 0 1px rgba(255,215,0,0.03),0 16px 40px rgba(0,0,0,0.45)",
      }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.4),transparent)" }} />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,215,0,0.4) 3px,rgba(255,215,0,0.4) 4px)", backgroundSize: "100% 4px" }} />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.4)" }}>
            <Icon name="Wrench" size={17} className="text-black" />
          </div>
          <div>
            <h3 className="font-oswald font-black text-xl sm:text-2xl uppercase text-white">
              Ремонт телефонов{" "}
              <span style={{ color: "#FFD700", textShadow: "0 0 16px rgba(255,215,0,0.45)" }}>в Калуге</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-px w-5" style={{ background: "rgba(255,215,0,0.35)" }} />
              <p className="font-roboto text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,215,0,0.45)" }}>
                при вас · 20 минут · от 300 ₽
              </p>
            </div>
          </div>
          <span className="ml-auto font-mono text-[9px] px-2 py-1 rounded hidden sm:block"
            style={{ color: "rgba(255,215,0,0.35)", background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.1)" }}>
            8 услуг
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SEO_LINKS.map((l, idx) => (
            <Link key={l.href} to={l.href}
              className="group relative overflow-hidden rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "ba-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
                animationDelay: `${idx * 50}ms`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = `${l.accent}0d`;
                el.style.borderColor = `${l.accent}35`;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = `0 8px 20px rgba(0,0,0,0.4),0 0 16px ${l.accent}18`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.02)";
                el.style.borderColor = "rgba(255,255,255,0.06)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}>
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `linear-gradient(90deg,transparent,${l.accent}70,transparent)` }} />
              <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `linear-gradient(180deg,transparent,${l.accent},transparent)` }} />

              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${l.accent}16`, border: `1px solid ${l.accent}28` }}>
                  <Icon name={l.icon} size={15} style={{ color: l.accent, filter: `drop-shadow(0 0 5px ${l.accent}70)` }} />
                </div>
                <Icon name="ChevronRight" size={12}
                  className="opacity-0 group-hover:opacity-70 transition-all group-hover:translate-x-0.5 shrink-0"
                  style={{ color: l.accent }} />
              </div>

              <div>
                <div className="font-oswald font-bold text-[13px] sm:text-sm uppercase leading-tight text-white/90 group-hover:text-white transition-colors">
                  {l.label}
                </div>
                <div className="font-roboto text-[10px] leading-snug mt-1"
                  style={{ color: `${l.accent}75` }}>
                  {l.keywords}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.08),transparent)" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Главный компонент
   ───────────────────────────────────────────────────────────────────────── */
export default function RepairBeforeAfter({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
      <style>{`
        @keyframes ba-fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Заголовок */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 font-roboto text-[10px] uppercase tracking-[0.2em]"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.75)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
          </span>
          Реальные работы наших мастеров
        </div>
        <h2 className="font-oswald font-bold text-3xl sm:text-4xl lg:text-5xl uppercase leading-tight mb-3">
          Примеры{" "}
          <span style={{ color: "#FFD700", textShadow: "0 0 40px rgba(255,215,0,0.3)" }}>
            наших работ
          </span>
        </h2>
        <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Потяните слайдер — увидите разницу до и после ремонта в нашем сервисе
        </p>
      </div>

      {/* Ряд 1 — 3 карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASES.slice(0, 3).map(c => <CaseCard key={c.id} c={c} />)}
      </div>

      {/* Ряд 2 — 2 карточки пошире */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {CASES.slice(3).map(c => <CaseCard key={c.id} c={c} />)}
      </div>

      {/* CTA */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-5"
        style={{
          background: "linear-gradient(145deg,rgba(14,11,6,0.97) 0%,rgba(8,8,12,0.99) 100%)",
          border: "1px solid rgba(255,215,0,0.18)",
          boxShadow: "0 0 40px rgba(255,215,0,0.06)",
        }}>
        <div>
          <div className="font-oswald text-lg font-bold uppercase text-white mb-0.5">
            Ваш телефон тоже можно починить
          </div>
          <div className="text-white/50 text-sm">
            Диагностика бесплатно · Гарантия до 12 месяцев
          </div>
        </div>
        <button onClick={onOrder}
          className="group relative overflow-hidden shrink-0 text-black font-oswald font-bold uppercase tracking-wide px-7 py-3.5 rounded-xl text-sm active:scale-95 transition-all inline-flex items-center gap-2
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <Icon name="Wrench" size={16} className="relative" />
          <span className="relative">Записаться на ремонт</span>
        </button>
      </div>

      {/* SEO-ссылки на подстраницы */}
      <RepairServiceLinks />
    </section>
  );
}
