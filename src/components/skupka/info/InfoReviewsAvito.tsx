import Icon from "@/components/ui/icon";

const InfoReviewsAvito = () => {
  return (
    <>
      {/* REVIEWS */}
      <section id="reviews" className="py-14 md:py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Яндекс Карты</p>
              <h2 className="font-oswald text-3xl md:text-5xl font-bold">ОТЗЫВЫ<br />КЛИЕНТОВ</h2>
            </div>
            <a href="https://yandex.ru/profile/52473097879?lang=ru" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold px-5 py-2 uppercase tracking-wide hover:border-[#FFD700] transition-colors text-sm mb-4">
              <Icon name="ExternalLink" size={14} />
              Все отзывы
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: "Антон К.", rating: 5, text: "Отличный сервис! Сдал iPhone 13, оценили быстро и честно. Деньги получил сразу на карту. Рекомендую!", date: "2024" },
              { name: "Марина С.", rating: 5, text: "Приятно удивлена — предложили хорошую цену за ноутбук, без торга и занижений. Всё официально, договор на руках.", date: "2024" },
              { name: "Дмитрий В.", rating: 5, text: "Быстро, чётко, по делу. Сдал PlayStation 5, оценили за 10 минут. Цена выше, чем в других скупках города.", date: "2024" },
              { name: "Ольга Н.", rating: 5, text: "Уже второй раз обращаюсь. Всегда честная оценка, вежливый персонал. Золотое кольцо приняли по хорошей цене.", date: "2024" },
              { name: "Игорь Р.", rating: 5, text: "Работают 24/7 — это огромный плюс. Приехал поздно вечером, всё оформили быстро. Деньги наличными сразу.", date: "2024" },
              { name: "Светлана М.", rating: 5, text: "Сдала MacBook и умные часы. Оценили честно, никакого обмана. Работают профессионально, советую всем!", date: "2024" },
            ].map((r) => (
              <div key={r.name} className="bg-[#0D0D0D] border border-[#FFD700]/10 p-6 hover:border-[#FFD700]/30 transition-colors">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <span key={i} className="text-[#FFD700] text-sm">★</span>
                  ))}
                </div>
                <p className="font-roboto text-white/70 text-sm leading-relaxed mb-4">«{r.text}»</p>
                <div className="flex items-center justify-between">
                  <span className="font-oswald font-bold text-white/50 text-sm uppercase">{r.name}</span>
                  <span className="font-roboto text-white/30 text-xs">{r.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href="https://yandex.ru/profile/52473097879?lang=ru" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold px-8 py-4 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
              <Icon name="Star" size={16} />
              Читать все отзывы на Яндексе
            </a>
          </div>
        </div>
      </section>

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
