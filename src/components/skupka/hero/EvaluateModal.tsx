import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import { SEND_LEAD_URL, INP_CLS, LBL_CLS, compressImage, uploadPhotoWithProgress } from "./evaluateModalShared";
import SiteRatingThankYou from "@/components/skupka/SiteRatingThankYou";

type PhotoItem = {
  preview: string;
  progress: number; // 0-100, 100 = загружено
  photo_id: number | null;
  failed: boolean;
};

export default function EvaluateModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ name: "", phone: "", desc: "", client_price: "" });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Промисы активных загрузок — ждём их все перед отправкой заявки.
  const pendingUploads = useRef<Promise<void>[]>([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.slice(0, 5 - photos.length).forEach(file => {
      const preview = URL.createObjectURL(file);
      const idx = photos.length + pendingUploads.current.length; // приблизительный индекс для обновления
      setPhotos(prev => prev.length < 5 ? [...prev, { preview, progress: 0, photo_id: null, failed: false }] : prev);
      const setProgressFor = (updater: (p: PhotoItem) => PhotoItem) => {
        setPhotos(prev => {
          const i = prev.findIndex(p => p.preview === preview);
          if (i === -1) return prev;
          const next = [...prev];
          next[i] = updater(next[i]);
          return next;
        });
      };
      const p = compressImage(file)
        .then(base64 => uploadPhotoWithProgress(base64, (pct) => {
          setProgressFor(p => ({ ...p, progress: pct }));
        }))
        .then(({ photo_id }) => {
          setProgressFor(p => ({ ...p, progress: 100, photo_id }));
        })
        .catch(() => {
          setProgressFor(p => ({ ...p, failed: true }));
        });
      pendingUploads.current.push(p);
      void idx;
    });
  };

  const goStep2 = () => {
    if (!formData.name.trim()) { setError("Введите ваше имя"); return; }
    if (!isPhoneValid(formData.phone)) { setError("Введите номер в формате +7 (___) ___-__-__"); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setError(null);
    ymGoal(Goals.FORM_SUBMIT, {});

    // Ждём завершения загрузки всех выбранных фото — они грузятся сразу при выборе,
    // так что к моменту отправки обычно уже готовы. Если фото ещё грузится — подождём.
    if (pendingUploads.current.length > 0) {
      try { await Promise.all(pendingUploads.current); } catch { /* noop */ }
    }

    // Мгновенно показываем «Спасибо» — не ждём сервер.
    setSubmitted(true);
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

    const readyPhotoIds = photos.filter(p => p.photo_id !== null).map(p => p.photo_id);
    const hasPhotos = readyPhotoIds.length > 0;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    fetch(SEND_LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        desc: hasPhotos ? `[фото] ${formData.desc}` : formData.desc,
        photo_ids: readyPhotoIds,
        contact_channels: [],
        contact_time: "",
      }),
      keepalive: true,
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        try { const data = await res.json(); if (data?.lead_id) setLeadId(data.lead_id); } catch { /* noop */ }
      })
      .catch(() => { /* отправка в фоне — ошибки не блокируют пользователя */ })
      .finally(() => clearTimeout(t));
  };

  // После успешной отправки — экран благодарности с оценкой сайта и каналом MAX
  if (submitted) {
    return <SiteRatingThankYou leadId={leadId} onClose={onClose} />;
  }

  return (
    <>
      <style>{`
        @keyframes evalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes evalSlideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes evalScaleIn {
          from { transform: scale(0.95) translateY(8px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes evalSuccessPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ animation: "evalFadeIn 0.2s ease both" }}>

        {/* Бэкдроп */}
        <div className="absolute inset-0" onClick={onClose} style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }} />

        {/* Модал */}
        <div className="relative w-full sm:max-w-md max-h-[95dvh] sm:max-h-[88dvh] overflow-y-auto overflow-x-hidden"
          style={{
            background: "linear-gradient(170deg, rgba(20,16,8,0.99) 0%, rgba(10,8,4,1) 100%)",
            border: "1px solid rgba(255,215,0,0.18)",
            borderBottom: "none",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03) inset",
            animation: "evalSlideUp 0.28s cubic-bezier(0.23,1,0.32,1) both",
          }}
          // На десктопе — другой стиль
          {...{ "data-modal": true }}
        >
          {/* Десктоп-оверрайд */}
          <style>{`
            @media (min-width: 640px) {
              [data-modal="true"] {
                border-radius: 20px !important;
                border-bottom: 1px solid rgba(255,215,0,0.18) !important;
                animation: evalScaleIn 0.25s cubic-bezier(0.23,1,0.32,1) both !important;
              }
            }
          `}</style>

          {/* Drag handle (мобайл) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,215,0,0.25)" }} />
          </div>

          {/* Световая полоска сверху */}
          <div className="absolute top-0 left-8 right-8 pointer-events-none" style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,248,232,0.8), rgba(255,215,0,0.6), transparent)",
            boxShadow: "0 0 20px rgba(255,215,0,0.4)",
          }} />

          {/* Угловое свечение */}
          <div className="absolute top-0 left-0 w-40 h-32 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 0% 0%, rgba(255,215,0,0.06) 0%, transparent 70%)",
          }} />

          {/* ── Шапка ── */}
          <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10" style={{
            background: "linear-gradient(180deg, rgba(20,16,8,0.99) 0%, rgba(14,11,6,0.97) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,215,0,0.08)",
          }}>
            {step === 2 && !submitted ? (
              <button onClick={() => { setStep(1); setError(null); }}
                className="flex items-center gap-1.5 transition-all duration-150 active:scale-95 font-roboto text-sm"
                style={{ color: "rgba(255,255,255,0.45)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                <Icon name="ChevronLeft" size={16} /> Назад
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{
                  background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                  boxShadow: "0 0 16px rgba(255,215,0,0.5)",
                }}>
                  <Icon name="Zap" size={14} className="text-black" />
                </div>
                <span className="font-oswald text-base font-bold uppercase tracking-wide" style={{
                  background: "linear-gradient(90deg, #fff8e8, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Быстрая оценка
                </span>
              </div>
            )}

            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90"
              style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <Icon name="X" size={17} />
            </button>
          </div>

          {/* Прогресс-бар (шаги) */}
          {!submitted && (
            <div className="flex gap-1 px-5 pt-3">
              {[1, 2].map(s => (
                <div key={s} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: step >= s ? "100%" : "0%",
                    background: "linear-gradient(90deg, #FFD700, #fff8a0)",
                    boxShadow: step >= s ? "0 0 8px rgba(255,215,0,0.6)" : "none",
                  }} />
                </div>
              ))}
            </div>
          )}

          <div className="p-5 pt-4">

            {/* ── Успех ── */}
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-2xl" style={{
                  background: "linear-gradient(135deg, #FFE34D, #FFD700)",
                  boxShadow: "0 0 40px rgba(255,215,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
                  animation: "evalSuccessPop 0.5s cubic-bezier(0.23,1,0.32,1) both",
                }}>
                  <Icon name="Check" size={36} className="text-black" />
                </div>
                <h3 className="font-oswald text-2xl font-bold uppercase mb-2" style={{
                  background: "linear-gradient(180deg, #fff8e8, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>Заявка принята!</h3>
                <p className="font-roboto text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Перезвоним в течение <b style={{ color: "white" }}>15 минут</b>
                </p>
                <p className="font-roboto text-xs mb-8" style={{ color: "rgba(255,255,255,0.28)" }}>
                  Работаем с 10:00 до 21:00, без выходных
                </p>
                <button onClick={onClose} className="btn-gold-premium btn-xl w-full">Закрыть</button>
              </div>

            ) : step === 1 ? (
              /* ── Шаг 1: Контакты ── */
              <div className="space-y-4">
                <p className="font-roboto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Оставьте номер — перезвоним, назовём цену и договоримся об удобном времени.
                </p>

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
                  <label className={LBL_CLS}>Телефон <span style={{ color: "#FFD700" }}>*</span></label>
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

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}>
                    <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm font-roboto">{error}</p>
                  </div>
                )}

                <button onClick={goStep2} className="btn-gold-premium btn-xl w-full mt-1">
                  Далее <Icon name="ArrowRight" size={18} />
                </button>

                {/* Соцдоказательства */}
                <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                  {[
                    { icon: "Clock", text: "15 мин ответ" },
                    { icon: "ShieldCheck", text: "Без обязательств" },
                    { icon: "Star", text: "4.9 рейтинг" },
                  ].map(({ icon, text }) => (
                    <span key={text} className="flex items-center gap-1 font-roboto text-[11px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Icon name={icon} size={11} />
                      {text}
                    </span>
                  ))}
                </div>
              </div>

            ) : (
              /* ── Шаг 2: Описание + фото + цена ── */
              <div className="space-y-4">

                {/* Карточка контактов (подтверждение) */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{
                  background: "linear-gradient(90deg, rgba(255,215,0,0.08), rgba(255,215,0,0.04))",
                  border: "1px solid rgba(255,215,0,0.15)",
                }}>
                  <Icon name="CheckCircle2" size={16} style={{ color: "#FFD700", flexShrink: 0 }} />
                  <div className="font-roboto text-sm min-w-0">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Контакты: </span>
                    <span className="font-semibold text-white truncate">{formData.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)" }}> · </span>
                    <span className="font-semibold text-white">{formData.phone}</span>
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
                  <label className={LBL_CLS}>
                    Желаемая цена <span className="normal-case font-roboto" style={{ color: "rgba(255,255,255,0.28)" }}>(необязательно)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={formData.client_price}
                      onChange={e => setFormData(p => ({ ...p, client_price: e.target.value }))}
                      placeholder="30 000"
                      className={INP_CLS + " pr-8"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-roboto text-sm"
                      style={{ color: "rgba(255,255,255,0.3)" }}>₽</span>
                  </div>
                </div>

                {/* Фото */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={LBL_CLS + " !mb-0"}>
                      Фото <span className="normal-case" style={{ color: "rgba(255,255,255,0.28)" }}>(необязательно)</span>
                    </label>
                    <span className="text-[11px] font-roboto" style={{ color: "rgba(255,215,0,0.7)" }}>{photos.length}/5</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 64, height: 64 }}>
                        <img src={p.preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: "linear-gradient(145deg, rgba(255,255,255,0.05), transparent)",
                        }} />
                        {/* Прогресс загрузки / статус */}
                        {p.failed ? (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
                            <Icon name="AlertTriangle" size={18} className="text-red-400" />
                          </div>
                        ) : p.progress < 100 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.55)" }}>
                            <Icon name="Loader2" size={16} className="animate-spin text-white/90" />
                            <span className="text-[9px] font-roboto font-bold text-white/90">{p.progress}%</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#22c55e" }}>
                            <Icon name="Check" size={10} className="text-white" />
                          </div>
                        )}
                        <button type="button" onClick={() => {
                          setPhotos(prev => prev.filter((_, i) => i !== idx));
                        }}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.85)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <Icon name="X" size={9} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <div onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1 cursor-pointer touch-manipulation transition-all duration-200 active:scale-95 rounded-xl"
                        style={{
                          width: 64, height: 64,
                          border: "1.5px dashed rgba(255,215,0,0.25)",
                          background: "rgba(255,215,0,0.04)",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,215,0,0.6)";
                          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,215,0,0.08)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,215,0,0.25)";
                          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,215,0,0.04)";
                        }}
                      >
                        <Icon name="Camera" size={18} style={{ color: "rgba(255,215,0,0.55)" }} />
                        <span className="font-roboto text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>добавить</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}>
                    <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm font-roboto">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={photos.some(p => p.progress < 100 && !p.failed)}
                  className="btn-gold-premium btn-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {photos.some(p => p.progress < 100 && !p.failed)
                    ? <><Icon name="Loader2" size={18} className="animate-spin" /> Загружаю фото…</>
                    : <><Icon name="Check" size={18} /> Отправить заявку</>}
                </button>

                <p className="font-roboto text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}