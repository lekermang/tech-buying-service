import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const SERVICES = [
  { icon: "Apple",      label: "Снятие iCloud",      color: "#fff3a0", desc: "iPhone, iPad — официально" },
  { icon: "ShieldOff",  label: "Обход FRP",           color: "#7dd3fc", desc: "Samsung, Xiaomi, Huawei" },
  { icon: "Smartphone", label: "IMEI Unlock",         color: "#86efac", desc: "Разблокировка от оператора" },
  { icon: "Cpu",        label: "Server Unlock",       color: "#fca5a5", desc: "Быстро — от 30 минут" },
];

export default function RepairUnlockBanner() {
  return (
    <section className="px-4 sm:px-8 py-6 max-w-5xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg,rgba(6,8,18,0.98) 0%,rgba(4,6,12,0.99) 100%)",
          border: "1px solid rgba(125,211,252,0.2)",
          boxShadow: "0 0 0 1px rgba(125,211,252,0.05),0 20px 50px rgba(0,0,0,0.55),0 0 60px rgba(125,211,252,0.04)",
        }}>

        {/* Верхняя синяя полоска */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(125,211,252,0.6),transparent)" }} />

        {/* Угловые скобки */}
        {[["top-2 left-2","border-t border-l"],["top-2 right-2","border-t border-r"],
          ["bottom-2 left-2","border-b border-l"],["bottom-2 right-2","border-b border-r"]].map(([pos, cls]) => (
          <span key={pos} className={`absolute w-4 h-4 pointer-events-none ${pos} ${cls}`}
            style={{ borderColor: "rgba(125,211,252,0.3)" }} />
        ))}

        {/* Фоновый градиент */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 100% 50%,rgba(125,211,252,0.04) 0%,transparent 60%)" }} />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">

            {/* Левая часть */}
            <div className="flex-1 min-w-0">
              {/* Бейдж */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-roboto text-[10px] uppercase tracking-[0.2em]"
                style={{ background: "rgba(125,211,252,0.08)", border: "1px solid rgba(125,211,252,0.22)", color: "rgba(125,211,252,0.85)" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: "#7dd3fc" }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#7dd3fc" }} />
                </span>
                Онлайн-кабинет · Работает 24/7
              </div>

              <h2 className="font-oswald font-black text-2xl sm:text-3xl uppercase leading-tight text-white mb-2">
                Разблокировка{" "}
                <span style={{ color: "#7dd3fc", textShadow: "0 0 24px rgba(125,211,252,0.4)" }}>
                  iCloud и FRP
                </span>
              </h2>
              <p className="font-roboto text-sm text-white/50 leading-relaxed mb-5 max-w-lg">
                Снимаем блокировку активации Apple и Google-аккаунт с Android. Заказывай онлайн — результат через 15–60 минут.
              </p>

              {/* Сервисы */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {SERVICES.map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <Icon name={s.icon} size={14} style={{ color: s.color, flexShrink: 0 }} />
                    <div className="min-w-0">
                      <div className="font-oswald font-bold text-[11px] uppercase text-white/85 leading-none truncate">{s.label}</div>
                      <div className="font-roboto text-[9px] text-white/35 mt-0.5 truncate">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Фичи */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "Zap",       text: "От 15 минут" },
                  { icon: "ShieldCheck", text: "Безопасно" },
                  { icon: "Globe",     text: "Любая страна" },
                  { icon: "CreditCard", text: "Оплата онлайн" },
                ].map(f => (
                  <div key={f.text} className="flex items-center gap-1.5 font-roboto text-[11px] text-white/45">
                    <Icon name={f.icon} size={12} style={{ color: "#7dd3fc" }} />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Правая часть — CTA */}
            <div className="flex flex-col items-center gap-3 shrink-0 w-full lg:w-auto">
              {/* Карточка кабинета */}
              <div className="w-full lg:w-56 p-4 rounded-xl text-center"
                style={{
                  background: "rgba(125,211,252,0.06)",
                  border: "1px solid rgba(125,211,252,0.2)",
                }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,rgba(125,211,252,0.2),rgba(125,211,252,0.08))", border: "1px solid rgba(125,211,252,0.3)" }}>
                  <Icon name="Unlock" size={22} style={{ color: "#7dd3fc" }} />
                </div>
                <div className="font-oswald font-bold text-base uppercase text-white mb-0.5">
                  Личный кабинет
                </div>
                <div className="font-roboto text-[10px] text-white/35 mb-4 leading-snug">
                  Заказывай, отслеживай статус,<br />пополняй баланс онлайн
                </div>

                <Link to="/unlock"
                  className="group relative overflow-hidden flex items-center justify-center gap-2 w-full py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all"
                  style={{
                    background: "linear-gradient(135deg,rgba(125,211,252,0.2),rgba(125,211,252,0.1))",
                    border: "1px solid rgba(125,211,252,0.45)",
                    color: "#7dd3fc",
                    boxShadow: "0 0 20px rgba(125,211,252,0.12)",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(125,211,252,0.22)"; el.style.boxShadow = "0 0 30px rgba(125,211,252,0.25)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "linear-gradient(135deg,rgba(125,211,252,0.2),rgba(125,211,252,0.1))"; el.style.boxShadow = "0 0 20px rgba(125,211,252,0.12)"; }}>
                  <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.15)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <Icon name="Unlock" size={15} className="relative" />
                  <span className="relative">Открыть кабинет</span>
                </Link>
              </div>

              <div className="font-roboto text-[10px] text-white/20 text-center">
                Регистрация · Вход · Заказ онлайн
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(125,211,252,0.12),transparent)" }} />
      </div>
    </section>
  );
}
