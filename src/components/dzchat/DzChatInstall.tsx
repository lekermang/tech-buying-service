/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  ("standalone" in window.navigator && (window.navigator as any).standalone) ||
  window.matchMedia("(display-mode: standalone)").matches;

export const DzChatInstallBanner = ({ installPrompt, onInstall }: {
  installPrompt: any;
  onInstall: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return; // уже установлено
    if (installPrompt) { setShow(true); setPlatform("android"); return; }
    if (isIOS()) { setShow(true); setPlatform("ios"); return; }
    if (isAndroid()) { setShow(true); setPlatform("android"); return; }
  }, [installPrompt]);

  if (!show) return null;

  return (
    <>
      {/* Плашка */}
      <button
        onClick={() => {
          if (installPrompt) { onInstall(); }
          else { setShowGuide(true); }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#FFD700]/15 to-[#FF6B00]/10 border-b border-[#FFD700]/20 hover:from-[#FFD700]/25 transition-all"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #FFD700, #FF6B00)" }}>
          <span className="text-black font-black text-lg leading-none">S</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Установить DzChat</p>
          <p className="text-white/40 text-xs">
            {platform === "ios" ? "Добавить на экран iPhone/iPad" : "Установить как приложение"}
          </p>
        </div>
        <Icon name="Download" size={18} className="text-[#FFD700] shrink-0" />
      </button>

      {/* Модал с инструкцией */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center" onClick={() => setShowGuide(false)}>
          <div className="bg-[#1a2634] w-full max-w-sm rounded-t-3xl p-6 pb-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FF6B00)" }}>
                  <span className="text-black font-black text-2xl leading-none">S</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">DzChat</p>
                  <p className="text-white/40 text-xs">Установка приложения</p>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-white/40 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>

            {platform === "ios" ? (
              <div className="space-y-4">
                <p className="text-white/60 text-sm text-center mb-4">Следуй инструкции в Safari:</p>
                <Step n={1} icon="Share2" color="#007AFF"
                  text='Нажми кнопку «Поделиться» внизу экрана' />
                <Step n={2} icon="PlusSquare" color="#34C759"
                  text='Выбери «На экран «Домой»»' />
                <Step n={3} icon="CheckCircle" color="#FFD700"
                  text='Нажми «Добавить» — DzChat появится на рабочем столе!' />
                <div className="mt-4 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl px-4 py-3">
                  <p className="text-[#007AFF] text-xs text-center">
                    💡 Работает только в Safari. В Chrome на iOS используй встроенный браузер.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/60 text-sm text-center mb-4">Следуй инструкции в Chrome:</p>
                <Step n={1} icon="MoreVertical" color="#4285F4"
                  text='Нажми меню ⋮ в правом верхнем углу браузера' />
                <Step n={2} icon="PlusCircle" color="#34A853"
                  text='Выбери «Добавить на главный экран»' />
                <Step n={3} icon="CheckCircle" color="#FFD700"
                  text='Нажми «Добавить» — DzChat появится как приложение!' />
                <div className="mt-4 bg-[#4285F4]/10 border border-[#4285F4]/20 rounded-xl px-4 py-3">
                  <p className="text-[#4285F4] text-xs text-center">
                    💡 Работает в Chrome и большинстве Android-браузеров.
                  </p>
                </div>
              </div>
            )}

            <button onClick={() => setShowGuide(false)}
              className="w-full mt-6 bg-gradient-to-r from-[#FFD700] to-[#FF6B00] text-black font-bold py-3 rounded-2xl">
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const Step = ({ n, icon, color, text }: { n: number; icon: string; color: string; text: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
      style={{ background: color }}>
      {n}
    </div>
    <div className="flex items-center gap-2 flex-1">
      <Icon name={icon as any} size={18} style={{ color }} className="shrink-0" />
      <p className="text-white/80 text-sm">{text}</p>
    </div>
  </div>
);

export default DzChatInstallBanner;
