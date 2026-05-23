import Icon from "@/components/ui/icon";

export const API = "https://functions.poehali.dev/d3550608-e324-4580-b568-6ba80c9c37b5";
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type Role = "select" | "sender" | "receiver";
export type SenderStep = "choose" | "uploading" | "wait" | "sending" | "done";
export type ReceiverStep = "code" | "wait" | "ready" | "downloading" | "done";

export type SessionFile = { id: number; name: string; mime: string | null; size: number };
export type SessionStatus = {
  sessionId: string;
  code: string;
  status: string;
  hasContacts: boolean;
  hasPhotos: boolean;
  hasDocs: boolean;
  receiverConnected: boolean;
  downloadStarted: boolean;
  downloadCompleted: boolean;
  filesCount: number;
  totalBytes: number;
  expiresAt: string;
};

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
    <div className="max-w-md mx-auto px-5 pt-10 pb-6 flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-[22px] font-extrabold leading-tight">Перенос данных</h2>
        <p className="text-sm text-[#777] mt-2 leading-relaxed">
          Это <b className="text-[#F0F0F0]">старое</b> устройство, с которого переносим?<br />
          Или <b className="text-[#F0F0F0]">новое</b>, на которое получаем?
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={() => onSelect("sender")}
          className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-bold text-[15px] flex items-center justify-center gap-2.5 transition active:scale-[0.97] hover:bg-[#FFE033]"
        >
          <Icon name="ArrowUpFromLine" size={18} />
          Старое устройство
          <span className="text-[11px] font-normal opacity-70">(отправить)</span>
        </button>
        <button
          onClick={() => onSelect("receiver")}
          className="w-full py-4 rounded-2xl bg-transparent border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-[15px] flex items-center justify-center gap-2.5 transition active:scale-[0.97] hover:border-[#FFD700] hover:text-[#FFD700]"
        >
          <Icon name="ArrowDownToLine" size={18} />
          Новое устройство
          <span className="text-[11px] font-normal opacity-70">(получить)</span>
        </button>
      </div>

      <div className="w-full max-w-sm bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc] text-left">
        <Icon name="Info" size={14} className="inline mr-1.5 text-[#FFD700]" />
        <b>Без сторонних приложений.</b> Всё работает в браузере. Данные хранятся на сервере не более 30 минут и удаляются автоматически.
      </div>
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
