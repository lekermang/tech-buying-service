import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "ios" | "desktop" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux/i.test(ua)) return "desktop";
  return "other";
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneApp());

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => { setInstalled(true); setCanPrompt(false); };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const trigger = async (): Promise<boolean> => {
    const ev = promptRef.current;
    if (!ev) return false;
    try {
      await ev.prompt();
      const res = await ev.userChoice;
      promptRef.current = null;
      setCanPrompt(false);
      if (res.outcome === "accepted") {
        setInstalled(true);
        return true;
      }
    } catch (_) { /* noop */ }
    return false;
  };

  return { canPrompt, installed, trigger };
}

type Props = {
  open: boolean;
  onClose: () => void;
  appName?: string;
  appDescription?: string;
};

export default function InstallAppModal({ open, onClose, appName = "Скупка24", appDescription = "На главный экран — как обычное приложение" }: Props) {
  const [platform, setPlatform] = useState<Platform>("other");
  const { canPrompt, trigger } = useInstallPrompt();

  useEffect(() => {
    if (open) setPlatform(detectPlatform());
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#FFD700]/30 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/70 p-5 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#0A0A0A] border-2 border-[#FFD700] flex items-center justify-center shadow-lg shadow-[#FFD700]/20 shrink-0">
              <span className="font-oswald font-black text-[#FFD700] text-2xl leading-none">S</span>
            </div>
            <div className="min-w-0">
              <div className="font-oswald font-bold text-white uppercase tracking-wider text-base leading-tight truncate">{appName}</div>
              <div className="font-roboto text-white/45 text-[10px] truncate">{appDescription}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/5 shrink-0" aria-label="Закрыть">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: "Zap", t: "Быстро", d: "Открывается мгновенно" },
            { icon: "WifiOff", t: "Офлайн", d: "Работает без сети" },
            { icon: "Smartphone", t: "Полный экран", d: "Без браузера" },
          ].map(b => (
            <div key={b.t} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-2.5 text-center">
              <Icon name={b.icon} size={16} className="text-[#FFD700] mx-auto mb-1" />
              <div className="font-oswald font-bold text-white text-[11px] uppercase">{b.t}</div>
              <div className="font-roboto text-white/40 text-[9px]">{b.d}</div>
            </div>
          ))}
        </div>

        {canPrompt && platform !== "ios" && (
          <button
            onClick={async () => { const ok = await trigger(); if (ok) onClose(); }}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
          >
            <Icon name="Download" size={16} />
            Установить сейчас
          </button>
        )}

        {platform === "ios" && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Apple" size={14} className="text-white/70" />
              <div className="font-oswald font-bold text-white uppercase text-xs tracking-wider">iPhone / iPad — Safari</div>
            </div>
            <ol className="space-y-2">
              {[
                { n: 1, t: "Откройте этот сайт в Safari", icon: "Compass" },
                { n: 2, t: "Нажмите кнопку «Поделиться» внизу экрана", icon: "Share" },
                { n: 3, t: "Выберите «На экран Домой»", icon: "PlusSquare" },
                { n: 4, t: "Нажмите «Добавить» в правом верхнем углу", icon: "Check" },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="font-roboto text-white/85 text-xs leading-tight">{s.t}</div>
                    <Icon name={s.icon} size={13} className="text-white/30 shrink-0" />
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1.5 flex items-start gap-1.5">
              <Icon name="Info" size={11} className="text-amber-300 shrink-0 mt-0.5" />
              <div className="font-roboto text-amber-200/80 text-[10px] leading-snug">
                На iPhone установка работает только в Safari. Если открыли в Chrome/Yandex — скопируйте ссылку и откройте в Safari.
              </div>
            </div>
          </div>
        )}

        {(platform === "android" || platform === "other") && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Smartphone" size={14} className="text-green-400/80" />
              <div className="font-oswald font-bold text-white uppercase text-xs tracking-wider">Android — Chrome</div>
            </div>
            <ol className="space-y-2">
              {[
                { n: 1, t: "Нажмите кнопку «⋮» в правом верхнем углу браузера", icon: "MoreVertical" },
                { n: 2, t: "Выберите «Установить приложение» или «Добавить на главный экран»", icon: "Download" },
                { n: 3, t: "Подтвердите кнопкой «Установить»", icon: "Check" },
                { n: 4, t: "Иконка появится на рабочем столе телефона", icon: "Home" },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{s.n}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="font-roboto text-white/85 text-xs leading-tight">{s.t}</div>
                    <Icon name={s.icon} size={13} className="text-white/30 shrink-0" />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {platform === "desktop" && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Monitor" size={14} className="text-blue-400/80" />
              <div className="font-oswald font-bold text-white uppercase text-xs tracking-wider">Компьютер — Chrome / Edge</div>
            </div>
            <div className="font-roboto text-white/70 text-xs leading-relaxed">
              Нажмите значок <Icon name="Download" size={12} className="inline -mt-0.5" /> в адресной строке справа и выберите «Установить».
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full text-white/40 hover:text-white font-roboto text-xs py-2.5">
          Закрыть
        </button>
      </div>
    </div>
  );
}
