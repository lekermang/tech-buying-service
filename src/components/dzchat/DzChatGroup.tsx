/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

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
    <div className="dzchat-root fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
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