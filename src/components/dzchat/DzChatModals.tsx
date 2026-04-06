/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

// ── ЗВУКИ УВЕДОМЛЕНИЙ ────────────────────────────────────────────
export const NOTIFICATION_SOUNDS = [
  { id: "default",  label: "Стандартный",   emoji: "🔔", url: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/dce22ed0-7e15-4a0f-84c3-9987477dea5a.jpg" },
  { id: "chime",    label: "Колокольчик",   emoji: "🔕", url: null },
  { id: "pop",      label: "Поп",           emoji: "💬", url: null },
  { id: "none",     label: "Без звука",     emoji: "🔇", url: null },
];

// Воспроизводим звук через Web Audio API (short beep)
export const playNotificationSound = (soundId: string) => {
  if (soundId === "none") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (soundId === "chime") {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } else if (soundId === "pop") {
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } else {
      // default — двойной мягкий сигнал
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_e) { /* Web Audio not supported */ }
};

// ── NEW CHAT MODAL ───────────────────────────────────────────────
export const NewChatModal = ({ token, onClose, onChatCreated }: {
  token: string; onClose: () => void; onChatCreated: (id: number) => void;
}) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsFound, setContactsFound] = useState<any[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    setContactsFound([]);
    if (!q.trim()) return setUsers([]);
    setLoading(true);
    const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
    setLoading(false);
    if (Array.isArray(res)) setUsers(res);
  };

  const start = async (partnerId: number) => {
    const res = await api("create", "POST", { partner_id: partnerId }, token);
    if (res.chat_id) { onChatCreated(res.chat_id); onClose(); }
  };

  // Синхронизация с контактами телефона через Contact Picker API
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

      // Собираем все номера
      const phones: string[] = [];
      selected.forEach((c: any) => {
        (c.tel || []).forEach((t: string) => {
          const cleaned = t.replace(/\s/g, "").replace(/[()]/g, "");
          if (cleaned) phones.push(cleaned);
        });
      });

      // Ищем каждый номер в DzChat
      const found: any[] = [];
      for (const phone of phones.slice(0, 20)) {
        const res = await api(`users&q=${encodeURIComponent(phone)}`, "GET", undefined, token);
        if (Array.isArray(res) && res.length > 0) {
          res.forEach(u => { if (!found.find(f => f.id === u.id)) found.push(u); });
        }
      }
      setContactsFound(found);
      if (found.length === 0) alert("Никто из ваших контактов пока не зарегистрирован в DzChat");
    } catch (_e) { /* Contact Picker cancelled or not supported */ }
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

        {/* Синхронизация контактов */}
        {"contacts" in navigator && (
          <button onClick={syncContacts} disabled={contactsLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] py-2.5 rounded-xl mb-3 hover:bg-[#25D366]/25 transition-colors disabled:opacity-50 text-sm font-medium">
            {contactsLoading
              ? <><Icon name="Loader" size={15} className="animate-spin" /> Поиск в контактах...</>
              : <><Icon name="BookUser" size={15} /> Найти из телефонной книги</>
            }
          </button>
        )}

        {contactsFound.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs">Найдено из контактов: {contactsFound.length}</p>
            <button onClick={() => setContactsFound([])} className="text-white/30 text-xs hover:text-white/60">Очистить</button>
          </div>
        )}

        <input type="text" value={query} onChange={e => search(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-3" />

        {loading && <p className="text-white/40 text-sm text-center py-4">Поиск...</p>}

        <div className="flex-1 overflow-y-auto space-y-1">
          {displayUsers.map(u => (
            <button key={u.id} onClick={() => start(u.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <DzChatAvatar name={u.name} url={u.avatar_url} size={40} />
              <div className="text-left">
                <p className="text-white text-sm font-medium">{u.name}</p>
                <p className="text-white/40 text-xs">{u.phone}</p>
              </div>
            </button>
          ))}
          {!loading && !contactsLoading && query && users.length === 0 && contactsFound.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Никого не найдено</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── PROFILE MODAL ────────────────────────────────────────────────
export const ProfileModal = ({ me, token, onClose, onUpdate }: {
  me: any; token: string; onClose: () => void; onUpdate: (u: any) => void;
}) => {
  const [name, setName] = useState(me.name);
  const [avatarB64, setAvatarB64] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(me.avatar_url);
  const [saving, setSaving] = useState(false);
  const [soundId, setSoundId] = useState<string>(() => localStorage.getItem("dzchat_sound") || "default");
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const r = ev.target?.result as string; setAvatarPreview(r); setAvatarB64(r.split(",")[1]); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSoundChange = (id: string) => {
    setSoundId(id);
    localStorage.setItem("dzchat_sound", id);
    playNotificationSound(id);
  };

  const save = async () => {
    setSaving(true);
    let avatar_url = me.avatar_url;
    if (avatarB64) {
      const res = await api("upload", "POST", { image: avatarB64, mime: "image/jpeg" }, token);
      if (res.url) avatar_url = res.url;
    }
    await api("profile", "POST", { name, avatar_url }, token);
    setSaving(false);
    onUpdate({ ...me, name, avatar_url });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1a2634] w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Профиль</h3>
          <button onClick={onClose} className="text-white/40"><Icon name="X" size={18} /></button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-5">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <DzChatAvatar name={name || "?"} url={avatarPreview || undefined} size={80} />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Icon name="Camera" size={20} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>

        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-2" />
        <p className="text-white/30 text-xs mb-5">Телефон: {me.phone}</p>

        {/* Звук уведомлений */}
        <div className="mb-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Icon name="Volume2" size={13} /> Звук уведомлений
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NOTIFICATION_SOUNDS.map(s => (
              <button key={s.id} onClick={() => handleSoundChange(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  soundId === s.id
                    ? "border-[#25D366] bg-[#25D366]/15 text-white"
                    : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                }`}>
                <span className="text-base">{s.emoji}</span>
                <span className="truncate">{s.label}</span>
                {soundId === s.id && <Icon name="Check" size={13} className="text-[#25D366] ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
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

  const search = async (q: string) => {
    setQuery(q);
    if (!q.trim()) return setUsers([]);
    setLoading(true);
    const res = await api(`users&q=${encodeURIComponent(q)}`, "GET", undefined, token);
    setLoading(false);
    if (Array.isArray(res)) setUsers(res);
  };

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
          <h3 className="text-white font-semibold flex items-center gap-2"><Icon name="Users" size={18} className="text-[#25D366]" /> Новая группа</h3>
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
                <button onClick={() => toggle(u)} className="text-white/40 hover:text-white"><Icon name="X" size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <input type="text" value={query} onChange={e => search(e.target.value)}
          placeholder="Добавить участников..."
          className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none mb-2" />
        <div className="flex-1 overflow-y-auto space-y-0.5 mb-3">
          {loading && <p className="text-white/30 text-xs text-center py-3">Поиск...</p>}
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