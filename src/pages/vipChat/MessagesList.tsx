import { forwardRef } from "react";
import Icon from "@/components/ui/icon";
import { Message, initials, fmtTime } from "./types";

type Group = { day: string; items: Message[] };

type Props = {
  grouped: Group[];
  meId: number;
  messagesCount: number;
  error: string | null;
  onOpenLightbox: (url: string) => void;
};

const MessagesList = forwardRef<HTMLDivElement, Props>(function MessagesList(
  { grouped, meId, messagesCount, error, onOpenLightbox },
  ref,
) {
  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-premium">
      {error && (
        <div className="text-center text-red-400 font-roboto text-xs py-2">⚠ {error}</div>
      )}
      {!messagesCount && !error && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-white/30 font-roboto">
          <Icon name="MessageCircle" size={42} className="text-[#FFD700]/30 mb-3" />
          <div className="font-oswald font-bold text-base text-[#FFD700]/60 uppercase">Чат пуст</div>
          <div className="text-xs mt-1">Будьте первым, кто напишет в СКУПКА24Vip</div>
        </div>
      )}

      {grouped.map(group => (
        <div key={group.day}>
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="font-roboto text-[10px] text-white/30 uppercase tracking-widest">{group.day}</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {group.items.map((m, i) => {
            const mine = m.employee_id === meId;
            const prev = i > 0 ? group.items[i - 1] : null;
            const sameAuthor = prev && prev.employee_id === m.employee_id
              && (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 3 * 60 * 1000);

            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} ${sameAuthor ? "mt-0.5" : "mt-2"}`}>
                <div className="w-8 shrink-0">
                  {!sameAuthor && (
                    m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-[11px]
                        ${m.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black"
                          : m.role === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                          : "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70"}`}>
                        {initials(m.full_name)}
                      </div>
                    )
                  )}
                </div>
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!sameAuthor && (
                    <div className={`flex items-center gap-1.5 text-[10px] ${mine ? "flex-row-reverse" : ""}`}>
                      <span className="font-oswald font-bold text-white/85">{m.full_name}</span>
                      <span className="text-white/30">{fmtTime(m.created_at)}</span>
                    </div>
                  )}
                  <div className={`relative rounded-2xl ${mine
                    ? "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/30 text-white"
                    : "bg-white/5 border border-white/5 text-white/90"} ${m.photo_url ? "p-1.5" : "px-3 py-2"}`}>
                    {m.photo_url && (
                      <button
                        type="button"
                        onClick={() => m.photo_url && onOpenLightbox(m.photo_url)}
                        className="block max-w-[260px]">
                        <img
                          src={m.photo_url}
                          alt="Фото"
                          className="rounded-xl w-full max-h-72 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                          loading="lazy"
                        />
                      </button>
                    )}
                    {m.text && (
                      <div className={`font-roboto text-sm whitespace-pre-wrap break-words leading-snug ${m.photo_url ? "px-2 pb-1.5 pt-1" : ""}`}>
                        {m.text}
                      </div>
                    )}
                    {sameAuthor && (
                      <span className="absolute bottom-0.5 right-2 text-[9px] text-white/30 font-roboto">{fmtTime(m.created_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default MessagesList;
