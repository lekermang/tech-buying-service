import Icon from "@/components/ui/icon";
import {
  ACCENT, PORCELAIN, AUTHENTICITY, PROCESS, WHY_US,
  CONDITION_GRADES, STORIES, FAQ_ITEMS,
} from "./data";

interface PorcelainContentProps {
  activeTab: number;
  setActiveTab: (i: number) => void;
  activeFaq: number | null;
  setActiveFaq: (i: number | null) => void;
}

const PorcelainContent = ({ activeTab, setActiveTab, activeFaq, setActiveFaq }: PorcelainContentProps) => {
  const activeCategory = PORCELAIN[activeTab];

  return (
    <>
      {/* ══ ТАБЛИЦА ЦЕН ══ */}
      <section id="porcelain" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
            <Icon name="Table" size={10} />
            Таблица цен
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Что мы покупаем</h2>
          <p className="font-roboto text-white/45 text-sm mt-1">Цены ориентировочные — итоговая стоимость зависит от завода, периода и сохранности</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {PORCELAIN.map((cat, i) => (
            <button
              key={cat.era}
              onClick={() => setActiveTab(i)}
              className="inline-flex items-center gap-2 px-4 py-2 font-roboto text-sm transition-all border"
              style={activeTab === i ? { borderColor: `${ACCENT}80`, background: `${ACCENT}18`, color: ACCENT } : { borderColor: "rgba(255,255,255,0.10)", background: "transparent", color: "rgba(255,255,255,0.50)" }}
            >
              <span>{cat.icon}</span>
              {cat.era}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#0D0D0D]">
                <th className="text-left font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3">Предмет</th>
                <th className="text-left font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3 hidden sm:table-cell">Период</th>
                <th className="text-right font-roboto text-[11px] uppercase tracking-widest text-white/30 px-5 py-3">Цена выкупа</th>
              </tr>
            </thead>
            <tbody>
              {activeCategory.items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="font-oswald font-bold text-sm text-white group-hover:text-[#60a5fa] transition-colors">{item.name}</div>
                    <div className="font-roboto text-white/40 text-xs mt-0.5 sm:hidden">{item.period}</div>
                    <div className="font-roboto text-white/35 text-xs mt-0.5 leading-snug max-w-xs">{item.note}</div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="font-roboto text-xs px-2 py-0.5 rounded-full border" style={{ color: activeCategory.color, borderColor: `${activeCategory.color}40`, background: `${activeCategory.color}15` }}>{item.period}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-oswald font-bold text-sm whitespace-nowrap" style={{ color: ACCENT }}>{item.price}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-roboto text-white/25 text-xs mt-3 text-right">* Итоговая цена определяется после осмотра предмета экспертом</p>
      </section>

      {/* ══ КАК ОПРЕДЕЛИТЬ ПОДЛИННОСТЬ ══ */}
      <section className="border-y border-white/5 py-14 md:py-20" style={{ background: "#0A0A0A" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Экспертиза
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как определить<br /><span style={{ color: ACCENT }}>подлинность</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div
                key={i}
                className="bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl transition-colors"
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = `${ACCENT}30`)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors" style={{ background: `${ACCENT}18` }}>
                  <Icon name={a.icon} size={18} style={{ color: ACCENT }} />
                </div>
                <div className="font-oswald font-bold text-base mb-1.5">{a.title}</div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК МЫ ПОКУПАЕМ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как мы <span style={{ color: ACCENT }}>покупаем</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p, i) => (
            <div key={i} className="relative bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl">
              {i < PROCESS.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 z-10">
                  <Icon name="ArrowRight" size={14} style={{ color: `${ACCENT}50` }} />
                </div>
              )}
              <div className="font-oswald font-black text-4xl leading-none mb-3" style={{ color: `${ACCENT}22` }}>{p.step}</div>
              <div className="font-oswald font-bold text-base mb-1.5">{p.title}</div>
              <div className="font-roboto text-white/50 text-sm leading-relaxed">{p.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {WHY_US.map((w, i) => (
            <div key={i} className="p-5 rounded-xl flex gap-3 border" style={{ background: `linear-gradient(135deg, ${ACCENT}12 0%, transparent 100%)`, borderColor: `${ACCENT}25` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ACCENT}20` }}>
                <Icon name={w.icon} size={18} style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="font-oswald font-bold text-sm mb-1">{w.title}</div>
                <div className="font-roboto text-white/50 text-xs leading-relaxed">{w.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ СОСТОЯНИЕ И ЦЕНА ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
            <Icon name="Star" size={10} />
            Оценка сохранности
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Состояние <span style={{ color: ACCENT }}>определяет цену</span></h2>
        </div>
        <div className="flex flex-col gap-3">
          {CONDITION_GRADES.map((g, i) => (
            <div key={i} className="flex items-center gap-4 bg-[#0D0D0D] border border-white/[0.06] px-5 py-4 rounded-xl">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-oswald font-black text-sm" style={{ background: `${g.color}20`, color: g.color, border: `2px solid ${g.color}40` }}>{g.grade}</div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-base mb-0.5" style={{ color: g.color }}>{g.label}</div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">{g.desc}</div>
              </div>
              <div className="font-oswald font-bold text-sm text-right shrink-0 ml-4 whitespace-nowrap" style={{ color: g.color }}>{g.modifier}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ РЕАЛЬНЫЕ ИСТОРИИ ══ */}
      <section className="py-14 md:py-20 border-t" style={{ borderColor: `${ACCENT}15`, background: "#0A0A0A" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
              <Icon name="Users" size={10} />
              Истории клиентов
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Реальные истории <span style={{ color: ACCENT }}>наших клиентов</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STORIES.map((s, i) => (
              <div key={i} className="bg-[#0D0D0D] border border-white/[0.06] p-6 rounded-xl flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-roboto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold" style={{ background: `${s.tagColor}20`, color: s.tagColor, border: `1px solid ${s.tagColor}40` }}>{s.tag}</span>
                  <span className="font-oswald font-bold text-sm text-white/70">{s.title}</span>
                </div>
                <p className="font-roboto text-white/60 text-sm leading-relaxed italic flex-1">«{s.quote}»</p>
                <div>
                  <div className="font-oswald font-black text-3xl" style={{ color: "#fbbf24" }}>{s.result}</div>
                  <div className="font-roboto text-white/35 text-xs mt-1 leading-relaxed">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ЧАСТЫЕ ВОПРОСЫ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border" style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}40`, color: ACCENT }}>
            <Icon name="HelpCircle" size={10} />
            FAQ
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Частые <span style={{ color: ACCENT }}>вопросы</span></h2>
        </div>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = activeFaq === i;
            return (
              <div key={i} className="bg-[#0D0D0D] border rounded-xl overflow-hidden transition-colors" style={{ borderColor: isOpen ? `${ACCENT}40` : "rgba(255,255,255,0.06)" }}>
                <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setActiveFaq(isOpen ? null : i)}>
                  <span className="font-oswald font-bold text-base leading-snug">{item.q}</span>
                  <span className="shrink-0 transition-transform duration-300" style={{ color: ACCENT, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <Icon name="ChevronDown" size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="font-roboto text-white/55 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default PorcelainContent;
