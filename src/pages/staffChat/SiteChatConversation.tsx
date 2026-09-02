import { useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  Room, Message, ClientHistory, Tag, TAGS, TAG_COLORS,
  QUICK_REPLIES, fmtTime,
} from "./siteChatTypes";

type Props = {
  activeRoom: number;
  activeRoomData: Room | undefined;
  messages: Message[];
  draft: string;
  sending: boolean;
  msgError: string | null;
  photoPreview: string | null;
  photoBase64: string | null;
  showQuickReplies: boolean;
  showNoteInput: boolean;
  noteText: string;
  showHistory: boolean;
  clientHistory: ClientHistory | null;
  historyLoading: boolean;
  roomTags: Record<number, Tag>;
  endRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onSetLightbox: (url: string) => void;
  onDraftChange: (v: string) => void;
  onSend: (text?: string) => void;
  onFileClick: () => void;
  onClearPhoto: () => void;
  onSetShowQuickReplies: (v: boolean) => void;
  onSetShowNoteInput: (v: boolean) => void;
  onSetNoteText: (v: string) => void;
  onSendNote: () => void;
  onSetShowHistory: (v: boolean) => void;
  onLoadClientHistory: (phone: string) => void;
  onPollRoom: (id: number) => void;
  onSetRoomTags: (updater: (prev: Record<number, Tag>) => Record<number, Tag>) => void;
};

export default function SiteChatConversation({
  activeRoom, activeRoomData, messages, draft, sending, msgError,
  photoPreview, photoBase64, showQuickReplies, showNoteInput, noteText,
  showHistory, clientHistory, historyLoading, roomTags, endRef,
  onBack, onSetLightbox, onDraftChange, onSend,
  onFileClick, onClearPhoto, onSetShowQuickReplies, onSetShowNoteInput,
  onSetNoteText, onSendNote, onSetShowHistory, onLoadClientHistory,
  onPollRoom, onSetRoomTags,
}: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Шапка */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="md:hidden text-white/40 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
          <span className="font-oswald font-bold text-[#FFD700] text-sm">{(activeRoomData?.client_name || "К")[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold text-white text-sm truncate">{activeRoomData?.client_name || activeRoomData?.title}</div>
          {activeRoomData?.client_phone && !activeRoomData.client_phone.startsWith("max:") && (
            <a href={`tel:${activeRoomData.client_phone}`} className="text-[#FFD700]/60 text-xs font-roboto hover:text-[#FFD700] transition-colors">+{activeRoomData.client_phone}</a>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TAGS.map(tag => (
            <button key={tag}
              onClick={() => onSetRoomTags(prev => ({ ...prev, [activeRoom]: prev[activeRoom] === tag ? undefined as unknown as Tag : tag }))}
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${roomTags[activeRoom] === tag ? TAG_COLORS[tag] : "border-white/10 text-white/20 hover:text-white/50"}`}>
              {tag}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            onSetShowHistory(!showHistory);
            if (!showHistory && activeRoomData?.client_phone) onLoadClientHistory(activeRoomData.client_phone);
          }}
          className={`p-1.5 rounded transition-colors ${showHistory ? "text-[#FFD700] bg-[#FFD700]/10" : "text-white/30 hover:text-[#FFD700]"}`}
          title="История клиента">
          <Icon name="User" size={16} />
        </button>
        <button onClick={() => onPollRoom(activeRoom)} className="text-white/30 hover:text-[#FFD700] transition-colors p-1.5">
          <Icon name="RefreshCw" size={14} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Сообщения + ввод */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-white/30 font-roboto text-sm py-10">Нет сообщений — клиент ещё не написал</div>
            )}
            {messages.map(m => {
              if (m.is_system || m.author_type === "system") return (
                <div key={m.id} className="flex justify-center">
                  <span className="text-white/25 text-xs font-roboto italic">{m.text}</span>
                </div>
              );
              if (m.is_note) return (
                <div key={m.id} className="flex justify-center">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-roboto px-3 py-1.5 rounded-xl max-w-[80%]">
                    📝 <span className="font-semibold">Заметка:</span> {m.text}
                  </div>
                </div>
              );
              const mine = m.author_type === "staff";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl overflow-hidden ${mine ? "bg-[#FFD700] text-black rounded-br-sm" : "bg-[#1A1A1A] text-white border border-white/10 rounded-bl-sm"}`}>
                    {m.photo_url && (
                      <img src={m.photo_url} alt="Фото"
                        className="max-w-[240px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onSetLightbox(m.photo_url!)} />
                    )}
                    {m.text && <p className="px-3 py-2 text-sm font-roboto whitespace-pre-wrap">{m.text}</p>}
                    <p className={`px-3 pb-1.5 text-[10px] text-right ${mine ? "text-black/50" : "text-white/30"}`}>{fmtTime(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Ввод */}
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            {msgError && <p className="text-red-400 text-xs mb-2">{msgError}</p>}
            {showNoteInput && (
              <div className="mb-2 flex gap-2">
                <input value={noteText} onChange={e => onSetNoteText(e.target.value)}
                  placeholder="Внутренняя заметка (видна только менеджерам)..."
                  onKeyDown={e => { if (e.key === "Enter") onSendNote(); }}
                  className="flex-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 text-sm px-3 py-2 rounded-xl outline-none placeholder:text-yellow-300/30" />
                <button onClick={onSendNote} className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 text-sm">Сохранить</button>
                <button onClick={() => onSetShowNoteInput(false)} className="px-3 py-2 text-white/30 hover:text-white text-sm">✕</button>
              </div>
            )}
            {showQuickReplies && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map(qr => (
                  <button key={qr} onClick={() => onSend(qr)}
                    className="text-xs bg-white/5 hover:bg-[#FFD700]/10 border border-white/10 hover:border-[#FFD700]/40 text-white/70 hover:text-[#FFD700] px-2.5 py-1.5 rounded-xl transition-all">
                    {qr}
                  </button>
                ))}
              </div>
            )}
            {photoPreview && (
              <div className="mb-2 relative inline-block">
                <img src={photoPreview} alt="Фото" className="max-h-20 rounded-lg border border-white/20 object-cover" />
                <button onClick={onClearPhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs leading-none">×</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button onClick={onFileClick} title="Прикрепить фото"
                className="w-8 h-8 bg-white/5 border border-white/10 text-white/30 flex items-center justify-center rounded-xl hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-all shrink-0">
                <Icon name="ImagePlus" size={15} />
              </button>
              <button onClick={() => onSetShowQuickReplies(!showQuickReplies)} title="Быстрые ответы"
                className={`w-8 h-8 border flex items-center justify-center rounded-xl transition-all shrink-0 ${showQuickReplies ? "bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]" : "bg-white/5 border-white/10 text-white/30 hover:text-[#FFD700] hover:border-[#FFD700]/40"}`}>
                <Icon name="Zap" size={15} />
              </button>
              <button onClick={() => onSetShowNoteInput(!showNoteInput)} title="Заметка"
                className={`w-8 h-8 border flex items-center justify-center rounded-xl transition-all shrink-0 ${showNoteInput ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/30 hover:text-yellow-400 hover:border-yellow-500/40"}`}>
                <Icon name="StickyNote" size={15} />
              </button>
              <textarea
                value={draft}
                onChange={e => onDraftChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder="Написать клиенту..."
                rows={1}
                className="flex-1 bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-3 py-2 font-roboto text-sm outline-none transition-colors resize-none rounded-xl max-h-28"
                style={{ minHeight: 34 }}
              />
              <button onClick={() => onSend()} disabled={(!draft.trim() && !photoBase64) || sending}
                className="w-9 h-9 bg-[#FFD700] text-black flex items-center justify-center rounded-xl hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-35 shrink-0">
                {sending ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Карточка клиента */}
        {showHistory && (
          <div className="w-64 shrink-0 border-l border-white/10 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-oswald font-bold text-white text-sm uppercase">История клиента</h3>
              <p className="text-white/40 text-xs mt-0.5">{activeRoomData?.client_name}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {historyLoading && (
                <div className="text-white/30 text-xs text-center py-4">
                  <Icon name="Loader" size={14} className="animate-spin inline mr-1" />Загрузка...
                </div>
              )}
              {!historyLoading && clientHistory && (
                <>
                  <div>
                    <p className="text-[#FFD700] text-[11px] font-oswald font-bold uppercase tracking-wide mb-2">Заявки ({clientHistory.leads.length})</p>
                    {clientHistory.leads.length === 0 && <p className="text-white/25 text-xs">Нет заявок</p>}
                    {clientHistory.leads.slice(0, 5).map(l => (
                      <div key={l.id} className="mb-2 p-2 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-white text-xs font-semibold">#{l.id} — {l.category || "Без категории"}</div>
                        <div className="text-white/40 text-[10px] mt-0.5">{l.created_at ? fmtTime(l.created_at) : ""}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[#FFD700] text-[11px] font-oswald font-bold uppercase tracking-wide mb-2">Ремонты ({clientHistory.repairs.length})</p>
                    {clientHistory.repairs.length === 0 && <p className="text-white/25 text-xs">Нет ремонтов</p>}
                    {clientHistory.repairs.slice(0, 5).map(r => (
                      <div key={r.id} className="mb-2 p-2 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-white text-xs font-semibold">#{r.id} — {r.model || "Устройство"}</div>
                        <div className="text-white/40 text-[10px] mt-0.5">{r.status}{r.repair_amount ? ` · ${r.repair_amount} ₽` : ""}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!historyLoading && !clientHistory && (
                <div className="text-white/25 text-xs text-center py-4">История недоступна<br />(клиент без телефона)</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}