/**
 * Топ-блок страницы /repair — staff-стиль:
 * 1. Баннер «Диагностика бесплатно»
 * 2. Форма заявки «Рассчитать стоимость»
 * 3. SEO-ссылки на подстраницы услуг
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import RepairWidget from "@/components/skupka/RepairWidget";

/* ── Keyframes (borrowed from staff loginUIPrimitives) ─────────────────── */
const KEYFRAMES = `
  @keyframes rtb-scanLine {
    0%   { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes rtb-floatParticle {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.35; }
    50%       { transform: translateY(-16px) scale(1.25); opacity: 0.75; }
  }
  @keyframes rtb-fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rtb-shimmerBtn {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(220%); }
  }
  @keyframes rtb-borderGlow {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.65; }
  }
  @keyframes rtb-pulse {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50%       { box-shadow: 0 0 0 6px rgba(255,215,0,0.08); }
  }
`;

/* ── Corner brackets ───────────────────────────────────────────────────── */
function Brackets({ color = "rgba(255,215,0,0.35)" }: { color?: string }) {
  const s = "absolute w-4 h-4 pointer-events-none";
  const b = `1.5px solid ${color}`;
  return (
    <>
      <span className={s} style={{ top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <span className={s} style={{ top: 0, right: 0, borderTop: b, borderRight: b }} />
      <span className={s} style={{ bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <span className={s} style={{ bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

/* ── Scanning line ─────────────────────────────────────────────────────── */
function ScanLine({ color = "#FFD700" }: { color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl" aria-hidden>
      <div className="absolute left-0 right-0 h-[2px] opacity-15"
        style={{ background: `linear-gradient(90deg,transparent,${color},transparent)`, animation: "rtb-scanLine 4s linear infinite" }} />
    </div>
  );
}

/* ── Floating gold particles ───────────────────────────────────────────── */
function Particles() {
  const pts = [
    { w: 2, l: "8%",  t: "25%", dur: 4.5 },
    { w: 3, l: "22%", t: "60%", dur: 6   },
    { w: 2, l: "58%", t: "20%", dur: 5   },
    { w: 4, l: "78%", t: "70%", dur: 7   },
    { w: 2, l: "92%", t: "40%", dur: 5.5 },
  ];
  return (
    <>
      {pts.map((p, i) => (
        <div key={i} aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.w, height: p.w,
            left: p.l, top: p.t,
            background: "#FFD700",
            boxShadow: "0 0 5px #FFD700",
            animation: `rtb-floatParticle ${p.dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Animated entry wrapper ────────────────────────────────────────────── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [in_, setIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIn(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: in_ ? 1 : 0,
      transform: in_ ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)",
    }}>
      {children}
    </div>
  );
}

/* ── SEO links data ─────────────────────────────────────────────────────── */
const SEO_LINKS = [
  { href: "/remont-iphone-kaluga",        icon: "Smartphone",      label: "Ремонт iPhone в Калуге",  keywords: "ремонт айфона калуга · замена экрана · аккумулятор", accent: "#fff3a0" },
  { href: "/remont-samsung-kaluga",       icon: "Smartphone",      label: "Ремонт Samsung в Калуге", keywords: "ремонт samsung galaxy калуга · снятие frp",           accent: "#93c5fd" },
  { href: "/remont-xiaomi-kaluga",        icon: "Smartphone",      label: "Ремонт Xiaomi в Калуге",  keywords: "ремонт xiaomi redmi poco калуга",                     accent: "#86efac" },
  { href: "/zamena-stekla-kaluga",        icon: "Layers",          label: "Замена стекла в Калуге",  keywords: "переклейка тачскрина калуга · oca-клей",              accent: "#c4b5fd" },
  { href: "/zamena-akkumulyatora-kaluga", icon: "BatteryCharging", label: "Замена аккумулятора",     keywords: "замена аккумулятора телефона калуга",                 accent: "#6ee7b7" },
  { href: "/remont-posle-vody-kaluga",    icon: "Droplets",        label: "Ремонт после воды",       keywords: "ремонт утопленника калуга · уз-промывка",             accent: "#7dd3fc" },
  { href: "/bga-pajka-kaluga",            icon: "Cpu",             label: "BGA-пайка в Калуге",      keywords: "bga пайка компонентный ремонт калуга",                accent: "#fca5a5" },
  { href: "/snyatie-frp-kaluga",          icon: "Unlock",          label: "Снятие FRP и iCloud",     keywords: "снятие frp samsung xiaomi · разблокировка icloud",    accent: "#fdba74" },
];

const STATS = [
  { icon: "Zap",       label: "При вас",      sub: "20 минут" },
  { icon: "BadgeCheck",label: "Гарантия",     sub: "до 12 мес" },
  { icon: "Wallet",    label: "От 300 ₽",     sub: "за работу" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function RepairTopBlock() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-5 pb-2 flex flex-col gap-5">
      <style>{KEYFRAMES}</style>

      {/* ══════════════════════════════════════════════════════════════════
          БЛОК 1 — Диагностика бесплатно
          ══════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={60}>
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(145deg, rgba(14,11,6,0.97) 0%, rgba(8,8,12,0.99) 100%)",
            border: "1px solid rgba(255,215,0,0.18)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.06), 0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.06)",
          }}>

          {/* Неоновая полоска сверху */}
          <div className="absolute top-0 left-0 right-0 h-px" aria-hidden
            style={{
              background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.7),rgba(255,248,232,0.9),rgba(255,215,0,0.7),transparent)",
              boxShadow: "0 0 18px rgba(255,215,0,0.4)",
              animation: "rtb-borderGlow 3s ease-in-out infinite",
            }} />

          {/* Угловое свечение */}
          <div className="absolute top-0 left-0 w-48 h-32 pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(ellipse at 0% 0%,rgba(255,215,0,0.08) 0%,transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-48 h-32 pointer-events-none" aria-hidden
            style={{ background: "radial-gradient(ellipse at 100% 100%,rgba(255,215,0,0.05) 0%,transparent 70%)" }} />

          {/* Сканирующая линия */}
          <ScanLine />

          {/* Фоновая hex-сетка (очень тонко) */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" aria-hidden
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700'/%3E%3C/svg%3E")`,
              backgroundSize: "56px 100px",
            }} />

          {/* Плавающие частицы */}
          <Particles />

          {/* Corner brackets */}
          <div className="absolute inset-0 pointer-events-none">
            <Brackets />
          </div>

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Иконка-блок */}
              <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)",
                    border: "1px solid rgba(255,215,0,0.3)",
                    boxShadow: "0 0 30px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                    animation: "rtb-pulse 3s ease-in-out infinite",
                  }}>
                  <Icon name="Microscope" size={28} style={{ color: "#FFD700", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }} />
                </div>
                {/* Мини-статус */}
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-green-500/20 border border-green-500/40 rounded-full px-1.5 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 font-roboto text-[8px] uppercase tracking-widest">FREE</span>
                </div>
              </div>

              {/* Текст */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Заголовок в стиле GlitchText */}
                  <h2 className="font-oswald font-black text-xl sm:text-2xl uppercase tracking-wide"
                    style={{ color: "#fff", letterSpacing: "0.08em" }}>
                    Диагностика{" "}
                    <span style={{
                      color: "#FFD700",
                      textShadow: "0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)",
                    }}>
                      бесплатно
                    </span>
                  </h2>
                  {/* Бейдж в стиле staff */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-roboto text-[9px] uppercase tracking-[0.18em] font-semibold"
                    style={{
                      background: "rgba(255,215,0,0.08)",
                      border: "1px solid rgba(255,215,0,0.25)",
                      color: "rgba(255,215,0,0.8)",
                    }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
                    </span>
                    если ремонт у нас
                  </div>
                </div>

                <p className="font-roboto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Мастер вскроет устройство при вас, покажет проблему под микроскопом и назовёт{" "}
                  <strong style={{ color: "rgba(255,255,255,0.85)" }}>точную стоимость</strong>{" "}
                  до начала работ. Диагностика бесплатна при условии ремонта в нашем сервисе.
                </p>
              </div>

              {/* Статы */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                {STATS.map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(255,215,0,0.05)",
                      border: "1px solid rgba(255,215,0,0.12)",
                    }}>
                    <Icon name={s.icon} size={13} style={{ color: "#FFD700" }} />
                    <div>
                      <div className="font-oswald font-bold text-xs text-white leading-none">{s.label}</div>
                      <div className="font-roboto text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,215,0,0.5)" }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Нижняя полоска */}
          <div className="absolute bottom-0 left-0 right-0 h-px" aria-hidden
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.12),transparent)" }} />
        </div>
      </FadeIn>

      {/* ══════════════════════════════════════════════════════════════════
          БЛОК 2 — Рассчитать стоимость
          ══════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={160}>
        <div id="repair-form" className="relative overflow-hidden rounded-2xl scroll-mt-20"
          style={{
            background: "linear-gradient(145deg, rgba(12,10,5,0.97) 0%, rgba(8,8,12,0.99) 100%)",
            border: "1px solid rgba(255,215,0,0.13)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.04), 0 16px 40px rgba(0,0,0,0.6)",
          }}>

          {/* Полоска сверху */}
          <div className="absolute top-0 left-0 right-0 h-px" aria-hidden
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.5),rgba(255,248,232,0.7),rgba(255,215,0,0.5),transparent)" }} />

          <div className="absolute inset-0 pointer-events-none">
            <Brackets color="rgba(255,215,0,0.2)" />
          </div>

          {/* Левая акцент-полоска */}
          <div className="absolute left-0 top-8 bottom-8 w-[2px] rounded-r" aria-hidden
            style={{ background: "linear-gradient(180deg,transparent,rgba(255,215,0,0.5),transparent)" }} />

          <div className="relative p-5 sm:p-6">
            {/* Заголовок */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg,#FFD700,#b8860b)",
                  boxShadow: "0 0 16px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                <Icon name="Calculator" size={17} className="text-black" />
              </div>
              <div>
                <h2 className="font-oswald font-black text-xl sm:text-2xl uppercase tracking-wide text-white"
                  style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>
                  Рассчитать{" "}
                  <span style={{ color: "#FFD700", textShadow: "0 0 16px rgba(255,215,0,0.45)" }}>
                    стоимость
                  </span>
                </h2>
                <p className="font-roboto text-[11px] uppercase tracking-[0.15em] mt-0.5"
                  style={{ color: "rgba(255,215,0,0.4)" }}>
                  Опишите проблему — мастер свяжется и назовёт точную цену
                </p>
              </div>
              <div className="ml-auto font-mono text-[9px] px-2 py-1 rounded hidden sm:block"
                style={{ color: "rgba(255,215,0,0.35)", background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.1)" }}>
                FREE_DIAG
              </div>
            </div>

            <RepairWidget />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px" aria-hidden
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.1),transparent)" }} />
        </div>
      </FadeIn>

      {/* ══════════════════════════════════════════════════════════════════
          БЛОК 3 — Ремонт телефонов · SEO-ссылки
          ══════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={260}>
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(145deg, rgba(10,8,4,0.96) 0%, rgba(8,8,12,0.98) 100%)",
            border: "1px solid rgba(255,215,0,0.1)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.03), 0 12px 30px rgba(0,0,0,0.5)",
          }}>

          <div className="absolute top-0 left-0 right-0 h-px" aria-hidden
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent)" }} />

          <div className="absolute inset-0 pointer-events-none">
            <Brackets color="rgba(255,215,0,0.15)" />
          </div>

          {/* Тонкие горизонтальные линии — CRT эффект */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" aria-hidden
            style={{
              backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,215,0,0.4) 3px,rgba(255,215,0,0.4) 4px)",
              backgroundSize: "100% 4px",
            }} />

          <div className="relative p-5 sm:p-6">
            {/* Заголовок блока */}
            <div className="flex items-end justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                  <Icon name="Wrench" size={15} style={{ color: "#FFD700" }} />
                </div>
                <div>
                  <h2 className="font-oswald font-black text-lg sm:text-xl uppercase tracking-wide text-white">
                    Ремонт телефонов
                    <span className="hidden sm:inline font-roboto font-normal text-[10px] ml-2 uppercase tracking-widest"
                      style={{ color: "rgba(255,215,0,0.45)" }}>
                      в Калуге
                    </span>
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-px w-4" style={{ background: "rgba(255,215,0,0.3)" }} />
                    <p className="font-roboto text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,215,0,0.4)" }}>
                      При вас · 20 минут · от 300 ₽
                    </p>
                  </div>
                </div>
              </div>
              <span className="font-roboto text-[9px] uppercase tracking-[0.2em] shrink-0 hidden sm:block"
                style={{ color: "rgba(255,255,255,0.2)" }}>
                Подробные страницы по каждому направлению
              </span>
            </div>

            {/* Сетка ссылок */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SEO_LINKS.map((l, idx) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="group relative overflow-hidden rounded-xl p-3.5 flex flex-col gap-1.5 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `rtb-fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both`,
                    animationDelay: `${280 + idx * 40}ms`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${l.accent}0a`;
                    el.style.borderColor = `${l.accent}35`;
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = `0 8px 20px rgba(0,0,0,0.4), 0 0 16px ${l.accent}15`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255,255,255,0.02)";
                    el.style.borderColor = "rgba(255,255,255,0.06)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {/* Полоска-акцент сверху */}
                  <div className="absolute top-0 left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg,transparent,${l.accent}60,transparent)` }} />

                  {/* Левая вертикальная линия */}
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(180deg,transparent,${l.accent},transparent)` }} />

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${l.accent}14`, border: `1px solid ${l.accent}25` }}>
                      <Icon name={l.icon} size={13} style={{ color: l.accent }} />
                    </div>
                    <span className="font-oswald text-[12px] font-bold uppercase leading-tight flex-1"
                      style={{ color: "rgba(255,255,255,0.82)", letterSpacing: "0.05em" }}>
                      {l.label}
                    </span>
                    <Icon name="ChevronRight" size={11}
                      className="shrink-0 opacity-20 group-hover:opacity-70 transition-all group-hover:translate-x-0.5"
                      style={{ color: l.accent }} />
                  </div>

                  <p className="font-roboto text-[9px] uppercase tracking-[0.12em] leading-snug pl-9"
                    style={{ color: `${l.accent}65` }}>
                    {l.keywords}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px" aria-hidden
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.08),transparent)" }} />
        </div>
      </FadeIn>

    </div>
  );
}
