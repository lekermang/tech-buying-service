/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { formatTime } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";
import { VoiceMessage, MsgStatus } from "./DzChatVoice";

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];
const SENDER_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

const DzChatMessage = ({ msg, me, chat, prevMsg, nextMsg, msgRef, contextMsg, reactionPickerMsg, onContextMenu, onReact, onReactionPicker, onReply, onForward, onRemove, onRemoveForAll, onScrollToMsg, onTextareaFocus }: {
  msg: any;
  me: any;
  chat: any;
  prevMsg: any;
  nextMsg: any;
  msgRef: (el: HTMLDivElement | null) => void;
  contextMsg: any;
  reactionPickerMsg: any;
  onContextMenu: (msg: any) => void;
  onReact: (msg: any, emoji: string) => void;
  onReactionPicker: (msg: any | null) => void;
  onReply: (msg: any) => void;
  onForward: (msg: any) => void;
  onRemove: (msg: any) => void;
  onRemoveForAll: (msg: any) => void;
  onScrollToMsg: (id: number) => void;
  onTextareaFocus: () => void;
}) => {
  const isMine = msg.sender_id === me.id;
  const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
  const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;
  const showDateSep = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

  return (
    <div>
      {showDateSep && (
        <div className="flex justify-center my-3">
          <span className="bg-[#1a2634]/80 text-white/40 text-xs px-3 py-1 rounded-full">
            {new Date(msg.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      )}
      <div ref={msgRef}
        className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-1.5 transition-colors rounded-lg ${isLast ? "mb-1" : "mb-0.5"}`}>
        {!isMine && (
          <div style={{ width: 32, flexShrink: 0 }}>
            {showAvatar && <DzChatAvatar name={msg.sender_name} url={msg.sender_avatar} size={28} />}
          </div>
        )}
        <div className="relative max-w-[85%] group"
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(msg); }}>
          {msg.removed ? (
            <div className={`px-3 py-2 rounded-2xl text-sm italic text-white/30 ${isMine ? "bg-[#1e4a2e]/60" : "bg-white/8"}`}>
              🚫 Сообщение удалено
            </div>
          ) : (
            <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
              isMine
                ? "bg-[#1e6f3e] text-white rounded-br-sm"
                : "bg-[#1e2c3a] text-white rounded-bl-sm"
            }`}>
              {/* Имя в группе */}
              {!isMine && showAvatar && chat.type === "group" && (
                <p className="text-xs font-semibold mb-0.5" style={{ color: SENDER_COLORS[msg.sender_id % 6] }}>
                  {msg.sender_name}
                </p>
              )}
              {/* Цитата reply */}
              {msg.reply && (
                <div className="border-l-2 border-[#25D366] pl-2 mb-1.5 rounded-r cursor-pointer bg-white/5 py-1 pr-2"
                  onClick={() => onScrollToMsg(msg.reply.id)}>
                  <p className="text-[11px] text-[#25D366] font-medium">{msg.reply.sender_name}</p>
                  <p className="text-[11px] text-white/60 truncate">
                    {msg.reply.voice_url ? "🎤 Голосовое" : msg.reply.photo_url ? "📷 Фото" : msg.reply.text}
                  </p>
                </div>
              )}
              {/* Пересланное */}
              {msg.forwarded_from && (
                <p className="text-xs text-white/40 mb-1 italic">↪ Пересланное сообщение</p>
              )}
              {/* Фото */}
              {msg.photo_url && (
                <img src={msg.photo_url} alt="фото" className="rounded-xl max-w-full mb-1 cursor-pointer block"
                  style={{ maxHeight: 280 }} loading="lazy"
                  onClick={() => window.open(msg.photo_url, "_blank")} />
              )}
              {/* Голосовое */}
              {msg.voice_url && (
                <VoiceMessage url={msg.voice_url} duration={msg.voice_duration || 0} isMine={isMine} />
              )}
              {/* Текст */}
              {msg.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>}
              {/* Время + статус */}
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-[10px] ${isMine ? "text-white/50" : "text-white/30"}`}>
                  {formatTime(msg.created_at)}
                </span>
                <MsgStatus msg={msg} me={me} />
              </div>
            </div>
          )}

          {/* Реакции */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
              {msg.reactions.map((r: any) => (
                <button key={r.emoji} onClick={() => onReact(msg, r.emoji)}
                  className="bg-[#1a2634] border border-white/10 rounded-full px-1.5 py-0.5 text-xs hover:border-[#25D366]/50 transition-colors"
                  title={r.users?.join(", ")}>
                  {r.emoji} {r.count > 1 ? r.count : ""}
                </button>
              ))}
            </div>
          )}

          {/* Быстрая реакция при наведении */}
          {!msg.removed && (
            <button
              onClick={e => { e.stopPropagation(); onReactionPicker(msg.id === reactionPickerMsg?.id ? null : msg); }}
              className={`absolute ${isMine ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#1a2634] border border-white/10 items-center justify-center text-white/40 hover:text-white hidden group-hover:flex transition-colors z-10`}>
              <Icon name="Smile" size={14} />
            </button>
          )}

          {/* Пикер реакций */}
          {reactionPickerMsg?.id === msg.id && (
            <div className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 bg-[#1a2634] border border-white/15 rounded-2xl px-2 py-1.5 flex gap-1 z-30 shadow-xl`}
              onClick={e => e.stopPropagation()}>
              {REACTIONS.map(e => (
                <button key={e} onClick={() => onReact(msg, e)}
                  className="text-lg hover:scale-125 transition-transform p-0.5">{e}</button>
              ))}
            </div>
          )}

          {/* Контекстное меню */}
          {contextMsg?.id === msg.id && (
            <div className={`absolute ${isMine ? "right-0" : "left-0"} bottom-full mb-1 bg-[#1e2c3a] border border-white/10 rounded-2xl shadow-2xl z-20 min-w-[180px] overflow-hidden`}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => { onReply(msg); onTextareaFocus(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                <Icon name="Reply" size={15} className="text-[#25D366]" /> Ответить
              </button>
              <button onClick={() => onForward(msg)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                <Icon name="Forward" size={15} className="text-blue-400" /> Переслать
              </button>
              {msg.text && (
                <button onClick={() => navigator.clipboard.writeText(msg.text || "")}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:bg-white/5 text-sm">
                  <Icon name="Copy" size={15} className="text-white/50" /> Копировать
                </button>
              )}
              {!msg.removed && (
                <div className="border-t border-white/5">
                  {isMine && (
                    <button onClick={() => onRemoveForAll(msg)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-red-400 hover:bg-white/5 text-sm">
                      <Icon name="Trash2" size={15} /> Удалить для всех
                    </button>
                  )}
                  <button onClick={() => onRemove(msg)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-red-300/70 hover:bg-white/5 text-sm">
                    <Icon name="EyeOff" size={15} /> Удалить для себя
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DzChatMessage;