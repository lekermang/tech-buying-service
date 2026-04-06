/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  ("standalone" in window.navigator && (window.navigator as any).standalone) ||
  window.matchMedia("(display-mode: standalone)").matches;
const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ── Полный гайд установки + уведомлений ──────────────────────────
export const DzChatSetupGuide = ({
  installPrompt,
  onInstall,
  initialTab = "install",
}: {
  installPrompt: any;
  onInstall: () => void;
  initialTab?: "install" | "notifications";
}) => {
  const [tab, setTab] = useState<"install" | "notifications">(initialTab);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [notifState, setNotifState] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [installed, setInstalled] = useState(isInStandaloneMode());

  useEffect(() => {
    if (isIOS()) setPlatform("ios");
    else if (isAndroid()) setPlatform("android");
    else setPlatform("desktop");
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifState(perm);
    // Отправляем SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({ type: "NOTIF_PERM", granted: perm === "granted" });
      }).catch(() => {});
    }
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await onInstall();
      setInstalled(true);
    }
  };

  const notifGranted = notifState === "granted";
  const notifDenied = notifState === "denied";

  return (
    <div className="bg-[#0f1923] min-h-full flex flex-col">
      {/* Табы */}
      <div className="flex border-b border-white/10 bg-[#1a2634]">
        <button
          onClick={() => setTab("install")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "install" ? "text-white border-b-2 border-[#25D366]" : "text-white/40"}`}>
          Установка
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "notifications" ? "text-white border-b-2 border-[#25D366]" : "text-white/40"}`}>
          Уведомления
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── ВКЛАДКА УСТАНОВКА ── */}
        {tab === "install" && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                <span className="text-white font-black text-2xl">D</span>
              </div>
              <div>
                <p className="text-white font-bold text-base">DzChat</p>
                <p className="text-white/40 text-sm">Мессенджер для телефона</p>
              </div>
            </div>

            {installed ? (
              <div className="bg-[#25D366]/15 border border-[#25D366]/30 rounded-2xl p-4 text-center">
                <p className="text-[#25D366] font-semibold text-sm">Приложение уже установлено!</p>
                <p className="text-white/40 text-xs mt-1">Открывай DzChat с главного экрана</p>
              </div>
            ) : (
              <>
                {/* Android — кнопка установки */}
                {platform === "android" && installPrompt && (
                  <button onClick={handleInstall}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                    <Icon name="Download" size={18} /> Установить приложение
                  </button>
                )}

                {/* iOS — инструкция Safari */}
                {platform === "ios" && (
                  <div className="space-y-3">
                    {!isSafari() && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                        <p className="text-amber-400 text-xs text-center">
                          ⚠️ Открой эту страницу в Safari — только там можно установить приложение на iPhone
                        </p>
                      </div>
                    )}
                    <GuideStep n={1} icon="Share2" color="#007AFF"
                      title="Нажми «Поделиться»"
                      desc="Кнопка внизу Safari (квадрат со стрелкой вверх)" />
                    <GuideStep n={2} icon="Plus" color="#34C759"
                      title="«На экран «Домой»»"
                      desc="Прокрути список вниз и найди этот пункт" />
                    <GuideStep n={3} icon="Check" color="#FFD700"
                      title="Нажми «Добавить»"
                      desc="DzChat появится на рабочем столе как приложение" />
                    <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl p-3">
                      <p className="text-[#007AFF] text-xs text-center">
                        Работает на iOS 16.4+ в Safari. На iPad — аналогично.
                      </p>
                    </div>
                  </div>
                )}

                {/* Android без installPrompt */}
                {platform === "android" && !installPrompt && (
                  <div className="space-y-3">
                    <GuideStep n={1} icon="MoreVertical" color="#4285F4"
                      title="Меню браузера"
                      desc='Нажми ⋮ в правом верхнем углу Chrome' />
                    <GuideStep n={2} icon="MonitorSmartphone" color="#34A853"
                      title="«Добавить на главный экран»"
                      desc="Или «Установить приложение» — зависит от браузера" />
                    <GuideStep n={3} icon="Check" color="#FFD700"
                      title="Подтверди установку"
                      desc="DzChat будет работать как обычное приложение" />
                  </div>
                )}

                {/* Desktop */}
                {platform === "desktop" && (
                  <div className="space-y-3">
                    <GuideStep n={1} icon="Globe" color="#4285F4"
                      title="Значок установки"
                      desc="Нажми на значок установки ⊕ в адресной строке Chrome" />
                    <GuideStep n={2} icon="Check" color="#34A853"
                      title="Установить"
                      desc="Подтверди установку — DzChat откроется как отдельное окно" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── ВКЛАДКА УВЕДОМЛЕНИЯ ── */}
        {tab === "notifications" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#25D366]/15 flex items-center justify-center mx-auto mb-3">
                <Icon name="Bell" size={28} className="text-[#25D366]" />
              </div>
              <p className="text-white font-semibold">Уведомления о сообщениях</p>
              <p className="text-white/40 text-xs mt-1">Узнавай о новых сообщениях мгновенно</p>
            </div>

            {/* Статус */}
            {notifGranted && (
              <div className="bg-[#25D366]/15 border border-[#25D366]/30 rounded-2xl p-4 text-center">
                <Icon name="CheckCircle" size={20} className="text-[#25D366] mx-auto mb-1" />
                <p className="text-[#25D366] font-semibold text-sm">Уведомления включены!</p>
                <p className="text-white/40 text-xs mt-1">Ты будешь получать уведомления о новых сообщениях</p>
              </div>
            )}

            {!notifGranted && (
              <>
                {/* iOS — специальный флоу */}
                {platform === "ios" && (
                  <div className="space-y-3">
                    {!installed ? (
                      <>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                          <p className="text-amber-300 text-xs font-medium mb-1">Сначала установи приложение</p>
                          <p className="text-white/50 text-xs">Уведомления на iPhone работают только если DzChat добавлен на главный экран через Safari</p>
                        </div>
                        <button onClick={() => setTab("install")}
                          className="w-full py-3 rounded-2xl text-sm font-semibold text-white border border-[#25D366]/40 hover:bg-[#25D366]/10 transition-colors">
                          Перейти к установке →
                        </button>
                      </>
                    ) : (
                      <>
                        <GuideStep n={1} icon="Settings" color="#007AFF"
                          title="Настройки iPhone"
                          desc="Открой Настройки → DzChat → Уведомления" />
                        <GuideStep n={2} icon="ToggleRight" color="#34C759"
                          title="Включи уведомления"
                          desc="Разреши звук, бейджи и баннеры" />
                        <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-xl p-3">
                          <p className="text-[#007AFF] text-xs">Работает на iOS 16.4+ (iPhone и iPad). На iOS 26 поддержка улучшена.</p>
                        </div>
                        <button onClick={requestNotifications}
                          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg,#007AFF,#5AC8FA)" }}>
                          <Icon name="Bell" size={18} /> Разрешить уведомления
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Android */}
                {platform !== "ios" && (
                  <div className="space-y-3">
                    {notifDenied && notifState !== "default" ? (
                      <>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <p className="text-red-400 text-xs font-medium mb-1">Уведомления заблокированы</p>
                          <p className="text-white/50 text-xs">Разреши их вручную в настройках браузера</p>
                        </div>
                        <GuideStep n={1} icon="Settings" color="#4285F4"
                          title="Настройки браузера"
                          desc='Нажми 🔒 в адресной строке → Разрешения → Уведомления' />
                        <GuideStep n={2} icon="ToggleRight" color="#34A853"
                          title="Разрешить"
                          desc="Переключи на «Разрешить» и перезагрузи страницу" />
                      </>
                    ) : (
                      <>
                        <p className="text-white/50 text-sm text-center">Нажми кнопку и разреши уведомления в всплывающем окне браузера</p>
                        <button onClick={requestNotifications}
                          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                          <Icon name="Bell" size={18} /> Разрешить уведомления
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Настройки звука */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Что работает</p>
              <FeatureRow icon="BellRing" color="#25D366"
                title="Звук при новом сообщении"
                desc="Работает в браузере и приложении" ok />
              <FeatureRow icon="Vibrate" color="#25D366"
                title="Вибрация"
                desc="Android + некоторые iPhone" ok />
              <FeatureRow icon="Hash" color="#25D366"
                title="Бейдж на иконке"
                desc="Счётчик непрочитанных на ярлыке" ok={installed} notOk={!installed}
                hint={!installed ? "Нужна установка на экран" : undefined} />
              <FeatureRow icon="Bell" color={notifGranted ? "#25D366" : "#f59e0b"}
                title="Push-уведомления"
                desc="Когда приложение закрыто" ok={notifGranted} notOk={!notifGranted}
                hint={!notifGranted ? "Нажми «Разрешить уведомления»" : undefined} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Шаг инструкции ────────────────────────────────────────────────
const GuideStep = ({ n, icon, color, title, desc }: {
  n: number; icon: string; color: string; title: string; desc: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
      style={{ background: color }}>
      {n}
    </div>
    <div className="flex-1 pt-0.5">
      <div className="flex items-center gap-2 mb-0.5">
        <Icon name={icon as any} size={14} style={{ color }} />
        <p className="text-white text-sm font-medium">{title}</p>
      </div>
      <p className="text-white/40 text-xs">{desc}</p>
    </div>
  </div>
);

// ── Строка фичи ───────────────────────────────────────────────────
const FeatureRow = ({ icon, color, title, desc, ok, notOk, hint }: {
  icon: string; color: string; title: string; desc: string;
  ok?: boolean; notOk?: boolean; hint?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: color + "20" }}>
      <Icon name={icon as any} size={16} style={{ color }} />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-white text-sm">{title}</p>
        {ok && <Icon name="Check" size={13} className="text-[#25D366]" />}
        {notOk && <Icon name="X" size={13} className="text-red-400" />}
      </div>
      <p className="text-white/40 text-xs">{desc}</p>
      {hint && <p className="text-amber-400 text-xs mt-0.5">→ {hint}</p>}
    </div>
  </div>
);

// ── Баннер в сайдбаре ─────────────────────────────────────────────
export const DzChatInstallBanner = ({ installPrompt, onInstall, onOpenGuide }: {
  installPrompt: any;
  onInstall: () => void;
  onOpenGuide: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (installPrompt) { setShow(true); setPlatform("android"); return; }
    if (isIOS()) { setShow(true); setPlatform("ios"); return; }
    if (isAndroid()) { setShow(true); setPlatform("android"); return; }
  }, [installPrompt]);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        if (installPrompt) onInstall();
        else onOpenGuide();
      }}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
        <Icon name="MonitorSmartphone" size={18} className="text-white" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-white text-sm font-semibold leading-tight">Установить DzChat</p>
        <p className="text-white/40 text-xs">
          {platform === "ios" ? "Добавить на экран iPhone" : "Установить как приложение"}
        </p>
      </div>
      <Icon name="ChevronRight" size={16} className="text-white/30 shrink-0" />
    </button>
  );
};
