import Icon from "@/components/ui/icon";

const LAST_UPDATED = "08 августа 2023 в 00:15:13";

const BRANDS = [
  "СИБРТЕХ", "ELFE", "SPARTA", "MATRIX", "STELS", "GROSS",
  "БАРС", "DENZEL", "ШУРУПЬ", "PALISAD", "KRONWERK", "MTX",
  "STERN", "PALISAD Home", "Полная выгрузка каталога",
];

const CATEGORIES = [
  "Отделочный инструмент", "Прочий инструмент", "Слесарный инструмент",
  "Автомобильный инструмент", "Столярный инструмент", "Садовый инвентарь",
  "Измерительный инструмент", "Силовое оборудование", "Крепежный инструмент",
  "Режущий инструмент", "Аксессуары для бетоносмесителей", "Аксессуары для насосов",
  "Аксессуары для плиткорезов", "Долота-стамески наборы", "Стусла прецизионные",
  "Полотна для прецизионного стусла", "Пилы для стусла", "Лопаты снеговые с черенком",
  "Адаптеры пласмассовые", "Адаптеры латунные", "Муфты пластмассовые",
  "Муфты латунные", "Переходники пластмассовые", "Переходники латунные",
  "Разветвители пластмассовые", "Разветвители латунные", "Соединители пластмассовые",
  "Соединители латунные", "Соединители стальные", "Ведра оцинкованные",
  "Тазы оцинкованные", "Колышки", "Наборы", "Кашпо подвесные", "Кашпо пристенные",
  "Компрессоры ременные", "Компрессоры поршневые", "Пластины", "Ленты", "Подвесы",
  "Опоры бруса", "Проушины прямы", "Проушины угловые", "Анкеры регулируемые",
  "Крабы соединительные", "Мебельный крепеж", "Кронштейны угловые",
  "Кронштейны усиленные", "Кронштейны декоративные", "Ящики для инструмента",
  "Лотки", "Полки для инструмента", "Веревки", "Канаты", "Наборы шпагатов",
  "Фалы", "Шпагаты", "Припой", "Выжигатели по дереву", "Пасты", "Наборы для пайки",
  "Наборы пинцетов", "Раскладки", "Клинья", "СВП", "Шаблоны для копирования",
  "Замки магнитные", "Наборы для укладки плитки", "Пистолеты для пены",
  "Пистолеты для герметика", "Сменные сопла", "Инфракрасные обогреватели",
  "Конвекторы", "Масляные обогреватели", "Снегоуборочные машины бензиновые",
  "Снегоуборочные машины электрические", "Аппараты для сварки пластиковых труб",
  "Инверторные полуавтоматы MIG-MAG", "Инверторы TIG", "Бетоносмесители",
  "Растворонасосы", "Аксессуары для цепных пил", "Стартеры для бензопил",
  "Электроды", "Держатели электродов", "Фиксаторы магнитные", "Насадки",
  "Клеммы", "Венцы", "Шестерни", "Ремни", "Чехлы", "Шнеки", "Удлинители для шнеков",
  "Батареи аккумуляторные", "Гайковерты ударные аккумуляторные",
  "Дрели-шуруповерты аккумуляторные", "УШМ аккумуляторные", "МФИ аккумуляторные",
  "Отвертки аккумуляторные", "Зарядные устройства", "Полукомбинезоны", "Куртки",
  "Брюки", "Триммеры электрические", "Аксессуары для лазерных уровней",
  "Машинки для укладки плитки", "Насосы циркуляционные", "Опрыскиватели ручные",
  "Опрыскиватели бензиновые", "Опрыскиватели аккумуляторные",
  "Лобзики аккумуляторные", "Шлифовальные машины аккумуляторные",
  "Пилы сабельные аккумуляторные", "Пилы циркулярные аккумуляторные",
  "Насосы фонтанные", "Пылесосы строительные", "Перфораторы аккумуляторные",
  "Распылители на штанге", "Дождеватели", "Наборы", "Тележки", "Хоппер ковши",
  "Снегоуборочные машины аккумуляторные", "Горелки сварочные", "Сопла газовые",
  "Наконечники токосъемные", "Подающие ролики", "Цангодержатели",
];

const CATEGORY_NO_YML = new Set(["Машинки для укладки плитки", "Стартеры для бензопил"]);
const CATEGORY_NO_CSV = new Set(["Стартеры для бензопил"]);

interface FormatBadgeProps {
  label: string;
  color: string;
  href?: string;
}

const FormatBadge = ({ label, color, href }: FormatBadgeProps) => {
  if (!href) return null;
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-roboto font-bold uppercase tracking-wide border transition-colors hover:opacity-80 ${color}`}
    >
      <Icon name="Download" size={11} />
      {label}
    </a>
  );
};

interface RowProps {
  name: string;
  hasYml?: boolean;
  hasCsv?: boolean;
  hasExcel?: boolean;
}

const Row = ({ name, hasYml = true, hasCsv = true, hasExcel = true }: RowProps) => (
  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
    <td className="py-3 px-4 font-roboto text-white/90 text-sm">{name}</td>
    <td className="py-3 px-4">
      <div className="flex flex-wrap gap-1.5">
        {hasYml && (
          <FormatBadge
            label="YML"
            color="border-[#FFD700]/40 text-[#FFD700] hover:border-[#FFD700]"
            href="#"
          />
        )}
        {hasCsv && (
          <FormatBadge
            label="CSV"
            color="border-blue-400/40 text-blue-300 hover:border-blue-400"
            href="#"
          />
        )}
        {hasExcel && (
          <FormatBadge
            label="Excel"
            color="border-green-400/40 text-green-300 hover:border-green-400"
            href="#"
          />
        )}
      </div>
    </td>
  </tr>
);

const ApiCatalog = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="bg-[#0D0D0D]/95 border-b border-[#FFD700]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-white/50 hover:text-[#FFD700] transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <span className="font-oswald font-bold text-base uppercase tracking-wider text-[#FFD700]">
            Каталог: инструменты и расходные материалы
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Intro */}
        <div className="mb-10">
          <p className="font-roboto text-white/50 text-sm uppercase tracking-widest mb-2">API выгрузка</p>
          <h1 className="font-oswald text-3xl md:text-5xl font-bold mb-4">
            КАТАЛОГ: ИНСТРУМЕНТЫ<br className="hidden md:block" /> И РАСХОДНЫЕ МАТЕРИАЛЫ
          </h1>
          <p className="font-roboto text-white/50 text-sm">
            Скачивайте актуальные прайс-листы в удобном формате: YML для маркетплейсов, CSV и Excel для обработки.
          </p>
        </div>

        {/* Бренды */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-[#FFD700]" />
            <h2 className="font-oswald text-2xl font-bold uppercase">Выгрузки по брендам</h2>
          </div>

          <div className="border border-[#FFD700]/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                  <th className="text-left py-3 px-4 font-oswald font-bold text-sm uppercase tracking-wide text-[#FFD700]">Бренд</th>
                  <th className="text-left py-3 px-4 font-oswald font-bold text-sm uppercase tracking-wide text-[#FFD700]">Скачать выгрузку</th>
                </tr>
              </thead>
              <tbody>
                {BRANDS.map((brand) => (
                  <Row key={brand} name={brand} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Категории */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-[#FFD700]" />
              <h2 className="font-oswald text-2xl font-bold uppercase">Типовые профили по категориям</h2>
            </div>
            <div className="flex items-center gap-2 text-white/40 font-roboto text-xs border border-white/10 px-3 py-2">
              <Icon name="Clock" size={13} />
              Время обновления: {LAST_UPDATED}
            </div>
          </div>

          <div className="border border-[#FFD700]/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                  <th className="text-left py-3 px-4 font-oswald font-bold text-sm uppercase tracking-wide text-[#FFD700]">Наименование</th>
                  <th className="text-left py-3 px-4 font-oswald font-bold text-sm uppercase tracking-wide text-[#FFD700]">Скачать выгрузку</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => (
                  <Row
                    key={cat}
                    name={cat}
                    hasYml={!CATEGORY_NO_YML.has(cat)}
                    hasCsv={!CATEGORY_NO_CSV.has(cat)}
                    hasExcel
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ApiCatalog;
