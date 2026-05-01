import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi } from "./types";

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
    <div className="space-y-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <Icon name="UserPlus" size={16} className="text-[#FFD700]" />
        <div className="font-bold text-sm">Быстрое добавление клиента</div>
        {onCancel && (
          <button onClick={onCancel} className="ml-auto text-white/40 p-1"><Icon name="X" size={16} /></button>
        )}
      </div>

      {/* Фото паспорта */}
      <div>
        <div className="text-[11px] text-white/50 mb-1">1. Фото первой страницы паспорта</div>
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt="Паспорт" className="w-full max-h-56 object-cover rounded-lg" />
            <button onClick={() => setPhotoUrl(null)}
              className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full">
              <Icon name="X" size={12} />
            </button>
            <div className="absolute bottom-2 left-2 bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              Загружено ✓
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={photoBusy}
            className="w-full bg-gradient-to-br from-[#FFD700]/15 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-[#FFD700] active:scale-95 transition-all disabled:opacity-50">
            <Icon name={photoBusy ? "Loader" : "Camera"} size={32} className={`text-[#FFD700] ${photoBusy ? "animate-spin" : ""}`} />
            <div className="font-bold text-[#FFD700]">{photoBusy ? "Загружаю..." : "Сделать фото паспорта"}</div>
            <div className="text-[10px] text-white/50">Откроется камера телефона</div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onPhoto(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* ФИО и телефон — самое важное */}
      <div>
        <div className="text-[11px] text-white/50 mb-1">2. ФИО *</div>
        <input value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2.5 text-base focus:border-[#FFD700]/50 outline-none" />
      </div>

      <div>
        <div className="text-[11px] text-white/50 mb-1">3. Телефон *</div>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          type="tel"
          className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2.5 text-base focus:border-[#FFD700]/50 outline-none" />
      </div>

      {/* Сворачиваемая секция с паспортом — необязательная */}
      <details className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2">
        <summary className="text-[11px] text-white/50 cursor-pointer select-none">
          Паспортные данные (необязательно — фото уже есть)
        </summary>
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={series} onChange={e => setSeries(e.target.value)} placeholder="Серия"
              className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
            <input value={number} onChange={e => setNumber(e.target.value)} placeholder="Номер"
              className="bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          </div>
          <input value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="Кем выдан"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес регистрации"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
        </div>
      </details>

      {err && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-2 rounded text-sm">{err}</div>}

      <button onClick={submit} disabled={busy || !fullName.trim()}
        className="w-full bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
        <Icon name={busy ? "Loader" : "Check"} size={16} className={busy ? "animate-spin" : ""} />
        {busy ? "Создаю..." : "Создать клиента и продолжить"}
      </button>
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
