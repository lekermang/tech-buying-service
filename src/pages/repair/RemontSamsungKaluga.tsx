import RepairLanding from "@/components/repair/RepairLanding";

export default function RemontSamsungKaluga() {
  return (
    <RepairLanding config={{
      title: "Ремонт Samsung в Калуге — Скупка24 | Galaxy, A-серия, Fold, Flip",
      desc: "Ремонт Samsung в Калуге: Galaxy S24, A35, Fold, Flip и другие модели. Замена экрана, аккумулятора, стекла. Снятие FRP Samsung. Бесплатная диагностика, гарантия. Калуга, ул. Кирова, 7.",
      url: "https://skypka24.com/remont-samsung-kaluga",
      badge: "Ремонт Samsung в Калуге",
      h1line1: "Ремонт",
      h1accent: "Samsung",
      h1line2: "в Калуге",
      heroText: "Чиним все модели Samsung: Galaxy S-серия, A-серия, M-серия, складные Galaxy Fold и Flip. Замена экранов AMOLED, аккумуляторов, стекла, ремонт после воды. Снятие FRP. Даже если в другом сервисе отказали — несите к нам.",
      advantages: [
        { icon: "MapPin", text: "Ул. Кирова, 7 — центр Калуги" },
        { icon: "Gift", text: "Бесплатная диагностика" },
        { icon: "Zap", text: "Ремонт при вас за 20–60 минут" },
        { icon: "Unlock", text: "Снятие FRP Samsung" },
        { icon: "ShieldCheck", text: "Гарантия до 12 месяцев" },
        { icon: "Cpu", text: "Компонентный ремонт плат" },
      ],
      services: [
        { name: "Замена экрана Samsung Galaxy", price: "890 ₽", time: "40–60 мин" },
        { name: "Замена стекла (переклейка)", price: "690 ₽", time: "60 мин" },
        { name: "Замена аккумулятора Samsung", price: "490 ₽", time: "30 мин" },
        { name: "Снятие FRP (Google-аккаунт)", price: "990 ₽", time: "1–2 часа" },
        { name: "Ремонт после воды", price: "990 ₽", time: "1–2 дня" },
        { name: "Замена разъёма зарядки", price: "490 ₽", time: "30 мин" },
        { name: "BGA-пайка и компонентный ремонт", price: "по диагностике", time: "1–3 дня" },
        { name: "Прошивка / восстановление Android", price: "890 ₽", time: "1–2 часа" },
      ],
      ctaTitle: "Записаться на ремонт Samsung",
      faq: [
        { q: "Чините ли складные Samsung Galaxy Fold и Flip?", a: "Да, берёмся за складные модели Samsung Galaxy Z Fold и Z Flip. Это сложный ремонт — оцениваем возможность и стоимость после диагностики." },
        { q: "Можно ли снять FRP на Samsung в Калуге?", a: "Да, предоставляем услугу снятия FRP (привязка к Google-аккаунту) на большинстве моделей Samsung. Работаем легально, с проверкой устройства." },
        { q: "Сколько стоит замена экрана Samsung?", a: "Замена экрана Samsung — от 890 ₽ за работу. Итоговая цена зависит от модели и типа дисплея (AMOLED, TFT). Скажем точно после диагностики." },
        { q: "Можно ли восстановить Samsung после воды?", a: "Да, если не пытаться заряжать устройство. Делаем полную разборку, промывку платы в УЗ-ванне, устраняем окисление под микроскопом." },
      ],
      seoText: `<strong>Ремонт Samsung в Калуге</strong> — сервисный центр Скупка24 на Кирова, 7. Чиним все модели Galaxy: флагманы S-серии, бюджетные A-серии, складные Fold и Flip. Выполняем <strong>замену экрана Samsung в Калуге</strong>, аккумулятора, стекла, кнопок, разъёма зарядки. Делаем <strong>снятие FRP Samsung</strong> и сложный компонентный ремонт на уровне платы. Samsung и Galaxy — товарные знаки Samsung Electronics Co., Ltd.`,
    }} />
  );
}
