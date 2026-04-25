import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const SEND_JOB_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const VACANCIES = [
  { id: "manager_online", label: "Менеджер онлайн", desc: "Консультация клиентов в мессенджерах, приём заявок, оценка техники по фото" },
  { id: "evaluator", label: "Оценщик техники", desc: "Приём и диагностика техники в офисе, работа с клиентами" },
  { id: "cashier", label: "Кассир-приёмщик", desc: "Оформление сделок, выплата средств клиентам, ведение учёта" },
];

export default function JobsSection() {
  const [form, setForm] = useState({ name: "", phone: "", vacancy: "manager_online" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSending(true);
    setError("");
    try {
      const selectedLabel = VACANCIES.find(v => v.id === form.vacancy)?.label || form.vacancy;
      const res = await fetch(SEND_JOB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          category: `💼 Вакансия: ${selectedLabel}`,
          desc: "Заявка с раздела «Работа у нас»",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        ymGoal(Goals.FORM_SUCCESS, { source: "jobs" });
      } else {
        setError("Ошибка отправки. Попробуйте позвонить.");
      }
    } catch {
      setError("Нет связи. Попробуйте позвонить.");
    } finally {
      setSending(false);
    }
  };

  const selectedVacancy = VACANCIES.find(v => v.id === form.vacancy) || VACANCIES[0];

  return (
    <section id="jobs" className="relative bg-[#0D0D0D] py-16 px-4 overflow-hidden border-t border-[#FFD700]/10">
      {/* Премиум-фон как в Trade In */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, transparent 50%, rgba(255,215,0,0.06) 100%)" }} />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(6,182,212,0.08)" }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.08)" }} />

      <div className="relative max-w-5xl mx-auto">

        {/* Заголовок в стиле Trade In */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
            <Icon name="Briefcase" size={12} />
            Карьера
          </span>
          <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">Вакансии</span>
        </div>
        <h2 className="font-oswald text-3xl md:text-5xl font-bold uppercase text-white mb-2 leading-[1.05]">
          Работай <span className="text-[#FFD700]">с нами.</span><br /><span className="text-cyan-400">Онлайн и в офисе.</span>
        </h2>
        <p className="font-roboto text-white/60 text-sm md:text-base mb-8 md:mb-10 max-w-xl">
          Ищем активных и честных людей. Гибкий график, стабильная выплата, дружная команда.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Вакансии */}
          <div className="space-y-3">
            {VACANCIES.map(v => (
              <button
                key={v.id}
                onClick={() => setForm(f => ({ ...f, vacancy: v.id }))}
                className={`w-full text-left p-4 border-2 transition-all ${
                  form.vacancy === v.id
                    ? "border-[#FFD700] bg-[#FFD700]/8"
                    : "border-[#222] hover:border-[#FFD700]/40 bg-[#111]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    form.vacancy === v.id ? "border-[#FFD700] bg-[#FFD700]" : "border-[#444]"
                  }`}>
                    {form.vacancy === v.id && <Icon name="Check" size={10} className="text-black" />}
                  </div>
                  <div>
                    <div className="font-oswald font-bold text-base uppercase text-white">{v.label}</div>
                    <div className="font-roboto text-white/40 text-xs mt-0.5">{v.desc}</div>
                  </div>
                </div>
              </button>
            ))}

            {/* Условия работы */}
            <div className="mt-6 bg-[#111] border border-[#222] p-4">
              <div className="font-oswald font-bold text-sm uppercase text-[#FFD700] mb-3">Условия работы</div>
              <ul className="space-y-2">
                {[
                  ["Briefcase", "Удалённая работа / офис — на ваш выбор"],
                  ["Clock", "Гибкий график, работа от 4 часов в день"],
                  ["TrendingUp", "Ставка + % от сделок"],
                  ["Users", "Обучение и поддержка команды"],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-center gap-2">
                    <Icon name={icon as string} size={14} className="text-[#FFD700] flex-shrink-0" />
                    <span className="font-roboto text-white/60 text-xs">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Форма */}
          <div className="bg-[#111] border border-[#222] p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="w-16 h-16 bg-[#FFD700] flex items-center justify-center mb-4">
                  <Icon name="Check" size={32} className="text-black" />
                </div>
                <h3 className="font-oswald text-2xl font-bold text-[#FFD700] uppercase mb-2">Заявка отправлена!</h3>
                <p className="font-roboto text-white/50 text-sm mb-1">Мы свяжемся с вами в Telegram или по телефону</p>
                <p className="font-roboto text-white/30 text-xs">Обычно отвечаем в течение часа</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", phone: "", vacancy: "manager_online" }); }}
                  className="mt-6 font-roboto text-[#FFD700] text-sm hover:underline"
                >
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="font-oswald font-bold text-lg uppercase text-white mb-1">
                    Оставить заявку
                  </div>
                  <div className="font-roboto text-white/40 text-xs mb-5">
                    Вакансия: <span className="text-[#FFD700]">{selectedVacancy.label}</span>
                  </div>
                </div>

                <div>
                  <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1.5">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Иван Иванов"
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1.5">
                    Номер телефона *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20"
                  />
                </div>

                {error && (
                  <div className="font-roboto text-red-400 text-xs">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-gold-premium btn-lg w-full"
                >
                  {sending ? "Отправляем..." : "Отправить заявку"}
                </button>

                <p className="font-roboto text-white/25 text-[10px] text-center leading-relaxed">
                  Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
                  Свяжемся через Telegram или по телефону.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}