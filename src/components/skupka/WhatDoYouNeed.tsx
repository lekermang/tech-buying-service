import { useState } from "react";
import Icon from "@/components/ui/icon";
import EvaluateModal from "@/components/skupka/hero/EvaluateModal";

/**
 * Блок «Что вам нужно?» — крупные плитки-намерения сразу после Hero.
 * Цель: за 2 секунды клиент понимает все направления и сразу идёт к действию.
 *
 * Действия:
 *  - sell-tech  → открыть форму оценки (продать технику)
 *  - sell-gold  → открыть продажу золота (событие open-sell-gold)
 *  - repair     → скролл к ремонту (событие open-repair)
 *  - used       → витрина Б/У (событие open-used-tech)
 *  - buy        → каталог /catalog
 *  - safe       → /safe-deals
 */

type Action =
  | { type: "evaluate" }
  | { type: "event"; name: string }
  | { type: "link"; href: string };

type Tile = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;       // основной цвет акцента
  glow: string;         // цвет свечения
  action: Action;
  featured?: boolean;   // крупная плитка
};

const TILES: Tile[] = [
  {
    id: "sell-tech",
    icon: "Banknote",
    title: "Продать технику",
    subtitle: "iPhone, MacBook, ноутбуки, консоли — оценка за 15 минут, деньги сразу",
    cta: "Узнать цену",
    accent: "#FFD700",
    glow: "rgba(255,215,0,0.18)",
    action: { type: "evaluate" },
    featured: true,
  },
  {
    id: "sell-gold",
    icon: "Gem",
    title: "Продать золото",
    subtitle: "Любая проба и вес. Оценим по актуальному курсу",
    cta: "Узнать цену",
    accent: "#facc15",
    glow: "rgba(250,204,21,0.16)",
    action: { type: "evaluate" },
  },
  {
    id: "repair",
    icon: "Wrench",
    title: "Ремонт телефона",
    subtitle: "При вас за 20 минут · от 300 ₽",
    cta: "Оставить заявку",
    accent: "#fb923c",
    glow: "rgba(251,146,60,0.16)",
    action: { type: "event", name: "open-repair" },
  },
  {
    id: "buy",
    icon: "Smartphone",
    title: "Купить технику",
    subtitle: "Новая и Б/У с гарантией. Каталог Apple и не только",
    cta: "В каталог",
    accent: "#60a5fa",
    glow: "rgba(96,165,250,0.16)",
    action: { type: "link", href: "/catalog" },
  },
  {
    id: "used",
    icon: "RefreshCw",
    title: "Б/У техника",
    subtitle: "Проверенная, в идеале, с гарантией 1 год",
    cta: "Открыть витрину",
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.16)",
    action: { type: "event", name: "open-used-tech" },
  },
  {
    id: "safe",
    icon: "ShieldCheck",
    title: "Безопасная сделка",
    subtitle: "Продайте технику через гаранта · защита от обмана",
    cta: "Подробнее",
    accent: "#34d399",
    glow: "rgba(52,211,153,0.16)",
    action: { type: "link", href: "/safe-deals" },
  },
];

export default function WhatDoYouNeed() {
  const [evalOpen, setEvalOpen] = useState(false);

  const handle = (action: Action) => {
    if (action.type === "evaluate") { setEvalOpen(true); return; }
    if (action.type === "link") { window.location.href = action.href; return; }
    if (action.type === "event") { window.dispatchEvent(new CustomEvent(action.name)); }
  };

  return (
    <section className="relative py-12 sm:py-16 px-4 overflow-hidden">
      {/* фоновое свечение */}
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,215,0,0.05)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)" }}>
            <Icon name="Compass" size={13} className="text-[#FFD700]" />
            <span className="font-roboto text-[11px] uppercase tracking-widest text-[#FFD700]">Быстрый выбор</span>
          </div>
          <h2 className="font-oswald font-bold uppercase tracking-wide text-3xl sm:text-4xl text-white">
            Что вам <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">нужно?</span>
          </h2>
          <p className="font-roboto text-sm sm:text-base text-white/50 mt-2 max-w-xl mx-auto">
            Выберите направление — и мы сразу поможем. Всё в одном месте.
          </p>
        </div>

        {/* Сетка плиток */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {TILES.map((t, i) => (
            <NeedTile key={t.id} tile={t} delay={i * 60} onClick={() => handle(t.action)} />
          ))}
        </div>
      </div>

      {evalOpen && <EvaluateModal onClose={() => setEvalOpen(false)} />}
    </section>
  );
}

function NeedTile({ tile, delay, onClick }: { tile: Tile; delay: number; onClick: () => void }) {
  const featured = tile.featured;
  return (
    <button
      onClick={onClick}
      className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98] ${featured ? "sm:col-span-2 lg:col-span-1" : ""}`}
      style={{
        background: "linear-gradient(150deg,rgba(22,18,11,0.96),rgba(12,10,7,0.99))",
        border: `1px solid ${tile.accent}30`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
        animation: `needTileIn 0.5s ease ${delay}ms both`,
        minHeight: featured ? "150px" : "130px",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${tile.accent}70`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 30px ${tile.glow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${tile.accent}30`;
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.4)`;
      }}
    >
      {/* угловое свечение */}
      <div aria-hidden className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100"
        style={{ background: tile.glow }} />

      <div className="relative p-4 sm:p-5 flex flex-col h-full">
        {/* иконка */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${tile.accent}18`, border: `1px solid ${tile.accent}40` }}>
          <Icon name={tile.icon} size={22} style={{ color: tile.accent }} />
        </div>

        {/* текст */}
        <div className="font-oswald font-bold text-lg text-white leading-tight">{tile.title}</div>
        <div className="font-roboto text-[12px] mt-1 leading-snug flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          {tile.subtitle}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1.5 mt-3 font-roboto text-sm font-semibold transition-all duration-300 group-hover:gap-2.5"
          style={{ color: tile.accent }}>
          {tile.cta}
          <Icon name="ArrowRight" size={15} />
        </div>
      </div>

      <style>{`@keyframes needTileIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </button>
  );
}