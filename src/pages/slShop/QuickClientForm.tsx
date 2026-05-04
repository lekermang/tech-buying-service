import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi } from "./types";
import { SLField, SLInput, SLButton, SLGrid } from "./slUI";

type Props = {
  token: string;
  onCreated: (clientId: number, fullName: string) => void;
  onCancel?: () => void;
};

/** Быстрое создание клиента: 1) фото паспорта с камеры, 2) ФИО + телефон, 3) Создать. */
export default function QuickClientForm({ token, onCreated, onCancel }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [series, setSeries] = useState("");
  const [number, setNumber] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPhoto = async (file: File) => {
    setPhotoBusy(true); setErr(null);
    try {
      // Сжимаем фото на клиенте (максимум 1600px по длинной стороне)
      const compressed = await compressImage(file, 1600, 0.82);
      const r = await slApi<{ url: string }>(token, "client_passport_upload", {
        method: "POST",
        body: { image_base64: compressed, field: "passport_photo_url" },
      });
      if (r.ok && r.data) {
        setPhotoUrl(r.data.url);
      } else {
        setErr(r.error || "Ошибка загрузки фото");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPhotoBusy(false);
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
        address: address.trim(),
        passport_photo_url: photoUrl,
      },
    });
    setBusy(false);
    if (r.ok && r.data) {
      onCreated(r.data.id, fullName.trim());
    } else {
      setErr(r.error || "Ошибка сохранения");
    }
  };

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
      <SLField label="1 · Фото 1-й страницы паспорта">
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt="Паспорт" className="w-full max-h-44 object-cover rounded-md" />
            <button onClick={() => setPhotoUrl(null)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/80 text-white p-1 rounded-full">
              <Icon name="X" size={11} />
            </button>
            <div className="absolute bottom-1 left-1 bg-emerald-500/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Загружено ✓</div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={photoBusy}
            className="w-full bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-lg py-5 flex flex-col items-center gap-1 hover:border-[#FFD700] active:scale-[0.98] transition-all disabled:opacity-50">
            <Icon name={photoBusy ? "Loader2" : "Camera"} size={22} className={`text-[#FFD700] ${photoBusy ? "animate-spin" : ""}`} />
            <div className="font-bold text-[#FFD700] text-[12px] uppercase tracking-wide">{photoBusy ? "Загружаю…" : "Сделать фото"}</div>
            <div className="text-[9px] text-white/45">Откроется камера телефона</div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
        />
      </SLField>

      <SLField label="2 · ФИО" required>
        <SLInput value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
      </SLField>

      <SLField label="3 · Телефон" required>
        <SLInput type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" iconLeft="Phone" />
      </SLField>

      {/* Сворачиваемая секция */}
      <details className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-1.5">
        <summary className="text-[10px] text-white/55 cursor-pointer select-none uppercase tracking-wide font-semibold">
          Паспортные данные (необязательно)
        </summary>
        <div className="mt-1.5 space-y-1.5">
          <SLGrid cols={2}>
            <SLInput value={series} onChange={e => setSeries(e.target.value)} placeholder="Серия" />
            <SLInput value={number} onChange={e => setNumber(e.target.value)} placeholder="Номер" />
          </SLGrid>
          <SLInput value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="Кем выдан" />
          <SLInput value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес регистрации" />
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