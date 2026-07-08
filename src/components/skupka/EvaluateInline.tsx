/**
 * Форма оценки устройства для встройки прямо на страницу (без модального окна).
 * Полная логика из EvaluateModal, но без backdrop/fixed-positioning.
 */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import { SEND_LEAD_URL, INP_CLS, LBL_CLS, compressImage, uploadPhotoWithProgress } from "./hero/evaluateModalShared";

const DEVICE_CATEGORIES = [
  { icon: "Smartphone", label: "Смартфон / iPhone" },
  { icon: "Tablet", label: "Планшет / iPad" },
  { icon: "Laptop", label: "Ноутбук / MacBook" },
  { icon: "Gamepad2", label: "Игровая консоль" },
  { icon: "Watch", label: "Часы / Apple Watch" },
  { icon: "Cpu", label: "Другое" },
];

type PhotoItem = {
  preview: string;
  progress: number; // 0-100, 100 = загружено
  photo_id: number | null;
  failed: boolean;
};

export default function EvaluateInline({ source = "ocenka_page" }: { source?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ name: "", phone: "", desc: "", client_price: "", category: "" });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Промисы активных загрузок — ждём их все перед отправкой заявки.
  const pendingUploads = useRef<Promise<void>[]>([]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.slice(0, 5 - photos.length).forEach(file => {
      const preview = URL.createObjectURL(file);
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
    });
  };

  const goStep2 = () => {
    if (!formData.name.trim()) { setError("Введите ваше имя"); return; }
    if (!isPhoneValid(formData.phone)) { setError("Введите номер в формате +7 (___) ___-__-__"); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    setError(null);
    ymGoal(Goals.FORM_SUBMIT, { source });

    // Фото грузятся сразу при выборе — к моменту отправки обычно уже готовы.
    // Если фото ещё грузится — подождём его завершения.
    if (pendingUploads.current.length > 0) {
      try { await Promise.all(pendingUploads.current); } catch { /* noop */ }
    }

    ymGoal(Goals.FORM_SUCCESS, { source });
    setSubmitted(true);

    const descFull = formData.category
      ? `[${formData.category}] ${formData.desc}`
      : formData.desc;
    const readyPhotoIds = photos.filter(p => p.photo_id !== null).map(p => p.photo_id);
    const hasPhotos = readyPhotoIds.length > 0;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    fetch(SEND_LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        desc: hasPhotos ? `[фото] ${descFull}` : descFull,
        photo_ids: readyPhotoIds,
        source,
      }),
      keepalive: true,
      signal: ctrl.signal,
    }).catch(() => {}).finally(() => clearTimeout(t));
  };

  // ── Экран «Спасибо» ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#FFD700]/30 bg-gradient-to-br from-[#1a1400] to-[#0a0a0a] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFD700] flex items-center justify-center mx-auto mb-5"
          style={{ boxShadow: "0 0 40px rgba(255,215,0,0.5)" }}>
          <Icon name="Check" size={32} className="text-black" />
        </div>
        <h3 className="font-oswald text-2xl font-bold uppercase mb-2">Заявка принята!</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Наш менеджер свяжется с вами в течение <strong className="text-white/90">15 минут</strong> и назовёт точную цену выкупа.
        </p>
        <div className="mt-6 text-white/40 text-xs">
          Работаем 9:00–21:00 · Калуга, ул. Кирова, 7
        </div>
      </div>
    );
  }

  const card = "rounded-2xl border border-[#FFD700]/15 overflow-hidden"
    + " bg-gradient-to-br from-[rgba(20,16,8,0.98)] to-[rgba(10,8,4,1)]";

  // ── Шаг 1: контакты ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className={card}>
        {/* Световая полоска сверху */}
        <div className="h-px w-full" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,248,232,0.8), rgba(255,215,0,0.6), transparent)",
          boxShadow: "0 0 16px rgba(255,215,0,0.3)",
        }} />

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
              <Icon name="Zap" size={18} className="text-black" />
            </div>
            <div>
              <div className="font-oswald text-lg font-bold uppercase tracking-wide"
                style={{ background: "linear-gradient(90deg,#fff8e8,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Быстрая оценка онлайн
              </div>
              <div className="text-white/40 text-xs">Ответим за 15 минут</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={LBL_CLS}>Ваше имя</label>
              <input className={INP_CLS} placeholder="Александр" value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && goStep2()} />
            </div>
            <div>
              <label className={LBL_CLS}>Телефон</label>
              <input className={INP_CLS} placeholder="+7 (___) ___-__-__"
                inputMode="tel" value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                onKeyDown={e => e.key === "Enter" && goStep2()} />
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <Icon name="AlertCircle" size={14} /> {error}
            </div>
          )}

          <button onClick={goStep2}
            className="group relative overflow-hidden mt-6 w-full py-4 rounded-xl font-oswald font-bold uppercase tracking-wide text-black text-base active:scale-95 transition-all flex items-center justify-center gap-2
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center gap-2">
              Далее — описать устройство
              <Icon name="ArrowRight" size={18} />
            </span>
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-white/25 text-[11px] font-roboto">
            <span className="flex items-center gap-1"><Icon name="Shield" size={11} /> Данные защищены</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Icon name="Clock" size={11} /> Ответим за 15 минут</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Шаг 2: устройство ────────────────────────────────────────────────────
  return (
    <div className={card}>
      <div className="h-px w-full" style={{
        background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,248,232,0.8), rgba(255,215,0,0.6), transparent)",
        boxShadow: "0 0 16px rgba(255,215,0,0.3)",
      }} />

      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => { setStep(1); setError(null); }}
            className="text-white/40 hover:text-white/80 transition-colors">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <span className="font-oswald text-base font-bold uppercase text-white/70">Опишите устройство</span>
        </div>

        {/* Категории */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {DEVICE_CATEGORIES.map(c => (
            <button key={c.label} onClick={() => setFormData(p => ({ ...p, category: c.label }))}
              className={`rounded-xl p-2.5 border text-center transition-all flex flex-col items-center gap-1.5 ${
                formData.category === c.label
                  ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]"
                  : "border-white/[0.08] text-white/50 hover:border-white/20"
              }`}>
              <Icon name={c.icon} size={18} />
              <span className="text-[10px] font-roboto leading-tight">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className={LBL_CLS}>Модель и состояние</label>
            <textarea className={INP_CLS} rows={3}
              placeholder={'iPhone 14 Pro 256GB, чёрный, без трещин\nXiaomi Redmi Note 12, сломан экран'}
              value={formData.desc}
              onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))} />
          </div>

          <div>
            <label className={LBL_CLS}>Желаемая цена (необязательно)</label>
            <input className={INP_CLS} placeholder="50 000 ₽" inputMode="numeric"
              value={formData.client_price}
              onChange={e => setFormData(p => ({ ...p, client_price: e.target.value }))} />
          </div>

          {/* Фото */}
          <div>
            <label className={LBL_CLS}>Фото устройства (до 5 штук)</label>
            <div className="flex gap-2 flex-wrap">
              {photos.map((ph, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                  <img src={ph.preview} alt="" className="w-full h-full object-cover" />
                  {ph.failed ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                      <Icon name="AlertTriangle" size={16} className="text-red-400" />
                    </div>
                  ) : ph.progress < 100 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55">
                      <Icon name="Loader2" size={14} className="animate-spin text-white/90" />
                      <span className="text-[9px] font-roboto font-bold text-white/90">{ph.progress}%</span>
                    </div>
                  ) : (
                    <div className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-emerald-500">
                      <Icon name="Check" size={9} className="text-white" />
                    </div>
                  )}
                  <button onClick={() => {
                    setPhotos(prev => prev.filter((_, j) => j !== i));
                  }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/70 hover:text-white">
                    <Icon name="X" size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-xl border border-dashed border-white/20 hover:border-[#FFD700]/50 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-[#FFD700] transition-colors">
                  <Icon name="Camera" size={18} />
                  <span className="text-[9px]">Добавить</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <Icon name="AlertCircle" size={14} /> {error}
          </div>
        )}

        <button onClick={handleSubmit}
          disabled={photos.some(p => p.progress < 100 && !p.failed)}
          className="group relative overflow-hidden mt-6 w-full py-4 rounded-xl font-oswald font-bold uppercase tracking-wide text-black text-base active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <span className="relative flex items-center gap-2">
            {photos.some(p => p.progress < 100 && !p.failed) ? (
              <><Icon name="Loader2" size={18} className="animate-spin" /> Загружаю фото…</>
            ) : (
              <><Icon name="Send" size={18} /> Отправить — получить оценку</>
            )}
          </span>
        </button>

        <p className="mt-3 text-center text-white/25 text-[10px] font-roboto">
          Нажимая «Отправить», вы соглашаетесь на обработку персональных данных
        </p>
      </div>
    </div>
  );
}