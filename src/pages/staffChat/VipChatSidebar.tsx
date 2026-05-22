import Icon from "@/components/ui/icon";
import { Me, Member, isOnline } from "./vipChatTypes";

type Props = {
  me: Me | null;
  myAvatar: string | null;
  peer: number;
  dialogList: Member[];
  totalDmUnread: number;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (v: boolean) => void;
  setPeer: (id: number) => void;
  setShowAvatarModal: (v: boolean) => void;
};

export default function VipChatSidebar({
  me,
  myAvatar,
  peer,
  dialogList,
  totalDmUnread,
  showMobileSidebar,
  setShowMobileSidebar,
  setPeer,
  setShowAvatarModal,
}: Props) {
  return (
    <aside
      className={`${
        showMobileSidebar ? "absolute inset-0 z-40 bg-[#0A0A0A]" : "hidden"
      } md:relative md:block md:w-72 md:flex-shrink-0 bg-gradient-to-b from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden flex flex-col`}
    >
      <div className="p-3 border-b border-[#1F1F1F] flex items-center gap-2">
        <Icon name="MessagesSquare" size={16} className="text-[#FFD700]" />
        <div className="font-oswald font-bold text-white uppercase tracking-wider text-sm">
          Чат команды
        </div>
        <button
          onClick={() => setShowMobileSidebar(false)}
          className="ml-auto md:hidden p-1 rounded hover:bg-white/10"
        >
          <Icon name="X" size={16} className="text-white/60" />
        </button>
      </div>

      {/* Профиль (моя аватарка) */}
      {me && (
        <div className="p-3 border-b border-[#1F1F1F] flex items-center gap-2.5">
          <button
            onClick={() => setShowAvatarModal(true)}
            className="relative w-10 h-10 rounded-full bg-[#FFD700]/15 border-2 border-[#FFD700]/40 flex items-center justify-center text-sm text-[#FFD700] font-bold overflow-hidden group"
            title="Сменить аватарку"
          >
            {myAvatar ? (
              <img src={myAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              me.full_name.slice(0, 1).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Icon name="Camera" size={14} className="text-white" />
            </div>
          </button>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white truncate">{me.full_name}</div>
            <div className="text-[10px] text-white/40 capitalize">{me.role}</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Общий чат */}
        <button
          onClick={() => {
            setPeer(0);
            setShowMobileSidebar(false);
          }}
          className={`w-full flex items-center gap-3 p-3 border-b border-[#1F1F1F]/60 hover:bg-white/[0.03] text-left transition ${
            peer === 0 ? "bg-[#FFD700]/[0.08] border-l-2 border-l-[#FFD700]" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
            <Icon name="Users" size={18} className="text-[#FFD700]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white truncate">Общий чат</div>
            <div className="text-[11px] text-white/40 truncate">Все сотрудники</div>
          </div>
        </button>

        {/* Личные диалоги */}
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center gap-2">
          Личные сообщения
          {totalDmUnread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#FFD700] text-black text-[9px] font-bold">
              {totalDmUnread}
            </span>
          )}
        </div>

        {dialogList.map((m) => {
          const online = isOnline(m.last_seen_at);
          const active = peer === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setPeer(m.id);
                setShowMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-3 p-3 border-b border-[#1F1F1F]/60 hover:bg-white/[0.03] text-left transition ${
                active ? "bg-[#FFD700]/[0.08] border-l-2 border-l-[#FFD700]" : ""
              }`}
            >
              <div className="relative w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-sm text-white/70 font-bold shrink-0 overflow-hidden">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  m.full_name.slice(0, 1).toUpperCase()
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
                    online ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                  {m.full_name}
                </div>
                <div className="text-[11px] text-white/40 truncate capitalize">
                  {online ? "в сети" : m.role}
                </div>
              </div>
              {!!m.unread && m.unread > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FFD700] text-black text-[10px] font-bold min-w-[20px] text-center">
                  {m.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
