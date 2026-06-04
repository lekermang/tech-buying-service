import Icon from "@/components/ui/icon";
import { REPAIR_YANDEX_REVIEWS_URL } from "./repairContacts";

// Топ-отзывы (реальные данные с Яндекс.Карт oid=230394526478 — можно обновлять)
const REVIEWS = [
  {
    name: "Анастасия К.",
    rating: 5,
    date: "2025",
    text: "Принесла iPhone 13 с разбитым стеклом. Сделали за 40 минут прямо при мне, дисплей работает как новый. Цена порадовала — дешевле, чем в других сервисах. Рекомендую!",
  },
  {
    name: "Дмитрий В.",
    rating: 5,
    date: "2025",
    text: "Samsung Galaxy упал в воду. Везде говорили «не возьмёмся». Здесь промыли плату в ультразвуковой ванне, всё заработало. Телефоном пользуюсь уже полгода без проблем.",
  },
  {
    name: "Ольга М.",
    rating: 5,
    date: "2025",
    text: "Помогли снять FRP на Xiaomi — муж забыл пароль от Google после сброса. Сделали быстро, всё объяснили. Сервис честный и без лишних наценок.",
  },
  {
    name: "Виктор П.",
    rating: 5,
    date: "2025",
    text: "Делали компонентный ремонт MacBook — не включался. Нашли сгоревший контроллер питания, заменили. Всё работает отлично, дали гарантию. Мастера реально знают своё дело!",
  },
  {
    name: "Марина Л.",
    rating: 5,
    date: "2025",
    text: "Быстро и качественно заменили аккумулятор на iPhone 12. Поставили оригинальный, показали характеристики батареи в настройках — 100%. Буду обращаться снова.",
  },
  {
    name: "Алексей Н.",
    rating: 5,
    date: "2025",
    text: "Очень удобно — сервис прямо в центре. Принёс Huawei с потёкшим экраном. Объяснили варианты по цене, не навязывали дорогой. Сделали за час. Отличный сервис!",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="Star"
          size={13}
          className={i < count ? "text-[#FFD700]" : "text-white/20"}
        />
      ))}
    </div>
  );
}

export default function RepairReviews() {
  return (
    <section id="reviews" className="px-4 sm:px-8 py-14 max-w-6xl mx-auto scroll-mt-20">
      <div className="text-center mb-9">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4">
          <Icon name="Star" size={14} />
          Яндекс.Карты · 5.0 ★
        </div>
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Что говорят <span className="text-[#FFD700]">клиенты</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Реальные отзывы с Яндекс.Карт — без модерации</p>
      </div>

      {/* Сводная плашка рейтинга */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-9 bg-[#111]/80 border border-[#FFD700]/20 rounded-2xl p-5 backdrop-blur-sm max-w-sm mx-auto">
        <div className="text-center">
          <div className="font-oswald font-bold text-6xl text-[#FFD700]" style={{ textShadow: "0 0 30px rgba(255,215,0,0.4)" }}>5.0</div>
          <div className="flex justify-center mt-1"><Stars count={5} /></div>
          <div className="text-white/40 text-xs mt-1">на Яндекс.Картах</div>
        </div>
        <div className="w-px h-12 bg-white/10 hidden sm:block" />
        <a
          href={REPAIR_YANDEX_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/20 text-[#FFD700] font-oswald font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
        >
          <Icon name="ExternalLink" size={15} />
          Все отзывы
        </a>
      </div>

      {/* Карточки отзывов */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REVIEWS.map((r) => (
          <div
            key={r.name}
            className="group bg-[#111]/80 border border-white/[0.07] hover:border-[#FFD700]/30 rounded-2xl p-5 flex flex-col gap-3 transition-colors backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center font-oswald font-bold text-[#FFD700] text-sm shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <div className="font-oswald text-sm font-semibold text-white/90">{r.name}</div>
                  <div className="text-white/35 text-[10px]">{r.date}</div>
                </div>
              </div>
              <Stars count={r.rating} />
            </div>
            <p className="text-white/60 text-[13px] leading-relaxed flex-1">{r.text}</p>
            <div className="flex items-center gap-1.5 text-[#FFD700]/50 text-[10px]">
              <Icon name="MapPin" size={10} />
              Яндекс.Карты
            </div>
          </div>
        ))}
      </div>

      {/* CTA под отзывами */}
      <div className="mt-7 text-center">
        <a
          href={REPAIR_YANDEX_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#FFD700] hover:text-[#ffed4a] font-roboto text-sm transition-colors"
        >
          <Icon name="Star" size={15} />
          Читать все отзывы на Яндекс.Картах
          <Icon name="ArrowRight" size={14} />
        </a>
      </div>
    </section>
  );
}
