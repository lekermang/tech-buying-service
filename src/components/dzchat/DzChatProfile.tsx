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
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    "Notification" in window ? Notification.permission : "denied"
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    // Сжимаем через canvas чтобы не превысить лимит base64
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 512;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setAvatarPreview(dataUrl);
      setAvatarB64(dataUrl.split(",")[1]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  const handleSoundChange = (id: string) => {
    setSoundId(id);
    localStorage.setItem("dzchat_sound", id);
    playNotificationSound(id);
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    // Передаём статус в SW
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
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Профиль</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={18} /></button>
        </div>

        {/* Аватарка */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <button className="relative group" onClick={() => fileRef.current?.click()}>
            <DzChatAvatar name={name || "?"} url={avatarPreview || undefined} size={90} />
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="Camera" size={22} className="text-white" />
              <span className="text-white text-[10px] mt-0.5">Изменить</span>
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Icon name="Loader" size={22} className="text-white animate-spin" />
              </div>
            )}
          </button>
          <p className="text-white/30 text-xs">Нажми чтобы изменить фото</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>

        {/* Имя */}
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-1 focus:ring-1 focus:ring-[#25D366]" />
        <p className="text-white/30 text-xs mb-5 px-1">📱 {me.phone}</p>

        {/* Уведомления */}
        <div className="mb-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="Bell" size={13} /> Уведомления
          </p>
          {notifPerm === "granted" ? (
            <div className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl px-3 py-2.5">
              <Icon name="BellRing" size={16} className="text-[#25D366]" />
              <span className="text-[#25D366] text-sm">Уведомления включены</span>
            </div>
          ) : notifPerm === "denied" ? (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <Icon name="BellOff" size={16} className="text-red-400" />
              <span className="text-red-400 text-sm flex-1">Заблокированы в браузере</span>
            </div>
          ) : (
            <button onClick={requestNotifications}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1da851] transition-colors text-sm">
              <Icon name="Bell" size={16} /> Разрешить уведомления
            </button>
          )}
        </div>

        {/* Звук */}
        <div className="mb-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="Volume2" size={13} /> Звук уведомлений
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NOTIFICATION_SOUNDS.map(s => (
              <button key={s.id} onClick={() => handleSoundChange(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  soundId === s.id
                    ? "border-[#25D366] bg-[#25D366]/15 text-white"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                }`}>
                <span className="text-base">{s.emoji}</span>
                <span className="truncate flex-1 text-left">{s.label}</span>
                {soundId === s.id && <Icon name="Check" size={13} className="text-[#25D366] shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Сохранить */}
        <button onClick={save} disabled={saving || uploadingAvatar}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3">
          {saving ? <><Icon name="Loader" size={16} className="animate-spin" /> Сохранение...</> : "Сохранить"}
        </button>

        {/* Выйти / Сменить аккаунт */}
        <div className="flex gap-2">
          {onSwitchAccount && (
            <button onClick={onSwitchAccount}
              className="flex-1 flex items-center justify-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 py-2.5 rounded-xl text-sm transition-colors">
              <Icon name="RefreshCw" size={14} /> Сменить аккаунт
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl text-sm transition-colors">
              <Icon name="LogOut" size={14} /> Выйти
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
