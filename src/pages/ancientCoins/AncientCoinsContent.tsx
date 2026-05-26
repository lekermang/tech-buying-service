import Icon from "@/components/ui/icon";
import { COINS, AUTHENTICITY, PROCESS, WHY_US, ANCIENT_PRICES, ANCIENT_STORIES, ANCIENT_FAQ } from "./data";

interface AncientCoinsContentProps {
  activeEra: number;
  setActiveEra: (i: number) => void;
  activeFaq: number | null;
  setActiveFaq: (i: number | null) => void;
  onOpenForm: () => void;
}

const AncientCoinsContent = ({ activeEra, setActiveEra, activeFaq, setActiveFaq, onOpenForm }: AncientCoinsContentProps) => {
  return (
    <>
      {/* ══ ТАБЛИЦА ЦЕН ══ */}
      <section id="coins" className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="Table" size={10} />
            Таблица цен
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Что мы покупаем</h2>
          <p className="font-roboto text-white/45 text-sm mt-1">Цены ориентировочные — итоговая стоимость зависит от сохранности и редкости</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {COINS.map((c, i) => (
            <button key={i} onClick={() => setActiveEra(i)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-roboto text-sm transition-all ${
                activeEra === i
                  ? "bg-[#FFD700] text-black font-bold"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
              }`}>
              <span>{c.icon}</span>
              {c.era}
            </button>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden border border-[#FFD700]/15">
          <div className="bg-[#0D0D0D] border-b border-[#FFD700]/10 px-4 py-3 flex items-center gap-2">
            <span className="text-xl">{COINS[activeEra].icon}</span>
            <span className="font-oswald font-bold text-base uppercase" style={{ color: COINS[activeEra].color }}>
              {COINS[activeEra].era}
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {COINS[activeEra].items.map((item, i) => (
              <div key={i} className="bg-[#0A0A0A] hover:bg-[#0D0D0D] transition-colors px-4 py-4 grid md:grid-cols-[1fr_auto] gap-3">
                <div>
                  <div className="font-oswald font-bold text-base text-white">{item.name}</div>
                  <div className="font-roboto text-white/40 text-xs mt-0.5">{item.period}</div>
                  <div className="font-roboto text-white/55 text-sm mt-1">{item.note}</div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-center">
                  <div className="font-oswald font-black text-lg md:text-xl" style={{ color: COINS[activeEra].color }}>
                    {item.price}
                  </div>
                  <button onClick={onOpenForm} className="mt-1.5 text-[10px] font-roboto uppercase tracking-wide text-white/30 hover:text-[#FFD700] transition-colors flex items-center gap-1">
                    оценить <Icon name="ArrowRight" size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК ОПРЕДЕЛИТЬ ПОДЛИННОСТЬ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="ShieldCheck" size={10} />
              Экспертиза
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как определить<br /><span className="text-[#FFD700]">подлинность</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHENTICITY.map((a, i) => (
              <div key={i} className="bg-[#0D0D0D] border border-white/[0.06] hover:border-[#FFD700]/20 transition-colors p-5 rounded-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center mb-3 group-hover:bg-[#FFD700]/15 transition-colors">
                  <Icon name={a.icon} size={18} className="text-[#FFD700]" />
                </div>
                <div className="font-oswald font-bold text-base mb-1.5">{a.title}</div>
                <div className="font-roboto text-white/50 text-sm leading-relaxed">{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ КАК МЫ РАБОТАЕМ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="Zap" size={10} />
            Процесс скупки
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Как мы <span className="text-[#FFD700]">покупаем</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROCESS.map((p, i) => (
            <div key={i} className="relative bg-[#0D0D0D] border border-white/[0.06] p-5 rounded-xl">
              {i < PROCESS.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2 z-10">
                  <Icon name="ArrowRight" size={14} className="text-[#FFD700]/30" />
                </div>
              )}
              <div className="font-oswald font-black text-4xl text-[#FFD700]/15 leading-none mb-3">{p.step}</div>
              <div className="font-oswald font-bold text-base mb-1.5">{p.title}</div>
              <div className="font-roboto text-white/50 text-sm leading-relaxed">{p.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {WHY_US.map((w, i) => (
            <div key={i} className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 p-5 rounded-xl flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name={w.icon} size={18} className="text-[#FFD700]" />
              </div>
              <div>
                <div className="font-oswald font-bold text-sm mb-1">{w.title}</div>
                <div className="font-roboto text-white/50 text-xs leading-relaxed">{w.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ АКТУАЛЬНЫЕ ЦЕНЫ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="TrendingUp" size={10} />
              Актуальные цены
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Сколько стоят <span className="text-[#FFD700]">ваши монеты</span></h2>
            <p className="font-roboto text-white/45 text-sm mt-1">Ориентировочные цены выкупа — итоговая стоимость зависит от состояния и редкости</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ANCIENT_PRICES.map((group) => (
              <div key={group.era} className="bg-[#0D0D0D] border border-white/[0.07] rounded-xl overflow-hidden" style={{ borderTopColor: group.color, borderTopWidth: 2 }}>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <span className="font-oswald font-bold text-base" style={{ color: group.color }}>{group.era}</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="font-roboto text-sm text-white/75">{item.name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="font-oswald font-bold text-sm text-[#FFD700] whitespace-nowrap">{item.price}</span>
                        {item.hot && <span className="text-xs leading-none" title="Горячий спрос">🔥</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ РЕАЛЬНЫЕ ИСТОРИИ ══ */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Icon name="BookOpen" size={10} />
            Реальные истории
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Находки наших <span className="text-[#FFD700]">клиентов</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {ANCIENT_STORIES.map((story) => (
            <div key={story.title} className="bg-[#0D0D0D] border border-white/[0.07] hover:border-[#FFD700]/20 transition-colors p-5 rounded-xl flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-oswald font-bold text-base leading-snug">{story.title}</div>
                <span className="shrink-0 font-roboto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color: story.tagColor, borderColor: `${story.tagColor}40`, background: `${story.tagColor}12` }}>
                  {story.tag}
                </span>
              </div>
              <p className="font-roboto text-white/50 text-sm leading-relaxed italic flex-1">&laquo;{story.quote}&raquo;</p>
              <div className="border-t border-white/[0.07] pt-4">
                <div className="font-oswald font-black text-2xl mb-1" style={{ color: "#FFD700" }}>{story.result}</div>
                <div className="font-roboto text-white/40 text-xs leading-relaxed">{story.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ЧАСТЫЕ ВОПРОСЫ ══ */}
      <section className="bg-[#0A0A0A] border-y border-white/5 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-roboto uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="HelpCircle" size={10} />
              FAQ
            </div>
            <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">Частые <span className="text-[#FFD700]">вопросы</span></h2>
          </div>
          <div className="flex flex-col gap-2">
            {ANCIENT_FAQ.map((item, i) => {
              const isOpen = activeFaq === i;
              return (
                <div key={i} className="bg-[#0D0D0D] rounded-xl overflow-hidden transition-colors" style={{ border: isOpen ? "1px solid #FFD700" : "1px solid rgba(255,255,255,0.07)" }}>
                  <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group" onClick={() => setActiveFaq(isOpen ? null : i)}>
                    <span className={`font-oswald font-bold text-sm transition-colors ${isOpen ? "text-[#FFD700]" : "text-white group-hover:text-[#FFD700]"}`}>{item.q}</span>
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className={`shrink-0 transition-colors ${isOpen ? "text-[#FFD700]" : "text-white/30"}`} />
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
        </div>
      </section>
    </>
  );
};

export default AncientCoinsContent;
