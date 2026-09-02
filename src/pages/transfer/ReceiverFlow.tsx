import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  API,
  type ReceiverStep, type SessionFile, type SessionStatus,
  fmtBytes, fileIcon,
  ProgressBar, Centered, BackBtn,
} from "./shared";

export default function ReceiverFlow({ prefillCode, onCancel }: { prefillCode: string; onCancel: () => void }) {
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
      const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
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