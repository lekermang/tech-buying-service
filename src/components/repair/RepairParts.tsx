import Icon from "@/components/ui/icon";

export default function RepairParts({ onOrder }: { onOrder: () => void }) {
  return (
    <section id="parts" className="px-4 sm:px-8 py-14 max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center mb-9 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4">
          <Icon name="Store" size={14} />
          Переклейка и запчасти — Калуга
        </div>
        <h2 className="font-oswald text-2xl sm:text-4xl font-bold uppercase leading-tight">
          Замена стекла (переклейка) и{" "}
          <span className="text-[#FFD700]">продажа запчастей</span> для телефонов
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Услуга — переклейка */}
        <div className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
            <Icon name="Layers" size={24} className="text-[#FFD700]" />
          </div>
          <h3 className="font-oswald text-xl font-bold uppercase mb-3">
            Профессиональная переклейка стекла
          </h3>
          <p className="text-white/55 text-[13px] leading-relaxed mb-4">
            Разбили стекло, но дисплей работает, а сенсор реагирует? Делаем профессиональную замену
            стекла (переклейку) любой сложности — от бюджетных моделей до флагманов с изогнутыми
            Curved-экранами. Используем вакуумный сепаратор, пресс и чистый УФ-клей. Никаких пузырей,
            пятен и отклеек — возвращаем битому экрану заводской вид без замены дорогостоящего
            дисплейного модуля.
          </p>
          <ul className="space-y-2">
            {[
              "Вакуумный сепаратор и ламинатор",
              "УФ-клей OCA, поляризатор",
              "Curved и изогнутые экраны",
              "Удаление царапин, полировка",
              "Без пузырей — заводской вид",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-white/70 text-[13px]">
                <Icon name="Check" size={14} className="text-[#FFD700] shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Магазин запчастей */}
        <div className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
            <Icon name="PackageOpen" size={24} className="text-[#FFD700]" />
          </div>
          <h3 className="font-oswald text-xl font-bold uppercase mb-3">
            Продажа запчастей для мобильных телефонов
          </h3>
          <p className="text-white/55 text-[13px] leading-relaxed mb-4">
            Вы мастер или хотите отремонтировать телефон своими руками? У нас в наличии и под заказ —
            качественные запчасти: дисплейные модули (оригинал, качественная копия TFT/Incell,
            восстановленный Refurbished), шлейфы, аккумуляторы повышенной ёмкости, разъёмы зарядки
            и гарнитуры. Расходники для переклейки: OCA-плёнка, жидкий УФ-клей, поляризаторы.
            Не знаете, какая деталь нужна? Присылайте фото или приходите лично — подберём совместимую
            запчасть за 5 минут.
          </p>
          <ul className="space-y-2">
            {[
              "Дисплеи: оригинал, копия (TFT/Incell), Refurbished",
              "Шлейфы, аккумуляторы повышенной ёмкости",
              "Разъёмы зарядки и гарнитуры",
              "OCA-плёнка, жидкий УФ-клей, поляризаторы",
              "Консультация по совместимости — бесплатно",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-white/70 text-[13px]">
                <Icon name="Check" size={14} className="text-[#FFD700] shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 text-center">
        <button
          onClick={onOrder}
          className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-3.5 rounded-xl text-sm active:scale-95 transition-all inline-flex items-center gap-2
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_10px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
        >
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <Icon name="MessageSquare" size={16} className="relative" />
          <span className="relative">Подобрать запчасть или заказать переклейку</span>
        </button>
      </div>
    </section>
  );
}