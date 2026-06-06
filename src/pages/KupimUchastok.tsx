/**
 * /kupim-uchastok — Срочный выкуп земельных участков.
 * SEO: PageSEO (title + meta + Schema.org), H1/H2/H3, alt-теги.
 * Дизайн в стиле Скупка24: тёмный, зелёный акцент (#2e7d32 / #4caf50).
 */
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../backend/func2url.json";

const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];
const PHONE_DISPLAY = "8 (992) 992-999-0333";
const PHONE_DISPLAY_SHORT = "+7 (992) 992-03-33";
const PHONE_TEL = "tel:+79929990333";
const A = "#4caf50";
const A2 = "#2e7d32";
const A_DARK = "#1b5e20";
const OG_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ec924fcc-4a46-41dc-969f-6cabdce36eab.jpg";

/* ── Фото галереи ── */
const PHOTOS = [
  { label: "Участок ИЖС", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ec924fcc-4a46-41dc-969f-6cabdce36eab.jpg", alt: "Выкуп участка ИЖС — срочно, дорого" },
  { label: "Дачный СНТ", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66b6341e-6eb1-4140-a1d2-79c6d55616e7.jpg", alt: "Выкуп дачного участка СНТ, ДНП" },
  { label: "Коммерческая земля", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ec924fcc-4a46-41dc-969f-6cabdce36eab.jpg", alt: "Выкуп коммерческой земли под бизнес" },
  { label: "Сельхозугодья", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66b6341e-6eb1-4140-a1d2-79c6d55616e7.jpg", alt: "Выкуп сельскохозяйственных угодий" },
  { label: "Участок у воды", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/ec924fcc-4a46-41dc-969f-6cabdce36eab.jpg", alt: "Выкуп участка у воды, реки, озера" },
  { label: "Лесной участок", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66b6341e-6eb1-4140-a1d2-79c6d55616e7.jpg", alt: "Выкуп лесного участка" },
];

/* ── Типы участков ── */
const LAND_TYPES = [
  { icon: "Home", label: "Земли ИЖС", desc: "Индивидуальное жилищное строительство" },
  { icon: "Trees", label: "СНТ и ДНП", desc: "Дача, садоводство, огородничество" },
  { icon: "Tractor", label: "Личное подсобное (ЛПХ)", desc: "Приусадебные и полевые участки" },
  { icon: "Building2", label: "Коммерческая земля", desc: "Под бизнес, торговлю, производство" },
  { icon: "Wheat", label: "Сельхозназначения", desc: "Пашня, луга, пастбища, сады" },
  { icon: "HardHat", label: "Земли под застройку", desc: "Промышленные и жилые зоны" },
  { icon: "MapPin", label: "Участки без подряда", desc: "Без обязательства строить" },
  { icon: "Shield", label: "С обременениями", desc: "Арест, залог, сервитут" },
  { icon: "Receipt", label: "С долгами по налогам", desc: "Поможем решить проблемы с ФНС" },
  { icon: "Zap", label: "Без коммуникаций", desc: "Без газа, воды, электричества" },
];

/* ── Преимущества ── */
const ADVANTAGES = [
  { icon: "Scale", title: "Бесплатная юридическая проверка", desc: "Проверим обременения, арест, залог — безвозмездно" },
  { icon: "Car", title: "Выезд специалиста за 2 часа", desc: "Приедем на участок сами, в любой район" },
  { icon: "Banknote", title: "Наличные, карта или счёт юрлица", desc: "Деньги в день подписания договора" },
  { icon: "FileCheck", title: "Поможем с документами", desc: "Соберём недостающие справки и выписки" },
  { icon: "Wrench", title: "Работаем со сложными объектами", desc: "Долги, аресты, неоформленные строения" },
  { icon: "BadgeCheck", title: "Гарантия чистоты сделки", desc: "Договор, нотариус, регистрация в Росреестре" },
];

/* ── Шаги ── */
const STEPS = [
  { n: "01", icon: "ClipboardList", title: "Заявка с кадастровым номером", desc: "Заполните форму — укажите кадастровый номер и телефон. Ответим за 10 минут." },
  { n: "02", icon: "Search", title: "Экспресс-проверка", desc: "Проверим участок по базам Росреестра. Назовём цену выкупа за 30 минут." },
  { n: "03", icon: "MapPin", title: "Выезд и осмотр", desc: "Специалист приедет на участок в течение 2 часов. Финальная оценка на месте." },
  { n: "04", icon: "Banknote", title: "Договор и деньги", desc: "Подписываем договор, регистрируем в Росреестре. Деньги сразу." },
];

/* ── Кейсы ── */
const CASES = [
  { cadastral: "50:09:***:0089", area: "12 сот.", price: "1 850 000 ₽", type: "ИЖС", img: OG_IMG },
  { cadastral: "71:30:***:0042", area: "6 сот.", price: "420 000 ₽", type: "СНТ", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66b6341e-6eb1-4140-a1d2-79c6d55616e7.jpg" },
  { cadastral: "40:26:***:0113", area: "30 сот.", price: "3 200 000 ₽", type: "Коммерческая", img: OG_IMG },
  { cadastral: "50:20:***:0077", area: "150 сот.", price: "890 000 ₽", type: "Сельхоз", img: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/66b6341e-6eb1-4140-a1d2-79c6d55616e7.jpg" },
];

/* ── Отзывы ── */
const REVIEWS = [
  { name: "Андрей В.", stars: 5, text: "Продал участок СНТ с долгами по налогам. Думал, никто не возьмёт — выкупили за 2 дня, деньги наличными. Всё честно.", date: "12 апреля 2025" },
  { name: "Светлана М.", stars: 5, text: "Унаследовала землю в другом регионе, была за рубежом. Ребята всё сделали дистанционно через нотариуса. Очень удобно!", date: "3 мая 2025" },
  { name: "ООО «СтройМаркет»", stars: 5, text: "Нужно было срочно реализовать коммерческую землю. Оценили по кадастровому номеру удалённо, выехали, оформили — три дня от звонка до денег.", date: "27 мая 2025" },
];

/* ── FAQ ── */
const FAQ = [
  { q: "Как быстро вы оцениваете участок по кадастровому номеру?", a: "После получения кадастрового номера наш специалист проверяет участок в базах Росреестра и называет предварительную цену за 10–30 минут. Окончательная стоимость — после выезда на место." },
  { q: "Выкупаете участки без коммуникаций?", a: "Да, выкупаем участки без газа, воды и электричества. Отсутствие коммуникаций влияет на цену, но не является препятствием для сделки." },
  { q: "Что делать, если у меня нет всех документов?", a: "Поможем собрать недостающие справки и выписки. Работаем с участками без межевания, без кадастрового паспорта, с неоформленными строениями." },
  { q: "Выкупаете ли участки с долгами по налогам?", a: "Да. Долги по налогам не являются препятствием. В рамках сделки помогаем урегулировать задолженность с ФНС." },
  { q: "Работаете ли с юридическими лицами?", a: "Да, работаем с ООО, ИП и физлицами. Оплата на расчётный счёт, безналичным переводом или наличными — по договорённости." },
  { q: "Какие документы нужны для сделки?", a: "Паспорт владельца, выписка из ЕГРН или свидетельство о праве собственности. Если чего-то нет — подскажем как получить и поможем." },
];

/* ── Schema.org ── */
const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Скупка24 — Срочный выкуп земельных участков",
    description: "Срочный выкуп земельных участков за 1 день. ИЖС, СНТ, коммерческая земля, сельхоз.",
    url: "https://skypka24.com/kupim-uchastok",
    telephone: "+79929990333",
    openingHours: "Mo-Su 09:00-22:00",
    image: OG_IMG,
    address: { "@type": "PostalAddress", addressLocality: "Калуга", streetAddress: "ул. Кирова, 7", addressCountry: "RU" },
    geo: { "@type": "GeoCoordinates", latitude: 54.5293, longitude: 36.2754 },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Срочный выкуп земельных участков за 1 день",
    provider: { "@type": "LocalBusiness", name: "Скупка24" },
    description: "Выкупаем любые земельные участки: ИЖС, СНТ, коммерческая земля, сельхоз, с обременениями, долгами по налогам. Оценка по кадастровому номеру за 30 минут.",
    areaServed: "Калуга и Калужская область",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Виды участков",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп ИЖС" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп СНТ" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп коммерческой земли" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Выкуп сельхозземель" } },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

/* ── Утилиты ── */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "+7";
  if (d.length <= 1) return "+7";
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
}

function formatCadastral(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  const parts: string[] = [];
  let pos = 0;
  const sizes = [2, 2, 6, 4];
  for (const size of sizes) {
    if (pos >= digits.length) break;
    parts.push(digits.slice(pos, pos + size));
    pos += size;
  }
  return parts.join(":");
}

/* ── Типы файлов ── */
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
}

/* ── Форма ── */
function LeadForm({ compact = false }: { compact?: boolean }) {
  const [cadastral, setCadastral] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [desc, setDesc] = useState("");
  const [agree, setAgree] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cadastralHint, setCadastralHint] = useState(false);

  const phoneOk = phone.replace(/\D/g, "").length === 11;
  const canSend = phoneOk && name.trim().length >= 2 && agree && !sending;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (!raw) { setPhone("+7"); return; }
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleCadastral = (v: string) => {
    setCadastral(formatCadastral(v));
    if (v.replace(/[^\d]/g, "").length >= 4) setCadastralHint(true);
  };

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const newFiles: UploadedFile[] = [];
    Array.from(incoming).forEach(f => {
      if (!allowed.includes(f.type)) return;
      if (f.size > 10 * 1024 * 1024) return;
      if (files.length + newFiles.length >= 10) return;
      const id = Math.random().toString(36).slice(2);
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      newFiles.push({ id, file: f, preview });
    });
    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          category: "Выкуп участков",
          desc: `Кадастровый номер: ${cadastral || "не указан"}. Файлов: ${files.length}. ${desc}`.trim(),
        }),
      });
      setDone(true);
    } catch {
      setErr("Ошибка сети — позвоните нам: " + PHONE_DISPLAY_SHORT);
    }
    setSending(false);
  };

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${A}20`, border: `2px solid ${A}60` }}>
        <Icon name="CheckCircle2" size={32} style={{ color: A }} />
      </div>
      <p className="font-oswald font-bold text-xl text-white">Заявка принята!</p>
      <p className="font-roboto text-white/60 text-sm max-w-xs">
        Мы проверим участок по кадастровому номеру и перезвоним за 30 минут
      </p>
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Кадастровый номер */}
      <div className="flex flex-col gap-1.5">
        <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Кадастровый номер *</label>
        <input
          type="text"
          value={cadastral}
          onChange={e => handleCadastral(e.target.value)}
          placeholder="50:09:0010203:45"
          className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${cadastral ? A + "60" : "rgba(255,255,255,0.12)"}`,
          }}
        />
        {cadastralHint && (
          <p className="font-roboto text-xs" style={{ color: A }}>
            Проверяем... ждите звонка специалиста
          </p>
        )}
        <p className="font-roboto text-[11px] text-white/30">Введите кадастровый номер — мы проверим участок за 10 минут и назовём цену</p>
      </div>

      {!compact && (
        <>
          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Ваше имя *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Иван"
              className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${name.trim().length >= 2 ? A + "60" : "rgba(255,255,255,0.12)"}`,
              }}
            />
          </div>

          {/* Телефон */}
          <div className="flex flex-col gap-1.5">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Телефон *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => handlePhone(e.target.value)}
              placeholder="+7 (999) 999-99-99"
              className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${phoneOk ? A + "60" : "rgba(255,255,255,0.12)"}`,
              }}
            />
          </div>

          {/* Загрузка файлов */}
          <div className="flex flex-col gap-2">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">
              Документы (JPG, PNG, PDF — до 10 МБ, макс. 10 файлов)
            </label>
            <div
              className={`relative rounded-xl p-4 text-center cursor-pointer transition-all ${dragOver ? "scale-[1.01]" : ""}`}
              style={{
                border: `2px dashed ${dragOver ? A : "rgba(255,255,255,0.15)"}`,
                background: dragOver ? `${A}08` : "rgba(255,255,255,0.03)",
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById("land-file-input")?.click()}
            >
              <input
                id="land-file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
              <Icon name="Upload" size={24} className="mx-auto mb-2" style={{ color: A + "80" }} />
              <p className="font-roboto text-sm text-white/50">
                {dragOver ? "Отпустите файлы" : "Перетащите файлы или нажмите для выбора"}
              </p>
              <p className="font-roboto text-xs text-white/30 mt-1">Выписки из ЕГРН, фото участка, документы на собственность</p>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {f.preview ? (
                      <img src={f.preview} alt={f.file.name} className="w-8 h-8 object-cover rounded" />
                    ) : (
                      <Icon name="FileText" size={20} style={{ color: A }} />
                    )}
                    <span className="font-roboto text-xs text-white/70 flex-1 truncate">{f.file.name}</span>
                    <span className="font-roboto text-[10px] text-white/30 shrink-0">
                      {(f.file.size / 1024 / 1024).toFixed(1)} МБ
                    </span>
                    <button type="button" onClick={() => removeFile(f.id)}
                      className="ml-1 text-white/30 hover:text-red-400 transition-colors shrink-0">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Доп. информация */}
          <div className="flex flex-col gap-1.5">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Дополнительно (необязательно)</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Есть строения, газ, подъездные пути, особенности..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none resize-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </div>
        </>
      )}

      {compact && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Имя *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Иван"
              className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${name.trim().length >= 2 ? A + "60" : "rgba(255,255,255,0.12)"}`,
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Телефон *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => handlePhone(e.target.value)}
              placeholder="+7 (999) 999-99-99"
              className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${phoneOk ? A + "60" : "rgba(255,255,255,0.12)"}`,
              }}
            />
          </div>
        </>
      )}

      {/* Согласие */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative shrink-0 mt-0.5">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="sr-only" />
          <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
            style={{
              background: agree ? A : "transparent",
              border: `2px solid ${agree ? A : "rgba(255,255,255,0.25)"}`,
            }}>
            {agree && <Icon name="Check" size={10} className="text-white" />}
          </div>
        </div>
        <span className="font-roboto text-[11px] text-white/40 leading-relaxed">
          Согласен(на) на обработку персональных данных в соответствии с ФЗ-152
        </span>
      </label>

      {err && (
        <p className="font-roboto text-xs text-red-400 flex items-center gap-1.5">
          <Icon name="AlertCircle" size={13} /> {err}
        </p>
      )}

      <button type="submit" disabled={!canSend}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-white transition-all active:scale-95 disabled:opacity-50"
        style={{
          background: canSend ? `linear-gradient(135deg,${A},${A2})` : "rgba(255,255,255,0.1)",
          boxShadow: canSend ? `0 4px 24px ${A}40` : "none",
        }}>
        <Icon name={sending ? "Loader2" : "ClipboardList"} size={18} className={sending ? "animate-spin" : ""} />
        {sending ? "Отправляем..." : "📋 Отправить заявку — получить оценку"}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ГЛАВНЫЙ КОМПОНЕНТ
══════════════════════════════════════════════════════════════════ */
export default function KupimUchastok() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      <PageSEO
        title="Срочный выкуп земельных участков за 1 день — дорого, любые участки | skypka24.com"
        description="Срочный выкуп земельных участков в день обращения. ИЖС, СНТ, коммерческая земля, сельхоз. Оценка за 30 минут. Деньги наличными или на карту. Работаем с юрлицами и физлицами. Звоните!"
        keywords="выкуп земельных участков, срочный выкуп участка, купим участок ИЖС, выкуп СНТ, скупка земли Калуга, выкуп коммерческой земли, продать участок срочно"
        url="https://skypka24.com/kupim-uchastok"
        ogImage={OG_IMG}
        schema={SCHEMA}
      />

      {/* ── Шапка-навигация ── */}
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-oswald font-black text-lg text-white uppercase tracking-wider">
            <Icon name="ArrowLeft" size={18} style={{ color: A }} />
            Скупка24
          </Link>
          <a href={PHONE_TEL} className="font-oswald font-bold text-sm uppercase tracking-wide px-4 py-2 rounded-lg transition-all active:scale-95"
            style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icon name="Phone" size={14} className="inline mr-1.5" />
            {PHONE_DISPLAY_SHORT}
          </a>
        </div>
      </header>

      {/* ══ БЛОК 1. HERO ══ */}
      <section className="relative px-4 py-16 overflow-hidden"
        style={{ background: `linear-gradient(135deg,#071a07 0%,#0a150a 40%,#0a0a0a 100%)`, borderBottom: `1px solid ${A}20` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 70% 40%,${A}10 0%,transparent 60%)` }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-roboto text-xs font-semibold uppercase tracking-wider"
            style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-full opacity-75" style={{ background: A }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: A }} />
            </span>
            Выезд за 2 часа · Деньги в день сделки
          </div>

          <h1 className="font-oswald font-black uppercase leading-tight mb-4" style={{ fontSize: "clamp(1.8rem,5vw,3rem)" }}>
            Срочный выкуп земельных участков{" "}
            <span style={{ color: A, textShadow: `0 0 30px ${A}50` }}>за 1 день</span>
          </h1>
          <p className="font-roboto text-white/60 text-lg mb-6 max-w-2xl leading-relaxed">
            Продайте земельный участок срочно и дорого без долгих поисков покупателя
          </p>

          <div className="mb-8">
            <a href={PHONE_TEL} className="font-oswald font-black text-white hover:text-green-400 transition-colors"
              style={{ fontSize: "clamp(1.4rem,4vw,2rem)" }}>
              <Icon name="Phone" size={22} className="inline mr-2" style={{ color: A }} />
              {PHONE_DISPLAY}
            </a>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={PHONE_TEL}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}40` }}>
              <Icon name="Phone" size={16} />
              Позвонить сейчас
            </a>
            <a href="#form"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${A}40` }}>
              <Icon name="ClipboardList" size={16} />
              Оставить заявку
            </a>
          </div>

          {/* Бейдж */}
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-roboto text-xs text-white/50"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="BadgeCheck" size={13} style={{ color: A }} />
            Бесплатная проверка документов
          </div>
        </div>

        {/* Изображение справа (десктоп) */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[40%] pointer-events-none" style={{ maskImage: "linear-gradient(to left, rgba(0,0,0,0.8) 60%, transparent 100%)" }}>
          <img src={OG_IMG} alt="Срочный выкуп земельных участков" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* ══ БЛОК 2. ГАЛЕРЕЯ ══ */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-2" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Срочный выкуп земли{" "}
            <span style={{ color: A }}>в Москве и области</span>
          </h2>
          <p className="font-roboto text-white/40 text-sm mb-6">Скупка земли ИЖС, СНТ, коммерческой и сельскохозяйственных угодий</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ border: `1px solid ${A}20`, minHeight: 240 }}>
              <img
                src={PHOTOS[activePhoto].img}
                alt={PHOTOS[activePhoto].alt}
                className="w-full h-full object-cover"
                style={{ minHeight: 240, maxHeight: 360 }}
              />
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                <span className="font-oswald font-bold text-white text-sm uppercase">{PHOTOS[activePhoto].label}</span>
              </div>
            </div>
            <div className="flex md:flex-col gap-2 flex-wrap md:flex-nowrap md:w-36">
              {PHOTOS.map((p, i) => (
                <button key={i} onClick={() => setActivePhoto(i)}
                  className="rounded-xl overflow-hidden transition-all active:scale-95 shrink-0"
                  style={{
                    border: `2px solid ${i === activePhoto ? A : "transparent"}`,
                    opacity: i === activePhoto ? 1 : 0.5,
                    width: 80, height: 56,
                  }}>
                  <img src={p.img} alt={p.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ БЛОК 3. ФОРМА ══ */}
      <section id="form" className="px-4 py-12" style={{ background: `linear-gradient(135deg,#071a07,#0a0a0a)` }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#0d1a0d,#111)",
              border: `1px solid ${A}30`,
              boxShadow: `0 0 60px ${A}12`,
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${A}80,transparent)` }} />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-roboto text-xs font-semibold uppercase tracking-wider"
              style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
              <Icon name="Zap" size={12} />
              Оценка за 30 минут
            </div>

            <h2 className="font-oswald font-black uppercase text-white text-2xl mb-1">
              Оценить участок по кадастровому номеру
            </h2>
            <p className="font-roboto text-white/40 text-sm mb-6">
              Введите кадастровый номер — мы проверим участок за 10 минут и назовём цену
            </p>

            <LeadForm />
          </div>
        </div>
      </section>

      {/* ══ БЛОК 4. КАКИЕ УЧАСТКИ ══ */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-2 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Выкупаем любые участки
          </h2>
          <p className="font-roboto text-white/40 text-sm text-center mb-8">
            Продать участок СНТ быстро или выкуп коммерческой земли за день — работаем со всеми категориями
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {LAND_TYPES.map((t, i) => (
              <div key={i} className="rounded-xl p-3 text-center transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={22} className="mx-auto mb-2" style={{ color: A }} />
                <p className="font-roboto font-semibold text-white text-xs mb-1 leading-tight">{t.label}</p>
                <p className="font-roboto text-white/35 text-[10px] leading-tight">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 5. ПРЕИМУЩЕСТВА ══ */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="rounded-xl p-5 flex gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${A}18` }}>
                  <Icon name={a.icon as Parameters<typeof Icon>[0]["name"]} size={20} style={{ color: A }} />
                </div>
                <div>
                  <p className="font-roboto font-semibold text-white text-sm mb-1">{a.title}</p>
                  <p className="font-roboto text-white/40 text-xs leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 6. КАК МЫ РАБОТАЕМ ══ */}
      <section className="px-4 py-12" style={{ background: `linear-gradient(135deg,#071407,#0a0a0a)` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-2 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Как мы работаем
          </h2>
          <p className="font-roboto text-white/40 text-sm text-center mb-10">
            Оценка участка по кадастровому номеру — от заявки до денег
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px"
              style={{ background: `linear-gradient(90deg,${A}40,${A}80,${A}40)` }} />
            {STEPS.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 relative z-10"
                  style={{ background: `linear-gradient(135deg,${A2},${A})`, boxShadow: `0 0 20px ${A}40` }}>
                  <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={22} className="text-white" />
                </div>
                <span className="font-roboto text-[10px] text-white/25 uppercase tracking-widest mb-1">Шаг {s.n}</span>
                <p className="font-oswald font-bold text-white text-sm uppercase mb-2">{s.title}</p>
                <p className="font-roboto text-white/40 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 7. КЕЙСЫ ══ */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-2 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Примеры выкупленных участков
          </h2>
          <p className="font-roboto text-white/40 text-sm text-center mb-8">Выкуп сельхозземель, ИЖС и коммерческих участков — реальные сделки</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CASES.map((c, i) => (
              <div key={i} className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${A}18`, background: "rgba(255,255,255,0.03)" }}>
                <div className="relative h-32 overflow-hidden">
                  <img src={c.img} alt={`Выкупленный участок ${c.type} — ${c.area}`} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <span className="font-roboto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: A2, color: "#fff" }}>{c.type}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-roboto text-white/30 text-[10px] mb-1">Кадастровый: {c.cadastral}</p>
                  <p className="font-roboto text-white/60 text-xs mb-1">Площадь: <span className="text-white">{c.area}</span></p>
                  <p className="font-oswald font-bold text-lg" style={{ color: A }}>{c.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 8. ОТЗЫВЫ ══ */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Отзывы клиентов
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-oswald font-bold text-sm text-white"
                    style={{ background: `linear-gradient(135deg,${A2},${A})` }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-roboto font-semibold text-white text-sm">{r.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: r.stars }).map((_, j) => (
                        <Icon key={j} name="Star" size={11} style={{ color: "#FFD700" }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="font-roboto text-white/60 text-sm leading-relaxed mb-2">"{r.text}"</p>
                <p className="font-roboto text-white/25 text-[10px]">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 9. FAQ ══ */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-2 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Выкуп земельных участков — вопросы и ответы
          </h2>
          <p className="font-roboto text-white/40 text-sm text-center mb-8">
            Выкуп коммерческой земли за день, скупка земли ИЖС дорого — отвечаем на частые вопросы
          </p>
          <div className="flex flex-col gap-2">
            {FAQ.map((f, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${openFaq === i ? A + "40" : "rgba(255,255,255,0.08)"}` }}>
                <button
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-all"
                  style={{ background: openFaq === i ? `${A}08` : "rgba(255,255,255,0.02)" }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-roboto font-semibold text-sm text-white leading-snug">{f.q}</span>
                  <Icon name={openFaq === i ? "ChevronUp" : "ChevronDown"} size={16} style={{ color: A, flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-0" style={{ background: `${A}05` }}>
                    <p className="font-roboto text-white/55 text-sm leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 10. КОНТАКТЫ ══ */}
      <section className="px-4 py-12" style={{ background: `linear-gradient(135deg,#071a07,#0a0a0a)`, borderTop: `1px solid ${A}20` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Карта и контакты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}20` }}>
              <div className="flex items-start gap-3 mb-4">
                <Icon name="MapPin" size={20} style={{ color: A }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-roboto font-semibold text-white text-sm">Адрес офиса</p>
                  <p className="font-roboto text-white/50 text-sm">г. Калуга, ул. Кирова, 7</p>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <Icon name="Phone" size={20} style={{ color: A }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-roboto font-semibold text-white text-sm">Телефон</p>
                  <a href={PHONE_TEL} className="font-oswald font-black text-xl hover:text-green-400 transition-colors" style={{ color: A }}>
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <Icon name="Clock" size={20} style={{ color: A }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-roboto font-semibold text-white text-sm">График работы</p>
                  <p className="font-roboto text-white/50 text-sm">Пн–Вс: 09:00–22:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="Mail" size={20} style={{ color: A }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-roboto font-semibold text-white text-sm">Email</p>
                  <a href="mailto:info@skypka24.com" className="font-roboto text-white/50 text-sm hover:text-white transition-colors">info@skypka24.com</a>
                </div>
              </div>
            </div>

            {/* Форма CTA */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}20` }}>
              <p className="font-oswald font-bold text-white text-lg uppercase mb-1">Быстрая оценка участка</p>
              <p className="font-roboto text-white/40 text-sm mb-4">Укажите кадастровый номер и телефон — позвоним за 30 минут</p>
              <LeadForm compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── Подвал ── */}
      <footer className="px-4 py-6 text-center" style={{ background: "#070707", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href={PHONE_TEL} className="font-oswald font-black text-2xl hover:text-green-400 transition-colors" style={{ color: A }}>
          {PHONE_DISPLAY}
        </a>
        <p className="font-roboto text-white/30 text-xs mt-2">© 2025 Скупка24 · Срочный выкуп земельных участков · г. Калуга</p>
        <Link to="/" className="font-roboto text-white/20 text-xs mt-1 hover:text-white/50 transition-colors inline-block">
          ← На главную
        </Link>
      </footer>

      {/* Плавающая кнопка "Позвонить" (мобильные) */}
      <a href={PHONE_TEL}
        className="md:hidden fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full font-oswald font-bold text-sm uppercase text-white shadow-lg transition-all active:scale-95"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}50` }}>
        <Icon name="Phone" size={16} className="animate-pulse" />
        Позвонить
      </a>
    </div>
  );
}
