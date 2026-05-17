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
import { slApi } from "../types";
import { SLSection, SLField, SLInput, SLTextarea, SLSelect, SLButton, SLCheckbox, SLGrid } from "../slUI";

type PassportData = {
  full_name?: string;
  series?: string;
  number?: string;
  issued_by?: string;
  issued_date?: string | null;
  birth_date?: string | null;
  address?: string;
  _ocr_error?: string;
};

type Props = {
  token: string;
  onCreated: (id: number) => void;
  onCancel: () => void;
  prefill?: { full_name?: string; phone?: string; amount?: number; start_date?: string } | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function C14dCreateForm({ token, onCreated, onCancel, prefill }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(prefill?.full_name || "");
  const [birthDate, setBirthDate] = useState("");
  const [passSeries, setPassSeries] = useState("");
  const [passNumber, setPassNumber] = useState("");
  const [passIssuedBy, setPassIssuedBy] = useState("");
  const [passIssueDate, setPassIssueDate] = useState("");
  const [phone, setPhone] = useState(prefill?.phone || "");
  const [email, setEmail] = useState("");

  const [itemType, setItemType] = useState(ITEM_TYPES[0]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [condition, setCondition] = useState(CONDITION_OPTIONS[1]);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [amount, setAmount] = useState<string>(prefill?.amount ? String(prefill.amount) : "");
  const interest_rate = 4;
  const term_days = 14;
  const [agreed, setAgreed] = useState(false);
  const [isLate, setIsLate] = useState<boolean>(!!prefill?.start_date);
  const [startDate, setStartDate] = useState<string>(prefill?.start_date || todayISO());

  const [photos, setPhotos] = useState<C14dPhoto[]>([]);
  const [uploading, setUploading] = useState<"passport" | "device" | null>(null);
  const passInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  // ИИ-сканер паспорта (как в скупке)
  const [scanBusy, setScanBusy] = useState(false);
  const [scanInfo, setScanInfo] = useState<string | null>(null);
  const [recognizedFields, setRecognizedFields] = useState<Set<string>>(new Set());
  const scanCameraRef = useRef<HTMLInputElement>(null);
  const scanGalleryRef = useRef<HTMLInputElement>(null);

  const applyPassportData = (pd: PassportData) => {
    const filled = new Set<string>(recognizedFields);
    if (pd.full_name && !fullName.trim()) { setFullName(pd.full_name); filled.add("fullName"); }
    if (pd.series && !passSeries.trim()) { setPassSeries(pd.series); filled.add("series"); }
    if (pd.number && !passNumber.trim()) { setPassNumber(pd.number); filled.add("number"); }
    if (pd.issued_by && !passIssuedBy.trim()) { setPassIssuedBy(pd.issued_by); filled.add("issuedBy"); }
    if (pd.issued_date && !passIssueDate) { setPassIssueDate(pd.issued_date); filled.add("issuedDate"); }
    if (pd.birth_date && !birthDate) { setBirthDate(pd.birth_date); filled.add("birthDate"); }
    setRecognizedFields(filled);
    if (filled.size > recognizedFields.size) {
      setScanInfo(`ИИ распознал данные паспорта: ${filled.size} полей. Проверь и поправь, если нужно.`);
      setTimeout(() => setScanInfo(null), 6000);
    } else if (pd._ocr_error) {
      setScanInfo("Фото сохранено, но автоматически распознать данные не удалось. Заполни вручную.");
      setTimeout(() => setScanInfo(null), 6000);
    }
  };

  const handleScanPassport = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { setError("Файл больше 8 МБ"); return; }
    setError(null);
    setScanBusy(true);
    try {
      const b64 = await fileToBase64(file);
      const r = await slApi<{ url: string; passport_data?: PassportData }>(token, "client_passport_upload", {
        method: "POST",
        body: { image_base64: b64, field: "passport_photo_url", recognize: true },
      });
      if (!r.ok || !r.data) { setError(r.error || "Ошибка распознавания"); return; }
      // Подкладываем загруженное фото в общий список фото договора
      if (r.data.url) {
        setPhotos(p => [...p.filter(x => x.photo_type !== "passport"), { photo_type: "passport", file_url: r.data!.url, s3_key: null }]);
      }
      if (r.data.passport_data) applyPassportData(r.data.passport_data);
    } finally {
      setScanBusy(false);
    }
  };

  const aiBadge = (key: string) => recognizedFields.has(key) ? (
    <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 align-middle">
      <Icon name="Sparkles" size={8} /> ИИ
    </span>
  ) : null;

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

  useEffect(() => { if (isLate) setSkipCash(true); }, [isLate]);

  const endDateISO = useMemo(() => {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + term_days);
    return d.toISOString().slice(0, 10);
  }, [startDate]);

  const calc = useMemo(() => {
    const a = Number(amount) || 0;
    const interest = Math.round(a * interest_rate / 100 * term_days * 100) / 100;
    const total = Math.round((a + interest) * 100) / 100;
    const daily = Math.round((total / term_days) * 100) / 100;
    return { principal: a, interest, total_due: total, daily_payment: daily };
  }, [amount]);

  const toggleAcc = (a: string) => setAccessories(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleFile = async (file: File, photo_type: "passport" | "device") => {
    if (file.size > 5 * 1024 * 1024) { setError("Файл больше 5 МБ"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) { setError("Формат: JPG/PNG/WEBP"); return; }
    setError(null);
    setUploading(photo_type);
    try {
      const b64 = await fileToBase64(file);
      const r = await c14dApi<{ file_url: string; s3_key: string }>(token, "upload_photo", {
        method: "POST",
        body: { photo_type, file_base64: b64, filename: file.name },
      });
      if (!r.ok || !r.data) { setError(r.error || "Ошибка загрузки"); return; }
      setPhotos(p => [...p.filter(x => x.photo_type !== photo_type), { photo_type, file_url: r.data!.file_url, s3_key: r.data!.s3_key }]);
    } finally { setUploading(null); }
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
        interest_rate, term_days,
        status: asDraft ? "draft" : "active",
        photos,
        start_date: startDate || todayISO(),
        cash_account_id: cashAccountId ? Number(cashAccountId) : null,
        skip_cash: skipCash,
      },
    });
    setSaving(false);
    if (!r.ok || !r.data) { setError(r.error || "Ошибка сохранения"); return; }
    onCreated(r.data.id);
  };

  const passPhoto = photos.find(p => p.photo_type === "passport");
  const devicePhoto = photos.find(p => p.photo_type === "device");

  return (
    <div className="space-y-2">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={onCancel} className="inline-flex items-center gap-1 text-white/60 hover:text-white text-[12px] font-semibold">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <div className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-bold">Новый договор · 14 дней</div>
      </div>

      {/* Клиент */}
      <SLSection icon="User" title="Клиент">
        {/* ИИ-сканер паспорта */}
        <div className="mb-3">
          <div className="bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                <Icon name={scanBusy ? "Loader2" : "Sparkles"} size={20} className={`text-[#FFD700] ${scanBusy ? "animate-spin" : ""}`} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-bold text-[#FFD700] text-[12px] uppercase tracking-wide flex items-center gap-1.5">
                  {scanBusy ? "Распознаю данные…" : "Распознать паспорт"}
                  {!scanBusy && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 normal-case tracking-normal font-semibold">
                      ИИ
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/55 leading-tight mt-0.5">
                  ИИ сам заполнит ФИО, серию, номер, кем выдан, дату выдачи и дату рождения
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => scanCameraRef.current?.click()}
                disabled={scanBusy}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FFD700] hover:bg-[#FFE34D] disabled:opacity-50 text-black font-bold text-[11px] uppercase tracking-wide rounded-md py-2.5 active:scale-[0.98] transition-all"
              >
                <Icon name="Camera" size={14} />
                Снять с камеры
              </button>
              <button
                type="button"
                onClick={() => scanGalleryRef.current?.click()}
                disabled={scanBusy}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FFD700]/12 hover:bg-[#FFD700]/20 border border-[#FFD700]/40 disabled:opacity-50 text-[#FFD700] font-bold text-[11px] uppercase tracking-wide rounded-md py-2.5 active:scale-[0.98] transition-all"
              >
                <Icon name="Image" size={14} />
                Из галереи
              </button>
            </div>
          </div>
          <input
            ref={scanCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) handleScanPassport(f); e.target.value = ""; }}
          />
          <input
            ref={scanGalleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) handleScanPassport(f); e.target.value = ""; }}
          />
          {scanInfo && (
            <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-1.5 text-[11px] flex items-start gap-1.5">
              <Icon name="Sparkles" size={11} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{scanInfo}</span>
            </div>
          )}
        </div>

        <SLGrid cols={2}>
          <SLField label={<>ФИО{aiBadge("fullName")}</>} required className="sm:col-span-2"><SLInput value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" /></SLField>
          <SLField label={<>Дата рождения{aiBadge("birthDate")}</>}><SLInput type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></SLField>
          <SLField label="Телефон"><SLInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" /></SLField>
          <SLField label={<>Серия{aiBadge("series")}</>}><SLInput value={passSeries} onChange={e => setPassSeries(e.target.value)} placeholder="0000" maxLength={5} /></SLField>
          <SLField label={<>Номер{aiBadge("number")}</>}><SLInput value={passNumber} onChange={e => setPassNumber(e.target.value)} placeholder="000000" maxLength={7} /></SLField>
          <SLField label={<>Кем выдан{aiBadge("issuedBy")}</>} className="sm:col-span-2"><SLInput value={passIssuedBy} onChange={e => setPassIssuedBy(e.target.value)} placeholder="ОУФМС России…" /></SLField>
          <SLField label={<>Дата выдачи{aiBadge("issuedDate")}</>}><SLInput type="date" value={passIssueDate} onChange={e => setPassIssueDate(e.target.value)} /></SLField>
          <SLField label="E-mail"><SLInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ivan@mail.ru" /></SLField>
        </SLGrid>
      </SLSection>

      {/* Фото */}
      <SLSection icon="Camera" title="Фото">
        <SLGrid cols={2}>
          {([
            { type: "passport" as const, label: "Паспорт (разворот)", ref: passInputRef, photo: passPhoto },
            { type: "device" as const, label: "Устройство", ref: deviceInputRef, photo: devicePhoto },
          ]).map(({ type, label, ref, photo }) => (
            <div key={type} className="rounded-md border border-dashed border-[#2a2a2a] bg-[#0A0A0A] p-1.5">
              <div className="text-[10px] text-white/55 mb-1 uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>{label}</span>
                {photo && <button onClick={() => removePhoto(type)} className="text-red-300/80 hover:text-red-300"><Icon name="X" size={11} /></button>}
              </div>
              {photo ? (
                <img src={photo.file_url} alt={type} className="w-full h-24 object-cover rounded bg-black/50" />
              ) : (
                <button
                  onClick={() => ref.current?.click()}
                  disabled={uploading === type}
                  className="w-full h-24 inline-flex flex-col items-center justify-center gap-1 rounded bg-[#FFD700]/8 hover:bg-[#FFD700]/15 border border-[#FFD700]/25 text-[#FFD700] text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <Icon name={uploading === type ? "Loader2" : "Upload"} size={16} className={uploading === type ? "animate-spin" : ""} />
                  <span>{uploading === type ? "Загрузка…" : "Загрузить"}</span>
                  <span className="text-[8px] text-[#FFD700]/60 normal-case tracking-normal">JPG/PNG · до 5 МБ</span>
                </button>
              )}
              <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, type); e.target.value = ""; }} />
            </div>
          ))}
        </SLGrid>
      </SLSection>

      {/* Имущество */}
      <SLSection icon="Package" title="Имущество">
        <SLGrid cols={2}>
          <SLField label="Тип"><SLSelect value={itemType} onChange={e => setItemType(e.target.value)}>{ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</SLSelect></SLField>
          <SLField label="Состояние"><SLSelect value={condition} onChange={e => setCondition(e.target.value)}>{CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</SLSelect></SLField>
          <SLField label="Марка"><SLInput value={brand} onChange={e => setBrand(e.target.value)} placeholder="Apple" /></SLField>
          <SLField label="Модель"><SLInput value={model} onChange={e => setModel(e.target.value)} placeholder="iPhone 13" /></SLField>
          <SLField label="Серийный / IMEI" className="sm:col-span-2"><SLInput value={serial} onChange={e => setSerial(e.target.value)} placeholder="ABC123XYZ" /></SLField>
          <SLField label="Комплектация" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1">
              {ACCESSORIES_OPTIONS.map(a => {
                const on = accessories.includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleAcc(a)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border transition ${on ? "bg-[#FFD700] text-black border-[#FFD700]" : "bg-[#0A0A0A] text-white/55 border-[#1F1F1F] hover:border-[#FFD700]/40"}`}>
                    {on && <Icon name="Check" size={9} className="inline mr-0.5" />}{a}
                  </button>
                );
              })}
            </div>
          </SLField>
          <SLField label="Отметки" className="sm:col-span-2"><SLTextarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Замечания оценщика…" /></SLField>
        </SLGrid>
      </SLSection>

      {/* Условия */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-2.5 sm:p-3 shadow-[0_0_20px_rgba(255,215,0,0.06)]">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon name="Calculator" size={12} className="text-[#FFD700]" />
          <h3 className="font-oswald uppercase text-[12px] tracking-[0.06em] font-bold">Условия</h3>
        </div>
        <SLGrid cols={3}>
          <SLField label="Сумма выдачи ₽" required>
            <SLInput type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="25 000" className="font-bold text-[14px]" />
          </SLField>
          <SLField label="Ставка"><div className="rounded-md bg-[#0A0A0A] border border-[#1A1A1A] px-2.5 py-1.5 text-[12px] text-white/70">4% / день</div></SLField>
          <SLField label="Срок"><div className="rounded-md bg-[#0A0A0A] border border-[#1A1A1A] px-2.5 py-1.5 text-[12px] text-white/70">14 дней</div></SLField>
        </SLGrid>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {[
            { l: "Выдача", v: calc.principal, c: "text-white" },
            { l: "Проценты", v: calc.interest, c: "text-orange-300" },
            { l: "К возврату", v: calc.total_due, c: "text-[#FFD700]" },
            { l: "В день", v: calc.daily_payment, c: "text-white/60" },
          ].map(x => (
            <div key={x.l} className="rounded-md bg-black/40 border border-white/5 px-2 py-1 text-center">
              <div className="text-[8px] uppercase tracking-wider text-white/40 font-bold">{x.l}</div>
              <div className={`font-oswald text-[13px] font-bold leading-tight ${x.c}`}>{fmt(x.v)} ₽</div>
            </div>
          ))}
        </div>
      </div>

      {/* Дата + касса */}
      <SLSection icon="CalendarClock" title="Дата и касса">
        <SLCheckbox
          checked={isLate}
          onChange={(v) => { setIsLate(v); if (!v) setStartDate(todayISO()); }}
          label={<b>Договор задним числом</b>}
          hint="Используйте, если договор заключён ранее. Деньги по умолчанию не списываются с кассы."
        />
        <div className="mt-2">
          <SLGrid cols={3}>
            <SLField label={<>Дата заключения{isLate && <span className="text-red-400">*</span>}</>}>
              <SLInput type="date" value={startDate} max={todayISO()} onChange={e => setStartDate(e.target.value)} disabled={!isLate} />
            </SLField>
            <SLField label="Дата окончания">
              <div className="rounded-md bg-[#0A0A0A] border border-[#1A1A1A] px-2.5 py-1.5 text-[12px] text-[#FFD700] font-semibold">{endDateISO || "—"}</div>
            </SLField>
            <SLField label="Касса (выдача)">
              <SLSelect value={cashAccountId} onChange={e => setCashAccountId(e.target.value)} disabled={skipCash}>
                {accounts.length === 0 && <option value="">Нет касс</option>}
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {fmt(a.balance)}{a.is_default ? " ★" : ""}</option>)}
              </SLSelect>
            </SLField>
          </SLGrid>
        </div>
        <div className="mt-2">
          <SLCheckbox checked={skipCash} onChange={setSkipCash} label="Не списывать с кассы" />
        </div>
      </SLSection>

      {/* Согласие */}
      <SLCheckbox checked={agreed} onChange={setAgreed} label="Клиент ознакомлен с условиями договора, в т.ч. с запретом продажи имущества в течение 14 дней." />

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px] flex items-center gap-1.5">
          <Icon name="AlertTriangle" size={12} /> {error}
        </div>
      )}

      {/* Действия */}
      <div className="flex gap-2 sticky bottom-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent pt-2 pb-1 -mx-1 px-1 z-10">
        <SLButton variant="gold" size="lg" icon="FileSignature" onClick={() => submit(false)} disabled={saving} className="flex-1">
          {saving ? "Сохраняю…" : "Подписать и сохранить"}
        </SLButton>
        <SLButton variant="dark" size="lg" icon="Save" onClick={() => submit(true)} disabled={saving}>Черновик</SLButton>
      </div>
    </div>
  );
}