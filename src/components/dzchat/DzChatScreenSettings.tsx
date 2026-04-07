/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import DzChatAvatar from "./DzChatAvatar";
import DzChatAvatarEditor from "./DzChatAvatarEditor";
import { NOTIFICATION_SOUNDS, playNotificationSound, unlockAudio } from "./dzchat.sounds";
import { THEMES, saveTheme } from "./dzchat.theme";
import { api } from "./dzchat.utils";

interface Props {
  me: any;
  token: string;
  onUpdate: (u: any) => void;
  onLogout: () => void;
  onThemeChange: () => void;
  onOpenSetupGuide: () => void;
  notifGranted: boolean;
  onRequestNotifications: () => void;
  totalUnread: number;
}

const Row = ({ icon, label, value, onPress, color, badge }: {
  icon: string; label: string; value?: string;
  onPress?: () => void; color?: string; badge?: number;
}) => (
  <button
    onClick={onPress}
    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 border-b border-white/5 last:border-0">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: color || "#3a3a3c" }}>
      <Icon name={icon as any} size={17} className="text-white" />
    </div>
    <p className="flex-1 text-left text-white text-[15px]">{label}</p>
    <div className="flex items-center gap-2 shrink-0">
      {value && <span className="text-white/40 text-sm">{value}</span>}
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#3a3a3c] text-white/70 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      <Icon name="ChevronRight" size={16} className="text-white/20" />
    </div>
  </button>
);

type SubScreen = null | "account" | "privacy" | "chats" | "notifications" | "storage" | "avatar" | "invite";

const DzChatScreenSettings = ({
  me, token, onUpdate, onLogout, onThemeChange,
  onOpenSetupGuide, notifGranted, onRequestNotifications, totalUnread,
}: Props) => {
  const [sub, setSub] = useState<SubScreen>(null);
  const [name, setName] = useState(me.name);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatar_url || null);
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [soundId, setSoundId] = useState(() => localStorage.getItem("dzchat_sound") || "default");
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem("dzchat_vibrate") !== "off");
  const [themeId, setThemeId] = useState(() => localStorage.getItem("dzchat_theme") ?? "dark");
  const fileRef = useRef<HTMLInputElement>(null);

  // Синхронизируем превью когда me обновляется извне (после сохранения)
  useEffect(() => {
    if (!avatarB64) {
      setAvatarPreview(me.avatar_url || null);
      setName(me.name);
    }
  }, [me.avatar_url, me.name, me.avatar_bust]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEditorSave = (b64: string, preview: string) => {
    setAvatarB64(b64); setAvatarPreview(preview); setEditSrc(null);
  };

  const saveProfile = async () => {
    setSaving(true);
    let avatar_url = me.avatar_url;
    if (avatarB64) {
      setUploadingAvatar(true);
      try {
        const res = await api("upload", "POST", { image: avatarB64, mime: "image/jpeg", kind: "avatar" }, token);
        setUploadingAvatar(false);
        if (res?.url) avatar_url = res.url;
        else { setSaving(false); alert("Не удалось загрузить фото"); return; }
      } catch { setUploadingAvatar(false); setSaving(false); alert("Ошибка сети"); return; }
    }
    await api("profile", "POST", { name, avatar_url }, token);
    setSaving(false);
    const bust = avatarB64 ? Date.now() : me.avatar_bust;
    onUpdate({ ...me, name, avatar_url, avatar_bust: bust });
    setAvatarB64(null);
    setSub(null);
  };

  if (editSrc) return (
    <DzChatAvatarEditor src={editSrc} onSave={handleEditorSave} onClose={() => setEditSrc(null)} />
  );

  // ── Подэкран: Аккаунт (редактирование профиля) ──
  if (sub === "account") return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={() => setSub(null)} className="text-[#25D366]"><Icon name="ArrowLeft" size={22} /></button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Аккаунт</h2>
        <button onClick={saveProfile} disabled={saving}
          className="text-[#25D366] text-sm font-medium disabled:opacity-40">
          {saving ? "..." : "Сохранить"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Аватар */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <button onClick={() => fileRef.current?.click()} className="relative group">
              <div className="rounded-full overflow-hidden w-24 h-24">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <DzChatAvatar name={name || "?"} size={96} />}
              </div>
              <div className="absolute inset-0 bg-black/55 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
                <Icon name="Camera" size={22} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                  <Icon name="Loader" size={22} className="text-white animate-spin" />
                </div>
              )}
            </button>
            {avatarPreview && (
              <button onClick={() => setEditSrc(avatarPreview!)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center border-2 border-black">
                <Icon name="Pencil" size={14} className="text-white" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>
        {/* Имя */}
        <div>
          <p className="text-[#25D366] text-xs mb-1 px-1">Имя</p>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-[#1c1c1e] text-white px-4 py-3 rounded-xl outline-none text-[15px]" />
        </div>
        <div>
          <p className="text-[#25D366] text-xs mb-1 px-1">Телефон</p>
          <div className="bg-[#1c1c1e] px-4 py-3 rounded-xl">
            <p className="text-white/50 text-[15px]">{me.phone || "—"}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );

  // ── Подэкран: Уведомления ──
  if (sub === "notifications") return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={() => setSub(null)} className="text-[#25D366]"><Icon name="ArrowLeft" size={22} /></button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Уведомления</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Push */}
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-medium">Push-уведомления</p>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${notifGranted ? "bg-[#25D366]" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifGranted ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </div>
          {!notifGranted && (
            <button onClick={onRequestNotifications}
              className="w-full bg-[#25D366] text-white text-sm py-2.5 rounded-xl font-medium">
              Разрешить уведомления
            </button>
          )}
          {notifGranted && <p className="text-white/40 text-xs">Уведомления включены ✓</p>}
        </div>
        {/* Звук */}
        <p className="text-white/40 text-xs px-1">Звук уведомлений</p>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {NOTIFICATION_SOUNDS.map(s => (
            <button key={s.id} onClick={() => {
              setSoundId(s.id); localStorage.setItem("dzchat_sound", s.id);
              if (s.id !== "none") { unlockAudio(); playNotificationSound(s.id); }
            }}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-white text-[15px] flex-1 text-left">{s.label}</span>
              {soundId === s.id && <Icon name="Check" size={18} className="text-[#25D366]" />}
            </button>
          ))}
        </div>
        {/* Вибрация */}
        <div className="bg-[#1c1c1e] rounded-2xl">
          <button onClick={() => {
            const next = !vibrateOn; setVibrateOn(next);
            localStorage.setItem("dzchat_vibrate", next ? "on" : "off");
            if (next && navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }}
            className="w-full flex items-center justify-between px-4 py-3.5">
            <p className="text-white text-[15px]">Вибрация</p>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${vibrateOn ? "bg-[#25D366]" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${vibrateOn ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // ── Подэкран: Чаты (тема) ──
  if (sub === "chats") return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={() => setSub(null)} className="text-[#25D366]"><Icon name="ArrowLeft" size={22} /></button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Чаты</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-white/40 text-xs mb-3 px-1">Тема оформления</p>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => {
              setThemeId(t.id); saveTheme(t.id); onThemeChange();
            }}
              className="rounded-2xl p-3 border-2 transition-colors text-left"
              style={{ background: t.bg, borderColor: themeId === t.id ? "#25D366" : "transparent" }}>
              <div className="w-6 h-6 rounded-full mb-2" style={{ background: t.accent }} />
              <p className="text-white text-sm font-medium">{t.label}</p>
            </button>
          ))}
        </div>
        <button onClick={onOpenSetupGuide}
          className="w-full mt-5 py-3 rounded-xl bg-[#1c1c1e] text-white text-sm flex items-center justify-center gap-2">
          <Icon name="MonitorSmartphone" size={16} />
          Установка и уведомления
        </button>
      </div>
    </div>
  );

  // ── Подэкран: Конфиденциальность ──
  if (sub === "privacy") return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={() => setSub(null)} className="text-[#25D366]"><Icon name="ArrowLeft" size={22} /></button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Конфиденциальность</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {[
            { label: "Последнее посещение", value: "Все" },
            { label: "Фото профиля", value: "Все" },
            { label: "Статус", value: "Все" },
            { label: "Группы", value: "Все" },
          ].map((item, i, arr) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <p className="text-white text-[15px]">{item.label}</p>
              <span className="text-white/40 text-sm">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Главный экран настроек ──
  return (
    <div className="flex flex-col h-full" style={{ background: "#000" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
          <Icon name="Search" size={17} className="text-white" />
        </button>
        <h1 className="text-white font-bold text-[22px]">Настройки</h1>
        <button className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
          <Icon name="QrCode" size={17} className="text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Профиль */}
        <button onClick={() => setSub("account")}
          className="w-full flex items-center gap-4 px-4 py-4 active:bg-white/5 mb-2">
          <div className="relative shrink-0">
            <DzChatAvatar name={me.name || "?"} url={me.avatar_url} size={62} bust={me.avatar_bust} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white font-semibold text-[18px] truncate">{me.name}</p>
            <p className="text-white/40 text-sm truncate mt-0.5">
              {localStorage.getItem("dzchat_status_text") || me.phone || "Нажми для редактирования"}
            </p>
          </div>
          <Icon name="ChevronRight" size={18} className="text-white/20 shrink-0" />
        </button>

        {/* Блок 1 */}
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4">
          <Row icon="Image" label="Аватар" color="#8e44ad" onPress={() => setSub("account")} />
          <Row icon="UserPlus" label="Пригласить контакт" color="#2980b9" onPress={() => {
            if (navigator.share) navigator.share({ title: "DzChat", text: "Присоединяйся к DzChat!", url: window.location.origin });
          }} />
        </div>

        {/* Блок 2 */}
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4">
          <Row icon="Megaphone" label="Размещение рекламы" color="#e67e22" />
          <Row icon="Briefcase" label="Инструменты для бизнеса" color="#16a085" />
        </div>

        {/* Блок 3 */}
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4">
          <Row icon="Star" label="Избранные" color="#f39c12" />
          <Row icon="Megaphone" label="Списки рассылки" color="#8e44ad" />
          <Row icon="Users" label="Сообщества" color="#2980b9" />
          <Row icon="Monitor" label="Связанные устройства" color="#7f8c8d" onPress={onOpenSetupGuide} />
        </div>

        {/* Блок 4 */}
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4">
          <Row icon="Key" label="Аккаунт" color="#e74c3c" onPress={() => setSub("account")} />
          <Row icon="Lock" label="Конфиденциальность" color="#7f8c8d" onPress={() => setSub("privacy")} />
          <Row icon="MessageCircle" label="Чаты" color="#27ae60" onPress={() => setSub("chats")} badge={totalUnread || undefined} />
          <Row icon="Bell" label="Уведомления" color="#e74c3c" onPress={() => setSub("notifications")} />
          <Row icon="HardDrive" label="Данные и хранилище" color="#2980b9" />
        </div>

        {/* Блок 5 */}
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-8">
          <Row icon="HelpCircle" label="Помощь" color="#27ae60" />
          <Row icon="LogOut" label="Выйти из аккаунта" color="#e74c3c" onPress={onLogout} />
        </div>
      </div>
    </div>
  );
};

export default DzChatScreenSettings;