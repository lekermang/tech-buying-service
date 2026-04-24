import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";
import PremiumSection from "@/components/skupka/PremiumSection";

const InfoReviewsAvito = () => {
  return (
    <>
      {/* REVIEWS — премиум в стиле Trade In */}
      <PremiumSection
        id="reviews"
        badge={{ icon: "Star", label: "Яндекс Карты · 4.9", color: "rose" }}
        eyebrow="Отзывы"
        title={<><span className="text-[#FFD700]">Любовь</span> клиентов<br />в цифрах.</>}
        accentA="rgba(255,215,0,0.08)"
        accentB="rgba(244,63,94,0.06)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { name: "Антон К.", rating: 5, text: "Отличный сервис! Сдал iPhone 13, оценили быстро и честно. Деньги получил сразу на карту. Рекомендую!", date: "2024" },
            { name: "Марина С.", rating: 5, text: "Приятно удивлена — предложили хорошую цену за ноутбук, без торга и занижений. Всё официально, договор на руках.", date: "2024" },
            { name: "Дмитрий В.", rating: 5, text: "Быстро, чётко, по делу. Сдал PlayStation 5, оценили за 10 минут. Цена выше, чем в других скупках города.", date: "2024" },
            { name: "Ольга Н.", rating: 5, text: "Уже второй раз обращаюсь. Всегда честная оценка, вежливый персонал. Золотое кольцо приняли по хорошей цене.", date: "2024" },
            { name: "Игорь Р.", rating: 5, text: "Работают 24/7 — это огромный плюс. Приехал поздно вечером, всё оформили быстро. Деньги наличными сразу.", date: "2024" },
            { name: "Светлана М.", rating: 5, text: "Сдала MacBook и умные часы. Оценили честно, никакого обмана. Работают профессионально, советую всем!", date: "2024" },
          ].map((r, i) => (
            <Reveal key={r.name} delay={(i % 4) as 0|1|2|3|4|5}>
              <div className="relative group h-full">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/10 to-rose-500/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative bg-[#0D0D0D] border border-[#FFD700]/15 hover:border-[#FFD700]/40 p-5 md:p-6 transition-colors h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <span key={idx} className="text-[#FFD700] text-sm">★</span>
                    ))}
                  </div>
                  <p className="font-roboto text-white/75 text-sm leading-relaxed mb-4 flex-1">«{r.text}»</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#FFD700]/10">
                    <span className="font-oswald font-bold text-white/60 text-sm uppercase">{r.name}</span>
                    <span className="font-roboto text-white/30 text-xs">{r.date}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="https://yandex.ru/profile/52473097879?lang=ru" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold px-6 md:px-8 py-3 md:py-4 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all">
            <Icon name="Star" size={16} />
            Читать все отзывы на Яндексе
            <Icon name="ArrowRight" size={16} />
          </a>
        </div>
      </PremiumSection>

      {/* AVITO */}
      <section id="avito" className="border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="mb-6 md:mb-8">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Маркетплейс</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">МЫ НА АВИТО</h2>
          </div>

          <a href="https://www.avito.ru/brands/skupka24kirova7" target="_blank" rel="noopener noreferrer"
            className="block group relative overflow-hidden border border-[#00AAFF]/30 hover:border-[#00AAFF] transition-colors">
            <div className="bg-gradient-to-r from-[#003D5C] to-[#001F2E] p-5 md:p-12 flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-5 md:gap-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00AAFF] flex items-center justify-center font-oswald font-bold text-white text-lg md:text-2xl shrink-0">AV</div>
                <div className="min-w-0">
                  <div className="font-oswald text-lg md:text-3xl font-bold text-white uppercase mb-1 leading-tight">Скупка24 на Авито</div>
                  <div className="font-roboto text-white/50 text-xs md:text-sm">Актуальные объявления · Отзывы · Безопасные сделки</div>
                  <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 flex-wrap">
                    {["✓ Быстрый ответ", "✓ Проверенный продавец", "✓ Безопасная сделка"].map((label) => (
                      <span key={label} className="font-roboto text-[#00AAFF] text-[10px] md:text-xs">{label}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-stretch md:items-center gap-2 md:gap-3 shrink-0">
                <div className="bg-[#00AAFF] text-white font-oswald font-bold text-sm md:text-lg px-5 md:px-8 py-3 md:py-4 uppercase tracking-wide group-hover:bg-[#0099EE] transition-colors flex items-center justify-center gap-2 md:gap-3">
                  <Icon name="ExternalLink" size={16} />
                  Смотреть объявления
                </div>
                <span className="font-roboto text-white/30 text-[10px] md:text-xs text-center">avito.ru/brands/skupka24kirova7</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-[#00AAFF] transition-all duration-500" />
          </a>
        </div>
      </section>
    </>
  );
};

export default InfoReviewsAvito;