/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

// ── ЗВУКИ УВЕДОМЛЕНИЙ ────────────────────────────────────────────
export const NOTIFICATION_SOUNDS = [
  { id: "default", label: "Стандартный", emoji: "🔔" },
  { id: "chime",   label: "Колокольчик", emoji: "🎵" },
  { id: "pop",     label: "Поп",         emoji: "💬" },
  { id: "ping",    label: "Пинг",        emoji: "📳" },
  { id: "none",    label: "Без звука",   emoji: "🔇" },
];

export const playNotificationSound = (soundId: string) => {
  if (soundId === "none") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (soundId === "chime") {
      osc.type = "sine"; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
    } else if (soundId === "pop") {
      osc.type = "sine"; osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } else if (soundId === "ping") {
      osc.type = "triangle"; osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine"; osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_e) { /* Web Audio not supported */ }
};

// ── NEW CHAT MODAL ───────────────────────────────────────────────
export const NewChatModal = ({ token, chats = [], onClose, onChatCreated }: {
  token: string; chats?: any[]; onClose: () => void; onChatCreated: (id: number) => void;
}) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsFound, setContactsFound] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // debounce поиска — ждём 400мс после последнего нажатия
  const handleSearch = (q: string) => {
    setQuery(q);
    setContactsFound([]);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setUsers([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
      setLoading(false);
      if (Array.isArray(res)) setUsers(res);
    }, 400);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const start = async (partnerId: number) => {
    const res = await api("create", "POST", { partner_id: partnerId }, token);
    if (res.chat_id) { onChatCreated(res.chat_id); onClose(); }
  };

  const syncContacts = async () => {
    const contacts = (navigator as any).contacts;
    if (!contacts) {
      alert("Ваш браузер не поддерживает доступ к контактам.\nПопробуйте Chrome на Android.");
      return;
    }
    setContactsLoading(true);
    try {
      const selected: any[] = await contacts.select(["name", "tel"], { multiple: true });
      if (!selected || selected.length === 0) { setContactsLoading(false); return; }
      const phones: string[] = [];
      selected.forEach((c: any) => {
        (c.tel || []).forEach((t: string) => {
          const cleaned = t.replace(/[\s()]/g, "").replace(/-/g, "");
          if (cleaned) phones.push(cleaned);
        });
      });
      const found: any[] = [];
      for (const phone of phones.slice(0, 30)) {
        const res = await api(`users&q=${encodeURIComponent(phone)}`, "GET", undefined, token);
        if (Array.isArray(res) && res.length > 0) {
          res.forEach(u => { if (!found.find(f => f.id === u.id)) found.push(u); });
        }
      }
      setContactsFound(found);
      if (found.length === 0) alert("Никто из ваших контактов пока не зарегистрирован в DzChat");
    } catch (_e) { /* cancelled */ }
    setContactsLoading(false);
  };

  const displayUsers = contactsFound.length > 0 ? contactsFound : users;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Новый чат</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>

        {"contacts" in navigator && (
          <button onClick={syncContacts} disabled={contactsLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] py-2.5 rounded-xl mb-3 hover:bg-[#25D366]/25 transition-colors disabled:opacity-50 text-sm font-medium">
            {contactsLoading
              ? <><Icon name="Loader" size={15} className="animate-spin" /> Поиск в контактах...</>
              : <><Icon name="BookUser" size={15} /> Найти из телефонной книги</>}
          </button>
        )}

        {contactsFound.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs">Из контактов: {contactsFound.length}</p>
            <button onClick={() => setContactsFound([])} className="text-white/30 text-xs hover:text-white/60">Очистить</button>
          </div>
        )}

        <div className="relative mb-3">
          <input type="text" value={query} onChange={e => handleSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none pr-10" />
          {loading && <Icon name="Loader" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[40px]">
          {!loading && query && users.length === 0 && contactsFound.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Никого не найдено</p>
          )}
          {displayUsers.map(u => {
            const existingChat = chats.find(c => c.type === "direct" && c.partner?.id === u.id);
            return (
              <button key={u.id} onClick={() => start(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <div className="relative">
                  <DzChatAvatar name={u.name} url={u.avatar_url} size={42} />
                  {u.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#1a2634] rounded-full" />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-white/40 text-xs">{u.phone}</p>
                </div>
                {existingChat
                  ? <span className="text-[11px] text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 px-2 py-0.5 rounded-full shrink-0">Открыть</span>
                  : <span className="text-[11px] text-white/25 shrink-0">Написать</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── PROFILE MODAL ────────────────────────────────────────────────
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

// ── EDIT GROUP MODAL ─────────────────────────────────────────────
export const EditGroupModal = ({ chat, token, onClose, onUpdated }: {
  chat: any; token: string; onClose: () => void; onUpdated: (name: string) => void;
}) => {
  const [name, setName] = useState(chat.name || "");
  const [members, setMembers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api(`group_info&chat_id=${chat.id}`, "GET", undefined, token).then(d => {
      if (d.members) setMembers(d.members);
    });
  }, [chat.id, token]);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setUsers([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
      setLoading(false);
      if (Array.isArray(res)) setUsers(res.filter(u => !members.find((m: any) => m.id === u.id)));
    }, 400);
  };

  const addMember = async (u: any) => {
    await api("group_add", "POST", { chat_id: chat.id, user_id: u.id }, token);
    setMembers(prev => [...prev, u]);
    setUsers(prev => prev.filter(x => x.id !== u.id));
    setQuery(""); setUsers([]);
  };

  const removeMember = async (userId: number) => {
    await api("group_remove", "POST", { chat_id: chat.id, user_id: userId }, token);
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await api("group_edit", "POST", { chat_id: chat.id, name }, token);
    setSaving(false);
    onUpdated(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Icon name="Settings" size={16} className="text-[#25D366]" /> Редактировать группу
          </h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Название группы"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-4 font-semibold focus:ring-1 focus:ring-[#25D366]" />

        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Участники ({members.length})</p>
        <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
              <DzChatAvatar name={m.name} url={m.avatar_url} size={32} />
              <span className="text-white text-sm flex-1">{m.name}</span>
              <button onClick={() => removeMember(m.id)}
                className="text-white/20 hover:text-red-400 transition-colors">
                <Icon name="UserMinus" size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="relative mb-3">
          <input type="text" value={query} onChange={e => search(e.target.value)}
            placeholder="Добавить участника..."
            className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2 rounded-xl outline-none pr-10 text-sm" />
          {loading && <Icon name="Loader" size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />}
        </div>
        {users.length > 0 && (
          <div className="space-y-0.5 mb-3 max-h-32 overflow-y-auto">
            {users.map((u: any) => (
              <button key={u.id} onClick={() => addMember(u)}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                <DzChatAvatar name={u.name} url={u.avatar_url} size={32} />
                <span className="text-white text-sm flex-1 text-left">{u.name}</span>
                <Icon name="UserPlus" size={14} className="text-[#25D366]" />
              </button>
            ))}
          </div>
        )}

        <button onClick={save} disabled={saving || !name.trim()}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
};

// ── CREATE GROUP MODAL ───────────────────────────────────────────
export const CreateGroupModal = ({ token, onClose, onCreated }: {
  token: string; onClose: () => void; onCreated: (id: number) => void;
}) => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setUsers([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
      setLoading(false);
      if (Array.isArray(res)) setUsers(res);
    }, 400);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const toggle = (u: any) => {
    setSelected(prev => prev.find((x: any) => x.id === u.id) ? prev.filter((x: any) => x.id !== u.id) : [...prev, u]);
  };

  const create = async () => {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    const res = await api("create_group", "POST", { name, member_ids: selected.map((u: any) => u.id) }, token);
    setCreating(false);
    if (res.chat_id) { onCreated(res.chat_id); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Icon name="Users" size={18} className="text-[#25D366]" /> Новая группа
          </h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Название группы"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-3 font-semibold" />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map((u: any) => (
              <div key={u.id} className="flex items-center gap-1 bg-[#25D366]/20 border border-[#25D366]/40 rounded-full px-2.5 py-1">
                <span className="text-xs text-white">{u.name}</span>
                <button onClick={() => toggle(u)} className="text-white/40 hover:text-white ml-0.5"><Icon name="X" size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="relative mb-2">
          <input type="text" value={query} onChange={e => search(e.target.value)}
            placeholder="Добавить участников..."
            className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none pr-10" />
          {loading && <Icon name="Loader" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />}
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 mb-3 min-h-[40px]">
          {users.map((u: any) => {
            const sel = selected.some((x: any) => x.id === u.id);
            return (
              <button key={u.id} onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${sel ? "bg-[#25D366]/15" : "hover:bg-white/5"}`}>
                <DzChatAvatar name={u.name} url={u.avatar_url} size={36} />
                <span className="text-white text-sm flex-1 text-left">{u.name}</span>
                {sel && <Icon name="Check" size={16} className="text-[#25D366]" />}
              </button>
            );
          })}
        </div>
        <button onClick={create} disabled={creating || !name.trim() || selected.length === 0}
          className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-40">
          {creating ? "Создание..." : `Создать группу (${selected.length} уч.)`}
        </button>
      </div>
    </div>
  );
};