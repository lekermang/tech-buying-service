import Icon from "@/components/ui/icon";

export default function RepairParts({ onOrder }: { onOrder: () => void }) {
  return (
    <section id="parts" className="px-4 sm:px-8 py-14 max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center mb-9 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4">
          <Icon name="Store" size={14} />
          Сервис + магазин запчастей
        </div>
        <h2 className="font-oswald text-2xl sm:text-4xl font-bold uppercase leading-tight">
          Замена стекла и <span className="text-[#FFD700]">продажа запчастей</span> для ремонта
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Услуга — переклейка */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
            <Icon name="Layers" size={24} className="text-[#FFD700]" />
          </div>
          <h3 className="font-oswald text-lg font-semibold uppercase mb-2">Переклейка стекла любой сложности</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-3">
            От бюджетных смартфонов до флагманов с изогнутыми (Curved) экранами. Используем вакуумный сепаратор,
            пресс и чистый УФ-клей OCA. Возвращаем битым экранам заводской вид — без замены всего дисплейного модуля.
          </p>
          <ul className="space-y-1.5">
            {["Сепаратор и пресс", "УФ-клей OCA, поляризатор", "Удаление царапин и полировка", "Ламинация без пузырей"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-white/70 text-[13px]">
                <Icon name="Check" size={14} className="text-[#FFD700] shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Товары — запчасти */}
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
            <Icon name="PackageOpen" size={24} className="text-[#FFD700]" />
          </div>
          <h3 className="font-oswald text-lg font-semibold uppercase mb-2">Запчасти для ремонта своими руками</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-3">
            Вы мастер или хотите отремонтировать телефон сами? В наличии и под заказ — качественные запчасти
            и расходники. Поможем с подбором: покажите телефон или назовите модель — подберём совместимую деталь.
          </p>
          <ul className="space-y-1.5">
            {["Дисплейные модули: оригинал, копия, восстановленные", "Шлейфы и аккумуляторы повышенной ёмкости", "Инструмент для пайки и ламинации", "Трафареты, паста, OCA-плёнка"].map((t) => (
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
          className="bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-8 py-3.5 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
        >
          <Icon name="MessageSquare" size={16} />
          Подобрать запчасть или заказать переклейку
        </button>
      </div>
    </section>
  );
}
