/**
 * SeoPageLayout — переиспользуемый layout для всех SEO-посадочных страниц скупки и ремонта.
 * Содержит: Header, Hero, Price Table, Advantages, Steps, LeadForm, Reviews, FAQ, Related, Footer, FloatBtn
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../../backend/func2url.json";

const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];
export const PHONE_DISPLAY = "+7 (992) 999-03-33";
export const PHONE_TEL = "tel:+79929990333";
const TODAY = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/* ── Типы ── */
export type PriceRow   = { model: string; price: string; time?: string };
export type FaqItem    = { q: string; a: string };
export type ReviewItem = { name: string; date: string; text: string; rating?: number };
export type StepItem   = { n: string; icon: string; title: string; desc: string };
export type AdvItem    = { icon: string; title: string; desc: string };
export type RelatedItem = { href: string; title: string; desc: string; icon: string };

export interface SeoPageConfig {
  /* SEO */
  title: string;
  description: string;
  keywords: string;
  url: string;
  ogImage?: string;
  schema: object | object[];
  /* Контент */
  badge: string;
  h1: string;
  heroText: string;
  heroSubText?: string;
  accentColor?: string;    // hex, default #FF6B1A
  accentColor2?: string;   // hex, default #E63946
  /* Таблица цен / услуг */
  priceTableTitle: string;
  priceTableNote?: string;
  priceRows: PriceRow[];
  isRepairTable?: boolean; // Если true — показывает колонку «Время»
  /* Блоки */
  advantages: AdvItem[];
  steps?: StepItem[];
  /* Форма */
  formCategory: string;   // "Скупка iPhone", "Ремонт Samsung" и т.д.
  formDataTrack: string;  // data-track аттрибут
  formExtra?: string;     // Дополнительное поле (VIN, доп. описание)
  /* Доп. блок */
  extraBlocks?: React.ReactNode;
  /* Отзывы */
  reviews: ReviewItem[];
  /* FAQ */
  faq: FaqItem[];
  /* Связанные страницы */
  related: RelatedItem[];
  /* Хлебные крошки */
  breadcrumbLabel: string;
}

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

/* ── Форма заявки ── */
function LeadForm({ category, dataTrack, A }: { category: string; dataTrack: string; A: string }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [agree,   setAgree]   = useState(true);
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const phoneOk = phone.replace(/\D/g, "").length === 11;
  const canSend = name.trim().length >= 2 && phoneOk && agree && !sending;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (!raw) { setPhone("+7"); return; }
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.replace(/\D/g, ""), category, desc: `Заявка со страницы` }),
      });
      setDone(true);
    } catch { setErr("Ошибка сети — позвоните нам: " + PHONE_DISPLAY); }
    setSending(false);
  };

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${A}20`, border: `2px solid ${A}60` }}>
        <Icon name="CheckCircle2" size={32} style={{ color: A }} />
      </div>
      <p className="font-oswald font-bold text-xl text-white">Заявка принята!</p>
      <p className="font-roboto text-white/60 text-sm max-w-xs">Перезвоним за 5 минут</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Ваше имя *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Иван"
            className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${name.trim().length >= 2 ? A + "60" : "rgba(255,255,255,0.12)"}` }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-roboto text-xs text-white/50 uppercase tracking-wider">Телефон *</label>
          <input type="tel" value={phone} onChange={e => handlePhone(e.target.value)} placeholder="+7 (999) 999-99-99"
            className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${phoneOk ? A + "60" : "rgba(255,255,255,0.12)"}` }} />
        </div>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative shrink-0 mt-0.5">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="sr-only" />
          <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
            style={{ background: agree ? A : "transparent", border: `2px solid ${agree ? A : "rgba(255,255,255,0.25)"}` }}>
            {agree && <Icon name="Check" size={10} className="text-white" />}
          </div>
        </div>
        <span className="font-roboto text-[11px] text-white/40 leading-relaxed">
          Согласен на обработку персональных данных в соответствии с ФЗ-152
        </span>
      </label>
      {err && <p className="font-roboto text-xs text-red-400 flex items-center gap-1.5"><Icon name="AlertCircle" size={13} />{err}</p>}
      <button type="submit" disabled={!canSend} data-track={dataTrack}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: canSend ? `linear-gradient(135deg,${A},#c0392b)` : "rgba(255,255,255,0.1)", boxShadow: canSend ? `0 4px 24px ${A}40` : "none" }}>
        <Icon name={sending ? "Loader2" : "Zap"} size={18} className={sending ? "animate-spin" : ""} />
        {sending ? "Отправляем..." : "Оценить онлайн — бесплатно"}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════
   ГЛАВНЫЙ КОМПОНЕНТ
══════════════════════════════════════════════════════ */
export default function SeoPageLayout({ config }: { config: SeoPageConfig }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const A  = config.accentColor  || "#FF6B1A";
  const A2 = config.accentColor2 || "#E63946";

  /* Schema.org хлебные крошки */
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://skypka24.com" },
      { "@type": "ListItem", "position": 2, "name": config.breadcrumbLabel, "item": config.url },
    ],
  };

  const allSchema = Array.isArray(config.schema)
    ? [...config.schema, breadcrumbSchema]
    : [config.schema, breadcrumbSchema];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      <PageSEO
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        url={config.url}
        ogImage={config.ogImage || "https://skypka24.com/og-main.jpg"}
        schema={allSchema}
      />

      {/* ── Шапка ── */}
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: "rgba(10,10,10,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-oswald font-black text-lg text-white uppercase tracking-wider">
            <span style={{ color: A }}>С</span>купка24
          </Link>
          <a href={PHONE_TEL} className="font-oswald font-bold text-sm uppercase tracking-wide px-4 py-2 rounded-lg transition-all active:scale-95"
            style={{ background: `${A}20`, border: `1px solid ${A}40`, color: A }}>
            <Icon name="Phone" size={14} className="inline mr-1.5" />{PHONE_DISPLAY}
          </a>
        </div>
      </header>

      {/* ── Хлебные крошки ── */}
      <div className="max-w-5xl mx-auto px-4 pt-3 pb-0">
        <nav className="flex items-center gap-1.5 text-[11px] font-roboto text-white/30">
          <Link to="/" className="hover:text-white/60 transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={10} />
          <span style={{ color: A }}>{config.breadcrumbLabel}</span>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section className="relative px-4 py-12 overflow-hidden"
        style={{ background: `linear-gradient(135deg,#1a0800 0%,#120606 40%,#0a0a0a 100%)`, borderBottom: `1px solid ${A}20` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 70% 40%,${A}10 0%,transparent 60%)` }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 font-roboto text-xs font-semibold uppercase tracking-wider"
            style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute animate-ping inline-flex h-full w-full rounded-full opacity-75" style={{ background: A }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: A }} />
            </span>
            {config.badge}
          </div>
          <h1 className="font-oswald font-black uppercase leading-tight mb-4" style={{ fontSize: "clamp(1.8rem,5vw,3rem)" }}>
            {config.h1}
          </h1>
          <p className="font-roboto text-white/65 text-lg mb-4 max-w-2xl leading-relaxed">{config.heroText}</p>
          {config.heroSubText && <p className="font-roboto text-white/40 text-sm mb-6 max-w-xl leading-relaxed">{config.heroSubText}</p>}
          <div className="flex flex-wrap gap-3">
            <a href={PHONE_TEL}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}40` }}>
              <Icon name="Phone" size={16} /> Позвонить сейчас
            </a>
            <a href="#form"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${A}40` }}>
              <Icon name="ClipboardList" size={16} /> Оставить заявку
            </a>
          </div>
        </div>
      </section>

      {/* ── Таблица цен ── */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            {config.priceTableTitle}
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${A}20` }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: `${A}15` }}>
                  <th className="font-oswald font-bold text-left px-4 py-3 text-sm uppercase tracking-wide" style={{ color: A }}>
                    {config.isRepairTable ? "Услуга" : "Модель"}
                  </th>
                  <th className="font-oswald font-bold text-right px-4 py-3 text-sm uppercase tracking-wide" style={{ color: A }}>Цена</th>
                  {config.isRepairTable && (
                    <th className="font-oswald font-bold text-right px-4 py-3 text-sm uppercase tracking-wide hidden sm:table-cell" style={{ color: A }}>Время</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {config.priceRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="font-roboto text-sm text-white/80 px-4 py-3">{row.model}</td>
                    <td className="font-oswald font-bold text-right px-4 py-3 whitespace-nowrap" style={{ color: A }}>{row.price}</td>
                    {config.isRepairTable && (
                      <td className="font-roboto text-right px-4 py-3 text-white/40 text-sm hidden sm:table-cell whitespace-nowrap">{row.time}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {config.priceTableNote && (
            <p className="font-roboto text-white/35 text-xs mt-3 leading-relaxed">{config.priceTableNote}</p>
          )}
        </div>
      </section>

      {/* ── Дополнительные блоки (специфичные для страницы) ── */}
      {config.extraBlocks}

      {/* ── Преимущества ── */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Почему выбирают <span style={{ color: A }}>Скупка24</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.advantages.map((a, i) => (
              <div key={i} className="rounded-xl p-5 flex gap-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
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

      {/* ── Шаги (если есть) ── */}
      {config.steps && (
        <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="font-oswald font-black uppercase text-white mb-8 text-center" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
              Как это работает
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: `linear-gradient(135deg,${A2},${A})`, boxShadow: `0 0 20px ${A}40` }}>
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
      )}

      {/* ── Форма заявки ── */}
      <section id="form" className="px-4 py-12" style={{ background: `linear-gradient(135deg,#1a0600,#0a0a0a)` }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1a0e08,#111)", border: `1px solid ${A}30`, boxShadow: `0 0 60px ${A}12` }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${A}80,transparent)` }} />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-roboto text-xs font-semibold uppercase tracking-wider"
              style={{ background: `${A}18`, border: `1px solid ${A}35`, color: A }}>
              <Icon name="Zap" size={12} />Оценка за 15 минут — бесплатно
            </div>
            <h2 className="font-oswald font-black uppercase text-white text-2xl mb-1">Оставить заявку</h2>
            <p className="font-roboto text-white/40 text-sm mb-6">Перезвоним за 5 минут — без спама</p>
            <LeadForm category={config.formCategory} dataTrack={config.formDataTrack} A={A} />
          </div>
        </div>
      </section>

      {/* ── Отзывы ── */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Отзывы клиентов
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {config.reviews.map((r, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-oswald font-bold text-sm text-white"
                    style={{ background: `linear-gradient(135deg,${A2},${A})` }}>
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-roboto font-semibold text-white text-sm">{r.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: r.rating || 5 }).map((_, j) => (
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

      {/* ── FAQ ── */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-8" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Частые вопросы
          </h2>
          <div className="flex flex-col gap-2">
            {config.faq.map((f, i) => (
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

      {/* ── Контакты ── */}
      <section className="px-4 py-12" style={{ background: "#0d0d0d", borderTop: `1px solid ${A}20` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Адреса офисов в Калуге
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { addr: "ул. Кирова, 11", note: "Центр города" },
              { addr: "ул. Кирова, 7/47", note: "Ближе к вокзалу" },
            ].map((o, i) => (
              <div key={i} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="MapPin" size={18} style={{ color: A }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-roboto font-semibold text-white text-sm">{o.addr}</p>
                    <p className="font-roboto text-white/40 text-xs">{o.note} · Работаем 24/7</p>
                  </div>
                </div>
                <a href={PHONE_TEL} className="font-oswald font-black text-xl hover:opacity-80 transition-opacity" style={{ color: A }}>
                  {PHONE_DISPLAY}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Смотрите также ── */}
      <section className="px-4 py-12" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)" }}>
            Смотрите также
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {config.related.map((r, i) => (
              <Link key={i} to={r.href}
                className="rounded-xl p-4 flex items-start gap-3 transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${A}18` }}>
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${A}18` }}>
                  <Icon name={r.icon as Parameters<typeof Icon>[0]["name"]} size={18} style={{ color: A }} />
                </div>
                <div>
                  <p className="font-roboto font-semibold text-white text-sm mb-0.5">{r.title}</p>
                  <p className="font-roboto text-white/40 text-xs leading-snug">{r.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Подвал ── */}
      <footer className="px-4 py-6 text-center" style={{ background: "#070707", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href={PHONE_TEL} className="font-oswald font-black text-2xl hover:opacity-80 transition-opacity" style={{ color: A }}>
          {PHONE_DISPLAY}
        </a>
        <p className="font-roboto text-white/30 text-xs mt-2">© {new Date().getFullYear()} Скупка24 · г. Калуга · Работаем 24/7</p>
        <p className="font-roboto text-white/20 text-xs mt-1">Обновлено: {TODAY}</p>
        <Link to="/" className="font-roboto text-white/20 text-xs mt-1 hover:text-white/50 transition-colors inline-block">← На главную</Link>
      </footer>

      {/* ── Плавающая кнопка ── */}
      <a href={PHONE_TEL}
        className="md:hidden fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full font-oswald font-bold text-sm uppercase text-white shadow-lg transition-all active:scale-95"
        style={{ background: `linear-gradient(135deg,${A},${A2})`, boxShadow: `0 4px 20px ${A}50` }}>
        <Icon name="Phone" size={16} className="animate-pulse" />Позвонить
      </a>
    </div>
  );
}
