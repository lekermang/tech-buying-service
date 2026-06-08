import { useState, useEffect, useCallback } from "react";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import ExitPopup from "@/components/skupka/ExitPopup";
import CookieBanner from "@/components/skupka/CookieBanner";
import PublicChatFab from "@/components/skupka/PublicChatFab";
import DesktopStickyBar from "@/components/skupka/DesktopStickyBar";
import EvaluateModal from "@/components/skupka/hero/EvaluateModal";

// ── Константы ─────────────────────────────────────────────────────────────────
const PHONE_TEL  = "tel:+79929990333";
const PHONE_800  = "tel:+78006006833";
const PHONE_DISP = "8 (800) 600-68-33";

const SERVICES = [
  { icon: "Smartphone",      label: "Скупка iPhone",     sub: "до 95 000 ₽",      href: "/skupka-iphone-kaluga",   accent: "#FFD700" },
  { icon: "Laptop",          label: "Скупка MacBook",    sub: "до 150 000 ₽",     href: "/skupka-macbook-kaluga",  accent: "#FFD700" },
  { icon: "Gem",             label: "Скупка золота",     sub: "до 500 000 ₽",     href: "/skupka-zolota-kaluga",   accent: "#fbbf24" },
  { icon: "Wrench",          label: "Ремонт телефонов",  sub: "от 300 ₽ · 20 мин",href: "/repair",                 accent: "#fb923c" },
  { icon: "RefreshCw",       label: "Trade In",          sub: "обмен с доплатой",  href: "/?section=tradein",       accent: "#4ade80" },
  { icon: "Shield",          label: "Безопасная сделка", sub: "гарант Скупка24",   href: "/safe-deals",             accent: "#a78bfa" },
  { icon: "ArrowLeftRight",  label: "Перенос данных",    sub: "фото, контакты",    href: "/transfer",               accent: "#60a5fa" },
  { icon: "ShoppingBag",     label: "Каталог техники",   sub: "новая + б/у",       href: "/catalog",                accent: "#34d399" },
];

const STATS = [
  { value: "50 000+", label: "клиентов" },
  { value: "9 лет",   label: "на рынке"  },
  { value: "4.9 ★",   label: "на картах" },
  { value: "15 мин",  label: "оценка"    },
];

const ACCEPT = [
  { icon: "Smartphone", title: "Смартфоны",        price: "до 95 000 ₽" },
  { icon: "Laptop",     title: "Ноутбуки",          price: "до 150 000 ₽" },
  { icon: "Tablet",     title: "Планшеты",          price: "до 70 000 ₽" },
  { icon: "Watch",      title: "Умные часы",        price: "до 40 000 ₽" },
  { icon: "Gem",        title: "Ювелирные",         price: "до 500 000 ₽" },
  { icon: "Camera",     title: "Фотоаппараты",      price: "до 80 000 ₽" },
  { icon: "Gamepad2",   title: "Игровые консоли",   price: "до 45 000 ₽" },
  { icon: "Headphones", title: "Аудио",             price: "до 30 000 ₽" },
];

const HOW_STEPS = [
  { n: "01", icon: "MessageSquare", title: "Оставьте заявку",   desc: "Через форму или по телефону" },
  { n: "02", icon: "Calculator",    title: "Получите оценку",   desc: "Честная цена за 15 минут" },
  { n: "03", icon: "MapPin",        title: "Приезжайте",        desc: "Кирова 11 или Кирова 7/47" },
  { n: "04", icon: "Banknote",      title: "Получите деньги",   desc: "Наличными или на карту — сегодня" },
];

const REPAIR_LINKS = [
  { href: "/remont-iphone-kaluga",          label: "Ремонт iPhone" },
  { href: "/remont-samsung-kaluga",         label: "Ремонт Samsung" },
  { href: "/remont-xiaomi-kaluga",          label: "Ремонт Xiaomi" },
  { href: "/zamena-stekla-kaluga",          label: "Замена стекла" },
  { href: "/zamena-akkumulyatora-kaluga",   label: "Замена аккумулятора" },
  { href: "/remont-posle-vody-kaluga",      label: "Ремонт после воды" },
  { href: "/bga-pajka-kaluga",              label: "BGA-пайка" },
  { href: "/snyatie-frp-kaluga",            label: "Снятие FRP / iCloud" },
];

// ── Компонент ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [modalOpen, setModalOpen] = useState(false);

  // Автоскролл к якорю
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("section") || params.get("block") || window.location.hash.replace("#", "");
    if (!target) return;
    const t = setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const openModal = useCallback(() => {
    ymGoal(Goals.FORM_OPEN, { place: "hero" });
    setModalOpen(true);
  }, []);

  return (
    <div style={{ background: "#0D0D0D", color: "#fff", minHeight: "100dvh", fontFamily: "Roboto, sans-serif" }}>
      <Header />

      {/* ── HERO ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "64px 16px 48px",
        background: "linear-gradient(160deg,#131000 0%,#0D0D0D 60%)",
        borderBottom: "1px solid rgba(255,215,0,0.12)",
      }}>
        {/* Фоновое свечение */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(255,215,0,0.12) 0%,transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Бейдж */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
            borderRadius: 99, padding: "4px 12px", marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFD700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Работаем 24/7 · Калуга
            </span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: "Oswald, sans-serif", fontWeight: 900,
            fontSize: "clamp(42px,9vw,80px)", lineHeight: 1,
            textTransform: "uppercase", marginBottom: 16, letterSpacing: "-0.01em",
          }}>
            <span style={{ color: "#fff" }}>Продай технику</span><br />
            <span style={{
              background: "linear-gradient(90deg,#b8860b,#FFD700,#fff3a0,#FFD700,#b8860b)",
              backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>выгодно</span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 520, marginBottom: 28 }}>
            Честная оценка за <strong style={{ color: "#fff" }}>15 минут</strong>. Смартфоны, ноутбуки,
            ювелирные украшения — принимаем всё.<br />
            <strong style={{ color: "#FFD700" }}>Выплата день в день.</strong>
          </p>

          {/* USP-чипы */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
            {["⚡ За 15 минут", "✓ Честная цена", "💰 Деньги сразу", "📄 Договор"].map(t => (
              <span key={t} style={{
                padding: "5px 12px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              }}>{t}</span>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 36 }}>
            <button
              onClick={openModal}
              style={{
                padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                fontFamily: "Oswald, sans-serif", fontWeight: 800,
                fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase",
                color: "#000", boxShadow: "0 4px 24px rgba(255,215,0,0.4)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon name="Zap" size={16} />
              Оценить онлайн
            </button>
            <a
              href={PHONE_800}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "hero" })}
              style={{
                padding: "14px 24px", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.35)",
                fontWeight: 700, fontSize: 14, color: "#FFD700", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon name="Phone" size={16} />
              {PHONE_DISP} · бесплатно
            </a>
          </div>

          {/* Статистика */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, fontWeight: 900, color: "#FFD700", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── УСЛУГИ (сетка 4×2) ── */}
      <section id="catalog" style={{ padding: "48px 16px", maxWidth: 960, margin: "0 auto" }}>
        <SectionLabel text="Что мы делаем" />
        <h2 style={h2style}>Все услуги</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 12,
        }}>
          {SERVICES.map(s => (
            <a key={s.href} href={s.href} style={{
              display: "flex", flexDirection: "column", gap: 10,
              padding: "20px 18px", borderRadius: 16, textDecoration: "none",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "border-color 0.2s, background 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = s.accent + "55";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.accent + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={20} style={{ color: s.accent }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{s.sub}</div>
              </div>
              <Icon name="ChevronRight" size={14} style={{ color: "rgba(255,255,255,0.2)", marginTop: "auto", alignSelf: "flex-end" }} />
            </a>
          ))}
        </div>
      </section>

      {/* ── ЧТО ПРИНИМАЕМ ── */}
      <section style={{
        padding: "48px 16px",
        background: "linear-gradient(180deg,#0D0D0D,#0f0f00 50%,#0D0D0D)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel text="Что принимаем" />
          <h2 style={h2style}>
            Всё что имеет{" "}
            <span style={{ color: "#FFD700" }}>ценность</span>
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 10,
          }}>
            {ACCEPT.map(a => (
              <div key={a.title} style={{
                padding: "16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,215,0,0.1)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "rgba(255,215,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={a.icon as Parameters<typeof Icon>[0]["name"]} size={18} style={{ color: "#FFD700" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "#FFD700", fontWeight: 700, marginTop: 2 }}>{a.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
            <button
              onClick={openModal}
              style={{
                padding: "13px 32px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: 14,
                textTransform: "uppercase", letterSpacing: "0.05em", color: "#000",
                boxShadow: "0 4px 20px rgba(255,215,0,0.3)",
              }}
            >
              Оценить бесплатно
            </button>
          </div>
        </div>
      </section>

      {/* ── КАК ЭТО РАБОТАЕТ ── */}
      <section id="how" style={{ padding: "48px 16px", maxWidth: 960, margin: "0 auto" }}>
        <SectionLabel text="Процесс" />
        <h2 style={h2style}>
          <span style={{ color: "#FFD700" }}>4 шага</span> до денег
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
        }}>
          {HOW_STEPS.map(step => (
            <div key={step.n} style={{
              padding: "24px 20px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 20, right: 20,
                fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: 28,
                color: "rgba(255,215,0,0.12)", lineHeight: 1,
              }}>{step.n}</div>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={step.icon as Parameters<typeof Icon>[0]["name"]} size={20} style={{ color: "#FFD700" }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ГАРАНТИИ ── */}
      <section id="guarantees" style={{
        padding: "48px 16px",
        background: "rgba(255,215,0,0.03)",
        borderTop: "1px solid rgba(255,215,0,0.1)",
        borderBottom: "1px solid rgba(255,215,0,0.1)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel text="Надёжность" />
          <h2 style={h2style}>
            Честно, официально,{" "}
            <span style={{ color: "#FFD700" }}>уже 9 лет</span>
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 12,
          }}>
            {[
              { icon: "ShieldCheck",  title: "Честная оценка",       desc: "Называем рыночную цену без занижения" },
              { icon: "FileText",     title: "Официальный договор",   desc: "Договор купли-продажи при каждой сделке" },
              { icon: "Banknote",     title: "Деньги в день обращения", desc: "Наличными или на карту сразу" },
              { icon: "Award",        title: "9 лет на рынке",        desc: "50 000+ сделок с 2015 года" },
              { icon: "Star",         title: "Рейтинг 4.9",           desc: "На Яндекс Картах — 3 460 отзывов" },
              { icon: "Clock",        title: "15 минут",              desc: "Быстрая оценка без ожидания" },
            ].map(g => (
              <div key={g.title} style={{
                display: "flex", gap: 14, padding: "16px 18px",
                borderRadius: 14, background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,215,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={g.icon as Parameters<typeof Icon>[0]["name"]} size={18} style={{ color: "#FFD700" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── РЕМОНТ (ссылки) ── */}
      <section style={{ padding: "48px 16px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <SectionLabel text="Сервис" />
            <h2 style={{ ...h2style, marginBottom: 0 }}>Ремонт телефонов</h2>
          </div>
          <a href="/repair" style={{
            fontSize: 13, fontWeight: 700, color: "#FFD700", textDecoration: "none",
            padding: "7px 14px", borderRadius: 8,
            border: "1px solid rgba(255,215,0,0.25)", whiteSpace: "nowrap",
          }}>
            Все услуги →
          </a>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 8,
        }}>
          {REPAIR_LINKS.map(r => (
            <a key={r.href} href={r.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 16px", borderRadius: 10, textDecoration: "none",
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(251,146,60,0.35)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
            >
              {r.label}
              <Icon name="ChevronRight" size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
            </a>
          ))}
        </div>
      </section>

      {/* ── ОФИСЫ + КОНТАКТЫ ── */}
      <section id="branches" style={{
        padding: "48px 16px",
        background: "linear-gradient(180deg,#0D0D0D,#0f0f00 50%,#0D0D0D)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel text="Где мы" />
          <h2 style={h2style}>Два офиса в <span style={{ color: "#FFD700" }}>центре Калуги</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {[
              { title: "Офис №1",   address: "ул. Кирова, 11",   hours: "Ежедневно 9:00 – 21:00", map: "https://yandex.ru/maps/-/CHtqKn1w" },
              { title: "Офис №2",   address: "ул. Кирова, 7/47", hours: "Ежедневно 9:00 – 21:00", map: "https://yandex.ru/maps/-/CHtqKn1w" },
            ].map(o => (
              <div key={o.title} style={{
                padding: "24px", borderRadius: 16,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.15)",
              }}>
                <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: 15, color: "#FFD700", marginBottom: 8, textTransform: "uppercase" }}>
                  {o.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Icon name="MapPin" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <span style={{ fontSize: 14, color: "#fff" }}>{o.address}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <Icon name="Clock" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{o.hours}</span>
                </div>
                <a href={o.map} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#FFD700", textDecoration: "none",
                  padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,215,0,0.3)",
                }}>
                  <Icon name="Navigation" size={12} />
                  Маршрут
                </a>
              </div>
            ))}
          </div>

          {/* Быстрые контакты */}
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href={PHONE_TEL} style={contactBtn}>
              <Icon name="Phone" size={16} />
              8 992 999-03-33
            </a>
            <a href={PHONE_800} style={{ ...contactBtn, background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
              <Icon name="Phone" size={16} />
              {PHONE_DISP} · бесплатно
            </a>
            <a href="https://t.me/skypka24" target="_blank" rel="noopener noreferrer" style={{ ...contactBtn, background: "rgba(37,150,190,0.12)", borderColor: "rgba(37,150,190,0.3)", color: "#38bdf8" }}>
              <Icon name="Send" size={16} />
              Telegram
            </a>
          </div>
        </div>
      </section>

      <ContactsFooter />
      <ExitPopup />
      <CookieBanner />
      <PublicChatFab />
      <DesktopStickyBar />
      {modalOpen && <EvaluateModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ── Вспомогательные стили ─────────────────────────────────────────────────────
const h2style: React.CSSProperties = {
  fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: "clamp(22px,4vw,32px)",
  textTransform: "uppercase", color: "#fff", marginBottom: 24, lineHeight: 1.1,
};

const contactBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "11px 20px", borderRadius: 10, textDecoration: "none",
  fontWeight: 700, fontSize: 14, color: "#FFD700",
  background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
};

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8,
      fontSize: 11, fontWeight: 700, color: "rgba(255,215,0,0.6)",
      letterSpacing: "0.2em", textTransform: "uppercase",
    }}>
      <span style={{ width: 20, height: 1, background: "rgba(255,215,0,0.4)" }} />
      {text}
    </div>
  );
}