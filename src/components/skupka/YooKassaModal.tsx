import { useState } from "react";
import Icon from "@/components/ui/icon";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";

const PAYMENT_URL = "https://functions.poehali.dev/6d3e059a-1409-4391-bb0b-c3c62f9cca8a";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const SERVICES = [
  { label: "Ремонт телефона", value: "Ремонт телефона", extraLabel: "Номер заявки", extraPlaceholder: "Например: 1042" },
  { label: "Предоплата за товар", value: "Предоплата за товар", extraLabel: "Наименование товара", extraPlaceholder: "Например: iPhone 13 Pro" },
  { label: "Чай", value: "Другое" },
];

interface YooKassaModalProps {
  open: boolean;
  onClose: () => void;
}

const YooKassaModal = ({ open, onClose }: YooKassaModalProps) => {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(SERVICES[0].value);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const amountNum = parseInt(amount.replace(/\D/g, "")) || 0;
  const activeService = SERVICES.find(s => s.value === service);
  const needsExtra = !!activeService?.extraLabel;
  const isValid = amountNum >= 100 && name.trim().length >= 2 && isPhoneValid(phone) && (!needsExtra || extra.trim().length >= 1);

  const handlePay = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          name: name.trim(),
          phone,
          description: extra.trim() ? `${service}: ${extra.trim()}` : service,
          return_url: `${window.location.origin}/?paid=1`,
        }),
      });
      const data = await res.json();
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else if (data.error) {
        setError(data.yookassa_description || "Ошибка ЮKassa. Попробуйте ещё раз.");
        console.error("[YooKassa]", data);
      } else {
        setError("Не удалось создать платёж. Попробуйте ещё раз.");
      }
    } catch {
      setError("Ошибка соединения. Проверьте интернет и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md bg-[#0D0D0D] border border-[#FFD700]/40 shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 60px rgba(255,215,0,0.12)" }}
      >
        {/* Золотая полоса сверху */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700]" />

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white/30 hover:text-white transition-colors z-10"
        >
          <Icon name="X" size={16} />
        </button>

        <div className="p-6">
          {/* Заголовок */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-1 h-12 bg-[#FFD700] shrink-0 mt-1" />
            <div>
              <p className="font-oswald text-xl font-bold uppercase text-white leading-tight">
                Оплата услуг<br />
                <span className="text-[#FFD700]">Скупка24</span>
              </p>
              <p className="text-white/40 text-xs mt-1">Безопасная оплата через ЮKassa</p>
            </div>
          </div>

          {/* Услуга */}
          <div className="mb-4">
            <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
              За что платите
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setService(s.value); setExtra(""); }}
                  className={`px-3 py-1.5 font-roboto text-xs transition-all border rounded ${
                    service === s.value
                      ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {needsExtra && activeService?.extraLabel && (
              <input
                type="text"
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder={activeService.extraPlaceholder}
                className="mt-2 w-full bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-white/20 rounded"
              />
            )}
          </div>

          {/* Сумма */}
          <div className="mb-4">
            <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
              Сумма (от 100 ₽)
            </label>
            <div className="flex gap-2 mb-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`flex-1 py-2 font-oswald font-bold text-sm transition-all border rounded ${
                    amountNum === a
                      ? "border-[#FFD700]/70 bg-[#FFD700]/15 text-[#FFD700]"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                  }`}
                >
                  {a.toLocaleString("ru-RU")}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min={100}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Введите свою сумму"
                className="w-full bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/20 rounded"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 font-oswald font-bold text-sm">₽</span>
            </div>
            {amountNum > 0 && amountNum < 100 && (
              <p className="text-red-400 text-xs mt-1">Минимальная сумма — 100 ₽</p>
            )}
          </div>

          {/* Имя */}
          <div className="mb-4">
            <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
              Ваше имя
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Имя или компания"
              className="w-full bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/20 rounded"
            />
          </div>

          {/* Телефон */}
          <div className="mb-5">
            <label className="block font-roboto text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onFocus={() => { if (!phone) setPhone("+7"); }}
              inputMode="tel"
              placeholder="+7 (___) ___-__-__"
              className="w-full bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/20 rounded"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-3">{error}</p>
          )}

          {/* Кнопка оплаты */}
          <button
            onClick={handlePay}
            disabled={!isValid || loading}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold py-4 uppercase tracking-widest hover:bg-yellow-400 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Перенаправление...
              </>
            ) : (
              <>
                <Icon name="CreditCard" size={18} />
                Оплатить {amountNum >= 100 ? `${amountNum.toLocaleString("ru-RU")} ₽` : ""}
              </>
            )}
          </button>

          {/* Дисклеймер */}
          <div className="mt-4 flex items-start gap-2 bg-white/[0.03] border border-white/[0.06] rounded p-3">
            <Icon name="ShieldCheck" size={14} className="text-[#FFD700]/60 mt-0.5 shrink-0" />
            <p className="font-roboto text-white/30 text-[10px] leading-relaxed">
              Платёж защищён ЮKassa. Данные карты не передаются нашему сайту.
              Нажимая «Оплатить», вы соглашаетесь с условиями обработки платежей.
              <br />
              <a href="tel:+79929990333" className="text-[#FFD700]/50 hover:text-[#FFD700] transition-colors">
                +7 (992) 999-03-33
              </a>{" "}
              · ИП Скупка24 · Калуга
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YooKassaModal;