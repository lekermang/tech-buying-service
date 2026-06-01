import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import { SEND_LEAD_URL, INP_CLS, LBL_CLS } from "./hero/evaluateModalShared";

type Props = { onOpenModal?: () => void };

type Step = "bar" | "form" | "success";

export default function DesktopStickyBar({ onOpenModal }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<Step>("bar");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Показываем после прокрутки 40% страницы
  useEffect(() => {
    const onScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (progress > 0.15) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openForm = () => {
    setStep("form");
    setError(null);
    setTimeout(() => phoneRef.current?.focus(), 200);
  };

  const submit = async () => {
    if (!name.trim()) { setError("Введите имя"); return; }
    if (!isPhoneValid(phone)) { setError("Введите корректный номер"); return; }
    setError(null);
    setLoading(true);
    ymGoal(Goals.FORM_SUBMIT, { place: "desktop_sticky" });
    try {
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, desc: "", client_price: "", photos: [], contact_channels: [], contact_time: "" }),
      });
      if (!res.ok) throw new Error("bad");
      ymGoal(Goals.FORM_SUCCESS, { place: "desktop_sticky" });
      setStep("success");
      setTimeout(() => { setDismissed(true); }, 5000);
    } catch {
      setError("Ошибка отправки. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes dsb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes dsb-pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.25); }
          50%       { box-shadow: 0 0 0 6px rgba(255,215,0,0); }
        }
        @keyframes dsb-shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>

      {/* Десктоп-панель */}
      <div
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-[45] items-center"
        style={{
          background: "linear-gradient(180deg, rgba(14,11,6,0.97) 0%, rgba(8,6,3,0.99) 100%)",
          borderTop: "1px solid rgba(255,215,0,0.18)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.03) inset",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease",
          height: 64,
        }}
      >
        {/* Световая полоска */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.5) 20%, rgba(255,248,232,0.7) 50%, rgba(255,215,0,0.5) 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(255,215,0,0.3)",
        }} />

        <div className="max-w-7xl mx-auto px-6 w-full flex items-center gap-6">

          {/* ── Лого/бренд ── */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: "linear-gradient(135deg, #FFE34D, #FFD700)",
              boxShadow: "0 0 16px rgba(255,215,0,0.5), 0 2px 0 rgba(255,255,255,0.2) inset",
            }}>
              <Icon name="Zap" size={16} className="text-black" />
            </div>
            <div>
              <div className="font-oswald text-sm font-bold uppercase tracking-wide leading-none" style={{
                background: "linear-gradient(90deg, #fff8e8, #FFD700)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Быстрая оценка</div>
              <div className="font-roboto text-[10px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                перезвоним за 15 минут
              </div>
            </div>
          </div>

          {/* ── Разделитель ── */}
          <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,215,0,0.12)" }} />

          {/* ── Контент — меняется по шагам ── */}
          <div className="flex-1 flex items-center gap-4">

            {step === "bar" && (
              <>
                <p className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Оставьте номер — перезвоним, назовём цену и договоримся об удобном времени.
                </p>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  {/* Соцдоказательства */}
                  <div className="hidden lg:flex items-center gap-4">
                    {[
                      { icon: "Clock", text: "15 мин ответ" },
                      { icon: "ShieldCheck", text: "Без обязательств" },
                      { icon: "Star", text: "4.9 рейтинг" },
                    ].map(({ icon, text }) => (
                      <span key={text} className="flex items-center gap-1.5 font-roboto text-[11px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        <Icon name={icon} size={12} style={{ color: "rgba(255,215,0,0.6)" }} />
                        {text}
                      </span>
                    ))}
                  </div>

                  {/* Кнопки */}
                  <a href="tel:+79929999777"
                    onClick={() => ymGoal(Goals.CALL_CLICK, { place: "desktop_sticky" })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-roboto text-sm font-semibold transition-all duration-200 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.2)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "white";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    <Icon name="Phone" size={14} />
                    Позвонить
                  </a>

                  <button
                    onClick={openForm}
                    className="relative overflow-hidden flex items-center gap-2 px-5 py-2 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all duration-200 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                      boxShadow: "0 0 20px rgba(255,215,0,0.4), 0 2px 0 rgba(255,255,255,0.25) inset",
                      animation: "dsb-pulse-gold 3s ease-in-out infinite",
                    }}
                  >
                    {/* Shimmer */}
                    <span className="absolute inset-0 pointer-events-none" style={{
                      background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
                      animation: "dsb-shimmer 3s ease-in-out infinite",
                    }} />
                    <Icon name="ArrowRight" size={15} />
                    Оставить заявку
                  </button>
                </div>
              </>
            )}

            {step === "form" && (
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <label className={LBL_CLS + " !mb-1"}>Ваше имя</label>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && phoneRef.current?.focus()}
                      placeholder="Иван"
                      className="w-full text-white px-3 py-1.5 font-roboto text-sm outline-none transition-all rounded-lg placeholder:text-white/20"
                      style={{
                        background: "linear-gradient(145deg,rgba(20,15,8,0.97),rgba(12,9,5,0.99))",
                        border: "1px solid rgba(255,255,255,0.1)",
                        height: 38,
                      }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,215,0,0.5)"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={LBL_CLS + " !mb-1"}>Телефон <span style={{ color: "#FFD700" }}>*</span></label>
                    <input
                      ref={phoneRef}
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      onFocus={e => {
                        if (!phone) setPhone("+7");
                        (e.target as HTMLInputElement).style.borderColor = "rgba(255,215,0,0.5)";
                        (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)";
                      }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
                      onKeyDown={e => e.key === "Enter" && submit()}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full text-white px-3 py-1.5 font-roboto text-sm outline-none transition-all rounded-lg placeholder:text-white/20"
                      style={{
                        background: "linear-gradient(145deg,rgba(20,15,8,0.97),rgba(12,9,5,0.99))",
                        border: "1px solid rgba(255,255,255,0.1)",
                        height: 38,
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0" style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}>
                    <Icon name="AlertCircle" size={12} className="text-red-400 shrink-0" />
                    <span className="text-red-400 font-roboto text-xs whitespace-nowrap">{error}</span>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="relative overflow-hidden flex items-center gap-2 px-5 py-2 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all duration-200 active:scale-95 disabled:opacity-50 shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                    boxShadow: "0 0 20px rgba(255,215,0,0.35), 0 2px 0 rgba(255,255,255,0.25) inset",
                    height: 38,
                  }}
                >
                  <span className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
                    animation: "dsb-shimmer 2.5s ease-in-out infinite",
                  }} />
                  {loading
                    ? <Icon name="Loader" size={15} className="animate-spin" />
                    : <><Icon name="ArrowRight" size={15} /> Далее</>
                  }
                </button>

                <button
                  onClick={() => { setStep("bar"); setName(""); setPhone(""); setError(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 shrink-0"
                  style={{ color: "rgba(255,255,255,0.25)", background: "transparent" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <Icon name="X" size={15} />
                </button>
              </div>
            )}

            {step === "success" && (
              <div className="flex-1 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                  background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                  boxShadow: "0 0 20px rgba(255,215,0,0.5)",
                }}>
                  <Icon name="Check" size={18} className="text-black" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-base uppercase tracking-wide" style={{
                    background: "linear-gradient(90deg, #fff8e8, #FFD700)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>Заявка принята!</div>
                  <div className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Перезвоним в течение <span style={{ color: "white" }}>15 минут</span> · Работаем без выходных
                  </div>
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
                >
                  <Icon name="X" size={15} />
                </button>
              </div>
            )}
          </div>

          {/* ── Крестик закрытия (только в bar режиме) ── */}
          {step === "bar" && (
            <button
              onClick={() => setDismissed(true)}
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg transition-all shrink-0"
              style={{ color: "rgba(255,255,255,0.2)", background: "transparent" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}