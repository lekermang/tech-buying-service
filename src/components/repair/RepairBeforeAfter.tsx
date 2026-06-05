import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const CASES = [
  {
    id: "screen",
    tag: "iPhone",
    service: "Замена экрана",
    time: "40 минут",
    price: "890 ₽",
    before: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/880ce7a4-54ef-4e06-97a0-8f34b017dfd2.jpg",
      label: "Разбитое стекло, нет сенсора",
    },
    after: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/6d407093-3c2e-4673-ad60-eaa80f34d8c4.jpg",
      label: "Новый дисплей, идеальный сенсор",
    },
    accent: "#FFD700",
  },
  {
    id: "water",
    tag: "Xiaomi",
    service: "Ремонт после воды",
    time: "1–2 дня",
    price: "990 ₽",
    before: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/e8420907-9119-4969-a22e-0fa45826a419.jpg",
      label: "Окисление платы, не включался",
    },
    after: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0c3ed702-2fc1-487a-be00-4fe0a1ad6564.jpg",
      label: "УЗ-промывка, восстановлен полностью",
    },
    accent: "#7dd3fc",
  },
  {
    id: "glass",
    tag: "Samsung",
    service: "Замена стекла",
    time: "60 минут",
    price: "690 ₽",
    before: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/b425933a-d3af-4615-9ddd-95a186819eb7.jpg",
      label: "Трещины по всему стеклу",
    },
    after: {
      img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/16158ca4-760a-44f7-b257-6e0bc8c0e863.jpg",
      label: "Переклейка стекла, заводской вид",
    },
    accent: "#86efac",
  },
];

/* ── Drag-слайдер ────────────────────────────────────────────────────────── */
function Slider({ before, after, accent }: {
  before: { img: string; label: string };
  after: { img: string; label: string };
  accent: string;
}) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getPos = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const onMove = (e: MouseEvent) => setPos(getPos(e.clientX));
    const onUp = () => { setDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const onMove = (e: TouchEvent) => setPos(getPos(e.touches[0].clientX));
    const onEnd = () => { setDragging(false); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  };

  return (
    <div ref={ref}
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{ aspectRatio: "4/3", cursor: dragging ? "grabbing" : "col-resize" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* AFTER (полный фон) */}
      <img src={after.img} alt={after.label}
        className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* BEFORE (clip слева) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before.img} alt={before.label}
          className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
          draggable={false} />
      </div>

      {/* Разделитель */}
      <div className="absolute top-0 bottom-0 w-px z-10" style={{ left: `${pos}%`, background: accent, boxShadow: `0 0 12px ${accent}` }}>
        {/* Кружок-ручка */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center z-20 select-none"
          style={{
            background: `linear-gradient(135deg, #1a1400, #0a0a0a)`,
            border: `2px solid ${accent}`,
            boxShadow: `0 0 20px ${accent}80, 0 4px 12px rgba(0,0,0,0.6)`,
          }}>
          <div className="flex items-center gap-0.5">
            <Icon name="ChevronLeft" size={10} style={{ color: accent }} />
            <Icon name="ChevronRight" size={10} style={{ color: accent }} />
          </div>
        </div>
      </div>

      {/* Лейблы */}
      <div className="absolute bottom-2.5 left-2.5 z-10">
        <span className="font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,100,100,0.9)", backdropFilter: "blur(4px)" }}>
          ДО
        </span>
      </div>
      <div className="absolute bottom-2.5 right-2.5 z-10">
        <span className="font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.75)", border: `1px solid ${accent}50`, color: accent, backdropFilter: "blur(4px)" }}>
          ПОСЛЕ
        </span>
      </div>

      {/* Подсказка при первом показе */}
      {pos === 50 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full font-roboto text-[10px] uppercase tracking-widest animate-pulse"
            style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${accent}40`, color: `${accent}cc`, backdropFilter: "blur(8px)" }}>
            <Icon name="ArrowLeftRight" size={11} />
            Потяни для сравнения
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Карточка кейса ──────────────────────────────────────────────────────── */
function CaseCard({ c }: { c: typeof CASES[0] }) {
  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(145deg, rgba(14,11,6,0.97) 0%, rgba(8,8,12,0.99) 100%)",
        border: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "0 0 0 1px rgba(255,215,0,0.04), 0 20px 40px rgba(0,0,0,0.5)",
      }}>

      {/* Верхняя неоновая полоска */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" aria-hidden
        style={{ background: `linear-gradient(90deg,transparent,${c.accent}80,transparent)` }} />

      {/* Corner brackets */}
      {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],
        ["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos, border]) => (
        <span key={pos} className={`absolute w-4 h-4 pointer-events-none ${pos} ${border}`}
          style={{ borderColor: `${c.accent}35` }} />
      ))}

      {/* Слайдер */}
      <div className="p-3">
        <Slider before={c.before} after={c.after} accent={c.accent} />
      </div>

      {/* Описания фото */}
      <div className="px-3 pb-1 grid grid-cols-2 gap-2 text-[10px] font-roboto">
        <div className="flex items-start gap-1.5">
          <span className="shrink-0 w-2 h-2 rounded-full bg-red-400/70 mt-0.5" />
          <span className="text-white/45 leading-snug">{c.before.label}</span>
        </div>
        <div className="flex items-start gap-1.5 justify-end text-right">
          <span className="text-white/45 leading-snug">{c.after.label}</span>
          <span className="shrink-0 w-2 h-2 rounded-full mt-0.5" style={{ background: c.accent }} />
        </div>
      </div>

      {/* Информация о работе */}
      <div className="p-3 pt-2 flex items-center gap-3 border-t mt-2"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>

        {/* Тег */}
        <span className="font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${c.accent}12`, border: `1px solid ${c.accent}25`, color: c.accent }}>
          {c.tag}
        </span>

        {/* Услуга */}
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold text-sm uppercase text-white/90 truncate">{c.service}</div>
        </div>

        {/* Время + цена */}
        <div className="text-right shrink-0">
          <div className="font-oswald font-bold text-sm" style={{ color: c.accent }}>{c.price}</div>
          <div className="font-roboto text-[10px] text-white/35 flex items-center gap-1 justify-end">
            <Icon name="Clock" size={9} />
            {c.time}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Главный компонент ───────────────────────────────────────────────────── */
export default function RepairBeforeAfter({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="px-4 sm:px-8 py-14 max-w-5xl mx-auto">
      {/* Заголовок */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 font-roboto text-[10px] uppercase tracking-[0.2em]"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.7)" }}>
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
          Потяните слайдер, чтобы сравнить состояние устройства до и после ремонта
        </p>
      </div>

      {/* Сетка кейсов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CASES.map(c => <CaseCard key={c.id} c={c} />)}
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-5 sm:p-6"
        style={{
          background: "linear-gradient(145deg, rgba(14,11,6,0.97) 0%, rgba(8,8,12,0.99) 100%)",
          border: "1px solid rgba(255,215,0,0.18)",
          boxShadow: "0 0 40px rgba(255,215,0,0.06)",
        }}>
        <div>
          <div className="font-oswald text-lg font-bold uppercase text-white mb-1">
            Ваш телефон тоже можно починить
          </div>
          <div className="text-white/50 text-sm">
            Диагностика бесплатно · Ремонт при вас · Гарантия до 12 месяцев
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
    </section>
  );
}
