import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import { SEND_LEAD_URL, INP_CLS, LBL_CLS, compressImage } from "./evaluateModalShared";

export default function EvaluateModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ name: "", phone: "", desc: "", client_price: "" });
  const [photos, setPhotos] = useState<{ preview: string; base64: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.slice(0, 5 - photos.length).forEach(file => {
      const preview = URL.createObjectURL(file);
      compressImage(file).then(base64 => {
        setPhotos(prev => prev.length < 5 ? [...prev, { preview, base64 }] : prev);
      });
    });
  };

  const goStep2 = () => {
    if (!formData.name.trim()) { setError("Введите ваше имя"); return; }
    if (!isPhoneValid(formData.phone)) { setError("Введите номер в формате +7 (___) ___-__-__"); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    ymGoal(Goals.FORM_SUBMIT, {});
    try {
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photos: [], contact_channels: [], contact_time: "" }),
      });
      if (!res.ok) throw new Error("bad_status");
      ymGoal(Goals.FORM_SUCCESS, {});
      try {
        (window as unknown as { skypkaConvert?: (d: Record<string, unknown>) => void }).skypkaConvert?.({
          type: "evaluate_skupka",
          form_type: "evaluate_skupka",
          phone: formData.phone,
          amount: formData.client_price ? Number(String(formData.client_price).replace(/\D/g, "")) : null,
          name: formData.name,
        });
      } catch { /* noop */ }
      setSubmitted(true);
      const readyPhotos = photos.map(p => p.base64).filter(Boolean);
      if (readyPhotos.length > 0) {
        fetch(SEND_LEAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, desc: `[фото] ${formData.desc}`, photos: readyPhotos }),
        }).catch(() => {});
      }
    } catch {
      setError("Ошибка отправки. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-[fadeIn_0.2s_ease]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#111] border-t sm:border border-[#FFD700]/25 shadow-2xl max-h-[95dvh] sm:max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-[slideDown_0.22s_ease]">

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-[#111] z-10">
          {step === 2 && !submitted ? (
            <button onClick={() => { setStep(1); setError(null); }}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors font-roboto text-sm">
              <Icon name="ChevronLeft" size={16} /> Назад
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-[#FFD700] flex items-center justify-center rounded">
                <Icon name="Zap" size={13} className="text-black" />
              </div>
              <span className="font-oswald text-base font-bold uppercase tracking-wide">Быстрая оценка</span>
            </div>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <Icon name="X" size={17} />
          </button>
        </div>

        <div className="p-5">
          {/* ── Успех ── */}
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#FFD700] flex items-center justify-center mx-auto mb-4 rounded-2xl">
                <Icon name="Check" size={32} className="text-black" />
              </div>
              <h3 className="font-oswald text-2xl font-bold text-[#FFD700] mb-2 uppercase">Заявка принята!</h3>
              <p className="font-roboto text-white/55 text-sm mb-1">Перезвоним в течение <b className="text-white">15 минут</b></p>
              <p className="font-roboto text-white/35 text-xs mb-7">Работаем с 10:00 до 21:00, без выходных</p>
              <button onClick={onClose} className="btn-gold-premium btn-lg w-full">Закрыть</button>
            </div>

          ) : step === 1 ? (
            /* ── Шаг 1: Контакты ── */
            <div className="space-y-3">
              <div>
                <div className="font-roboto text-white/60 text-sm mb-4 leading-relaxed">
                  Оставьте номер — перезвоним, назовём цену и договоримся об удобном времени.
                </div>
              </div>

              <div>
                <label className={LBL_CLS}>Ваше имя</label>
                <input
                  autoFocus
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && goStep2()}
                  placeholder="Иван"
                  className={INP_CLS}
                />
              </div>

              <div>
                <label className={LBL_CLS}>Телефон <span className="text-[#FFD700]">*</span></label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  onFocus={() => { if (!formData.phone) setFormData(p => ({ ...p, phone: "+7" })); }}
                  onKeyDown={e => e.key === "Enter" && goStep2()}
                  placeholder="+7 (___) ___-__-__"
                  className={INP_CLS}
                />
              </div>

              {error && <p className="text-red-400 text-sm font-roboto text-center">{error}</p>}

              <button onClick={goStep2} className="btn-gold-premium btn-xl w-full mt-1">
                Далее <Icon name="ArrowRight" size={18} />
              </button>

              {/* Соцдоказательства */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <span className="flex items-center gap-1 text-white/35 text-[11px] font-roboto">
                  <Icon name="Clock" size={11} /> 15 мин ответ
                </span>
                <span className="flex items-center gap-1 text-white/35 text-[11px] font-roboto">
                  <Icon name="ShieldCheck" size={11} /> Без обязательств
                </span>
                <span className="flex items-center gap-1 text-white/35 text-[11px] font-roboto">
                  <Icon name="Star" size={11} /> 4.9 рейтинг
                </span>
              </div>
            </div>

          ) : (
            /* ── Шаг 2: Описание + фото + цена ── */
            <div className="space-y-3">
              <div className="bg-[#0D0D0D] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3 mb-1">
                <Icon name="CheckCircle2" size={16} className="text-[#FFD700] shrink-0" />
                <div className="font-roboto text-sm">
                  <span className="text-white/50">Контакты: </span>
                  <span className="text-white font-semibold">{formData.name}</span>
                  <span className="text-white/50"> · </span>
                  <span className="text-white font-semibold">{formData.phone}</span>
                </div>
              </div>

              <div>
                <label className={LBL_CLS}>Что продаёте?</label>
                <textarea
                  autoFocus
                  value={formData.desc}
                  onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                  placeholder="iPhone 14 Pro 256GB, чёрный, без трещин, все документы"
                  rows={3}
                  className={INP_CLS + " resize-none"}
                />
              </div>

              <div>
                <label className={LBL_CLS}>Желаемая цена <span className="text-white/30 normal-case font-roboto">(необязательно)</span></label>
                <div className="relative">
                  <input
                    type="number" min="0"
                    value={formData.client_price}
                    onChange={e => setFormData(p => ({ ...p, client_price: e.target.value }))}
                    placeholder="30 000"
                    className={INP_CLS + " pr-8"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 font-roboto text-sm">₽</span>
                </div>
              </div>

              {/* Фото */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={LBL_CLS + " mb-0"}>Фото <span className="text-white/30 normal-case">(необязательно)</span></label>
                  <span className="text-[#FFD700] text-[11px] font-roboto">{photos.length}/5</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 text-white flex items-center justify-center rounded-full">
                        <Icon name="X" size={9} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div onClick={() => fileRef.current?.click()}
                      className="w-16 h-16 border-2 border-dashed border-[#333] hover:border-[#FFD700] active:border-[#FFD700] rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-manipulation transition-colors">
                      <Icon name="Camera" size={18} className="text-[#FFD700]/60" />
                      <span className="font-roboto text-white/30 text-[9px]">добавить</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
              </div>

              {error && <p className="text-red-400 text-sm font-roboto text-center">{error}</p>}

              <button onClick={handleSubmit} disabled={loading} className="btn-gold-premium btn-xl w-full">
                {loading
                  ? <><Icon name="Loader" size={18} className="animate-spin" /> Отправляем...</>
                  : <><Icon name="Check" size={18} /> Отправить заявку</>
                }
              </button>

              <p className="font-roboto text-white/25 text-xs text-center">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
