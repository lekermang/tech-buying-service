import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/d3550608-e324-4580-b568-6ba80c9c37b5";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

type Role = "select" | "sender" | "receiver";
type SenderStep = "choose" | "uploading" | "wait" | "sending" | "done";
type ReceiverStep = "code" | "wait" | "ready" | "downloading" | "done";

type SessionFile = { id: number; name: string; mime: string | null; size: number };
type SessionStatus = {
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

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} КБ`;
  return `${(b / 1024 / 1024).toFixed(1)} МБ`;
}

function fileIcon(mime: string | null | undefined): string {
  if (!mime) return "FileText";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.includes("pdf")) return "FileText";
  if (mime.includes("word") || mime.includes("document")) return "FileText";
  if (mime.includes("sheet") || mime.includes("excel")) return "Sheet";
  if (mime.includes("vcard")) return "Contact";
  return "File";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1] || "");
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function Transfer() {
  const [params] = useSearchParams();
  const joinFromUrl = params.get("join");
  const codeFromUrl = params.get("code");

  const [role, setRole] = useState<Role>("select");

  useEffect(() => {
    if (joinFromUrl || codeFromUrl) setRole("receiver");
  }, [joinFromUrl, codeFromUrl]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      {role === "select" && <RoleScreen onSelect={setRole} />}
      {role === "sender" && <SenderFlow onCancel={() => setRole("select")} />}
      {role === "receiver" && (
        <ReceiverFlow
          prefillCode={codeFromUrl || joinFromUrl || ""}
          onCancel={() => setRole("select")}
        />
      )}
    </div>
  );
}

function TopBar() {
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

/* ─────────────────── РОЛИ ─────────────────── */
function RoleScreen({ onSelect }: { onSelect: (r: Role) => void }) {
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

/* ─────────────────── ОТПРАВИТЕЛЬ ─────────────────── */
function SenderFlow({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<SenderStep>("choose");
  const [options, setOptions] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [session, setSession] = useState<{ id: string; code: string; expiresAt: string } | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadTitle, setUploadTitle] = useState("Подготовка...");
  const [receiverConnected, setReceiverConnected] = useState(false);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const toggle = (k: string) => {
    setOptions(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const addFiles = (incoming: File[]) => {
    setFiles(prev => {
      const map = new Map(prev.map(f => [f.name + f.size, f]));
      incoming.forEach(f => {
        if (f.size > MAX_FILE_BYTES) {
          toast.error(`Файл "${f.name}" больше 25 МБ — пропущен`);
          return;
        }
        map.set(f.name + f.size, f);
      });
      return Array.from(map.values());
    });
  };

  const pickContacts = async (): Promise<File | null> => {
    const nav = navigator as Navigator & {
      contacts?: { select: (props: string[], opts: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>> };
    };
    if (!nav.contacts) {
      toast.error("Выбор контактов поддерживается только в Chrome Android и Safari iOS 14.5+");
      return null;
    }
    try {
      const contacts = await nav.contacts.select(["name", "tel", "email"], { multiple: true });
      if (!contacts.length) return null;
      const vcards = contacts.map(c => {
        const name = c.name?.[0] || "Без имени";
        const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`];
        c.tel?.forEach(t => lines.push(`TEL:${t}`));
        c.email?.forEach(e => lines.push(`EMAIL:${e}`));
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

      // Контакты
      const toUpload: { file: File; kind: string }[] = [];
      if (options.has("contacts")) {
        setUploadTitle("Получаем контакты...");
        const vcf = await pickContacts();
        if (vcf) toUpload.push({ file: vcf, kind: "contacts" });
      }
      files.forEach(f => {
        const kind = (f.type || "").startsWith("image/") || (f.type || "").startsWith("video/") ? "photos" : "docs";
        toUpload.push({ file: f, kind });
      });

      // Загрузка файлов по одному (base64 JSON)
      let done = 0;
      const total = toUpload.length || 1;
      for (const { file, kind } of toUpload) {
        setUploadTitle(`Загружаем: ${file.name}`);
        const b64 = await fileToBase64(file);
        const r = await fetch(`${API}?action=upload&id=${sid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileBase64: b64,
            kind,
          }),
        });
        if (!r.ok) {
          const ed = await r.json().catch(() => ({}));
          throw new Error(ed.error || `Ошибка загрузки ${file.name}`);
        }
        done++;
        setUploadPct(Math.round((done / total) * 100));
      }

      // Mark ready
      await fetch(`${API}?action=mark_ready&id=${sid}`, { method: "POST" });
      setSession({ id: sid, code, expiresAt: cd.expiresAt });
      setStep("wait");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Ошибка");
      setStep("choose");
    }
  };

  // Поллинг статуса (ждём получателя и окончания скачивания)
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
        if (d.downloadStarted) {
          setStep("sending");
        }
        if (d.downloadCompleted) {
          setStep("done");
        }
        if (d.status === "expired") {
          toast.error("Сессия истекла");
          setStep("choose");
        }
      } catch {
        /* ignore */
      }
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

  /* ─── Рендер шагов ─── */
  if (step === "choose") {
    return (
      <SenderChoose
        options={options}
        toggle={toggle}
        files={files}
        addFiles={addFiles}
        removeFile={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
        onNext={goUpload}
        onBack={onCancel}
        photosInputRef={photosInputRef}
        docsInputRef={docsInputRef}
      />
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
  if (step === "done") {
    return <SenderDone onHome={onCancel} />;
  }
  return null;
}

function StepDots({ active, total }: { active: number; total: number }) {
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

function SenderChoose({
  options, toggle, files, addFiles, removeFile, onNext, onBack, photosInputRef, docsInputRef,
}: {
  options: Set<string>;
  toggle: (k: string) => void;
  files: File[];
  addFiles: (f: File[]) => void;
  removeFile: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
  photosInputRef: React.RefObject<HTMLInputElement>;
  docsInputRef: React.RefObject<HTMLInputElement>;
}) {
  const showDropzone = options.has("photos") || options.has("docs");
  const canNext = options.size > 0;

  return (
    <>
      <StepDots active={0} total={3} />
      <div className="max-w-md mx-auto px-5">
        <BackBtn onClick={onBack} />
        <h3 className="font-bold text-base mb-1 mt-2">Что перенести?</h3>
        <p className="text-sm text-[#777] mb-5">Выберите типы данных для передачи на новый телефон</p>

        <OptionRow icon="Users" title="Контакты" desc="Все номера и имена" active={options.has("contacts")} onClick={() => toggle("contacts")} />
        <OptionRow icon="Camera" title="Фото и видео" desc="Выберите файлы из галереи" active={options.has("photos")} onClick={() => toggle("photos")} />
        <OptionRow icon="FileText" title="Документы" desc="PDF, Word, таблицы" active={options.has("docs")} onClick={() => toggle("docs")} />

        <input ref={photosInputRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
          onChange={(e) => addFiles(Array.from(e.target.files || []))} />
        <input ref={docsInputRef} type="file" multiple style={{ display: "none" }}
          onChange={(e) => addFiles(Array.from(e.target.files || []))} />

        {showDropzone && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => photosInputRef.current?.click()}
              disabled={!options.has("photos")}
              className="rounded-xl border-2 border-dashed border-[#2A2A2A] p-4 text-center disabled:opacity-40 hover:border-[#FFD700] transition"
            >
              <Icon name="ImagePlus" size={22} className="mx-auto mb-1 text-[#FFD700]" />
              <div className="text-xs text-[#999]">Добавить фото / видео</div>
            </button>
            <button
              onClick={() => docsInputRef.current?.click()}
              disabled={!options.has("docs")}
              className="rounded-xl border-2 border-dashed border-[#2A2A2A] p-4 text-center disabled:opacity-40 hover:border-[#FFD700] transition"
            >
              <Icon name="FilePlus" size={22} className="mx-auto mb-1 text-[#FFD700]" />
              <div className="text-xs text-[#999]">Добавить документы</div>
            </button>
          </div>
        )}

        {options.has("contacts") && (
          <div className="mt-3 bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc]">
            <Icon name="Info" size={13} className="inline mr-1.5 text-[#FFD700]" />
            На следующем шаге браузер откроет список контактов — выберите нужные.
            <div className="text-xs text-[#777] mt-1">Работает в Chrome (Android) и Safari (iOS 14.5+)</div>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider font-bold text-[#777] mb-2">
              Выбрано файлов: {files.length} · {fmtBytes(files.reduce((s, f) => s + f.size, 0))}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#1C1C1C] rounded-lg px-3 py-2">
                  <Icon name={fileIcon(f.type)} size={16} className="text-[#FFD700] shrink-0" />
                  <div className="text-sm flex-1 truncate">{f.name}</div>
                  <div className="text-xs text-[#777] shrink-0">{fmtBytes(f.size)}</div>
                  <button onClick={() => removeFile(i)} className="text-[#777] hover:text-[#FF453A]">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-5 py-5">
        <button
          onClick={onNext}
          disabled={!canNext}
          className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-bold text-[15px] transition active:scale-[0.97] hover:bg-[#FFE033] disabled:bg-[#3A3500] disabled:text-[#665D00] disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </>
  );
}

function OptionRow({ icon, title, desc, active, onClick }: { icon: string; title: string; desc: string; active: boolean; onClick: () => void }) {
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

function ProgressBar({ pct, color = "gold" }: { pct: number; color?: "gold" | "green" }) {
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

function Centered({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-6 flex flex-col items-center text-center gap-4">
      <Icon name="Loader2" size={40} className="text-[#FFD700] animate-spin" />
      <h3 className="text-base font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-[#777]">{subtitle}</p>}
      {children}
    </div>
  );
}

function SenderWait({ session, receiverConnected, sending, onCancel }: { session: { id: string; code: string }; receiverConnected: boolean; sending: boolean; onCancel: () => void }) {
  const joinUrl = `${window.location.origin}/transfer?code=${session.code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(joinUrl); toast.success("Ссылка скопирована"); } catch { toast.message(joinUrl); }
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

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-[#FFD700] flex items-center gap-1 mb-3">
      <Icon name="ChevronLeft" size={14} /> Назад
    </button>
  );
}

/* ─────────────────── ПОЛУЧАТЕЛЬ ─────────────────── */
function ReceiverFlow({ prefillCode, onCancel }: { prefillCode: string; onCancel: () => void }) {
  const [step, setStep] = useState<ReceiverStep>("code");
  const [code, setCode] = useState(prefillCode.toUpperCase().slice(0, 6));
  const [session, setSession] = useState<{ id: string } | null>(null);
  const [info, setInfo] = useState<{ files: SessionFile[]; totalBytes: number; hasContacts: boolean; hasPhotos: boolean } | null>(null);
  const [dlPct, setDlPct] = useState(0);
  const pollRef = useRef<number | null>(null);

  const joinSession = useCallback(async (codeToJoin?: string) => {
    const c = (codeToJoin || code).trim().toUpperCase();
    if (c.length < 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    setStep("wait");
    try {
      const r = await fetch(`${API}?action=find&code=${c}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Сессия не найдена");
      const sid = d.sessionId as string;
      setSession({ id: sid });
      // Уведомить отправителя
      await fetch(`${API}?action=mark_connected&id=${sid}`, { method: "POST" }).catch(() => null);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message);
      setStep("code");
    }
  }, [code]);

  // Автоматически подключаем, если пришли по ссылке
  useEffect(() => {
    if (prefillCode && step === "code") {
      joinSession(prefillCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCode]);

  // Поллим — ждём пока статус станет ready
  useEffect(() => {
    if (step !== "wait" || !session) return;
    const tick = async () => {
      try {
        const r = await fetch(`${API}?action=status&id=${session.id}`);
        const d = (await r.json()) as SessionStatus;
        if (d.status === "ready" || d.status === "downloading" || d.status === "completed") {
          // Грузим файлы
          const fr = await fetch(`${API}?action=files&id=${session.id}`);
          const fd = await fr.json();
          setInfo(fd);
          setStep("ready");
        } else if (d.status === "expired" || d.status === "cancelled") {
          toast.error("Сессия истекла или отменена");
          setStep("code");
        }
      } catch {
        /* ignore */
      }
    };
    pollRef.current = window.setInterval(tick, 2500);
    tick();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [step, session]);

  const startDownload = async () => {
    if (!session) return;
    setStep("downloading");
    setDlPct(10);
    try {
      const url = `${API}?action=zip&id=${session.id}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Ошибка скачивания");
      const reader = r.body?.getReader();
      const total = Number(r.headers.get("content-length") || 0);
      let received = 0;
      const chunks: Uint8Array[] = [];
      if (reader) {
         
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) {
              setDlPct(Math.round((received / total) * 100));
            }
          }
        }
      }
      const blob = new Blob(chunks, { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `transfer_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setDlPct(100);

      // vcf отдельно
      if (info?.hasContacts) {
        const vcf = info.files.find(f => f.name.toLowerCase().endsWith(".vcf"));
        if (vcf) {
          const vcfUrl = `${API}?action=file&id=${session.id}&file_id=${vcf.id}`;
          setTimeout(() => {
            const b = document.createElement("a");
            b.href = vcfUrl;
            b.download = vcf.name;
            document.body.appendChild(b);
            b.click();
            document.body.removeChild(b);
          }, 800);
        }
      }
      setTimeout(() => setStep("done"), 800);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message);
      setStep("ready");
    }
  };

  if (step === "code") {
    return (
      <div className="max-w-md mx-auto px-5 pt-6 pb-6">
        <BackBtn onClick={onCancel} />
        <h3 className="text-base font-bold mb-1">Введите код</h3>
        <p className="text-sm text-[#777] mb-5">Введите 6-значный код, который отображается на старом устройстве</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          maxLength={6}
          placeholder="------"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-[#1C1C1C] border-2 border-[#2A2A2A] rounded-xl px-4 py-3.5 text-3xl font-extrabold tracking-[10px] text-center text-[#FFD700] uppercase tabular-nums outline-none focus:border-[#FFD700] transition placeholder:text-[#2A2A2A]"
        />

        <button
          onClick={() => joinSession()}
          disabled={code.length < 6}
          className="mt-5 w-full py-4 rounded-2xl bg-[#FFD700] text-black font-bold text-[15px] disabled:bg-[#3A3500] disabled:text-[#665D00] active:scale-[0.97] transition"
        >
          Подключиться
        </button>

        <div className="mt-5 bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc]">
          <Icon name="Lightbulb" size={13} className="inline mr-1.5 text-[#FFD700]" />
          Откройте старый телефон на странице Перенос данных — там увидите код.
        </div>
      </div>
    );
  }

  if (step === "wait") {
    return (
      <Centered title="Ждём данные..." subtitle="Старое устройство загружает файлы" />
    );
  }

  if (step === "ready" && info) {
    return (
      <div className="max-w-md mx-auto px-5 pt-6 pb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3DDC84]/[0.15] border border-[#3DDC84]/30 text-xs font-bold text-[#3DDC84] mb-3">
          <Icon name="Link2" size={12} /> Устройства соединены
        </div>
        <h3 className="text-base font-bold mb-1">Готово к получению</h3>
        <p className="text-sm text-[#777] mb-4">Данные со старого устройства:</p>

        <div className="max-h-64 overflow-y-auto space-y-1.5 mb-4">
          {info.files.map(f => (
            <div key={f.id} className="flex items-center gap-2 bg-[#1C1C1C] rounded-lg px-3 py-2">
              <Icon name={fileIcon(f.mime)} size={16} className="text-[#FFD700] shrink-0" />
              <div className="text-sm flex-1 truncate">{f.name}</div>
              <div className="text-xs text-[#777] shrink-0">{fmtBytes(f.size)}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#777]">Файлов:</span>
            <span className="font-bold">{info.files.length} шт.</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#777]">Размер:</span>
            <span className="font-bold">{fmtBytes(info.totalBytes)}</span>
          </div>
        </div>

        <button
          onClick={startDownload}
          className="w-full py-4 rounded-2xl bg-[#3DDC84] text-black font-bold text-[15px] active:scale-[0.97] transition"
        >
          <Icon name="Download" size={16} className="inline mr-2" />
          Получить данные
        </button>
      </div>
    );
  }

  if (step === "downloading") {
    return (
      <Centered title="Скачиваем данные..." subtitle="Не закрывайте браузер">
        <ProgressBar pct={dlPct} color="green" />
        <div className="text-sm font-bold text-[#3DDC84] mt-2">{dlPct}%</div>
      </Centered>
    );
  }

  if (step === "done" && info) {
    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-6 flex flex-col items-center text-center gap-5">
        <div className="text-6xl">✅</div>
        <div>
          <div className="text-2xl font-extrabold text-[#3DDC84] mb-2">Данные получены!</div>
          <p className="text-sm text-[#777]">Получено {info.files.length} файл(ов) · {fmtBytes(info.totalBytes)}</p>
        </div>
        <div className="w-full space-y-2">
          {info.hasContacts && (
            <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc] text-left">
              <Icon name="Users" size={13} className="inline mr-1.5 text-[#FFD700]" />
              <b>Контакты (.vcf):</b> файл скачан отдельно. Откройте его — телефон предложит «Импортировать».
            </div>
          )}
          {info.hasPhotos && (
            <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] rounded-xl px-3.5 py-3 text-sm text-[#ccc] text-left">
              <Icon name="Camera" size={13} className="inline mr-1.5 text-[#FFD700]" />
              <b>Фото:</b> распакуйте архив из «Загрузок» и сохраните в галерею.
            </div>
          )}
        </div>
        <a href="/" className="w-full py-3.5 rounded-2xl bg-[#FFD700] text-black font-bold text-[15px] text-center no-underline">
          ← На главную Скупка24
        </a>
        <button onClick={onCancel} className="w-full py-3.5 rounded-2xl bg-transparent border-2 border-[#2A2A2A] text-[#F0F0F0] font-bold text-sm">
          🔄 Перенести ещё раз
        </button>
      </div>
    );
  }

  return null;
}
