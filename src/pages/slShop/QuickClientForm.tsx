import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLClient } from "./types";
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

type ClientMatchStats = {
  items_count: number;
  total_buy: number;
  total_sell: number;
  last_buy_at: string | null;
};

type ClientMatch = Pick<SLClient,
  "id" | "full_name" | "phone" | "passport_series" | "passport_number" |
  "passport_issued_by" | "passport_issued_date" | "address" | "birth_date" |
  "passport_photo_url" | "passport_photo2_url" | "face_photo_url"
> & { stats?: ClientMatchStats };

// "2 недели назад" / "вчера" / "12 дней назад" — для last_buy_at
function relTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес назад`;
  return `${Math.floor(days / 365)} г назад`;
}

/** Быстрое создание клиента: 1) фото паспорта с камеры, 2) AI распознаёт данные,
 *  3) сотрудник проверяет/правит и нажимает "Создать". */
export default function QuickClientForm({ token, onCreated, onCancel }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photo2Url, setPhoto2Url] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photo2Busy, setPhoto2Busy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [recognizedFields, setRecognizedFields] = useState<Set<string>>(new Set());
  // Найденные дубли в БД (по серии/номеру или ФИО+ДР)
  const [matches, setMatches] = useState<ClientMatch[]>([]);
  const [matchesDismissed, setMatchesDismissed] = useState(false);
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
  const galleryRef = useRef<HTMLInputElement>(null);
  const gallery2Ref = useRef<HTMLInputElement>(null);

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
      const r = await slApi<{ url: string; passport_data?: PassportData; matches?: ClientMatch[] }>(token, "client_passport_upload", {
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
        // Если найдены дубли в базе — показываем подсказку "Это он?"
        if (r.data.matches && r.data.matches.length > 0) {
          setMatches(r.data.matches);
          setMatchesDismissed(false);
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
          <div className="bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-lg p-3">
            <div className="flex flex-col items-center gap-0.5 mb-2.5">
              <Icon name={photoBusy ? "Loader2" : "Sparkles"} size={20} className={`text-[#FFD700] ${photoBusy ? "animate-spin" : ""}`} />
              <div className="font-bold text-[#FFD700] text-[12px] uppercase tracking-wide">
                {photoBusy ? (ocrBusy ? "Распознаю данные…" : "Загружаю…") : "Распознать паспорт"}
              </div>
              <div className="text-[9px] text-white/55 text-center px-2 leading-tight">
                ИИ автоматически прочитает ФИО, серию, номер,<br />кем выдан и адрес из фото
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={photoBusy}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FFD700] hover:bg-[#FFE34D] disabled:opacity-50 text-black font-bold text-[11px] uppercase tracking-wide rounded-md py-2.5 active:scale-[0.98] transition-all"
              >
                <Icon name="Camera" size={14} />
                Снять
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={photoBusy}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FFD700]/12 hover:bg-[#FFD700]/20 border border-[#FFD700]/40 disabled:opacity-50 text-[#FFD700] font-bold text-[11px] uppercase tracking-wide rounded-md py-2.5 active:scale-[0.98] transition-all"
              >
                <Icon name="Image" size={14} />
                Из галереи
              </button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f, "passport_photo_url"); e.target.value = ""; }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
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
            <div className="bg-[#0E0E0E] border border-dashed border-white/15 rounded-lg p-2.5">
              <div className="flex flex-col items-center gap-0.5 mb-2">
                <Icon name={photo2Busy ? "Loader2" : "MapPin"} size={16} className={`text-white/55 ${photo2Busy ? "animate-spin" : ""}`} />
                <div className="font-semibold text-white/70 text-[11px]">
                  {photo2Busy ? "Распознаю прописку…" : "Фото с пропиской (необязательно)"}
                </div>
                <div className="text-[9px] text-white/40">ИИ дочитает адрес регистрации</div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => input2Ref.current?.click()}
                  disabled={photo2Busy}
                  className="inline-flex items-center justify-center gap-1 bg-[#1A1A1A] hover:bg-[#222] border border-white/10 disabled:opacity-50 text-white/80 font-semibold text-[10px] uppercase tracking-wide rounded py-1.5 active:scale-[0.98] transition-all"
                >
                  <Icon name="Camera" size={12} />
                  Снять
                </button>
                <button
                  type="button"
                  onClick={() => gallery2Ref.current?.click()}
                  disabled={photo2Busy}
                  className="inline-flex items-center justify-center gap-1 bg-[#1A1A1A] hover:bg-[#222] border border-white/10 disabled:opacity-50 text-white/80 font-semibold text-[10px] uppercase tracking-wide rounded py-1.5 active:scale-[0.98] transition-all"
                >
                  <Icon name="Image" size={12} />
                  Из галереи
                </button>
              </div>
            </div>
          )}
          <input
            ref={input2Ref}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f, "passport_photo2_url"); e.target.value = ""; }}
          />
          <input
            ref={gallery2Ref}
            type="file"
            accept="image/*"
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

      {/* Найден дубль клиента в базе — предлагаем выбрать его, а не создавать новый */}
      {matches.length > 0 && !matchesDismissed && (
        <div className="rounded-lg bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border-2 border-[#FFD700]/50 p-2 space-y-1.5 shadow-[0_0_18px_rgba(255,215,0,0.18)]">
          <div className="flex items-start gap-1.5">
            <Icon name="UserSearch" size={14} className="text-[#FFD700] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[12px] text-[#FFD700] uppercase tracking-wide leading-tight">
                {matches.length === 1 ? "Похоже, это он?" : `Найдено похожих клиентов: ${matches.length}`}
              </div>
              <div className="text-[10px] text-white/60 leading-tight mt-0.5">
                Такой клиент уже есть в базе — выбери его, чтобы не создавать дубль
              </div>
            </div>
            <button onClick={() => setMatchesDismissed(true)}
              title="Скрыть и создать нового"
              className="text-white/40 hover:text-white p-0.5 shrink-0">
              <Icon name="X" size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {matches.map(m => {
              const s = m.stats;
              const hasHistory = s && s.items_count > 0;
              return (
                <button key={m.id} onClick={() => onCreated(m.id, m.full_name)}
                  className="w-full text-left bg-[#0E0E0E] hover:bg-[#141414] active:scale-[0.99] border border-[#1F1F1F] hover:border-[#FFD700] rounded-md p-2 transition-all">
                  <div className="flex items-center gap-2">
                    {m.passport_photo_url ? (
                      <img src={m.passport_photo_url} alt="" className="w-10 h-10 object-cover rounded shrink-0 border border-[#FFD700]/30" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#1A1A1A] flex items-center justify-center shrink-0">
                        <Icon name="User" size={16} className="text-white/30" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[12px] text-white truncate flex items-center gap-1.5">
                        {m.full_name}
                        <span className="text-[9px] text-white/40 font-normal">#{m.id}</span>
                      </div>
                      <div className="text-[10px] text-white/55 flex flex-wrap gap-x-2 mt-0.5">
                        {m.phone && <span><Icon name="Phone" size={9} className="inline mr-0.5" />{m.phone}</span>}
                        {m.passport_series && <span>{m.passport_series} {m.passport_number}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 inline-flex items-center gap-1 bg-[#FFD700] text-black text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">
                      <Icon name="Check" size={10} /> Это он
                    </div>
                  </div>
                  {/* История сделок */}
                  {hasHistory ? (
                    <div className="mt-1.5 pt-1.5 border-t border-[#1F1F1F]/70 flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                        <Icon name="ShoppingBag" size={9} />
                        {s!.items_count} {s!.items_count === 1 ? "сделка" : (s!.items_count < 5 ? "сделки" : "сделок")}
                      </span>
                      {s!.total_buy > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] font-bold tabular-nums">
                          <Icon name="Wallet" size={9} />
                          {Math.round(s!.total_buy).toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                      {s!.last_buy_at && (
                        <span className="inline-flex items-center gap-1 text-white/55">
                          <Icon name="Clock" size={9} />
                          {relTime(s!.last_buy_at)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1.5 pt-1.5 border-t border-[#1F1F1F]/70 text-[10px] text-white/35 flex items-center gap-1">
                      <Icon name="UserPlus" size={9} />
                      Новый постоянный — сделок пока не было
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={() => setMatchesDismissed(true)}
            className="w-full text-[10px] text-white/45 hover:text-white/80 underline underline-offset-2 py-1">
            Не он — создать нового клиента
          </button>
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

      {matches.length > 0 && !matchesDismissed && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-200 px-2 py-1.5 text-[10px] flex items-center gap-1.5">
          <Icon name="AlertTriangle" size={11} className="text-amber-300 shrink-0" />
          <span>Сначала проверь похожих клиентов выше — возможно, такой уже есть</span>
        </div>
      )}

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