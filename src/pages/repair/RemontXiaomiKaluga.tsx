import RepairLanding from "@/components/repair/RepairLanding";

export default function RemontXiaomiKaluga() {
  return (
    <RepairLanding config={{
      title: "Ремонт Xiaomi в Калуге — Скупка24 | Redmi, POCO, Mi, Note",
      desc: "Ремонт Xiaomi, Redmi, POCO в Калуге. Замена экрана, аккумулятора, стекла. Снятие FRP, ремонт после воды. Бесплатная диагностика, гарантия 12 мес. Калуга, ул. Кирова, 7.",
      url: "https://skypka24.com/remont-xiaomi-kaluga",
      badge: "Ремонт Xiaomi в Калуге",
      h1line1: "Ремонт Xiaomi,",
      h1accent: "Redmi, POCO",
      h1line2: "в Калуге",
      heroText: "Ремонт всех устройств Xiaomi: Redmi Note, POCO X-серия, Mi 14, 13T Pro и любые другие модели. Замена экранов, аккумуляторов, стекла, разъёмов, снятие FRP. Бесплатная диагностика в центре Калуги.",
      advantages: [
        { icon: "MapPin", text: "Ул. Кирова, 7 — центр Калуги" },
        { icon: "Gift", text: "Бесплатная диагностика" },
        { icon: "Zap", text: "Ремонт при вас за 20–60 минут" },
        { icon: "Unlock", text: "Снятие FRP Xiaomi / Redmi" },
        { icon: "ShieldCheck", text: "Гарантия до 12 месяцев" },
        { icon: "Clock", text: "Ежедневно с 9:00 до 21:00" },
      ],
      services: [
        { name: "Замена экрана Xiaomi / Redmi", price: "890 ₽", time: "40–60 мин" },
        { name: "Замена стекла (переклейка)", price: "690 ₽", time: "60 мин" },
        { name: "Замена аккумулятора Xiaomi", price: "490 ₽", time: "30 мин" },
        { name: "Снятие FRP / Mi аккаунта", price: "990 ₽", time: "1–2 часа" },
        { name: "Ремонт после воды", price: "990 ₽", time: "1–2 дня" },
        { name: "Замена разъёма зарядки", price: "490 ₽", time: "30 мин" },
        { name: "Прошивка / восстановление MIUI", price: "890 ₽", time: "1–2 часа" },
        { name: "Компонентный ремонт платы", price: "по диагностике", time: "1–3 дня" },
      ],
      ctaTitle: "Записаться на ремонт Xiaomi",
      faq: [
        { q: "Снимаете ли FRP и Mi-аккаунт на Xiaomi?", a: "Да, делаем снятие FRP (Google-аккаунт) и обход Mi-аккаунта (Xiaomi account) на большинстве моделей Xiaomi, Redmi и POCO." },
        { q: "Чините ли Redmi Note и POCO?", a: "Да, работаем со всеми сериями: Redmi, Redmi Note, POCO X, POCO F, POCO M и Mi. Если в другом сервисе отказали — несите к нам." },
        { q: "Сколько стоит замена экрана Xiaomi?", a: "От 890 ₽ за работу. Итоговая сумма зависит от модели. Называем точную цену после бесплатной диагностики." },
      ],
      seoText: `<strong>Ремонт Xiaomi в Калуге</strong> — Скупка24 на ул. Кирова, 7. Чиним Redmi, POCO, Mi, Note всех поколений. <strong>Замена экрана Xiaomi в Калуге</strong>, аккумулятора, стекла, снятие FRP — быстро, с гарантией. Xiaomi, Redmi, POCO — товарные знаки Xiaomi Inc.`,
    }} />
  );
}
