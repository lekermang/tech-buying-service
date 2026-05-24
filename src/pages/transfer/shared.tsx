import Icon from "@/components/ui/icon";

export const API = "https://functions.poehali.dev/d3550608-e324-4580-b568-6ba80c9c37b5";
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Граница, после которой идём через pre-signed S3 PUT (без base64 через функцию). */
export const PRESIGNED_THRESHOLD = 4 * 1024 * 1024;

export type Role = "select" | "sender" | "receiver" | "pc";
export type SenderStep = "choose" | "uploading" | "wait" | "sending" | "done";
export type ReceiverStep = "code" | "wait" | "ready" | "downloading" | "done";

/** Все категории данных, которые поддерживает перенос. */
export type DataKind =
  | "contacts"
  | "photos"
  | "docs"
  | "selfie"
  | "audio"
  | "messengers"
  | "notes"
  | "bookmarks"
  | "wifi"
  | "calendar";

export type SessionFile = { id: number; name: string; mime: string | null; size: number };

export type SessionStatus = {
  sessionId: string;
  code: string;
  status: string;
  hasContacts: boolean;
  hasPhotos: boolean;
  hasDocs: boolean;
  hasNotes?: boolean;
  hasBookmarks?: boolean;
  hasWifi?: boolean;
  hasCalendar?: boolean;
  hasAudio?: boolean;
  hasMessengers?: boolean;
  receiverConnected: boolean;
  downloadStarted: boolean;
  downloadCompleted: boolean;
  filesCount: number;
  totalBytes: number;
  expiresAt: string;
};

/**
 * Загружает файл: если меньше PRESIGNED_THRESHOLD — base64-JSON через функцию,
 * иначе — pre-signed PUT прямо в S3, минуя Cloud Function.
 * onProgress(0..100) — прогресс одного файла.
 */
export async function uploadFileSmart(
  sessionId: string,
  file: File,
  kind: DataKind,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const mime = file.type || "application/octet-stream";
  if (file.size <= PRESIGNED_THRESHOLD) {
    const b64 = await fileToBase64(file);
    const r = await fetch(`${API}?action=upload&id=${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId, fileName: file.name, mimeType: mime, fileBase64: b64, kind,
      }),
    });
    if (!r.ok) {
      const ed = await r.json().catch(() => ({}));
      throw new Error(ed.error || `Ошибка загрузки ${file.name}`);
    }
    onProgress?.(100);
    return;
  }
  // Pre-signed PUT для больших файлов
  const initR = await fetch(`${API}?action=init_upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, fileName: file.name, mimeType: mime }),
  });
  const initD = await initR.json();
  if (!initR.ok) throw new Error(initD.error || "init_upload failed");
  const { uploadUrl, s3Key } = initD as { uploadUrl: string; s3Key: string };
  // PUT в S3 c прогрессом через XHR
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 PUT ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Ошибка сети при загрузке в S3"));
    xhr.send(file);
  });
  // Регистрация файла
  const compR = await fetch(`${API}?action=complete_upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId, fileName: file.name, mimeType: mime, s3Key, size: file.size, kind,
    }),
  });
  if (!compR.ok) {
    const ed = await compR.json().catch(() => ({}));
    throw new Error(ed.error || "complete_upload failed");
  }
}

/** Помечает в сессии «нефайловую» категорию (Wi-Fi-QR, инструкция WA и т.п.). */
export async function setSessionFlag(sessionId: string, flag: DataKind): Promise<void> {
  await fetch(`${API}?action=set_flags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, [flag]: true }),
  });
}

export function fmtBytes(b: number): string {
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} КБ`;
  return `${(b / 1024 / 1024).toFixed(1)} МБ`;
}

export function fileIcon(mime: string | null | undefined): string {
  if (!mime) return "FileText";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.includes("pdf")) return "FileText";
  if (mime.includes("word") || mime.includes("document")) return "FileText";
  if (mime.includes("sheet") || mime.includes("excel")) return "Sheet";
  if (mime.includes("vcard")) return "Contact";
  return "File";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1] || "");
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
      </a>
      <span className="text-sm text-[#777]">Перенос данных</span>
    </div>
  );
}

export function RoleScreen({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-10 flex flex-col items-center gap-7 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-12 blur-3xl opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,215,0,0.25), transparent 65%)" }}
        />
        <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/[0.1] border border-[#FFD700]/30 text-[11px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
          <Icon name="Shield" size={12} /> Безопасный перенос
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-tight">
          Перенесите данные<br />
          <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">за 2 минуты</span>
        </h1>
        <p className="text-sm text-[#999] mt-3 leading-relaxed max-w-md mx-auto">
          С iPhone, Android, любого браузера. Контакты, фото, видео, документы,
          голосовые, чаты WhatsApp, Wi-Fi и календарь — в один клик, без приложений.
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <RoleBtn
          onClick={() => onSelect("sender")}
          icon="Smartphone"
          arrow="ArrowUpFromLine"
          variant="gold"
          title="Старый телефон"
          desc="Отправить данные"
        />
        <RoleBtn
          onClick={() => onSelect("receiver")}
          icon="Smartphone"
          arrow="ArrowDownToLine"
          variant="outline"
          title="Новый телефон"
          desc="Получить данные"
        />
        <RoleBtn
          onClick={() => onSelect("pc")}
          icon="Monitor"
          arrow="ArrowUpFromLine"
          variant="outline"
          title="С компьютера"
          desc="Большие видео и архивы без ограничений"
        />
      </div>

      <div className="w-full max-w-sm grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-[#777]">
        <Feature icon="Lock" text="Шифрование" />
        <Feature icon="Timer" text="30 мин и удалено" />
        <Feature icon="Zap" text="Без приложений" />
      </div>

      <TransferProBlock />
    </div>
  );
}

function TransferProBlock() {
  // Динамически импортируем чтобы не было кругового импорта
  const handle = async () => {
    const { createUniversalPayment } = await import("@/pages/safeDeals/api");
    const r = await createUniversalPayment({
      purpose: "transfer_pro",
      amount: 500,
      description: "Перенос данных PRO · безлимитный объём + приоритет",
      returnUrl: window.location.href,
    });
    if (r.ok && r.data?.confirmationUrl) {
      window.location.href = r.data.confirmationUrl;
    } else {
      alert(r.error || "Не удалось создать платёж");
    }
  };
  return (
    <button
      onClick={handle}
      className="w-full max-w-sm rounded-2xl p-4 bg-gradient-to-br from-[#FFD700]/[0.12] via-[#FFD700]/[0.04] to-transparent border-2 border-[#FFD700]/40 hover:border-[#FFD700] transition active:scale-[0.98] text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700] text-black flex items-center justify-center shrink-0">
            <Icon name="Crown" size={20} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#FFD700]">PRO тариф · 500 ₽</div>
            <div className="text-[10px] text-[#999] mt-0.5">Безлимитный объём, приоритетная скорость, сессия 24 часа</div>
          </div>
        </div>
        <Icon name="ArrowRight" size={16} className="text-[#FFD700] shrink-0" />
      </div>
    </button>
  );
}

function RoleBtn({ onClick, icon, arrow, variant, title, desc }: {
  onClick: () => void;
  icon: string;
  arrow: string;
  variant: "gold" | "outline";
  title: string;
  desc: string;
}) {
  const isGold = variant === "gold";
  return (
    <button
      onClick={onClick}
      className={`group relative w-full p-4 rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center gap-3.5 text-left overflow-hidden ${
        isGold
          ? "bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.6)]"
          : "bg-[#141414] border-2 border-[#2A2A2A] text-[#F0F0F0] hover:border-[#FFD700]/60"
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
        isGold ? "bg-black/15" : "bg-[#FFD700]/[0.1] text-[#FFD700]"
      }`}>
        <Icon name={icon} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold leading-tight">{title}</div>
        <div className={`text-xs mt-0.5 ${isGold ? "opacity-70" : "text-[#777]"}`}>{desc}</div>
      </div>
      <Icon name={arrow} size={18} className={isGold ? "" : "text-[#FFD700] opacity-70 group-hover:translate-x-0.5 transition-transform"} />
    </button>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-[#FFD700]/[0.04] border border-[#FFD700]/[0.1]">
      <Icon name={icon} size={14} className="text-[#FFD700]" />
      <span className="text-center leading-tight">{text}</span>
    </div>
  );
}

export function StepDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i === active ? "bg-[#FFD700] scale-125" : i < active ? "bg-[#3DDC84]" : "bg-[#2A2A2A]"
          }`}
        />
      ))}
    </div>
  );
}

export function OptionRow({ icon, title, desc, active, onClick }: { icon: string; title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-4 rounded-xl border-2 mb-2.5 transition active:scale-[0.98] ${
        active ? "border-[#FFD700] bg-[#FFD700]/[0.15]" : "border-transparent bg-[#1C1C1C]"
      }`}
    >
      <Icon name={icon} size={26} className={active ? "text-[#FFD700]" : "text-[#999]"} />
      <div className="flex-1 text-left">
        <div className="text-[15px] font-bold text-[#F0F0F0]">{title}</div>
        <div className="text-xs text-[#777] mt-0.5">{desc}</div>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-extrabold transition ${
        active ? "bg-[#FFD700] border-[#FFD700] text-black" : "border-[#2A2A2A] text-transparent"
      }`}>
        ✓
      </div>
    </button>
  );
}

export function ProgressBar({ pct, color = "gold" }: { pct: number; color?: "gold" | "green" }) {
  return (
    <div className="w-full max-w-sm bg-[#1C1C1C] rounded-lg h-2 overflow-hidden">
      <div
        className="h-full rounded-lg transition-all duration-300"
        style={{
          width: `${pct}%`,
          background: color === "green"
            ? "linear-gradient(90deg, #3DDC84, #6FFFC0)"
            : "linear-gradient(90deg, #FFD700, #FFE55C)",
        }}
      />
    </div>
  );
}

export function Centered({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-6 flex flex-col items-center text-center gap-4">
      <Icon name="Loader2" size={40} className="text-[#FFD700] animate-spin" />
      <h3 className="text-base font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-[#777]">{subtitle}</p>}
      {children}
    </div>
  );
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-[#FFD700] flex items-center gap-1 mb-3">
      <Icon name="ChevronLeft" size={14} /> Назад
    </button>
  );
}