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

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallPwaButton() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const onBefore = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => { setInstalled(true); setCanPrompt(false); setOpen(false); };

    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    const ev = promptRef.current;
    if (!ev) return;
    try {
      await ev.prompt();
      const res = await ev.userChoice;
      if (res.outcome === "accepted") {
        setInstalled(true);
        setOpen(false);
      }
      promptRef.current = null;
      setCanPrompt(false);
    } catch (_) { /* noop */ }
  };

  if (installed) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Установить как приложение"
        className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-roboto font-bold uppercase tracking-wide rounded-sm transition-all active:scale-95 bg-gradient-to-r from-blue-500/20 to-cyan-500/15 text-cyan-300 hover:from-blue-500/30 hover:to-cyan-500/25 ring-1 ring-cyan-400/30"
      >
        <Icon name="Download" size={12} />
        <span className="hidden sm:inline">Установить</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#FFD700]/20 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/70 p-5 max-h-[90vh] overflow-y-auto safe-bottom"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
                  <Icon name="Smartphone" size={18} className="text-black" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-white uppercase tracking-wider text-base leading-tight">Установить как приложение</div>
                  <div className="font-roboto text-white/40 text-[10px]">Скупка24 на главном экране</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/5">
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Преимущества */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: "Zap", t: "Быстрее", d: "Загрузка мгновенно" },
                { icon: "WifiOff", t: "Без браузера", d: "Полный экран" },
                { icon: "Bell", t: "Уведомления", d: "Чат и заявки" },
              ].map(b => (
                <div key={b.t} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-2.5 text-center">
                  <Icon name={b.icon} size={16} className="text-[#FFD700] mx-auto mb-1" />
                  <div className="font-oswald font-bold text-white text-[11px] uppercase">{b.t}</div>
                  <div className="font-roboto text-white/40 text-[9px]">{b.d}</div>
                </div>
              ))}
            </div>

            {/* Кнопка нативной установки (Android Chrome / Edge) */}
            {canPrompt && platform !== "ios" && (
              <button
                onClick={triggerInstall}
                className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
              >
                <Icon name="Download" size={16} />
                Установить сейчас
              </button>
            )}

            {/* Платформа: iOS */}
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
                    На iPhone установка работает только в браузере Safari. Если вы открыли в Chrome/Yandex — скопируйте ссылку и откройте в Safari.
                  </div>
                </div>
              </div>
            )}

            {/* Платформа: Android */}
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

            {/* Десктоп */}
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

            <button onClick={() => setOpen(false)} className="w-full text-white/40 hover:text-white font-roboto text-xs py-2.5">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
