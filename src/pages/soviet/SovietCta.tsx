import Icon from "@/components/ui/icon";
import { ACCENT } from "./data";

interface SovietCtaProps {
  ctaPhone: string;
  setCtaPhone: (v: string) => void;
  ctaSent: boolean;
  handleCtaSend: () => void;
  formOpen: boolean;
  setFormOpen: (v: boolean) => void;
  phone: string;
  setPhone: (v: string) => void;
  sent: boolean;
  handleModalSend: () => void;
}

const SovietCta = ({
  ctaPhone, setCtaPhone, ctaSent, handleCtaSend,
  formOpen, setFormOpen, phone, setPhone, sent, handleModalSend,
}: SovietCtaProps) => {
  return (
    <>
      {/* ══ CTA БЛОК ══ */}
      <section className="relative overflow-hidden border-t py-14 md:py-20" style={{ borderColor: `${ACCENT}15`, background: "#0A0A0A" }}>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: `${ACCENT}10` }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="font-oswald font-black text-3xl md:text-5xl uppercase mb-3">
            Есть советские вещи?<br />
            <span style={{ color: ACCENT }}>Оценим за 24 часа</span>
          </div>
          <p className="font-roboto text-white/50 text-sm md:text-base mb-8 leading-relaxed">
            Пришлите фото — ответим быстро. Или приходите в офис — осмотр и оценка полностью бесплатны.
          </p>

          {!ctaSent ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="tel"
                value={ctaPhone}
                onChange={(e) => setCtaPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="flex-1 bg-[#111] border border-[#333] text-white px-4 py-3 font-roboto text-sm focus:outline-none transition-colors placeholder:text-white/20"
                onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = `${ACCENT}70`)}
                onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#333")}
              />
              <button
                onClick={handleCtaSend}
                className="font-oswald font-bold text-sm uppercase px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2"
                style={{ background: ACCENT, color: "#fff" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#dc2626")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = ACCENT)}
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
            <a href="tel:+79929990333" className="font-roboto text-white/40 text-sm transition-colors flex items-center gap-1.5"
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)")}
            >
              <Icon name="Phone" size={13} /> +7 (992) 999-03-33
            </a>
            <span className="text-white/15">·</span>
            <a href="https://t.me/skupka24" target="_blank" rel="noreferrer" className="font-roboto text-white/40 text-sm transition-colors flex items-center gap-1.5"
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)")}
            >
              <Icon name="Send" size={13} /> Telegram
            </a>
          </div>
        </div>
      </section>

      {/* ══ ФОРМА-МОДАЛ ══ */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setFormOpen(false)}>
          <div className="bg-[#111] rounded-2xl p-6 max-w-sm w-full border" style={{ borderColor: `${ACCENT}30` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-oswald font-bold text-lg uppercase">Оценить вещи</div>
              <button onClick={() => setFormOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            {!sent ? (
              <>
                <p className="font-roboto text-white/50 text-sm mb-4">Оставьте номер — перезвоним в течение 30 минут и проконсультируем бесплатно.</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full bg-[#0A0A0A] border border-[#333] text-white px-4 py-3 rounded-lg font-roboto text-sm focus:outline-none mb-3 placeholder:text-white/20 transition-colors"
                  onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = `${ACCENT}70`)}
                  onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#333")}
                />
                <button
                  onClick={handleModalSend}
                  className="w-full font-oswald font-bold text-sm uppercase py-3 rounded-lg transition-colors"
                  style={{ background: ACCENT, color: "#fff" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#dc2626")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = ACCENT)}
                >
                  Перезвоните мне
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon name="CheckCircle" size={24} className="text-emerald-400" />
                </div>
                <div className="font-oswald font-bold text-base mb-1">Заявка принята!</div>
                <div className="font-roboto text-white/45 text-sm">Перезвоним в течение 30 минут</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SovietCta;