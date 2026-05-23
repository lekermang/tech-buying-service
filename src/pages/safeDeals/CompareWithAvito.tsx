/** Блок сравнения «Безопасная сделка vs Авито» — для убеждения новых продавцов. */
import Icon from "@/components/ui/icon";

type Row = {
  feature: string;
  avito: { text: string; bad?: boolean };
  us: { text: string; good?: boolean };
};

const ROWS: Row[] = [
  {
    feature: "Доверие покупателя",
    avito: { text: "Зависит от рейтинга. Новички не получают сделок", bad: true },
    us: { text: "Гарант — Скупка24, 9 лет на рынке", good: true },
  },
  {
    feature: "Проверка товара",
    avito: { text: "На свой страх и риск", bad: true },
    us: { text: "Сотрудник проверяет, заводит фото-отчёт", good: true },
  },
  {
    feature: "Место сделки",
    avito: { text: "Парковки, метро, чужие квартиры", bad: true },
    us: { text: "Безопасный офис на Кирова, 11", good: true },
  },
  {
    feature: "Подлинность товара",
    avito: { text: "Никто не проверяет — могут продать подделку", bad: true },
    us: { text: "Каждый товар верифицируется ИИ + сотрудником", good: true },
  },
  {
    feature: "Защита от мошенников",
    avito: { text: "Чарджбэки, фейк-переводы, разводы", bad: true },
    us: { text: "QR-код сделки, паспортная верификация", good: true },
  },
  {
    feature: "Аккаунт и история",
    avito: { text: "Нужна старая регистрация, отзывы", bad: true },
    us: { text: "Не нужен — оформление за 2 минуты", good: true },
  },
  {
    feature: "Скорость продажи",
    avito: { text: "Звонки несколько дней, торг, отказы", bad: true },
    us: { text: "Готовая база покупателей + витрина", good: true },
  },
  {
    feature: "Платная публикация",
    avito: { text: "От 100 ₽ за неделю + Premium-размещения", bad: true },
    us: { text: "Бесплатно — комиссия 10% только после продажи", good: true },
  },
];

export default function CompareWithAvito() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-5 py-10 border-t border-[#1A1A1A]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[10px] font-bold tracking-wider uppercase text-[#FFD700] mb-2">
          <Icon name="GitCompare" size={11} /> Почему лучше
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold">
          Безопасная сделка <span className="text-[#FFD700]">vs Авито</span>
        </h2>
        <p className="text-sm text-[#777] mt-1.5">Сравните — у нас быстрее, безопаснее, выгоднее</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#141414]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 sm:px-4 py-3 border-b border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="text-[10px] uppercase tracking-wider text-[#666] font-bold">Параметр</div>
          <div className="text-center">
            <div className="text-xs text-[#FF6B6B] font-bold">Авито</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#FFD700] font-bold flex items-center justify-center gap-1">
              <Icon name="Shield" size={10} /> Скупка24
            </div>
          </div>
        </div>

        {ROWS.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 sm:px-4 py-3 border-b border-[#1F1F1F] last:border-b-0">
            <div className="text-xs sm:text-sm font-bold text-white pr-2">{r.feature}</div>
            <div className="flex items-start gap-1.5 text-xs text-[#999]">
              <Icon name="X" size={12} className="text-[#FF6B6B] shrink-0 mt-0.5" />
              <span>{r.avito.text}</span>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-[#ddd]">
              <Icon name="Check" size={12} className="text-[#3DDC84] shrink-0 mt-0.5" />
              <span>{r.us.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-emerald-500/[0.06] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-center">
        <Icon name="Sparkles" size={18} className="text-[#3DDC84] inline mr-1" />
        <span className="text-sm text-[#ddd]">
          <b>У вас нет аккаунта на Авито или плохие отзывы?</b> Не страшно — у нас вообще не нужна регистрация.
          Заходите через Яндекс ID, импортируйте объявление одной ссылкой, доверяйте сделку гаранту.
        </span>
      </div>
    </section>
  );
}
