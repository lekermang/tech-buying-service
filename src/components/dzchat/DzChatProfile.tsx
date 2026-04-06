/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";
import { NOTIFICATION_SOUNDS, playNotificationSound } from "./dzchat.sounds";

export const ProfileModal = ({ me, token, onClose, onUpdate, onLogout, onSwitchAccount }: {
  me: any; token: string; onClose: () => void; onUpdate: (u: any) => void;
  onLogout?: () => void; onSwitchAccount?: () => void;
}) => {
  const [name, setName] = useState(me.name);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [soundId, setSoundId] = useState<string>(() => localStorage.getItem("dzchat_sound") || "default");
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem("dzchat_vibrate") !== "off");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(() => localStorage.getItem("dzchat_custom_audio") || null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    "Notification" in window ? Notification.permission : "denied"
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 512;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setAvatarPreview(dataUrl);
      setAvatarB64(dataUrl.split(",")[1]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  // Загрузка кастомного звука из галереи
  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    localStorage.setItem("dzchat_custom_audio", url);
    setSoundId("custom");
    localStorage.setItem("dzchat_sound", "custom");
    // Предпрослушивание
    const audio = new Audio(url);
    audio.play().catch(() => {});
    e.target.value = "";
  };

  const handleSoundChange = (id: string) => {
    setSoundId(id);
    localStorage.setItem("dzchat_sound", id);
    if (id === "custom" && customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      audio.play().catch(() => {});
    } else {
      playNotificationSound(id);
    }
  };

  const handleVibrateToggle = () => {
    const next = !vibrateOn;
    setVibrateOn(next);
    localStorage.setItem("dzchat_vibrate", next ? "on" : "off");
    if (next && navigator.vibrate) navigator.vibrate([100, 50, 100]);
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
      if (res.url) avatar_url = res.url;
      else { setSaving(false); return; }
    }
    await api("profile", "POST", { name, avatar_url }, token);
    setSaving(false);
    onUpdate({ ...me, name, avatar_url });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[94vh] overflow-y-auto"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-base">⚙️ Настройки</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={18} /></button>
        </div>

        {/* Аватарка */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <button className="relative group" onClick={() => fileRef.current?.click()}>
            <DzChatAvatar name={name || "?"} url={avatarPreview || undefined} size={90} />
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
              <Icon name="Camera" size={22} className="text-white" />
              <span className="text-white text-[10px] mt-0.5">Изменить</span>
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Icon name="Loader" size={22} className="text-white animate-spin" />
              </div>
            )}
          </button>
          <p className="text-white/30 text-xs">Нажми для смены фото</p>
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

          {/* Вибрация */}
          {"vibrate" in navigator && (
            <button onClick={handleVibrateToggle}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                vibrateOn ? "border-[#25D366]/40 bg-[#25D366]/10" : "border-white/10 bg-white/5"
              }`}>
              <Icon name="Smartphone" size={18} className={vibrateOn ? "text-[#25D366]" : "text-white/40"} />
              <span className={`flex-1 text-left text-sm ${vibrateOn ? "text-white" : "text-white/50"}`}>Вибрация при сообщении</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${vibrateOn ? "bg-[#25D366]" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${vibrateOn ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}
        </div>

        {/* ── Звук уведомлений ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icon name="Volume2" size={12} /> Звук уведомлений
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {NOTIFICATION_SOUNDS.map(s => (
            <button key={s.id} onClick={() => handleSoundChange(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                soundId === s.id
                  ? "border-[#25D366] bg-[#25D366]/15 text-white"
                  : "border-white/10 text-white/50 active:border-white/30"
              }`}>
              <span className="text-base">{s.emoji}</span>
              <span className="truncate flex-1 text-left">{s.label}</span>
              {soundId === s.id && <Icon name="Check" size={12} className="text-[#25D366] shrink-0" />}
            </button>
          ))}
          {/* Кнопка выбора из галереи */}
          <button onClick={() => audioFileRef.current?.click()}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
              soundId === "custom"
                ? "border-[#25D366] bg-[#25D366]/15 text-white"
                : "border-white/10 text-white/50 active:border-white/30"
            }`}>
            <span className="text-base">🎵</span>
            <span className="truncate flex-1 text-left">{soundId === "custom" ? "Мой звук ✓" : "Из галереи"}</span>
          </button>
          <input ref={audioFileRef} type="file" accept="audio/*" onChange={handleAudioFile} className="hidden" />
        </div>
        <audio ref={customAudioRef} />

        {/* ── Установка приложения ── */}
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 mt-4">
          <Icon name="Smartphone" size={12} /> Приложение
        </p>
        <div className="space-y-2 mb-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white text-sm font-medium mb-3">Установи DzChat как приложение</p>
            <div className="space-y-3">
              {/* iOS */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-[#007AFF]/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="Share2" size={14} className="text-[#007AFF]" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">iPhone / iPad (Safari)</p>
                  <p className="text-white/40 text-xs mt-0.5">Нажми «Поделиться» → «На экран Домой»</p>
                </div>
              </div>
              {/* Android */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-[#4285F4]/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="Chrome" size={14} className="text-[#4285F4]" fallback="Globe" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">Android (Chrome)</p>
                  <p className="text-white/40 text-xs mt-0.5">Меню ⋮ → «Добавить на главный экран»</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Сохранить */}
        <button onClick={save} disabled={saving || uploadingAvatar}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl active:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3 text-base">
          {saving ? <><Icon name="Loader" size={16} className="animate-spin" /> Сохранение...</> : "Сохранить"}
        </button>

        {/* Выйти / Сменить аккаунт */}
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
