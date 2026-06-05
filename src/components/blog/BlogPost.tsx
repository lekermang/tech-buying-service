import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Props {
  title: string;
  desc: string;
  keywords: string;
  url: string;
  date: string;
  readTime: string;
  tag: string;
  repairLink?: string;
  repairLinkText?: string;
  children: ReactNode;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function PostSEO({ title, desc, keywords, url, date }: Pick<Props, "title" | "desc" | "keywords" | "url" | "date">) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Скупка24`;

    const setMeta = (sel: string, attr: "name" | "property", key: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
      return el;
    };
    const created: HTMLElement[] = [];
    const push = (el: HTMLElement | null) => { if (el) created.push(el); };
    push(setMeta(`meta[name="description"]`, "name", "description", desc));
    push(setMeta(`meta[name="keywords"]`, "name", "keywords", keywords));
    push(setMeta(`meta[property="og:title"]`, "property", "og:title", `${title} — Скупка24`));
    push(setMeta(`meta[property="og:description"]`, "property", "og:description", desc));
    push(setMeta(`meta[property="og:url"]`, "property", "og:url", url));
    push(setMeta(`meta[property="og:type"]`, "property", "og:type", "article"));

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", url);

    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: desc,
      url,
      datePublished: date,
      dateModified: date,
      author: {
        "@type": "Organization",
        name: "Скупка24",
        url: "https://skypka24.com",
      },
      publisher: {
        "@type": "LocalBusiness",
        name: "Скупка24",
        url: "https://skypka24.com",
        telephone: "+79929990333",
        address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        logo: { "@type": "ImageObject", url: "https://skypka24.com/og-repair.jpg" },
      },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = prev;
      created.forEach(el => el.remove());
      schema.remove();
    };
  }, [title, desc, keywords, url, date]);
  return null;
}

export default function BlogPost({ title, desc, keywords, url, date, readTime, tag, repairLink, repairLinkText, children }: Props) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <PostSEO title={title} desc={desc} keywords={keywords} url={url} date={date} />

      <div aria-hidden className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,215,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      <article className="relative z-10 max-w-2xl mx-auto px-4 sm:px-8 py-10 pb-20">

        {/* Навигация */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          <Link to="/" className="flex items-center gap-1 text-white/40 hover:text-[#FFD700] transition-colors text-sm">
            <Icon name="ChevronLeft" size={13} />
            Скупка24
          </Link>
          <Icon name="ChevronRight" size={11} className="text-white/20" />
          <Link to="/blog" className="text-white/40 hover:text-[#FFD700] transition-colors text-sm">Блог</Link>
          <Icon name="ChevronRight" size={11} className="text-white/20" />
          <span className="text-white/25 text-sm truncate max-w-[200px]">{title.slice(0, 40)}…</span>
        </div>

        {/* Мета */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-roboto font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25">
            {tag}
          </span>
          <span className="text-white/30 text-xs font-roboto">{formatDate(date)}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/30 text-xs font-roboto flex items-center gap-1">
            <Icon name="Clock" size={11} className="opacity-60" />
            {readTime}
          </span>
        </div>

        {/* Заголовок */}
        <h1 className="font-oswald font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight mb-4 uppercase">
          {title}
        </h1>
        <p className="text-white/50 font-roboto text-base leading-relaxed mb-8 border-b border-white/[0.07] pb-8">
          {desc}
        </p>

        {/* Контент */}
        <div className="
          font-roboto text-white/75 leading-relaxed text-[15px]
          [&_h2]:font-oswald [&_h2]:font-bold [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:text-white [&_h2]:uppercase [&_h2]:mt-8 [&_h2]:mb-3
          [&_p]:mb-4
          [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-none [&_ul>li]:relative [&_ul>li]:pl-4 [&_ul>li]:mb-1.5
          [&_ul>li]:before:content-['—'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-[#FFD700]/60
          [&_strong]:text-white [&_strong]:font-semibold
        ">
          {children}
        </div>

        {/* CTA */}
        {repairLink && (
          <div className="mt-10 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name="Wrench" size={17} className="text-[#FFD700]" />
              </div>
              <div>
                <div className="font-oswald font-bold text-white uppercase">Нужна помощь?</div>
                <div className="text-white/40 text-xs font-roboto">Бесплатная диагностика, Калуга ул. Кирова 7</div>
              </div>
            </div>
            <Link to={repairLink}
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold uppercase tracking-wide px-5 py-2.5 rounded-xl text-sm hover:bg-[#ffed4a] transition-colors">
              <Icon name="ArrowRight" size={15} />
              {repairLinkText ?? "Записаться на ремонт"}
            </Link>
          </div>
        )}

        {/* Назад в блог */}
        <div className="mt-8 pt-8 border-t border-white/[0.07]">
          <Link to="/blog" className="inline-flex items-center gap-2 text-white/40 hover:text-[#FFD700] transition-colors text-sm font-roboto">
            <Icon name="ChevronLeft" size={14} />
            Все статьи блога
          </Link>
        </div>
      </article>
    </div>
  );
}
