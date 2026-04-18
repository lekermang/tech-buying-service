import { useState } from "react";
import Icon from "@/components/ui/icon";
import { formatPhone } from "@/lib/phoneFormat";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

const INP = "w-full bg-[#111] border border-[#333] text-white px-4 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";

export default function RepairDiscount() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    referrer_phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ discount_pct: number } | null>(null);

  const canSubmit = form.full_name.trim().length >= 2 &&
    form.phone.replace(/\D/g, "").length === 11 &&
    form.birth_date.length === 10;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "client_register",
          full_name: form.full_name.trim(),
          phone: form.phone,
          birth_date: form.birth_date,
          referrer_phone: form.referrer_phone,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ discount_pct: data.discount_pct });
        setStep("success");
      } else {
        setError(data.error || "Ошибка регистрации");
      }
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div className="bg-black border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <a href="/" className="text-white/40 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </a>
        <div className="font-oswald font-bold text-lg uppercase tracking-wide">Скидки на ремонт</div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {step === "success" ? (
          /* Успех */
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-5">
              <Icon name="Check" size={32} className="text-black" />
            </div>
            <div className="font-oswald font-bold text-2xl uppercase mb-2">Вы зарегистрированы!</div>
            <div className="font-roboto text-white/60 text-sm mb-6">
              Ваша скидка на ремонт активирована
            </div>

            {/* Карточка скидки */}
            <div className="bg-[#FFD700] text-black px-6 py-5 mb-6">
              <div className="font-roboto text-sm mb-1">Ваша скидка</div>
              <div className="font-oswald font-bold text-5xl">{result?.discount_pct}%</div>
              {result?.discount_pct === 5 && (
                <div className="font-roboto text-[11px] mt-1 opacity-70">
                  +2% за приглашение друга
                </div>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-white/10 p-4 text-left mb-5">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-3">Как пользоваться</div>
              <div className="space-y-2">
                {[
                  "Назовите свой номер телефона при сдаче телефона в ремонт",
                  "Скидка применяется автоматически к итоговой стоимости",
                  "Приводите друзей — ваша скидка вырастет до 5%",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 font-roboto text-xs text-white/60">
                    <span className="text-[#FFD700] font-bold shrink-0">{i + 1}.</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <a href="/" className="block w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase text-sm text-center hover:bg-yellow-400 transition-colors">
              На главную
            </a>
          </div>
        ) : (
          /* Форма */
          <>
            {/* Преимущества */}
            <div className="mb-6">
              <div className="font-oswald font-bold text-2xl uppercase mb-1">Зарегистрируйтесь</div>
              <div className="font-roboto text-white/50 text-sm mb-5">
                И получите постоянную скидку на все ремонты
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-[#1A1A1A] border border-white/10 p-3">
                  <div className="font-oswald font-bold text-[#FFD700] text-2xl mb-0.5">-3%</div>
                  <div className="font-roboto text-white/50 text-[11px]">скидка для всех<br/>зарегистрированных</div>
                </div>
                <div className="bg-[#1A1A1A] border border-white/10 p-3">
                  <div className="font-oswald font-bold text-[#FFD700] text-2xl mb-0.5">-5%</div>
                  <div className="font-roboto text-white/50 text-[11px]">если привели<br/>нового клиента</div>
                </div>
              </div>
            </div>

            {/* Форма */}
            <div className="space-y-3">
              <div>
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">ФИО *</div>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                  className={INP}
                />
              </div>

              <div>
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Телефон *</div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                  className={INP}
                />
              </div>

              <div>
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Дата рождения *</div>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className={INP + " [color-scheme:dark]"}
                />
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">
                  Телефон того, кто вас привёл <span className="normal-case text-white/20">(необязательно, +5% ему)</span>
                </div>
                <input
                  type="tel"
                  value={form.referrer_phone}
                  onChange={e => setForm(p => ({ ...p, referrer_phone: formatPhone(e.target.value) }))}
                  placeholder="+7 (___) ___-__-__"
                  className={INP}
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 text-red-400 font-roboto text-xs flex items-center gap-1.5">
                <Icon name="AlertCircle" size={13} /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit || loading}
              className="mt-5 w-full bg-[#FFD700] text-black font-oswald font-bold py-3.5 uppercase text-base hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Icon name="Loader" size={16} className="animate-spin" /> Регистрируем...</>
              ) : "Получить скидку"}
            </button>

            <div className="mt-3 font-roboto text-white/20 text-[10px] text-center">
              Данные используются только для учёта скидок
            </div>
          </>
        )}
      </div>
    </div>
  );
}
