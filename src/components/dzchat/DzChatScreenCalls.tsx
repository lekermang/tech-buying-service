/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import DzChatAvatar from "./DzChatAvatar";

interface Props {
  me: any;
  chats: any[];
  onStartCall: (chat: any) => void;
  onOpenChat: (chat: any) => void;
}

function formatCallDate(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) {
    const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
    return days[d.getDay()];
  }
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Быстрый доступ — последние контакты
const QuickDial = ({ chats, onStartCall }: { chats: any[]; onStartCall: (c: any) => void }) => {
  const recents = chats.filter(c => c.type === "direct" && c.partner).slice(0, 3);
  const items = [
    { icon: "Phone", label: "Позвонить", color: "#1c1c1e", action: () => {} },
    { icon: "CalendarDays", label: "Запланировать", color: "#1c1c1e", action: () => {} },
    { icon: "Grid3x3", label: "Клавиатура", color: "#1c1c1e", action: () => {} },
    ...recents.map(c => ({ icon: null, label: c.name?.split(" ")[0] || "?", color: "#1c1c1e", chat: c, action: () => onStartCall(c) })),
    { icon: "Heart", label: "Избранное", color: "#1c1c1e", action: () => {} },
  ];

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none">
      {items.map((item, i) => (
        <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 min-w-[56px]">
          <div className="w-14 h-14 rounded-full bg-[#1c1c1e] flex items-center justify-center overflow-hidden">
            {(item as any).chat ? (
              <DzChatAvatar name={(item as any).chat.name || "?"} url={(item as any).chat.avatar_url} size={56} />
            ) : (
              <Icon name={item.icon as any} size={22} className="text-white" />
            )}
          </div>
          <span className="text-white/60 text-[10px] text-center leading-tight max-w-[56px] truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const DzChatScreenCalls = ({ me, chats, onStartCall, onOpenChat }: Props) => {
  // Берём чаты с партнёрами как историю звонков
  const callHistory = chats
    .filter(c => c.type === "direct" && c.partner && c.last_message)
    .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());

  return (
    <div className="flex flex-col h-full" style={{ background: "#000" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
          <Icon name="MoreHorizontal" size={18} className="text-white" />
        </button>
        <h1 className="text-white font-bold text-[22px]">Звонки</h1>
        <button
          onClick={() => {}}
          className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
          <Icon name="Plus" size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Быстрый набор */}
        <QuickDial chats={chats} onStartCall={onStartCall} />

        {/* История */}
        {callHistory.length > 0 ? (
          <>
            <p className="px-4 pt-3 pb-2 text-white font-bold text-[17px]">Недавние</p>
            {callHistory.map((chat, idx) => {
              const lm = chat.last_message;
              const isMissed = false; // в реальности брали бы из статуса звонка
              const isLast = idx === callHistory.length - 1;
              return (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => onOpenChat(chat)} className="shrink-0">
                    <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={46} />
                  </button>
                  <button className="flex-1 min-w-0 text-left" onClick={() => onOpenChat(chat)}>
                    <p className="font-medium text-[15px] truncate" style={{ color: isMissed ? "#ff3b30" : "#fff" }}>
                      {chat.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="PhoneOutgoing" size={12} className="text-white/40" />
                      <span className="text-white/40 text-xs">Исходящий</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white/30 text-xs">{lm ? formatCallDate(lm.created_at) : ""}</span>
                    <button
                      onClick={() => onStartCall(chat)}
                      className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center">
                      <Icon name="Info" size={16} className="text-[#25D366]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-[#1c1c1e] flex items-center justify-center mb-4">
              <Icon name="Phone" size={36} className="text-white/20" />
            </div>
            <p className="text-white/50 text-base font-medium text-center">Нет звонков</p>
            <p className="text-white/25 text-sm text-center mt-2">История звонков появится здесь</p>
            <button
              onClick={() => {}}
              className="mt-6 bg-[#25D366] text-white text-sm px-6 py-2.5 rounded-xl font-medium">
              Начать звонок
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DzChatScreenCalls;
