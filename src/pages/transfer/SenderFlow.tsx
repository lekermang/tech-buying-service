import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  API,
  type SenderStep, type SessionStatus, type DataKind,
  fmtBytes, fileIcon,
  uploadFileSmart, setSessionFlag,
  StepDots, ProgressBar, Centered, BackBtn,
} from "./shared";
import {
  WifiQRModule, NotesEditorModule, BookmarksImport, CalendarImport,
  MessengersInfoModule, CameraModule, AudioRecorderModule,
} from "./SenderModules";

type ModuleKey = "camera" | "audio" | "wifi" | "notes" | "bookmarks" | "messengers" | "calendar" | "files";

type DataTypeDef = {
  key: DataKind;
  icon: string;
  title: string;
  desc: string;
  module?: ModuleKey;
  accept?: string;
  color?: string;
};

const DATA_TYPES: DataTypeDef[] = [
  { key: "contacts",   icon: "Users",        title: "Контакты",          desc: "Все номера и имена",        color: "#FFD700" },
  { key: "photos",     icon: "Image",        title: "Фото и видео",       desc: "Из галереи телефона",       module: "files", accept: "image/*,video/*", color: "#3DDC84" },
  { key: "selfie",     icon: "Camera",       title: "Селфи / съёмка",     desc: "Сразу из камеры браузера",  module: "camera", color: "#FF9D5C" },
  { key: "audio",      icon: "Mic",          title: "Голосовая запись",   desc: "Запись через микрофон",     module: "audio", color: "#7AB8FF" },
  { key: "docs",       icon: "FileText",     title: "Документы",          desc: "PDF, Word, таблицы, ZIP",   module: "files", accept: "*/*", color: "#B8A4FF" },
  { key: "messengers", icon: "MessageCircle",title: "WhatsApp / Telegram",desc: "Экспорт чатов",             module: "messengers", color: "#25D366" },
  { key: "notes",      icon: "StickyNote",   title: "Заметки и пароли",   desc: "Ручной ввод",               module: "notes", color: "#FFE066" },
  { key: "wifi",       icon: "Wifi",         title: "Wi-Fi сеть",         desc: "QR-код для подключения",    module: "wifi", color: "#5CD6E0" },
  { key: "bookmarks",  icon: "Bookmark",     title: "Закладки браузера",  desc: "Из bookmarks.html",         module: "bookmarks", color: "#FFAE5C" },
  { key: "calendar",   icon: "Calendar",     title: "Календарь",          desc: "Файл .ics",                 module: "calendar", color: "#FF7AB8" },
];

export default function SenderFlow({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<SenderStep>("choose");
  const [active, setActive] = useState<Set<DataKind>>(new Set());
  const [files, setFiles] = useState<Array<{ file: File; kind: DataKind }>>([]);
  const [virtualFlags, setVirtualFlags] = useState<Set<DataKind>>(new Set());

  const [openModule, setOpenModule] = useState<ModuleKey | null>(null);
  const [moduleKind, setModuleKind] = useState<DataKind>("docs");
  const filesInputRef = useRef<HTMLInputElement>(null);
  const [filesAccept, setFilesAccept] = useState("*/*");

  const [session, setSession] = useState<{ id: string; code: string; expiresAt: string } | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadTitle, setUploadTitle] = useState("Подготовка...");
  const [receiverConnected, setReceiverConnected] = useState(false);
  const pollRef = useRef<number | null>(null);

  const toggle = (def: DataTypeDef) => {
    const wasActive = active.has(def.key);
    setActive((prev) => {
      const n = new Set(prev);
      if (n.has(def.key)) n.delete(def.key);
      else n.add(def.key);
      return n;
    });
    if (def.module && !wasActive) {
      if (def.module === "files") {
        setFilesAccept(def.accept || "*/*");
        setModuleKind(def.key);
        setTimeout(() => filesInputRef.current?.click(), 50);
      } else {
        setModuleKind(def.key);
        setOpenModule(def.module);
      }
    }
  };

  const addFile = (file: File, kind: DataKind) => {
    setFiles((prev) => {
      const key = file.name + file.size + kind;
      if (prev.some((p) => p.file.name + p.file.size + p.kind === key)) return prev;
      return [...prev, { file, kind }];
    });
  };

  const pickContacts = async (): Promise<File | null> => {
    const nav = navigator as Navigator & {
      contacts?: { select: (props: string[], opts: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>> };
    };
    if (!nav.contacts) {
      toast.error("Выбор контактов работает только в Chrome Android и Safari iOS 14.5+");
      return null;
    }
    try {
      const contacts = await nav.contacts.select(["name", "tel", "email"], { multiple: true });
      if (!contacts.length) return null;
      const vcards = contacts.map((c) => {
        const name = c.name?.[0] || "Без имени";
        const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`];
        c.tel?.forEach((t) => lines.push(`TEL:${t}`));
        c.email?.forEach((e) => lines.push(`EMAIL:${e}`));
        lines.push("END:VCARD");
        return lines.join("\r\n");
      });
      const blob = new Blob([vcards.join("\r\n\r\n")], { type: "text/vcard" });
      toast.success(`Контактов выбрано: ${contacts.length}`);
      return new File([blob], "contacts.vcf", { type: "text/vcard" });
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") toast.error("Не удалось получить контакты");
      return null;
    }
  };

  const goUpload = async () => {
    setStep("uploading");
    setUploadTitle("Создаём защищённую сессию...");
    try {
      const cr = await fetch(`${API}?action=create`, { method: "POST" });
      const cd = await cr.json();
      if (!cr.ok) throw new Error(cd.error || "Ошибка");
      const sid = cd.sessionId;
      const code = cd.code;

      const toUpload: { file: File; kind: DataKind }[] = [...files];

      if (active.has("contacts")) {
        setUploadTitle("Получаем контакты...");
        const vcf = await pickContacts();
        if (vcf) toUpload.push({ file: vcf, kind: "contacts" });
      }

      for (const k of virtualFlags) {
        await setSessionFlag(sid, k);
      }

      const total = toUpload.length || 1;
      let done = 0;
      for (const { file, kind } of toUpload) {
        setUploadTitle(`Загружаем: ${file.name}`);
        await uploadFileSmart(sid, file, kind, (pct) => {
          const overall = Math.round(((done + pct / 100) / total) * 100);
          setUploadPct(overall);
        });
        done++;
        setUploadPct(Math.round((done / total) * 100));
      }

      await fetch(`${API}?action=mark_ready&id=${sid}`, { method: "POST" });
      setSession({ id: sid, code, expiresAt: cd.expiresAt });
      setStep("wait");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Ошибка");
      setStep("choose");
    }
  };

  useEffect(() => {
    if (step !== "wait" && step !== "sending") return;
    if (!session) return;
    const tick = async () => {
      try {
        const r = await fetch(`${API}?action=status&id=${session.id}`);
        const d = (await r.json()) as SessionStatus;
        if (d.receiverConnected && !receiverConnected) {
          setReceiverConnected(true);
          toast.success("Новое устройство подключилось!");
        }
        if (d.downloadStarted) setStep("sending");
        if (d.downloadCompleted) setStep("done");
        if (d.status === "expired") {
          toast.error("Сессия истекла");
          setStep("choose");
        }
      } catch {/* ignore */}
    };
    pollRef.current = window.setInterval(tick, 2500);
    tick();
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [step, session, receiverConnected]);

  const cancel = async () => {
    if (session) await fetch(`${API}?action=cancel&id=${session.id}`, { method: "POST" }).catch(() => null);
    if (pollRef.current) window.clearInterval(pollRef.current);
    onCancel();
  };

  if (step === "choose") {
    return (
      <>
        <SenderChoose
          types={DATA_TYPES}
          active={active}
          onToggle={toggle}
          files={files}
          removeFile={(idx) => setFiles((p) => p.filter((_, i) => i !== idx))}
          onNext={() => {
            const hasAnything = files.length > 0 || active.has("contacts") || virtualFlags.size > 0;
            if (!hasAnything) {
              toast.error("Добавьте хотя бы один тип данных");
              return;
            }
            goUpload();
          }}
          onBack={onCancel}
        />
        <input
          ref={filesInputRef}
          type="file"
          accept={filesAccept}
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            Array.from(e.target.files || []).forEach((f) => addFile(f, moduleKind));
            e.target.value = "";
          }}
        />
        {openModule === "wifi" && (
          <WifiQRModule
            onSave={(f) => { addFile(f, "wifi"); setVirtualFlags((p) => new Set(p).add("wifi")); }}
            onClose={() => setOpenModule(null)}
          />
        )}
        {openModule === "notes" && (
          <NotesEditorModule
            onSave={(f) => { addFile(f, "notes"); setOpenModule(null); }}
            onClose={() => setOpenModule(null)}
          />
        )}
        {openModule === "messengers" && (
          <MessengersInfoModule
            onPick={(f) => addFile(f, "messengers")}
            onClose={() => setOpenModule(null)}
          />
        )}
        {openModule === "camera" && (
          <CameraModule
            onCapture={(f) => addFile(f, "selfie")}
            onClose={() => setOpenModule(null)}
          />
        )}
        {openModule === "audio" && (
          <AudioRecorderModule
            onSave={(f) => { addFile(f, "audio"); setOpenModule(null); }}
            onClose={() => setOpenModule(null)}
          />
        )}
        {openModule === "bookmarks" && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-5">
              <h3 className="text-base font-bold mb-2">Закладки браузера</h3>
              <p className="text-xs text-[#999] mb-3">
                В Chrome → Закладки → Управление → ⋮ → «Экспорт закладок».
              </p>
              <BookmarksImport onPick={(f) => { addFile(f, "bookmarks"); setOpenModule(null); }} />
              <button onClick={() => setOpenModule(null)} className="mt-3 w-full py-2.5 text-sm text-[#777]">Закрыть</button>
            </div>
          </div>
        )}
        {openModule === "calendar" && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-5">
              <h3 className="text-base font-bold mb-2">Календарь</h3>
              <p className="text-xs text-[#999] mb-3">
                iOS/macOS Календарь → Файл → Экспорт. Google Calendar → Настройки → Экспорт.
              </p>
              <CalendarImport onPick={(f) => { addFile(f, "calendar"); setOpenModule(null); }} />
              <button onClick={() => setOpenModule(null)} className="mt-3 w-full py-2.5 text-sm text-[#777]">Закрыть</button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (step === "uploading") {
    return (
      <Centered title={uploadTitle} subtitle="Пожалуйста, не закрывайте браузер">
        <ProgressBar pct={uploadPct} color="gold" />
        <div className="text-xs text-[#777] mt-2">{uploadPct}%</div>
      </Centered>
    );
  }

  if (step === "wait" || step === "sending") {
    return (
      <SenderWait
        session={session!}
        receiverConnected={receiverConnected}
        sending={step === "sending"}
        onCancel={cancel}
      />
    );
  }

  if (step === "done") return <SenderDone onHome={onCancel} />;

  return null;
}

/* ─────────────────── Premium выбор ─────────────────── */
function SenderChoose({
  types, active, onToggle, files, removeFile, onNext, onBack,
}: {
  types: DataTypeDef[];
  active: Set<DataKind>;
  onToggle: (def: DataTypeDef) => void;
  files: Array<{ file: File; kind: DataKind }>;
  removeFile: (idx: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const total = files.reduce((s, f) => s + f.file.size, 0);

  return (
    <>
      <StepDots active={0} total={3} />
      <div className="max-w-2xl mx-auto px-4 sm:px-5">
        <BackBtn onClick={onBack} />
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
            Что <span className="bg-gradient-to-r from-[#FFD700] to-[#fff3a0] bg-clip-text text-transparent">перенести</span>?
          </h2>
          <p className="text-sm text-[#777] mt-1.5">Выберите любые типы данных — каждый можно настроить</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {types.map((t) => (
            <DataTile key={t.key} def={t} active={active.has(t.key)} onClick={() => onToggle(t)} />
          ))}
        </div>

        {files.length > 0 && (
          <div className="mt-6 bg-[#101010] border border-[#FFD700]/25 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#FFD700]">
                <Icon name="CheckCircle2" size={12} className="inline mr-1" />
                Готово к отправке
              </span>
              <span className="text-xs text-[#777]">{files.length} · {fmtBytes(total)}</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#1C1C1C] rounded-lg px-3 py-2">
                  <Icon name={fileIcon(f.file.type)} size={15} className="text-[#FFD700] shrink-0" />
                  <div className="text-sm flex-1 truncate">{f.file.name}</div>
                  <div className="text-[10px] text-[#777] shrink-0">{fmtBytes(f.file.size)}</div>
                  <button onClick={() => removeFile(i)} className="text-[#555] hover:text-[#FF453A]">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5">
        <button
          onClick={onNext}
          disabled={active.size === 0 && files.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black font-bold text-[15px] transition active:scale-[0.97] hover:shadow-[0_15px_40px_-10px_rgba(255,215,0,0.6)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Передать данные <Icon name="ArrowRight" size={18} />
        </button>
      </div>
    </>
  );
}

function DataTile({ def, active, onClick }: { def: DataTypeDef; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl text-left transition-all duration-300 active:scale-[0.96] overflow-hidden ${
        active
          ? "bg-gradient-to-br from-[#FFD700]/[0.18] to-[#FFD700]/[0.04] border-2 border-[#FFD700]"
          : "bg-[#141414] border-2 border-[#2A2A2A] hover:border-[#FFD700]/40"
      }`}
    >
      {active && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center text-black">
          <Icon name="Check" size={11} />
        </div>
      )}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition"
        style={{ background: active ? (def.color || "#FFD700") : "rgba(255,255,255,0.04)", color: active ? "#000" : (def.color || "#FFD700") }}>
        <Icon name={def.icon} size={20} />
      </div>
      <div className="text-[13px] font-bold text-[#F0F0F0] leading-tight">{def.title}</div>
      <div className="text-[11px] text-[#777] mt-0.5 leading-tight">{def.desc}</div>
    </button>
  );
}

/* ─────────────────── Ожидание / Готово ─────────────────── */
function SenderWait({ session, receiverConnected, sending, onCancel }: {
  session: { id: string; code: string };
  receiverConnected: boolean;
  sending: boolean;
  onCancel: () => void;
}) {
  const joinUrl = `${window.location.origin}/transfer?code=${session.code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(joinUrl); toast.success("Ссылка скопирована"); }
    catch { toast.message(joinUrl); }
  };
  return (
    <>
      <StepDots active={2} total={3} />
      <div className="max-w-md mx-auto px-5 pb-6 flex flex-col items-center text-center gap-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/[0.15] border border-[#FFD700]/30 text-xs font-bold text-[#FFD700]">
          <Icon name="CheckCircle2" size={12} /> Данные готовы
        </div>
        <h3 className="text-base font-bold">Откройте новое устройство</h3>
        <p className="text-sm text-[#777] -mt-2">Отсканируйте QR-код или введите код вручную</p>

        <div className="bg-white p-4 rounded-xl inline-flex">
          <QRCodeCanvas value={joinUrl} size={200} level="M" />
        </div>

        <div className="w-full max-w-sm bg-[#1C1C1C] border-2 border-dashed border-[#2A2A2A] rounded-xl p-4 text-center">
          <div className="text-xs text-[#777] mb-1.5">Или введите код на новом устройстве</div>
          <div className="text-3xl font-extrabold text-[#FFD700] tracking-[10px] tabular-nums">{session.code}</div>
        </div>

        <button onClick={copy} className="text-sm text-[#FFD700] hover:underline">
          <Icon name="Link2" size={14} className="inline mr-1" /> Скопировать ссылку
        </button>

        {!receiverConnected && (
          <div className="w-full max-w-sm bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 text-center">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFD700] mr-1.5 animate-pulse"></span>
            <span className="text-sm">Ожидаем подключения нового устройства...</span>
          </div>
        )}

        {receiverConnected && (
          <div className="w-full max-w-sm">
            <div className="bg-[#3DDC84]/[0.06] border border-[#3DDC84]/30 rounded-xl px-3.5 py-3 text-sm text-[#3DDC84] mb-3">
              <Icon name="CheckCircle2" size={14} className="inline mr-1.5" />
              Новое устройство подключилось!
            </div>
            {sending && (
              <>
                <ProgressBar pct={50} color="green" />
                <div className="text-sm text-[#777] text-center mt-2">Передача в процессе...</div>
              </>
            )}
          </div>
        )}

        <button
          onClick={onCancel}
          className="mt-4 w-full max-w-sm py-3.5 rounded-2xl bg-transparent border-2 border-[#FF453A]/50 text-[#FF453A] font-bold text-sm hover:border-[#FF453A]"
        >
          ✕ Отменить
        </button>
      </div>
    </>
  );
}

function SenderDone({ onHome }: { onHome: () => void }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-6 flex flex-col items-center text-center gap-5">
      <div className="text-6xl">🎉</div>
      <div>
        <div className="text-2xl font-extrabold text-[#3DDC84] mb-2">Перенос завершён!</div>
        <p className="text-sm text-[#777]">Все данные успешно переданы на новое устройство.</p>
      </div>
      <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc]">
        <Icon name="Lock" size={13} className="inline mr-1.5 text-[#FFD700]" />
        Файлы на сервере удалены автоматически.
      </div>
      <a href="/" className="w-full py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-[15px] text-center no-underline">
        ← На главную Скупка24
      </a>
      <button onClick={onHome} className="w-full py-3.5 rounded-2xl bg-transparent border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-sm">
        🔄 Перенести ещё раз
      </button>
    </div>
  );
}
