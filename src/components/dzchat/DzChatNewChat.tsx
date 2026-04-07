/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

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
    <div className="dzchat-root fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
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