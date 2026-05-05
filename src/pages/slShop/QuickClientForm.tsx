import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi } from "./types";
import { SLField, SLInput, SLButton, SLGrid } from "./slUI";

type Props = {
  token: string;
  onCreated: (clientId: number, fullName: string) => void;
  onCancel?: () => void;
};

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

/** Быстрое создание клиента: 1) фото паспорта с камеры, 2) AI распознаёт данные,
 *  3) сотрудник проверяет/правит и нажимает "Создать". */
export default function QuickClientForm({ token, onCreated, onCancel }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photo2Url, setPhoto2Url] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photo2Busy, setPhoto2Busy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [recognizedFields, setRecognizedFields] = useState<Set<string>>(new Set());
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [series, setSeries] = useState("");
  const [number, setNumber] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  // Записываем в state только пустые поля — не затираем то, что сотрудник уже исправил
  const applyPassportData = (pd: PassportData) => {
    const filled = new Set<string>(recognizedFields);
    if (pd.full_name && !fullName.trim()) { setFullName(pd.full_name); filled.add("fullName"); }
    if (pd.series && !series.trim()) { setSeries(pd.series); filled.add("series"); }
    if (pd.number && !number.trim()) { setNumber(pd.number); filled.add("number"); }
    if (pd.issued_by && !issuedBy.trim()) { setIssuedBy(pd.issued_by); filled.add("issuedBy"); }
    if (pd.issued_date && !issuedDate) { setIssuedDate(pd.issued_date); filled.add("issuedDate"); }
    if (pd.birth_date && !birthDate) { setBirthDate(pd.birth_date); filled.add("birthDate"); }
    if (pd.address && !address.trim()) { setAddress(pd.address); filled.add("address"); }
    setRecognizedFields(filled);
    if (filled.size > recognizedFields.size) {
      setInfo(`ИИ распознал данные из паспорта: ${filled.size} полей. Проверь и поправь, если нужно.`);
      setTimeout(() => setInfo(null), 5000);
    } else if (pd._ocr_error) {
      setInfo("Фото сохранено, но автоматически распознать данные не удалось. Заполни вручную.");
      setTimeout(() => setInfo(null), 5000);
    }
  };

  const onPhoto = async (file: File, fieldKey: "passport_photo_url" | "passport_photo2_url") => {
    const isMain = fieldKey === "passport_photo_url";
    if (isMain) setPhotoBusy(true); else setPhoto2Busy(true);
    setErr(null); setInfo(null);
    try {
      // Сжимаем фото на клиенте (максимум 1600px по длинной стороне)
      const compressed = await compressImage(file, 1600, 0.82);
      const r = await slApi<{ url: string; passport_data?: PassportData }>(token, "client_passport_upload", {
        method: "POST",
        body: { image_base64: compressed, field: fieldKey, recognize: true },
      });
      if (r.ok && r.data) {
        if (isMain) setPhotoUrl(r.data.url);
        else setPhoto2Url(r.data.url);
        // Применяем распознанные данные (бэкенд OCR-ит синхронно)
        if (r.data.passport_data) {
          applyPassportData(r.data.passport_data);
        }
      } else {
        setErr(r.error || "Ошибка загрузки фото");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      if (isMain) setPhotoBusy(false); else setPhoto2Busy(false);
      setOcrBusy(false);
    }
  };

  const submit = async () => {
    if (!fullName.trim()) { setErr("Введите ФИО"); return; }
    setBusy(true); setErr(null);
    const r = await slApi<{ id: number }>(token, "client_save", {
      method: "POST",
      body: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        passport_series: series.trim(),
        passport_number: number.trim(),
        passport_issued_by: issuedBy.trim(),
        passport_issued_date: issuedDate || null,
        birth_date: birthDate || null,
        address: address.trim(),
        passport_photo_url: photoUrl,
        passport_photo2_url: photo2Url,
      },
    });
    setBusy(false);
    if (r.ok && r.data) {
      onCreated(r.data.id, fullName.trim());
    } else {
      setErr(r.error || "Ошибка сохранения");
    }
  };

  // Бейдж "✓ ИИ" возле распознанного поля
  const aiBadge = (key: string) => recognizedFields.has(key) ? (
    <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 align-middle">
      <Icon name="Sparkles" size={8} /> ИИ
    </span>
  ) : null;

  return (
    <div className="space-y-2 bg-[#101010] border border-[#1A1A1A] rounded-xl p-2.5 shadow-[0_1px_0_rgba(255,215,0,0.04)_inset]">
      <div className="flex items-center gap-1.5">
        <Icon name="UserPlus" size={13} className="text-[#FFD700]" />
        <div className="font-oswald uppercase font-bold text-[12px] tracking-wide">Быстрое добавление клиента</div>
        {onCancel && (
          <button onClick={onCancel} className="ml-auto text-white/40 hover:text-white p-0.5"><Icon name="X" size={13} /></button>
        )}
      </div>

      {/* Фото паспорта */}
      <SLField label="1 · Фото паспорта (страница с фото)">
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt="Паспорт" className="w-full max-h-44 object-cover rounded-md" />
            <button onClick={() => { setPhotoUrl(null); setRecognizedFields(new Set()); }} className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/80 text-white p-1 rounded-full" title="Удалить фото и сделать заново">
              <Icon name="X" size={11} />
            </button>
            <div className="absolute bottom-1 left-1 bg-emerald-500/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
              <Icon name="Check" size={9} /> Сохранено
            </div>
            {recognizedFields.size > 0 && (
              <div className="absolute bottom-1 right-1 bg-[#FFD700]/95 text-black text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                <Icon name="Sparkles" size={9} /> ИИ {recognizedFields.size}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={photoBusy}
            className="w-full bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-lg py-5 flex flex-col items-center gap-1 hover:border-[#FFD700] active:scale-[0.98] transition-all disabled:opacity-50">
            <Icon name={photoBusy ? "Loader2" : "Camera"} size={22} className={`text-[#FFD700] ${photoBusy ? "animate-spin" : ""}`} />
            <div className="font-bold text-[#FFD700] text-[12px] uppercase tracking-wide">
              {photoBusy ? (ocrBusy ? "Распознаю данные…" : "Загружаю…") : "Сделать фото"}
            </div>
            <div className="text-[9px] text-white/55 text-center px-2 leading-tight">
              ИИ автоматически прочитает ФИО, серию, номер,<br />кем выдан и адрес из фото
            </div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f, "passport_photo_url"); e.target.value = ""; }}
        />
      </SLField>

      {/* Дополнительное фото — страница с пропиской (необязательно) */}
      {photoUrl && (
        <SLField label="1.5 · Фото страницы с пропиской (необязательно)">
          {photo2Url ? (
            <div className="relative">
              <img src={photo2Url} alt="Прописка" className="w-full max-h-36 object-cover rounded-md" />
              <button onClick={() => setPhoto2Url(null)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/80 text-white p-1 rounded-full" title="Удалить фото">
                <Icon name="X" size={11} />
              </button>
              <div className="absolute bottom-1 left-1 bg-emerald-500/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                <Icon name="Check" size={9} /> Прописка
              </div>
            </div>
          ) : (
            <button
              onClick={() => input2Ref.current?.click()}
              disabled={photo2Busy}
              className="w-full bg-[#0E0E0E] border border-dashed border-white/15 rounded-lg py-3 flex flex-col items-center gap-0.5 hover:border-[#FFD700]/40 active:scale-[0.98] transition-all disabled:opacity-50">
              <Icon name={photo2Busy ? "Loader2" : "MapPin"} size={16} className={`text-white/55 ${photo2Busy ? "animate-spin" : ""}`} />
              <div className="font-semibold text-white/70 text-[11px]">
                {photo2Busy ? "Распознаю прописку…" : "Добавить фото с пропиской"}
              </div>
              <div className="text-[9px] text-white/40">ИИ дочитает адрес регистрации</div>
            </button>
          )}
          <input
            ref={input2Ref}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f, "passport_photo2_url"); e.target.value = ""; }}
          />
        </SLField>
      )}

      {info && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-1.5 text-[11px] flex items-start gap-1.5">
          <Icon name="Sparkles" size={11} className="mt-0.5 shrink-0 text-emerald-300" />
          <span>{info}</span>
        </div>
      )}

      <SLField label={<>2 · ФИО{aiBadge("fullName")}</>} required>
        <SLInput value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
      </SLField>

      <SLField label="3 · Телефон" required>
        <SLInput type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" iconLeft="Phone" />
      </SLField>

      {/* Сворачиваемая секция — авто-открыта если ИИ что-то распознал */}
      <details className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-1.5" open={recognizedFields.size > 0}>
        <summary className="text-[10px] text-white/55 cursor-pointer select-none uppercase tracking-wide font-semibold flex items-center gap-1.5">
          Паспортные данные
          {recognizedFields.size > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 normal-case tracking-normal">
              распознано {recognizedFields.size}
            </span>
          )}
        </summary>
        <div className="mt-1.5 space-y-1.5">
          <SLGrid cols={2}>
            <div>
              <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
                Серия{aiBadge("series")}
              </div>
              <SLInput value={series} onChange={e => setSeries(e.target.value)} placeholder="1234" inputMode="numeric" />
            </div>
            <div>
              <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
                Номер{aiBadge("number")}
              </div>
              <SLInput value={number} onChange={e => setNumber(e.target.value)} placeholder="567890" inputMode="numeric" />
            </div>
          </SLGrid>
          <div>
            <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
              Кем выдан{aiBadge("issuedBy")}
            </div>
            <SLInput value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="ОВД района ..." />
          </div>
          <SLGrid cols={2}>
            <div>
              <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
                Дата выдачи{aiBadge("issuedDate")}
              </div>
              <SLInput type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} />
            </div>
            <div>
              <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
                Дата рождения{aiBadge("birthDate")}
              </div>
              <SLInput type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
          </SLGrid>
          <div>
            <div className="text-[9px] text-white/45 uppercase tracking-wide mb-0.5 flex items-center">
              Адрес регистрации{aiBadge("address")}
            </div>
            <SLInput value={address} onChange={e => setAddress(e.target.value)} placeholder="г. Калуга, ул. ..." />
          </div>
        </div>
      </details>

      {err && <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2 py-1.5 text-[12px] flex items-center gap-1.5"><Icon name="AlertTriangle" size={11} />{err}</div>}

      <SLButton variant="gold" size="lg" icon={busy ? "Loader2" : "Check"} onClick={submit} disabled={busy || !fullName.trim()} className="w-full">
        {busy ? "Создаю…" : "Создать клиента и продолжить"}
      </SLButton>
    </div>
  );
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image error"));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Read error"));
    reader.readAsDataURL(file);
  });
}