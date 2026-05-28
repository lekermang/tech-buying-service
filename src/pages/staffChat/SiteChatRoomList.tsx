import Icon from "@/components/ui/icon";
import { Room, Tag, TAG_COLORS, TAGS, fmtTime } from "./siteChatTypes";

type Props = {
  rooms: Room[];
  roomsLoading: boolean;
  activeRoom: number | null;
  search: string;
  pushEnabled: boolean;
  roomTags: Record<number, Tag>;
  filteredRooms: Room[];
  onSelectRoom: (id: number) => void;
  onSearch: (v: string) => void;
  onRefresh: () => void;
  onRequestPush: () => void;
  onMarkAsRead: (id: number, e: React.MouseEvent) => void;
  onArchive: (id: number, e: React.MouseEvent) => void;
};

export default function SiteChatRoomList({
  rooms, roomsLoading, activeRoom, search, pushEnabled, roomTags,
  filteredRooms, onSelectRoom, onSearch, onRefresh, onRequestPush,
  onMarkAsRead, onArchive,
}: Props) {
  return (
    <div className={`${activeRoom ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 shrink-0 border-r border-white/10`}>
      <div className="px-3 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-oswald font-bold text-white text-base uppercase tracking-wide">Чаты с сайта</h2>
            <p className="text-white/40 text-[11px] font-roboto">{rooms.length} диалог{rooms.length === 1 ? "" : rooms.length < 5 ? "а" : "ов"}</p>
          </div>
          <div className="flex items-center gap-1">
            {!pushEnabled && (
              <button onClick={onRequestPush} title="Включить уведомления" className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
                <Icon name="Bell" size={15} />
              </button>
            )}
            {pushEnabled && <Icon name="BellRing" size={14} className="text-green-400" />}
            <button onClick={onRefresh} className="text-white/30 hover:text-[#FFD700] transition-colors p-1">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Поиск по чатам..."
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-7 pr-3 py-2 rounded-lg outline-none focus:border-[#FFD700]/50 placeholder:text-white/25"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {roomsLoading && (
          <div className="flex items-center justify-center py-12 text-white/30">
            <Icon name="Loader" size={16} className="animate-spin mr-2" />Загрузка...
          </div>
        )}
        {!roomsLoading && filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
            <Icon name="MessageSquare" size={32} className="text-white/15" />
            <p className="text-white/30 font-roboto text-sm">{search ? "Ничего не найдено" : "Нет активных чатов"}</p>
          </div>
        )}
        {filteredRooms.map(rm => {
          const tag = roomTags[rm.id];
          return (
            <button key={rm.id} onClick={() => onSelectRoom(rm.id)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${activeRoom === rm.id ? "bg-[#FFD700]/10 border-l-2 border-l-[#FFD700]" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-oswald font-bold text-[#FFD700] text-sm">{(rm.client_name || rm.title || "К")[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-roboto font-semibold text-white text-sm truncate">{rm.client_name || rm.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {rm.unread_count > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="bg-[#FFD700] text-black text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{rm.unread_count}</span>
                          <button onClick={e => onMarkAsRead(rm.id, e)} title="Прочитано"
                            className="w-4 h-4 rounded-full bg-white/10 hover:bg-green-500/30 flex items-center justify-center text-white/30 hover:text-green-400 transition-all">
                            <Icon name="Check" size={9} />
                          </button>
                        </div>
                      )}
                      {rm.last_message_at && <span className="text-white/30 text-[10px] font-roboto">{fmtTime(rm.last_message_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="text-white/40 text-xs font-roboto truncate">{rm.last_message_text || "Нет сообщений"}</div>
                    <button onClick={e => onArchive(rm.id, e)} title="Удалить чат"
                      className="shrink-0 ml-1 w-4 h-4 flex items-center justify-center text-white/15 hover:text-red-400 transition-colors">
                      <Icon name="Trash2" size={11} />
                    </button>
                  </div>
                  {tag && <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${TAG_COLORS[tag]}`}>{tag}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
