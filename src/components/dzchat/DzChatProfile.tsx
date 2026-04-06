/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";
import DzChatAvatarEditor from "./DzChatAvatarEditor";
import { NOTIFICATION_SOUNDS, playNotificationSound, playSendSound, unlockAudio } from "./dzchat.sounds";
import { THEMES, saveTheme, loadAndApplyTheme } from "./dzchat.theme";

const Toggle = ({ on }: { on: boolean }) => (
  <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${on ? "bg-[#25D366]" : "bg-white/20"}`}>
    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </div>
);

export const ProfileModal = ({ me, token, onClose, onUpdate, onLogout, onSwitchAccount, onThemeChange }: {
  me: any; token: string; onClose: () => void; onUpdate: (u: any) => void;
  onLogout?: () => void; onSwitchAccount?: () => void; onThemeChange?: () => void;
}) => {
  const [name, setName] = useState(me.name);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatar_url || null);
  const [editSrc, setEditSrc] = useState<string | null>(null);   // исходник для редактора
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [soundId, setSoundId] = useState<string>(() => localStorage.getItem("dzchat_sound") || "default");
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem("dzchat_vibrate") !== "off");
  const [sendSoundOn, setSendSoundOn] = useState(() => localStorage.getItem("dzchat_send_sound") !== "off");
  const [themeId, setThemeId] = useState(() => localStorage.getItem("dzchat_theme") ?? "dark");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(() => localStorage.getItem("dzchat_custom_audio") || null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    "Notification" in window ? Notification.permission : "denied"
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  // Открываем редактор вместо немедленной обрезки
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Редактор вернул готовый b64 + preview
  const handleEditorSave = (b64: string, preview: string) => {
    setAvatarB64(b64);
    setAvatarPreview(preview);
    setEditSrc(null);
  };

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    localStorage.setItem("dzchat_custom_audio", url);
    setSoundId("custom");
    localStorage.setItem("dzchat_sound", "custom");
    new Audio(url).play().catch(() => {});
    e.target.value = "";
  };

  const handleSoundChange = (id: string) => {
    unlockAudio();
    setSoundId(id);
    localStorage.setItem("dzchat_sound", id);
    if (id === "custom" && customAudioUrl) new Audio(customAudioUrl).play().catch(() => {});
    else playNotificationSound(id);
  };

  const handleVibrateToggle = () => {
    const next = !vibrateOn;
    setVibrateOn(next);
    localStorage.setItem("dzchat_vibrate", next ? "on" : "off");
    if (next && navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const handleThemeChange = (id: string) => {
    setThemeId(id);
    saveTheme(id);
    onThemeChange?.();
  };

  const handleSendSoundToggle = () => {
    unlockAudio();
    const next = !sendSoundOn;
    setSendSoundOn(next);
    localStorage.setItem("dzchat_send_sound", next ? "on" : "off");
    if (next) playSendSound();
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      reg?.active?.postMessage({ type: "NOTIF_PERM", granted: perm === "granted" });
    }
  };

  const save = async () => {
    setSaving(true);
    let avatar_url = me.avatar_url;
    if (avatarB64) {
      setUploadingAvatar(true);
      const res = await api("upload", "POST", { image: avatarB64, mime: "image/jpeg", kind: "avatar" }, token);
      setUploadingAvatar(false);
      if (res.url) {
        avatar_url = res.url;
      } else {
        setSaving(false);
        return;
      }
    }
    const saved = await api("profile", "POST", { name, avatar_url }, token);
    setSaving(false);
    // Используем URL который вернул сервер (или тот что только что загрузили)
    const finalUrl = saved.avatar_url || avatar_url;
    onUpdate({ ...me, name, avatar_url: finalUrl });
    onClose();
  };

  // Если открыт редактор — показываем его поверх всего
  if (editSrc) {
    return (
      <DzChatAvatarEditor
        src={editSrc}
        onSave={handleEditorSave}
        onClose={() => setEditSrc(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[94vh] overflow-y-auto"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-base">⚙️ Настройки</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={18} /></button>
        </div>

        {/* ── Аватарка ── */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="relative">
            <button className="relative group" onClick={() => fileRef.current?.click()}>
              <div className="rounded-full overflow-hidden" style={{ width: 90, height: 90 }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar"
                    style={{ width: 90, height: 90, objectFit: "cover", display: "block" }} />
                ) : (
                  <DzChatAvatar name={name || "?"} size={90} />
                )}
              </div>
              <div className="absolute inset-0 bg-black/55 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
                <Icon name="Camera" size={22} className="text-white" />
                <span className="text-white text-[10px] mt-0.5">Изменить</span>
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <Icon name="Loader" size={22} className="text-white animate-spin" />
                </div>
              )}
            </button>
            {/* Зелёная кнопка редактировать */}
            {avatarPreview && (
              <button onClick={() => avatarPreview && setEditSrc(avatarPreview)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center border-2 border-[#1a2634]">
                <Icon name="Pencil" size={14} className="text-white" />
              </button>
            )}
          </div>
          <p className="text-white/30 text-xs">Нажми для смены · ✏️ для редактирования</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>

        {/* Имя */}
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none mb-1 focus:ring-1 focus:ring-[#25D366] text-base" />
        <p className="text-white/30 text-xs mb-5 px-1">📱 {me.phone}</p>

        {/* ── Уведомления ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icon name="Bell" size={12} /> Уведомления
        </p>
        <div className="space-y-2 mb-5">
          {notifPerm === "granted" ? (
            <div className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl px-3 py-2.5">
              <Icon name="BellRing" size={16} className="text-[#25D366]" />
              <span className="text-[#25D366] text-sm flex-1">Пуш-уведомления включены</span>
              <Icon name="Check" size={14} className="text-[#25D366]" />
            </div>
          ) : notifPerm === "denied" ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <p className="text-red-400 text-sm font-medium">🚫 Уведомления заблокированы</p>
              <p className="text-red-300/60 text-xs mt-0.5">Разреши в настройках браузера → Уведомления</p>
            </div>
          ) : (
            <button onClick={requestNotifications}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3 rounded-xl active:bg-[#1da851] text-sm">
              <Icon name="Bell" size={16} /> Разрешить пуш-уведомления
            </button>
          )}
        </div>

        {/* ── Звук и вибрация ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icon name="Volume2" size={12} /> Звук и вибрация
        </p>
        <div className="space-y-2 mb-3">
          {/* Звук отправки */}
          <button onClick={handleSendSoundToggle}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              sendSoundOn ? "border-[#25D366]/40 bg-[#25D366]/10" : "border-white/10 bg-white/5"
            }`}>
            <Icon name="Send" size={17} className={sendSoundOn ? "text-[#25D366]" : "text-white/40"} />
            <div className="flex-1 text-left">
              <p className={`text-sm ${sendSoundOn ? "text-white" : "text-white/50"}`}>Звук отправки</p>
              <p className="text-white/30 text-xs">При нажатии «Отправить»</p>
            </div>
            <Toggle on={sendSoundOn} />
          </button>

          {/* Вибрация */}
          {"vibrate" in navigator && (
            <button onClick={handleVibrateToggle}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                vibrateOn ? "border-[#25D366]/40 bg-[#25D366]/10" : "border-white/10 bg-white/5"
              }`}>
              <Icon name="Smartphone" size={17} className={vibrateOn ? "text-[#25D366]" : "text-white/40"} />
              <div className="flex-1 text-left">
                <p className={`text-sm ${vibrateOn ? "text-white" : "text-white/50"}`}>Вибрация</p>
                <p className="text-white/30 text-xs">При входящих сообщениях</p>
              </div>
              <Toggle on={vibrateOn} />
            </button>
          )}
        </div>

        {/* Звук уведомлений — выбор */}
        <p className="text-white/40 text-xs mb-2 px-1">Звук входящих сообщений:</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {NOTIFICATION_SOUNDS.map(s => (
            <button key={s.id} onClick={() => handleSoundChange(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                soundId === s.id ? "border-[#25D366] bg-[#25D366]/15 text-white" : "border-white/10 text-white/50 active:border-white/30"
              }`}>
              <span className="text-base">{s.emoji}</span>
              <span className="truncate flex-1 text-left">{s.label}</span>
              {soundId === s.id && <Icon name="Check" size={12} className="text-[#25D366] shrink-0" />}
            </button>
          ))}
          <button onClick={() => { unlockAudio(); audioFileRef.current?.click(); }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
              soundId === "custom" ? "border-[#25D366] bg-[#25D366]/15 text-white" : "border-white/10 text-white/50"
            }`}>
            <span className="text-base">🎵</span>
            <span className="truncate flex-1 text-left">{soundId === "custom" ? "Мой звук ✓" : "Из галереи"}</span>
          </button>
          <input ref={audioFileRef} type="file" accept="audio/*" onChange={handleAudioFile} className="hidden" />
        </div>
        <p className="text-white/25 text-xs mb-5 px-1">Нажми на звук чтобы послушать</p>

        {/* ── Оформление ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 mt-5">
          <Icon name="Palette" size={12} /> Оформление
        </p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {THEMES.map(t => {
            const active = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`relative flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm transition-all overflow-hidden ${
                  active ? "border-[#25D366] ring-1 ring-[#25D366]/50" : "border-white/10 hover:border-white/25"
                }`}
                style={{
                  background: t.isGlass
                    ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)"
                    : t.sidebar,
                }}>
                {/* Мини-превью пузырей */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="w-8 h-2.5 rounded-full opacity-90"
                    style={{ background: t.bubbleOut }} />
                  <div className="w-6 h-2.5 rounded-full opacity-70 self-end"
                    style={{ background: t.bubbleIn }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium leading-tight" style={{ color: t.text }}>
                    {t.emoji} {t.label}
                  </p>
                  {t.isGlass && (
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      прозрачный
                    </p>
                  )}
                </div>
                {active && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: t.accent }}>
                    <Icon name="Check" size={10} className="text-white" />
                  </div>
                )}
                {/* Акцент-полоска */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                  style={{ background: active ? t.accent : "transparent" }} />
              </button>
            );
          })}
        </div>

        {/* ── Установка ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 mt-4">
          <Icon name="Smartphone" size={12} /> Приложение
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#007AFF]/20 rounded-lg flex items-center justify-center shrink-0">
              <Icon name="Share2" size={14} className="text-[#007AFF]" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium">iPhone / iPad (Safari)</p>
              <p className="text-white/40 text-xs mt-0.5">Нажми «Поделиться» → «На экран Домой»</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[#4285F4]/20 rounded-lg flex items-center justify-center shrink-0">
              <Icon name="Globe" size={14} className="text-[#4285F4]" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium">Android (Chrome)</p>
              <p className="text-white/40 text-xs mt-0.5">Меню ⋮ → «Добавить на главный экран»</p>
            </div>
          </div>
        </div>

        {/* Сохранить */}
        <button onClick={save} disabled={saving || uploadingAvatar}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl active:bg-[#1da851] disabled:opacity-50 flex items-center justify-center gap-2 mb-3 text-base">
          {saving ? <><Icon name="Loader" size={16} className="animate-spin" /> Сохранение...</> : "Сохранить"}
        </button>

        <div className="flex gap-2">
          {onSwitchAccount && (
            <button onClick={onSwitchAccount}
              className="flex-1 flex items-center justify-center gap-1.5 border border-white/10 text-white/50 py-2.5 rounded-xl text-sm">
              <Icon name="RefreshCw" size={14} /> Сменить аккаунт
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-sm">
              <Icon name="LogOut" size={14} /> Выйти
            </button>
          )}
        </div>
      </div>
    </div>
  );
};