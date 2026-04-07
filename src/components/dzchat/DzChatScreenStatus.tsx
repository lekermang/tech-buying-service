/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import DzChatAvatar from "./DzChatAvatar";

interface Props {
  me: any;
  token: string;
  chats: any[];
  onOpenChat: (chat: any) => void;
}

function timeAgo(iso: string): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

const DzChatScreenStatus = ({ me, token, chats, onOpenChat }: Props) => {
  const [myStatus, setMyStatus] = useState<string>(() => localStorage.getItem("dzchat_status_text") || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Контакты с последним сообщением — имитируем "статусы" через last_message
  const contactsWithActivity = chats
    .filter(c => c.last_message?.created_at)
    .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime())
    .slice(0, 20);

  const handlePostStatus = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    // Сохраняем статус локально
    localStorage.setItem("dzchat_status_text", draft.trim());
    setMyStatus(draft.trim());
    setEditing(false);
    setDraft("");
    setPosting(false);
  };

  const handleClearStatus = () => {
    localStorage.removeItem("dzchat_status_text");
    setMyStatus("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#000" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <button className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
          <Icon name="MoreHorizontal" size={18} className="text-white" />
        </button>
        <h1 className="text-white font-bold text-[22px]">Статус</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Мой статус */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <div className="relative shrink-0">
            <div className="rounded-full p-0.5" style={{
              background: myStatus ? "linear-gradient(135deg,#25D366,#128C7E)" : "#1c1c1e"
            }}>
              <div className="rounded-full bg-black p-0.5">
                <DzChatAvatar name={me.name || "?"} url={me.avatar_url} size={52} bust={me.avatar_bust} />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#25D366] border-2 border-black flex items-center justify-center">
              <Icon name="Plus" size={11} className="text-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[15px]">Добавить статус</p>
            <p className="text-white/40 text-xs mt-0.5 truncate">
              {myStatus || "Исчезает через 24 часа"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(true); setDraft(myStatus); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
              <Icon name="Camera" size={16} className="text-white" />
            </button>
            <button
              onClick={() => { setEditing(true); setDraft(myStatus); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] flex items-center justify-center">
              <Icon name="Pencil" size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Поле ввода статуса */}
        {editing && (
          <div className="px-4 py-3 bg-[#1c1c1e] border-b border-white/10">
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Введите текст статуса..."
              maxLength={139}
              className="w-full bg-transparent text-white text-[15px] outline-none placeholder-white/30"
              onKeyDown={e => e.key === "Enter" && handlePostStatus()}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-white/30 text-xs">{139 - draft.length}</span>
              <div className="flex gap-2">
                {myStatus && (
                  <button onClick={handleClearStatus} className="text-red-400 text-sm px-3 py-1 rounded-lg">
                    Удалить
                  </button>
                )}
                <button onClick={() => setEditing(false)} className="text-white/40 text-sm px-3 py-1 rounded-lg">
                  Отмена
                </button>
                <button
                  onClick={handlePostStatus}
                  disabled={!draft.trim() || posting}
                  className="bg-[#25D366] text-white text-sm px-4 py-1 rounded-lg font-medium disabled:opacity-40">
                  {posting ? "..." : "Опубликовать"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Последние обновления */}
        {contactsWithActivity.length > 0 && (
          <>
            <p className="px-4 pt-5 pb-2 text-white/40 text-xs font-semibold uppercase tracking-wider">Последние</p>
            {contactsWithActivity.map((chat, idx) => {
              const lm = chat.last_message;
              const isLast = idx === contactsWithActivity.length - 1;
              return (
                <button
                  key={chat.id}
                  onClick={() => onOpenChat(chat)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-white/5"
                  style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="rounded-full p-0.5 shrink-0"
                    style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                    <div className="rounded-full bg-black p-0.5">
                      <DzChatAvatar name={chat.name || "?"} url={chat.avatar_url} size={50} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-white font-medium text-[15px] truncate">{chat.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{timeAgo(lm.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {contactsWithActivity.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-[#1c1c1e] flex items-center justify-center mb-4">
              <Icon name="Circle" size={36} className="text-white/20" />
            </div>
            <p className="text-white/50 text-base font-medium text-center">Статусы контактов</p>
            <p className="text-white/25 text-sm text-center mt-2">Здесь будут появляться статусы ваших контактов</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DzChatScreenStatus;