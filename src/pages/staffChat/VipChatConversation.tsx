import { RefObject } from "react";
import Icon from "@/components/ui/icon";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import EnableNotificationsBanner from "./EnableNotificationsBanner";
import { Me, Member, Msg, isOnline } from "./vipChatTypes";

type Props = {
  token: string;
  peer: number;
  peerMember: Member | null;
  members: Member[];
  me: Me | null;
  messages: Msg[];
  loading: boolean;
  error: string | null;
  text: string;
  sending: boolean;
  showEmoji: boolean;
  scrollRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  setText: (v: string | ((prev: string) => string)) => void;
  setShowEmoji: (v: boolean | ((s: boolean) => boolean)) => void;
  setShowMobileSidebar: (v: boolean) => void;
  send: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  uploadPhoto: (file: File) => void;
};

export default function VipChatConversation({
  token,
  peer,
  peerMember,
  members,
  me,
  messages,
  loading,
  error,
  text,
  sending,
  showEmoji,
  scrollRef,
  fileInputRef,
  setText,
  setShowEmoji,
  setShowMobileSidebar,
  send,
  onKeyDown,
  uploadPhoto,
}: Props) {
  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <EnableNotificationsBanner token={token} />

      {/* Заголовок текущего чата */}
      <div className="flex items-center gap-3 px-3 py-2 bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl">
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="md:hidden p-1 rounded hover:bg-white/10"
        >
          <Icon name="Menu" size={18} className="text-white/70" />
        </button>
        {peer === 0 ? (
          <>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
              <Icon name="Users" size={16} className="text-[#FFD700]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-white truncate">Общий чат</div>
              <div className="text-[11px] text-white/40">
                {members.length} {members.length === 1 ? "участник" : "участников"}
              </div>
            </div>
          </>
        ) : peerMember ? (
          <>
            <div className="relative w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-sm text-white/70 font-bold overflow-hidden">
              {peerMember.avatar_url ? (
                <img src={peerMember.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                peerMember.full_name.slice(0, 1).toUpperCase()
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0E0E0E] ${
                  isOnline(peerMember.last_seen_at) ? "bg-green-500" : "bg-gray-500"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-white truncate">
                {peerMember.full_name}
              </div>
              <div className="text-[11px] text-white/40">
                {isOnline(peerMember.last_seen_at) ? "в сети" : "не в сети"} ·{" "}
                <span className="capitalize">{peerMember.role}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3 space-y-2"
      >
        {loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
            <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
            <span className="text-xs">Загружаю переписку…</span>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
            <Icon name="MessagesSquare" size={24} className="text-white/20" />
            <span className="text-xs">
              {peer === 0 ? "Пока сообщений нет. Напиши первым!" : "Начни переписку — напиши первым."}
            </span>
          </div>
        )}
        {messages.map((m) => {
          const mine = me?.id === m.author_id;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center text-[10px] text-[#FFD700] font-bold shrink-0 overflow-hidden">
                {m.author_avatar ? (
                  <img src={m.author_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (m.author_name || "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`text-[10px] text-white/45 px-2 ${mine ? "text-right" : ""}`}>
                  {m.author_name} ·{" "}
                  {new Date(m.created_at).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div
                  className={`px-3 py-1.5 rounded-2xl text-[13px] leading-snug whitespace-pre-wrap break-words ${
                    mine
                      ? "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/10 border border-[#FFD700]/30 text-white"
                      : "bg-[#1A1A1A] border border-white/5 text-white/90"
                  }`}
                >
                  {m.photo_url && (
                    <img
                      src={m.photo_url}
                      alt=""
                      className="max-w-[280px] rounded-md mb-1.5 cursor-zoom-in"
                      onClick={() => window.open(m.photo_url!, "_blank")}
                    />
                  )}
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-24 right-6 z-30 shadow-2xl rounded-xl overflow-hidden">
          <EmojiPicker
            onEmojiClick={(e) => {
              setText((prev) => prev + e.emoji);
              setShowEmoji(false);
            }}
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.NATIVE}
            width={320}
            height={400}
            searchPlaceHolder="Поиск смайлика…"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white/70 hover:text-[#FFD700] hover:border-[#FFD700]/30"
          title="Прикрепить фото"
        >
          <Icon name="Paperclip" size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadPhoto(f);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          className={`p-2.5 rounded-lg border ${
            showEmoji
              ? "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]"
              : "bg-[#1A1A1A] border-[#2A2A2A] text-white/70 hover:text-[#FFD700] hover:border-[#FFD700]/30"
          }`}
          title="Смайлики"
        >
          <Icon name="Smile" size={16} />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={
            peer === 0
              ? "Сообщение в общий чат… (Enter — отправить)"
              : `Сообщение для ${peerMember?.full_name || ""}… (Enter — отправить)`
          }
          className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2.5 rounded-lg text-[13px] resize-none focus:outline-none max-h-32"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110"
        >
          {sending ? (
            <Icon name="Loader" size={14} className="animate-spin" />
          ) : (
            <Icon name="Send" size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
