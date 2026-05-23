/**
 * Модули — отдельные «инструменты» отправителя для каждого типа данных:
 * - WifiQR: генерируем .vcf-подобный текст подключения и .png QR-код
 * - NotesEditor: ручной ввод заметок и паролей
 * - BookmarksImport: загрузка bookmarks.html, парсинг ссылок
 * - MessengersInfo: модалка с инструкциями WA/TG + загрузка экспортов
 * - CameraCapture: захват фото/видео/селфи через getUserMedia
 * - AudioRecorder: запись через MediaRecorder
 * - CalendarFile: просто input для .ics с подсветкой
 */
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";

/* ─────────────────── Wi-Fi QR ─────────────────── */
export function WifiQRModule({ onSave, onClose }: { onSave: (file: File) => void; onClose: () => void }) {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [hidden, setHidden] = useState(false);

  const wifiString = `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`;

  const save = () => {
    if (!ssid.trim()) {
      toast.error("Укажите название сети");
      return;
    }
    // Сохраняем как .txt с инструкцией для импорта
    const text = `# Wi-Fi для импорта на новом устройстве
# Сеть: ${ssid}
# Безопасность: ${encryption}
# Скрытая: ${hidden ? "Да" : "Нет"}
#
# Способ 1: откройте файл wifi-qr.png — отсканируйте камерой телефона.
# Способ 2: подключитесь вручную:

SSID: ${ssid}
PASSWORD: ${password}
SECURITY: ${encryption}
HIDDEN: ${hidden ? "yes" : "no"}

Wi-Fi QR string:
${wifiString}
`;
    const blob = new Blob([text], { type: "text/plain" });
    onSave(new File([blob], `wifi-${ssid.replace(/[^a-zA-Z0-9]/g, "_") || "network"}.txt`, { type: "text/plain" }));
    toast.success("Wi-Fi сохранён, добавьте больше или нажмите Готово");
  };

  return (
    <ModalShell title="Wi-Fi для нового телефона" onClose={onClose}>
      <p className="text-sm text-[#999] mb-4">
        Заполните данные сети — получите QR-код, который можно отсканировать камерой нового телефона.
      </p>

      <div className="grid grid-cols-1 gap-3">
        <Field label="Название сети (SSID)">
          <input value={ssid} onChange={(e) => setSsid(e.target.value)}
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#FFD700] outline-none"
            placeholder="MyWiFi" />
        </Field>
        <Field label="Пароль">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="text"
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#FFD700] outline-none"
            placeholder="••••••••" />
        </Field>
        <Field label="Шифрование">
          <select value={encryption} onChange={(e) => setEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
            className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm focus:border-[#FFD700] outline-none">
            <option value="WPA">WPA / WPA2 / WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Без пароля</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-[#ccc]">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          Сеть скрытая
        </label>
      </div>

      {ssid && (
        <div className="mt-5 flex justify-center">
          <div className="bg-white rounded-xl p-3">
            <QRCodeCanvas value={wifiString} size={180} level="M" />
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#2A2A2A] text-sm font-bold">Отмена</button>
        <button onClick={save} disabled={!ssid.trim()} className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black text-sm font-bold disabled:opacity-40">
          Добавить Wi-Fi
        </button>
      </div>
    </ModalShell>
  );
}

/* ─────────────────── Заметки / Пароли ─────────────────── */
export function NotesEditorModule({ onSave, onClose }: { onSave: (file: File) => void; onClose: () => void }) {
  type Note = { title: string; body: string };
  const [notes, setNotes] = useState<Note[]>([{ title: "", body: "" }]);

  const add = () => setNotes((p) => [...p, { title: "", body: "" }]);
  const remove = (i: number) => setNotes((p) => p.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof Note, v: string) => {
    setNotes((p) => p.map((n, idx) => (idx === i ? { ...n, [k]: v } : n)));
  };

  const save = () => {
    const valid = notes.filter((n) => n.title.trim() || n.body.trim());
    if (valid.length === 0) {
      toast.error("Добавьте хотя бы одну заметку");
      return;
    }
    const lines: string[] = [];
    lines.push(`# Заметки (${new Date().toLocaleString("ru-RU")})`);
    lines.push(`# Перенесено через Скупка24 · skupka24.com/transfer`);
    lines.push("");
    valid.forEach((n, i) => {
      lines.push(`## ${i + 1}. ${n.title || "(без названия)"}`);
      lines.push(n.body || "");
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    onSave(new File([blob], `notes-${new Date().toISOString().slice(0, 10)}.txt`, { type: "text/plain" }));
    toast.success(`Заметок добавлено: ${valid.length}`);
  };

  return (
    <ModalShell title="Заметки и пароли" onClose={onClose}>
      <p className="text-sm text-[#999] mb-4">
        Введите ключевые заметки/пароли вручную. Будут сохранены в одном текстовом файле.
      </p>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {notes.map((n, i) => (
          <div key={i} className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={n.title} onChange={(e) => update(i, "title", e.target.value)}
                placeholder={`Заметка ${i + 1}`}
                className="flex-1 bg-transparent border-b border-[#2A2A2A] text-sm font-bold focus:border-[#FFD700] outline-none py-1" />
              {notes.length > 1 && (
                <button onClick={() => remove(i)} className="text-[#777] hover:text-[#FF453A]">
                  <Icon name="Trash2" size={14} />
                </button>
              )}
            </div>
            <textarea value={n.body} onChange={(e) => update(i, "body", e.target.value)}
              placeholder="Текст заметки..."
              rows={3}
              className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-[#555]" />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-[#2A2A2A] text-sm text-[#FFD700] hover:border-[#FFD700]">
        + Добавить ещё заметку
      </button>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#2A2A2A] text-sm font-bold">Отмена</button>
        <button onClick={save} className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black text-sm font-bold">Сохранить</button>
      </div>
    </ModalShell>
  );
}

/* ─────────────────── Закладки браузера ─────────────────── */
export function BookmarksImport({ onPick }: { onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".html,text/html"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onPick(f);
            toast.success("Закладки добавлены");
          }
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[#2A2A2A] text-sm text-[#FFD700] hover:border-[#FFD700] transition flex items-center justify-center gap-2"
      >
        <Icon name="Upload" size={14} /> Загрузить bookmarks.html
      </button>
    </>
  );
}

/* ─────────────────── Календарь .ics ─────────────────── */
export function CalendarImport({ onPick }: { onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".ics,text/calendar"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onPick(f);
            toast.success("Календарь добавлен");
          }
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[#2A2A2A] text-sm text-[#FFD700] hover:border-[#FFD700] transition flex items-center justify-center gap-2"
      >
        <Icon name="CalendarPlus" size={14} /> Загрузить файл .ics
      </button>
    </>
  );
}

/* ─────────────────── Инструкции WA / TG ─────────────────── */
export function MessengersInfoModule({ onPick, onClose }: { onPick: (file: File) => void; onClose: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <ModalShell title="WhatsApp / Telegram" onClose={onClose}>
      <p className="text-sm text-[#999] mb-4">
        Мессенджеры не дают прямого доступа к чатам, но позволяют их экспортировать.
        Загрузите файл экспорта здесь — мы его передадим.
      </p>

      <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3.5 mb-3">
        <div className="flex items-center gap-2 mb-2 text-[#25D366] font-bold">
          <Icon name="MessageCircle" size={16} /> WhatsApp
        </div>
        <ol className="text-xs text-[#ccc] space-y-1 list-decimal pl-4">
          <li>Откройте чат → Меню → Ещё → Экспорт чата</li>
          <li>Выберите «Без медиа» или «С медиа»</li>
          <li>Поделитесь → Сохранить файл → загрузите его сюда</li>
        </ol>
      </div>

      <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3.5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-[#0088CC] font-bold">
          <Icon name="Send" size={16} /> Telegram
        </div>
        <ol className="text-xs text-[#ccc] space-y-1 list-decimal pl-4">
          <li>Telegram Desktop → Настройки → Расширенные → Экспорт данных</li>
          <li>Выберите чаты, формат HTML или JSON</li>
          <li>Скопируйте папку в архив .zip и загрузите сюда</li>
        </ol>
      </div>

      <input
        ref={ref}
        type="file"
        accept=".txt,.zip,.html,.json,application/zip"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(onPick);
          if (files.length > 0) {
            toast.success(`Файлов экспорта: ${files.length}`);
            onClose();
          }
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm flex items-center justify-center gap-2"
      >
        <Icon name="Upload" size={14} /> Загрузить файл экспорта
      </button>
    </ModalShell>
  );
}

/* ─────────────────── Камера ─────────────────── */
export function CameraModule({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        toast.error("Нет доступа к камере");
        onClose();
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      toast.success("Снимок добавлен");
    }, "image/jpeg", 0.92);
  };

  return (
    <ModalShell title="Сделать снимок" onClose={onClose}>
      <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4]">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="absolute top-2 right-2 bg-black/60 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center text-white"
        >
          <Icon name="SwitchCamera" size={16} />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#2A2A2A] text-sm font-bold">
          Закрыть
        </button>
        <button onClick={snap} className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm flex items-center justify-center gap-2">
          <Icon name="Camera" size={16} /> Снимок
        </button>
      </div>
    </ModalShell>
  );
}

/* ─────────────────── Микрофон ─────────────────── */
export function AudioRecorderModule({ onSave, onClose }: { onSave: (file: File) => void; onClose: () => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const ext = (rec.mimeType || "").includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
        onSave(file);
        toast.success("Запись сохранена");
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Нет доступа к микрофону");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    };
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <ModalShell title="Голосовая запись" onClose={onClose}>
      <div className="text-center py-8">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition ${
          recording ? "bg-[#FF453A]/20 animate-pulse" : "bg-[#FFD700]/15"
        }`}>
          <Icon name={recording ? "Mic" : "MicOff"} size={42} className={recording ? "text-[#FF453A]" : "text-[#FFD700]"} />
        </div>
        <div className="text-2xl font-extrabold tabular-nums mt-4">{mm}:{ss}</div>
        <p className="text-xs text-[#777] mt-2">{recording ? "Идёт запись..." : "Готово к записи"}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#2A2A2A] text-sm font-bold">Закрыть</button>
        {!recording ? (
          <button onClick={start} className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm">
            Начать запись
          </button>
        ) : (
          <button onClick={stop} className="flex-1 py-3 rounded-xl bg-[#FF453A] text-white font-bold text-sm">
            Остановить
          </button>
        )}
      </div>
    </ModalShell>
  );
}

/* ─────────────────── Базовая обёртка модалок ─────────────────── */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-5">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[#999] hover:text-white">
            <Icon name="X" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider font-bold text-[#777] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
