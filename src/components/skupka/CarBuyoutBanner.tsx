/**
 * CarBuyoutBanner — блок выкупа авто на главной странице.
 * Тёмный фон с оранжево-красным акцентом, форма с телефоном,
 * 3 преимущества, ссылка на /vykup-avto.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];
const ACCENT = "#FF6B1A";
const ACCENT2 = "#E63946";

const PERKS = [
  { icon: "Timer",      text: "Оценка за 15 минут" },
  { icon: "Banknote",   text: "Платим выше рынка"   },
  { icon: "Car",        text: "Любое состояние"     },
];

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 1) return "+7";
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
}

export default function CarBuyoutBanner() {
  const [phone,   setPhone]   = useState("+7");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);

  const phoneOk = phone.replace(/\D/g, "").length === 11;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (!raw) { setPhone("+7"); return; }
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOk || sending) return;
    setSending(true);
    try {
      await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Выкуп авто",
          phone: phone.replace(/\D/g, ""),
          category: "Выкуп авто",
          desc: "Заявка с блока на главной странице",
        }),
      });
      setDone(true);
    } catch { setDone(true); }
    setSending(false);
  };

  return (
    <section className="px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg,#1a0a00 0%,#1a0505 40%,#0d0d0d 100%)",
          border: "1px solid rgba(255,107,26,0.25)",
          boxShadow: "0 0 40px rgba(255,107,26,0.08)",
        }}>

        {/* Декоративная полоска сверху */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${ACCENT}80,${ACCENT2}80,transparent)` }} />

        {/* Фоновое свечение */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse,${ACCENT}12 0%,transparent 70%)`, filter: "blur(40px)" }} />

        <div className="relative px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">

          {/* Левая часть — текст */}
          <div className="flex-1 min-w-0">
            {/* Бейдж */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 text-[10px] font-roboto font-semibold uppercase tracking-wider"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, color: ACCENT }}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: ACCENT }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
              </span>
              Срочный выкуп авто
            </div>

            <h2 className="font-oswald font-black uppercase text-white leading-tight mb-1"
              style={{ fontSize: "clamp(1.2rem,4vw,1.75rem)" }}>
              Выкуп авто за{" "}
              <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}40` }}>1 час</span>
              {" "}— дорого и наличными
            </h2>
            <p className="font-roboto text-white/50 text-sm mb-4 leading-relaxed">
              Оценим за 15 минут. Любые марки, любые состояния. Деньги сразу.
            </p>

            {/* 3 преимущества */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PERKS.map(p => (
                <div key={p.text} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon name={p.icon} size={13} style={{ color: ACCENT }} />
                  <span className="font-roboto text-[11px] text-white/65">{p.text}</span>
                </div>
              ))}
            </div>

            {/* Форма */}
            {!done ? (
              <form onSubmit={submit} className="flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  placeholder="+7 (999) 999-99-99"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: `1px solid ${phoneOk ? ACCENT + "60" : "rgba(255,255,255,0.12)"}`,
                    minWidth: "160px",
                  }}
                />
                <button type="submit" disabled={!phoneOk || sending}
                  className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-white active:scale-95 transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg,${ACCENT},${ACCENT2})`,
                    boxShadow: `0 4px 16px ${ACCENT}35`,
                  }}>
                  <Icon name={sending ? "Loader2" : "Zap"} size={15} className={sending ? "animate-spin" : ""} />
                  {sending ? "..." : "Оценить авто"}
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <Icon name="CheckCircle2" size={18} className="text-green-400 shrink-0" />
                <span className="font-roboto text-sm text-white/80">Заявка принята — перезвоним за 5 минут!</span>
              </div>
            )}

            {/* Ссылка подробнее */}
            <Link to="/vykup-avto"
              className="inline-flex items-center gap-1.5 mt-3 font-roboto text-xs transition-colors"
              style={{ color: `${ACCENT}90` }}
              onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.color = `${ACCENT}90`)}>
              Подробнее о выкупе
              <Icon name="ArrowRight" size={12} />
            </Link>
          </div>

          {/* Правая часть — изображение (только sm+) */}
          <div className="hidden sm:block shrink-0 w-44 h-32 rounded-xl overflow-hidden"
            style={{ border: `1px solid ${ACCENT}20` }}>
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/79c67669-1c7d-47c2-83ec-92fdf612be90.jpg"
              alt="Срочный выкуп автомобилей"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
