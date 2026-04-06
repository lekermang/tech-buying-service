/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { formatTime } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";

// ── ChatHeader ────────────────────────────────────────────────────
export const ChatHeader = ({ chat, onBack, onGroupInfoClick, onGroupEditClick, showSearch, onToggleSearch }: {
  chat: any;
  onBack: () => void;
  onGroupInfoClick: () => void;
  onGroupEditClick?: () => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}) => {
  const partnerOnline = chat.partner?.is_online;
  const lastSeen = chat.partner?.last_seen_at;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1a2634] border-b border-white/10 shrink-0">
      <button onClick={onBack} className="text-white/60 hover:text-white md:hidden p-1">
        <Icon name="ArrowLeft" size={22} />
      </button>
      <button onClick={chat.type === "group" ? onGroupInfoClick : undefined} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className="relative">
          <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={40} />
          {partnerOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#1a2634] rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-white truncate text-sm">{chat.name}</p>
          <p className="text-xs text-white/40 truncate">
            {chat.type === "group"
              ? "Нажми чтобы увидеть участников"
              : partnerOnline
                ? <span className="text-[#25D366]">в сети</span>
                : lastSeen ? `был(а) ${formatTime(lastSeen)}` : ""}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-0.5 shrink-0">
        {chat.type === "group" && onGroupEditClick && (
          <button onClick={e => { e.stopPropagation(); onGroupEditClick(); }}
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Icon name="Settings" size={17} />
          </button>
        )}
        <button onClick={onToggleSearch}
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Icon name="Search" size={18} />
        </button>
      </div>
    </div>
  );
};

// ── SearchBar ─────────────────────────────────────────────────────
export const SearchBar = ({ searchQuery, searchResults, onSearch, onResultClick }: {
  searchQuery: string;
  searchResults: any[];
  onSearch: (q: string) => void;
  onResultClick: (id: number) => void;
}) => (
  <div className="px-3 py-2 bg-[#1a2634] border-b border-white/10 shrink-0">
    <input autoFocus value={searchQuery} onChange={e => onSearch(e.target.value)}
      placeholder="Поиск по сообщениям..."
      className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#25D366]" />
    {searchResults.length > 0 && (
      <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
        {searchResults.map(r => (
          <button key={r.id} onClick={() => onResultClick(r.id)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <p className="text-xs text-[#25D366]">{r.sender_name}</p>
            <p className="text-sm text-white/80 truncate">{r.text}</p>
          </button>
        ))}
      </div>
    )}
  </div>
);

// ── GroupInfoModal ─────────────────────────────────────────────────
export const GroupInfoModal = ({ members, onClose }: { members: any[]; onClose: () => void }) => (
  <div className="absolute inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
    <div className="bg-[#1a2634] rounded-t-2xl md:rounded-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-4"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Участники группы</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white"><Icon name="X" size={20} /></button>
      </div>
      {members.map(m => (
        <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/5">
          <div className="relative">
            <DzChatAvatar name={m.name} url={m.avatar_url} size={36} />
            {m.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#1a2634] rounded-full" />}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{m.name}</p>
            <p className="text-white/40 text-xs">{m.is_online ? <span className="text-[#25D366]">в сети</span> : m.last_seen_at ? formatTime(m.last_seen_at) : ""}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);