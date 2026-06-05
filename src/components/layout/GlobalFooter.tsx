import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const NAV = [
  {
    title: "Скупка и оценка",
    links: [
      { to: "/", label: "Главная" },
      { to: "/ocenka", label: "Оценить онлайн" },
      { to: "/catalog", label: "Каталог техники" },
      { to: "/safe-deals", label: "Безопасные сделки" },
      { to: "/safe-deals/shop", label: "Витрина товаров" },
      { to: "/safe-deals/kupit-iphone-kaluga", label: "Купить iPhone" },
      { to: "/safe-deals/vykup-noutbukov", label: "Выкуп ноутбуков" },
    ],
  },
  {
    title: "Ремонт телефонов",
    links: [
      { to: "/repair", label: "Все услуги ремонта" },
      { to: "/remont-iphone-kaluga", label: "Ремонт iPhone" },
      { to: "/remont-samsung-kaluga", label: "Ремонт Samsung" },
      { to: "/remont-xiaomi-kaluga", label: "Ремонт Xiaomi" },
      { to: "/zamena-stekla-kaluga", label: "Замена стекла" },
      { to: "/zamena-akkumulyatora-kaluga", label: "Замена аккумулятора" },
      { to: "/remont-posle-vody-kaluga", label: "Ремонт после воды" },
      { to: "/bga-pajka-kaluga", label: "BGA-пайка" },
      { to: "/snyatie-frp-kaluga", label: "Снятие FRP" },
      { to: "/repair-discount", label: "Скидки на ремонт" },
      { to: "/repair-status", label: "Статус ремонта" },
    ],
  },
  {
    title: "Антиквариат",
    links: [
      { to: "/skupka-antikvariata", label: "Скупка антиквариата" },
      { to: "/ancient-coins", label: "Древние монеты" },
      { to: "/russian-coins", label: "Русские монеты" },
      { to: "/bronze-sculptures", label: "Бронзовые скульптуры" },
      { to: "/icons", label: "Иконы" },
      { to: "/porcelain", label: "Фарфор" },
      { to: "/soviet-antiques", label: "Советский антиквариат" },
    ],
  },
  {
    title: "Полезное",
    links: [
      { to: "/transfer", label: "Перенос данных" },
      { to: "/transfer/guide", label: "Гид по переносу" },
      { to: "/unlock", label: "Разблокировка" },
      { to: "/safe-deals/checklist", label: "Чек-лист при покупке" },
      { to: "/safe-deals/blacklist", label: "Чёрный список" },
      { to: "/blog", label: "Блог" },
      { to: "/blog/chto-delat-esli-telefon-upal-v-vodu", label: "Телефон упал в воду" },
      { to: "/blog/top-5-polomok-iphone", label: "Топ-5 поломок iPhone" },
      { to: "/blog/kak-vybrat-servisnyj-centr-v-kaluge", label: "Как выбрать сервис" },
    ],
  },
];

export default function GlobalFooter() {
  return (
    <footer className="bg-[#080808] border-t border-[#FFD700]/10 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">

        {/* Логотип и контакты */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/[0.07]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
              <Icon name="Zap" size={18} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-xl text-[#FFD700] uppercase tracking-wider leading-none">Скупка24</div>
              <div className="font-roboto text-[11px] text-white/40 mt-0.5">Калуга · с 9:00 до 21:00 ежедневно</div>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:+79929990333"
              className="inline-flex items-center gap-2 text-[#FFD700] font-oswald font-bold text-lg hover:text-[#ffed4a] transition-colors min-h-[44px]">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
            <a href="/chat"
              className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] text-sm font-roboto px-4 py-2.5 rounded-xl hover:bg-[#FFD700]/20 transition-colors min-h-[44px]">
              <Icon name="MessageSquare" size={15} />
              Написать в чат
            </a>
          </div>
        </div>

        {/* Сетка ссылок */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {NAV.map(section => (
            <div key={section.title}>
              <div className="font-oswald font-bold text-xs uppercase tracking-[0.2em] text-[#FFD700]/70 mb-3">
                {section.title}
              </div>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-roboto text-sm text-white/50 hover:text-white/90 transition-colors leading-snug block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Адреса */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {[
            { addr: "ул. Кирова, 7", note: "Скупка + Ремонт + Каталог" },
            { addr: "ул. Кирова, 11 (ТЦ Кировский)", note: "Скупка + Безопасные сделки" },
          ].map(o => (
            <div key={o.addr} className="flex items-start gap-3">
              <Icon name="MapPin" size={15} className="text-[#FFD700]/60 mt-0.5 shrink-0" />
              <div>
                <div className="font-roboto text-sm text-white/70">{o.addr}</div>
                <div className="font-roboto text-xs text-white/35">{o.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Копирайт */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs font-roboto border-t border-white/[0.05] pt-6">
          <span>© 2024–2026 Скупка24 · Калуга</span>
          <div className="flex items-center gap-4">
            <Link to="/requisites" className="hover:text-white/50 transition-colors">Реквизиты</Link>
            <Link to="/safe-deals/checklist" className="hover:text-white/50 transition-colors">Чек-лист</Link>
            <Link to="/chat" className="hover:text-white/50 transition-colors">Чат</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
