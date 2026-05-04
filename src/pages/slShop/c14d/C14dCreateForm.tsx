import { useState, useMemo, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi,
  fileToBase64,
  fmt,
  ITEM_TYPES,
  ACCESSORIES_OPTIONS,
  CONDITION_OPTIONS,
  type C14dPhoto,
  type C14dCashAccount,
} from "./types";

type Props = {
  token: string;
  onCreated: (id: number) => void;
  onCancel: () => void;
  prefill?: { full_name?: string; phone?: string; amount?: number; start_date?: string } | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const inp = "w-full rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white placeholder:text-white/30 transition";
const lbl = "block text-[11px] uppercase tracking-wider font-semibold text-white/60 mb-1";

export default function C14dCreateForm({ token, onCreated, onCancel, prefill }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Клиент
  const [fullName, setFullName] = useState(prefill?.full_name || "");
  const [birthDate, setBirthDate] = useState("");
  const [passSeries, setPassSeries] = useState("");
  const [passNumber, setPassNumber] = useState("");
  const [passIssuedBy, setPassIssuedBy] = useState("");
  const [passIssueDate, setPassIssueDate] = useState("");
  const [phone, setPhone] = useState(prefill?.phone || "");
  const [email, setEmail] = useState("");

  // Имущество
  const [itemType, setItemType] = useState(ITEM_TYPES[0]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [condition, setCondition] = useState(CONDITION_OPTIONS[1]);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Условия + дата
  const [amount, setAmount] = useState<string>(prefill?.amount ? String(prefill.amount) : "");
  const interest_rate = 4;
  const term_days = 14;
  const [agreed, setAgreed] = useState(false);
  const [isLate, setIsLate] = useState<boolean>(!!prefill?.start_date);
  const [startDate, setStartDate] = useState<string>(prefill?.start_date || todayISO());

  // Кассы
  const [accounts, setAccounts] = useState<C14dCashAccount[]>([]);
  const [cashAccountId, setCashAccountId] = useState<string>("");
  const [skipCash, setSkipCash] = useState(false);

  useEffect(() => {
    c14dApi<{ accounts: C14dCashAccount[] }>(token, "cash_accounts").then(r => {
      if (r.ok && r.data) {
        setAccounts(r.data.accounts);
        const def = r.data.accounts.find(a => a.is_default) || r.data.accounts[0];
        if (def) setCashAccountId(String(def.id));
      }
    });
  }, [token]);

  // При late-договоре по умолчанию не списываем из кассы (деньги уже выданы)
  useEffect(() => {
    if (isLate) setSkipCash(true);
  }, [isLate]);

  const endDateISO = useMemo(() => {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + term_days);
    return d.toISOString().slice(0, 10);
  }, [startDate]);

  // Фото
  const [photos, setPhotos] = useState<C14dPhoto[]>([]);
  const [uploading, setUploading] = useState<"passport" | "device" | null>(null);
  const passInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  const calc = useMemo(() => {
    const a = Number(amount) || 0;
    const interest = Math.round(a * interest_rate / 100 * term_days * 100) / 100;
    const total = Math.round((a + interest) * 100) / 100;
    const daily = Math.round((total / term_days) * 100) / 100;
    return { principal: a, interest, total_due: total, daily_payment: daily };
  }, [amount]);

  const toggleAcc = (a: string) => {
    setAccessories(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  };

  const handleFile = async (file: File, photo_type: "passport" | "device") => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Файл больше 5 МБ");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      setError("Формат: JPG / PNG / WEBP");
      return;
    }
    setError(null);
    setUploading(photo_type);
    try {
      const b64 = await fileToBase64(file);
      const r = await c14dApi<{ file_url: string; s3_key: string }>(token, "upload_photo", {
        method: "POST",
        body: { photo_type, file_base64: b64, filename: file.name },
      });
      if (!r.ok || !r.data) {
        setError(r.error || "Ошибка загрузки");
        return;
      }
      setPhotos(p => [...p.filter(x => x.photo_type !== photo_type), { photo_type, file_url: r.data!.file_url, s3_key: r.data!.s3_key }]);
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (t: "passport" | "device") => setPhotos(p => p.filter(x => x.photo_type !== t));

  const submit = async (asDraft: boolean) => {
    setError(null);
    if (!fullName.trim()) { setError("ФИО клиента обязательно"); return; }
    const a = Number(amount);
    if (!a || a <= 0) { setError("Укажите сумму выдачи"); return; }
    if (!asDraft && !agreed) { setError("Подтвердите ознакомление клиента"); return; }
    if (isLate && !startDate) { setError("Укажите дату заключения договора"); return; }
    if (startDate && startDate > todayISO()) { setError("Дата заключения не может быть в будущем"); return; }
    setSaving(true);
    const r = await c14dApi<{ id: number; contract_number: string }>(token, "create", {
      method: "POST",
      body: {
        client: {
          full_name: fullName.trim(),
          birth_date: birthDate || null,
          passport_series: passSeries.trim() || null,
          passport_number: passNumber.trim() || null,
          passport_issued_by: passIssuedBy.trim() || null,
          passport_issue_date: passIssueDate || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
        },
        item: {
          item_type: itemType,
          brand: brand.trim() || null,
          model: model.trim() || null,
          serial_number: serial.trim() || null,
          condition,
          accessories,
          notes: notes.trim() || null,
        },
        amount: a,
        interest_rate,
        term_days,
        status: asDraft ? "draft" : "active",
        photos,
        start_date: startDate || todayISO(),
        cash_account_id: cashAccountId ? Number(cashAccountId) : null,
        skip_cash: skipCash,
      },
    });
    setSaving(false);
    if (!r.ok || !r.data) {
      setError(r.error || "Ошибка сохранения");
      return;
    }
    onCreated(r.data.id);
  };

  const passPhoto = photos.find(p => p.photo_type === "passport");
  const devicePhoto = photos.find(p => p.photo_type === "device");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>
        <div className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Создать договор</div>
      </div>

      {/* Клиент */}
      <section className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="User" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Клиент</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>ФИО клиента *</label>
            <input className={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
          </div>
          <div>
            <label className={lbl}>Дата рождения</label>
            <input className={inp} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Серия паспорта</label>
            <input className={inp} value={passSeries} onChange={e => setPassSeries(e.target.value)} placeholder="0000" maxLength={5} />
          </div>
          <div>
            <label className={lbl}>Номер паспорта</label>
            <input className={inp} value={passNumber} onChange={e => setPassNumber(e.target.value)} placeholder="000000" maxLength={7} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Кем выдан</label>
            <input className={inp} value={passIssuedBy} onChange={e => setPassIssuedBy(e.target.value)} placeholder="ОУФМС России по г. Калуге" />
          </div>
          <div>
            <label className={lbl}>Дата выдачи</label>
            <input className={inp} type="date" value={passIssueDate} onChange={e => setPassIssueDate(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Телефон</label>
            <input className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" type="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>E-mail (опционально)</label>
            <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@mail.ru" />
          </div>
        </div>
      </section>

      {/* Фото */}
      <section className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Camera" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Фото</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            { type: "passport" as const, label: "Фото паспорта (разворот)", hint: "JPG/PNG, до 5 МБ", ref: passInputRef, photo: passPhoto },
            { type: "device" as const, label: "Фото устройства", hint: "С видимым серийным номером", ref: deviceInputRef, photo: devicePhoto },
          ]).map(({ type, label, hint, ref, photo }) => (
            <div key={type} className="rounded-lg border border-dashed border-[#2a2a2a] p-3 bg-[#0F0F0F]">
              <div className="text-[12px] font-semibold text-white/80 mb-1">{label}</div>
              <div className="text-[10px] text-white/40 mb-2">{hint}</div>
              {photo ? (
                <div className="relative">
                  <img src={photo.file_url} alt={type} className="w-full h-40 object-contain rounded bg-black/50" />
                  <button onClick={() => removePhoto(type)} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1">
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => ref.current?.click()}
                  disabled={uploading === type}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  {uploading === type ? (
                    <><Icon name="Loader2" size={14} className="animate-spin" /> Загрузка...</>
                  ) : (
                    <><Icon name="Upload" size={14} /> Загрузить</>
                  )}
                </button>
              )}
              <input
                ref={ref}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, type);
                  e.target.value = "";
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Имущество */}
      <section className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Package" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Имущество</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Тип</label>
            <select className={inp} value={itemType} onChange={e => setItemType(e.target.value)}>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Состояние</label>
            <select className={inp} value={condition} onChange={e => setCondition(e.target.value)}>
              {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Марка</label>
            <input className={inp} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Apple" />
          </div>
          <div>
            <label className={lbl}>Модель</label>
            <input className={inp} value={model} onChange={e => setModel(e.target.value)} placeholder="iPhone 13" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Серийный номер / IMEI</label>
            <input className={inp} value={serial} onChange={e => setSerial(e.target.value)} placeholder="ABC123XYZ" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Комплектация</label>
            <div className="flex flex-wrap gap-1.5">
              {ACCESSORIES_OPTIONS.map(a => {
                const on = accessories.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAcc(a)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition ${on ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-[#0F0F0F] text-white/60 border-[#222] hover:border-[#FFD700]/40"}`}
                  >
                    {on && <Icon name="Check" size={11} className="inline mr-1" />}
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Особые отметки</label>
            <textarea className={inp + " min-h-[70px] resize-y"} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Замечания оценщика..." />
          </div>
        </div>
      </section>

      {/* Условия */}
      <section className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Calculator" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Условия договора</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={lbl}>Сумма выдачи, ₽ *</label>
            <input className={inp + " text-lg font-bold"} type="number" inputMode="decimal" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="25 000" />
          </div>
          <div>
            <label className={lbl}>Ставка</label>
            <div className="px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#222] text-sm text-white/80">4% в день</div>
          </div>
          <div>
            <label className={lbl}>Срок</label>
            <div className="px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#222] text-sm text-white/80">14 дней</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { l: "Сумма выдачи", v: calc.principal, c: "text-white" },
            { l: "Проценты за 14 дней", v: calc.interest, c: "text-orange-300" },
            { l: "К возврату", v: calc.total_due, c: "text-[#FFD700]" },
            { l: "В день", v: calc.daily_payment, c: "text-white/70" },
          ].map(x => (
            <div key={x.l} className="rounded-lg bg-black/40 border border-white/5 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wider text-white/50">{x.l}</div>
              <div className={`font-oswald text-base font-bold ${x.c}`}>{fmt(x.v)} ₽</div>
            </div>
          ))}
        </div>
      </section>

      {/* Дата заключения и касса */}
      <section className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="CalendarClock" size={16} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-sm tracking-wide">Дата и касса</h3>
        </div>

        <label className="flex items-start gap-2 text-sm text-white/80 cursor-pointer select-none mb-3">
          <input type="checkbox" checked={isLate} onChange={e => { setIsLate(e.target.checked); if (!e.target.checked) setStartDate(todayISO()); }} className="mt-1 accent-[#FFD700]" />
          <span>
            <b>Добавить договор задним числом</b>
            <div className="text-[11px] text-white/50">Используйте, если договор был заключён ранее, но не внесён в систему. Деньги по умолчанию не списываются из кассы.</div>
          </span>
        </label>

        <div className="grid sm:grid-cols-3 gap-3 mb-2">
          <div>
            <label className={lbl}>Дата заключения {isLate && <span className="text-red-300">*</span>}</label>
            <input
              className={inp}
              type="date"
              value={startDate}
              max={todayISO()}
              onChange={e => setStartDate(e.target.value)}
              disabled={!isLate}
            />
          </div>
          <div>
            <label className={lbl}>Дата окончания</label>
            <div className="px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#222] text-sm text-[#FFD700] font-semibold">{endDateISO || "—"}</div>
          </div>
          <div>
            <label className={lbl}>Касса (выдача наличных)</label>
            <select
              className={inp}
              value={cashAccountId}
              onChange={e => setCashAccountId(e.target.value)}
              disabled={skipCash}
            >
              {accounts.length === 0 && <option value="">Нет активных касс</option>}
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({fmt(a.balance)} ₽){a.is_default ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 text-[12px] text-white/70 cursor-pointer select-none">
          <input type="checkbox" checked={skipCash} onChange={e => setSkipCash(e.target.checked)} className="mt-1 accent-[#FFD700]" />
          <span>
            Не списывать сумму с кассы (только зарегистрировать договор)
            {isLate && <span className="text-[#FFD700]/70"> · по умолчанию для договоров задним числом</span>}
          </span>
        </label>
      </section>

      <label className="flex items-start gap-2 text-sm text-white/80 cursor-pointer select-none">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 accent-[#FFD700]" />
        <span>Клиент ознакомлен с условиями договора, в том числе с запретом продажи имущества в течение 14 дней.</span>
      </label>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 text-sm flex items-center gap-2">
          <Icon name="AlertTriangle" size={14} /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => submit(false)}
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold uppercase tracking-wider text-sm transition active:scale-95 disabled:opacity-50"
        >
          {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="FileSignature" size={16} />}
          Подписать и сохранить
        </button>
        <button
          onClick={() => submit(true)}
          disabled={saving}
          className="px-4 py-3 rounded-lg bg-[#0F0F0F] border border-[#222] hover:border-[#FFD700]/40 text-white/80 font-bold uppercase tracking-wider text-sm transition active:scale-95"
        >
          <Icon name="Save" size={14} className="inline mr-1" /> Черновик
        </button>
      </div>
    </div>
  );
}