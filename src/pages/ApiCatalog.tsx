import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const INSTRUMENT_API_URL = "https://functions.poehali.dev/894b4895-a528-4a4d-8bef-423c19423565";
const PAGE_SIZE = 100;

interface Product {
  id: string;
  ARTICLE: string;
  BASE_PRICE: string;
  DISCOUNT_PRICE: number;
  RETAIL_PRICE: string;
  AMOUNT: string;
}

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
  "Распылители на штанге", "Дождеватели", "Тележки", "Хоппер ковши",
  "Снегоуборочные машины аккумуляторные", "Горелки сварочные", "Сопла газовые",
  "Наконечники токосъемные", "Подающие ролики", "Цангодержатели",
];

const CATEGORY_NO_YML = new Set(["Машинки для укладки плитки", "Стартеры для бензопил"]);
const CATEGORY_NO_CSV = new Set(["Стартеры для бензопил"]);

const FormatBadge = ({ label, color }: { label: string; color: string }) => (
  <a
    href="#"
    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-roboto font-bold uppercase tracking-wide border transition-colors hover:opacity-80 ${color}`}
  >
    <Icon name="Download" size={11} />
    {label}
  </a>
);

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
        {hasYml && <FormatBadge label="YML" color="border-[#FFD700]/40 text-[#FFD700] hover:border-[#FFD700]" />}
        {hasCsv && <FormatBadge label="CSV" color="border-blue-400/40 text-blue-300 hover:border-blue-400" />}
        {hasExcel && <FormatBadge label="Excel" color="border-green-400/40 text-green-300 hover:border-green-400" />}
      </div>
    </td>
  </tr>
);

const useProducts = (token: string, offset: number) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${INSTRUMENT_API_URL}?method=get.products.list&limit=${PAGE_SIZE}&offset=${offset}`,
        { headers: { "X-Admin-Token": token } }
      );
      const raw = await res.json();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (data.error) { setError(data.error); return; }
      const list: Product[] = Object.entries(data).map(([id, v]) => ({ id, ...(v as Omit<Product, "id">) }));
      setProducts(list);
      if (total === null) setTotal(list.length === PAGE_SIZE ? PAGE_SIZE * 10 : list.length);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [token, offset]);

  useEffect(() => { load(); }, [load]);
  return { products, loading, error, reload: load };
};

interface ApiCatalogContentProps { token?: string; }

export const ApiCatalogContent = ({ token = "" }: ApiCatalogContentProps) => {
  const [tab, setTab] = useState<"products" | "brands" | "categories">("products");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const { products, loading, error } = useProducts(token, offset);

  const filtered = search
    ? products.filter(p => p.ARTICLE.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="font-roboto text-white/50 text-xs uppercase tracking-widest mb-0.5">instrument.ru</p>
          <h2 className="font-oswald text-2xl font-bold uppercase">Каталог: инструменты и расходные материалы</h2>
        </div>
        <div className="flex gap-1">
          {([["products", "Товары", "Package"], ["brands", "Бренды", "Tag"], ["categories", "Категории", "List"]] as const).map(([key, label, icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 font-oswald font-bold uppercase text-xs px-3 py-1.5 transition-colors ${tab === key ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white border border-white/10"}`}>
              <Icon name={icon} size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "products" && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по артикулу..."
              className="flex-1 bg-[#111] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
            />
            <button onClick={() => { setOffset(0); setSearch(""); }}
              className="border border-white/10 text-white/40 hover:text-white px-3 py-2 transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-white/40 font-roboto text-sm py-8 justify-center">
              <Icon name="Loader" size={16} className="animate-spin" />
              Загружаю товары...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 font-roboto text-sm py-4">
              <Icon name="AlertCircle" size={15} />
              {error === "Unauthorized" ? "Введи токен в поле входа в админку" : error}
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="border border-[#FFD700]/20 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                      {["Артикул", "Базовая цена", "Цена со скидкой", "Наличие"].map(h => (
                        <th key={h} className="text-left py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-roboto text-sm text-white/90">{p.ARTICLE}</td>
                        <td className="py-2.5 px-4 font-roboto text-sm text-white/60">{Number(p.BASE_PRICE).toLocaleString("ru-RU")} ₽</td>
                        <td className="py-2.5 px-4 font-roboto text-sm font-bold text-[#FFD700]">{Number(p.DISCOUNT_PRICE).toLocaleString("ru-RU")} ₽</td>
                        <td className="py-2.5 px-4">
                          <span className={`font-roboto text-xs px-2 py-0.5 border ${p.AMOUNT === "В наличии" ? "border-green-500/40 text-green-400" : "border-white/10 text-white/40"}`}>
                            {p.AMOUNT}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-roboto text-white/30 text-xs">{filtered.length} товаров на странице</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    className="font-roboto text-xs border border-white/10 text-white/50 hover:text-white disabled:opacity-30 px-3 py-1.5 transition-colors flex items-center gap-1">
                    <Icon name="ChevronLeft" size={13} /> Назад
                  </button>
                  <span className="font-roboto text-xs text-white/30 px-2 py-1.5">стр. {offset / PAGE_SIZE + 1}</span>
                  <button disabled={filtered.length < PAGE_SIZE} onClick={() => setOffset(offset + PAGE_SIZE)}
                    className="font-roboto text-xs border border-white/10 text-white/50 hover:text-white disabled:opacity-30 px-3 py-1.5 transition-colors flex items-center gap-1">
                    Вперёд <Icon name="ChevronRight" size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "brands" && (
        <section>
          <div className="border border-[#FFD700]/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                  <th className="text-left py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Бренд</th>
                </tr>
              </thead>
              <tbody>
                {BRANDS.map((brand) => (
                  <tr key={brand} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-roboto text-sm text-white/90">{brand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "categories" && (
        <section>
          <div className="flex items-center justify-end mb-3">
            <div className="flex items-center gap-2 text-white/30 font-roboto text-xs border border-white/10 px-3 py-1.5">
              <Icon name="Clock" size={12} />
              Обновлено: {LAST_UPDATED}
            </div>
          </div>
          <div className="border border-[#FFD700]/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                  <th className="text-left py-2.5 px-4 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">Категория</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => (
                  <tr key={cat} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-roboto text-sm text-white/90">{cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const ApiCatalog = () => (
  <div className="min-h-screen bg-[#0D0D0D] text-white">
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
    <div className="max-w-7xl mx-auto">
      <ApiCatalogContent />
    </div>
  </div>
);

export default ApiCatalog;