import Icon from "@/components/ui/icon";
import { SEND_LEAD_URL } from "./RussianCoinsData";

interface CtaProps {
  ctaPhone: string;
  setCtaPhone: (v: string) => void;
  ctaSent: boolean;
  setCtaSent: (v: boolean) => void;
}

interface ModalProps {
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  phone: string;
  setPhone: (v: string) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
}

export function RussianCoinsCtaBlock({
  ctaPhone,
  setCtaPhone,
  ctaSent,
  setCtaSent,
}: CtaProps) {
  const handleCtaSend = () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: ctaPhone,
        name: "Клиент",
        category: "Царские монеты",
        desc: "Заявка с CTA блока — Перезвоните мне",
      }),
    }).catch(() => {});
    setCtaSent(true);
  };

  return (
    <section className="relative overflow-hidden border-t border-[#FFD700]/10 bg-[#0A0A0A] py-14 md:py-20">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD700]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
          Есть монеты?
          <br />
          <span className="text-[#FFD700]">Оценим за 2 часа</span>
        </div>
        <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
          Пришлите фото — ответим быстро. Или приходите в офис — оценка
          бесплатная.
        </p>

        {!ctaSent ? (
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="tel"
              value={ctaPhone}
              onChange={(e) => setCtaPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="flex-1 bg-[#111] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
            />
            <button
              onClick={handleCtaSend}
              className="bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase px-6 py-3 hover:bg-yellow-400 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Icon name="Send" size={15} />
              Перезвоните мне
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full font-roboto text-sm">
            <Icon name="CheckCircle" size={16} />
            Перезвоним в течение 30 минут!
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
          <a
            href="tel:+79929999777"
            className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5"
          >
            <Icon name="Phone" size={13} /> +7 (992) 999-97-77
          </a>
          <span className="text-white/15">·</span>
          <a
            href="https://t.me/skupka24"
            target="_blank"
            rel="noreferrer"
            className="font-roboto text-white/40 text-sm hover:text-[#FFD700] transition-colors flex items-center gap-1.5"
          >
            <Icon name="Send" size={13} /> Telegram
          </a>
        </div>
      </div>
    </section>
  );
}

export function RussianCoinsModal({
  formOpen,
  setFormOpen,
  phone,
  setPhone,
  sent,
  setSent,
}: ModalProps) {
  const handleModalSend = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        name: "Клиент",
        category: "Царские монеты",
        desc: "Заявка с формы оценки монеты",
      }),
    }).catch(() => {});
    setSent(true);
  };

  if (!formOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setFormOpen(false)}
    >
      <div
        className="bg-[#111] border border-[#FFD700]/25 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="font-oswald font-bold text-lg uppercase">
            Оценить монету
          </div>
          <button
            onClick={() => setFormOpen(false)}
            className="text-white/30 hover:text-white transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {!sent ? (
          <>
            <p className="font-roboto text-white/50 text-sm mb-4">
              Оставьте номер — перезвоним в течение 30 минут и
              проконсультируем бесплатно.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-[#0A0A0A] border border-[#333] focus:border-[#FFD700]/60 text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20"
            />
            <button
              onClick={handleModalSend}
              className="w-full bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Перезвоните мне
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon
                name="CheckCircle"
                size={24}
                className="text-emerald-400"
              />
            </div>
            <div className="font-oswald font-bold text-base mb-1">
              Заявка принята!
            </div>
            <div className="font-roboto text-white/45 text-sm">
              Перезвоним в течение 30 минут
            </div>
          </div>
        )}
      </div>
    </div>
  );
}