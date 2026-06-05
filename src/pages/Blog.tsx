import { useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const POSTS = [
  {
    slug: "chto-delat-esli-telefon-upal-v-vodu",
    title: "Что делать, если телефон упал в воду: пошаговая инструкция",
    desc: "Телефон упал в воду — первые действия решают всё. Рассказываем, что категорически нельзя делать и как сохранить данные.",
    date: "2026-05-20",
    readTime: "3 мин",
    tag: "Советы",
    tagColor: "#3b82f6",
    keywords: "телефон упал в воду, что делать телефон вода, ремонт телефона после воды Калуга",
  },
  {
    slug: "top-5-polomok-iphone",
    title: "Топ-5 самых частых поломок iPhone и сколько стоит ремонт",
    desc: "Разбитый экран, вздувшаяся батарея, не работает кнопка — разбираем главные поломки iPhone и цены на ремонт в Калуге.",
    date: "2026-05-28",
    readTime: "4 мин",
    tag: "iPhone",
    tagColor: "#FFD700",
    keywords: "поломки iPhone, ремонт iPhone Калуга цена, замена экрана аккумулятора iPhone",
  },
  {
    slug: "kak-vybrat-servisnyj-centr-v-kaluge",
    title: "Как выбрать сервисный центр в Калуге: 7 критериев",
    desc: "На что смотреть при выборе мастерской по ремонту телефона. Гарантия, запчасти, отзывы — разбираем честно.",
    date: "2026-06-02",
    readTime: "5 мин",
    tag: "Гид",
    tagColor: "#22c55e",
    keywords: "выбрать сервисный центр Калуга, ремонт телефонов Калуга отзывы, хороший мастер телефон Калуга",
  },
];

function BlogSEO() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Блог о ремонте телефонов — Скупка24 Калуга";

    const setMeta = (sel: string, attr: "name" | "property", key: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
      return el;
    };
    const created: HTMLElement[] = [];
    const push = (el: HTMLElement | null) => { if (el) created.push(el); };
    push(setMeta(`meta[name="description"]`, "name", "description", "Полезные статьи о ремонте телефонов: что делать если телефон упал в воду, топ поломок iPhone, как выбрать сервисный центр в Калуге."));
    push(setMeta(`meta[name="keywords"]`, "name", "keywords", "ремонт телефонов Калуга блог, советы ремонт телефона, сервисный центр Калуга статьи"));
    push(setMeta(`meta[property="og:title"]`, "property", "og:title", "Блог о ремонте телефонов — Скупка24 Калуга"));
    push(setMeta(`meta[property="og:type"]`, "property", "og:type", "website"));
    push(setMeta(`meta[property="og:url"]`, "property", "og:url", "https://skypka24.com/blog"));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", "https://skypka24.com/blog");

    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Блог Скупка24",
      url: "https://skypka24.com/blog",
      description: "Полезные статьи о ремонте телефонов от сервисного центра Скупка24 в Калуге",
      publisher: {
        "@type": "LocalBusiness",
        name: "Скупка24",
        url: "https://skypka24.com",
        telephone: "+79929990333",
        address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
      },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = prev;
      created.forEach(el => el.remove());
      schema.remove();
    };
  }, []);
  return null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function Blog() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <BlogSEO />

      {/* Фоновая сетка */}
      <div aria-hidden className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,215,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-10 pb-20">

        {/* Навигация */}
        <div className="flex items-center gap-2 mb-10">
          <Link to="/" className="flex items-center gap-1.5 text-white/50 hover:text-[#FFD700] transition-colors text-sm">
            <Icon name="ChevronLeft" size={14} />
            Скупка24
          </Link>
          <Icon name="ChevronRight" size={12} className="text-white/20" />
          <span className="text-white/40 text-sm">Блог</span>
        </div>

        {/* Заголовок */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] text-[11px] font-roboto uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4">
            <Icon name="BookOpen" size={12} />
            Блог
          </div>
          <h1 className="font-oswald font-bold text-3xl sm:text-4xl uppercase text-white mb-2">
            Полезные статьи
          </h1>
          <p className="text-white/45 font-roboto text-sm">
            Советы по ремонту телефонов от мастеров сервисного центра Скупка24 в Калуге
          </p>
        </div>

        {/* Список статей */}
        <div className="flex flex-col gap-4">
          {POSTS.map(post => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#FFD700]/20 transition-all p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-roboto font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: post.tagColor + "20", color: post.tagColor, border: `1px solid ${post.tagColor}40` }}>
                      {post.tag}
                    </span>
                    <span className="text-white/25 text-xs font-roboto">{formatDate(post.date)}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/25 text-xs font-roboto">{post.readTime}</span>
                  </div>
                  <h2 className="font-oswald font-bold text-lg sm:text-xl text-white group-hover:text-[#FFD700] transition-colors leading-tight mb-2">
                    {post.title}
                  </h2>
                  <p className="font-roboto text-sm text-white/50 leading-relaxed">{post.desc}</p>
                </div>
                <Icon name="ArrowRight" size={18} className="text-white/20 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-6 text-center">
          <Icon name="Wrench" size={24} className="text-[#FFD700] mx-auto mb-3" />
          <div className="font-oswald font-bold text-xl uppercase text-white mb-1">Нужен ремонт?</div>
          <p className="text-white/50 text-sm mb-4">Бесплатная диагностика, ремонт при вас за 20–60 минут</p>
          <Link to="/repair"
            className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold uppercase tracking-wide px-6 py-3 rounded-xl text-sm hover:bg-[#ffed4a] transition-colors">
            <Icon name="ChevronRight" size={16} />
            Перейти к ремонту
          </Link>
        </div>
      </div>
    </div>
  );
}
