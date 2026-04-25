import { Member, ROLE_BADGE, ROLE_LABEL, initials, isOnline, lastSeenText } from "./types";

type Props = {
  members: Member[];
  meId: number;
  onlineCount: number;
  showMembers: boolean;
};

export default function MembersList({ members, meId, onlineCount, showMembers }: Props) {
  return (
    <aside className={`${showMembers ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0 border-r border-white/5 bg-black/40 overflow-y-auto`}>
      <div className="p-3 border-b border-white/5 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-10">
        <div className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wider">Участники</div>
        <div className="font-roboto text-white/40 text-[10px] mt-0.5">
          {members.length} всего · <span className="text-green-400">{onlineCount} онлайн</span>
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {members.map(m => {
          const online = isOnline(m);
          return (
            <div key={m.id} className="flex items-center gap-2.5 p-2.5 hover:bg-white/[0.03] transition-colors">
              <div className="relative shrink-0">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.full_name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-oswald font-bold text-[12px]
                    ${m.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black"
                      : m.role === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                      : "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70"}`}>
                    {initials(m.full_name)}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#0A0A0A] rounded-full ${online ? "bg-green-400" : "bg-gray-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate flex items-center gap-1.5">
                  {m.full_name}
                  {m.id === meId && <span className="text-[9px] text-[#FFD700]/60 font-bold">ВЫ</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-bold px-1 rounded ${ROLE_BADGE[m.role] || "bg-white/10 text-white/50"}`}>
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                  <span className={`font-roboto text-[10px] ${online ? "text-green-400" : "text-white/35"}`}>
                    {lastSeenText(m)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
