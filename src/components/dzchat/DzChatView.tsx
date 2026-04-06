/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./dzchat.utils";
import { ChatHeader, SearchBar, GroupInfoModal } from "./DzChatHeader";
import DzChatMessage from "./DzChatMessage";
import { ReplyPreview, ChatInput } from "./DzChatInput";
import { EditGroupModal } from "./DzChatModals";
import { playSendSound, playVoiceSentSound, unlockAudio } from "./dzchat.sounds";
import type { DzTheme } from "./dzchat.theme";
import { loadAndApplyTheme } from "./dzchat.theme";

const DzChatView = ({ chat, me, token, onBack, onChatUpdate, theme: themeProp }: {
  chat: any; me: any; token: string; onBack: () => void; onChatUpdate?: () => void;
  theme?: DzTheme;
}) => {
  const theme = themeProp ?? loadAndApplyTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [forwardMsg, setForwardMsg] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contextMsg, setContextMsg] = useState<any>(null);
  const [reactionPickerMsg, setReactionPickerMsg] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupEdit, setShowGroupEdit] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  // Онлайн-статус и typing партнёра — обновляется отдельным поллингом
  const [partnerOnline, setPartnerOnline] = useState<boolean>(!!chat.partner?.is_online);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(chat.partner?.last_seen_at ?? null);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [liveChatData, setLiveChatData] = useState<any>(chat);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const onlinePollRef = useRef<ReturnType<typeof setInterval>>();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // id последнего известного сообщения — скроллим вниз только при появлении нового
  const lastMsgIdRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const fetchingMsgRef = useRef(false); // защита от параллельных запросов при 1с интервале

  // Отправляем typing=true, через 4с — typing=false
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      api("typing", "POST", { chat_id: chat.id, is_typing: true }, token).catch(() => {});
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      api("typing", "POST", { chat_id: chat.id, is_typing: false }, token).catch(() => {});
    }, 4000);
  }, [chat.id, token]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadMessages = useCallback(async () => {
    if (fetchingMsgRef.current) return;
    fetchingMsgRef.current = true;
    try {
      const data = await api(`messages&chat_id=${chat.id}`, "GET", undefined, token);
      if (Array.isArray(data)) {
        setMessages(prev => {
          const lastNew = data.length > 0 ? data[data.length - 1].id : null;
          const lastOld = prev.length > 0 ? prev[prev.length - 1].id : null;
          if (lastNew !== lastOld && isAtBottomRef.current) {
            lastMsgIdRef.current = lastNew;
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
          return data;
        });
      }
      await api("read", "POST", { chat_id: chat.id }, token);
      onChatUpdate?.();
    } finally {
      fetchingMsgRef.current = false;
    }
  }, [chat.id, token, onChatUpdate]);

  useEffect(() => {
    // При смене чата — сброс и мгновенный скролл вниз
    setMessages([]); setReplyTo(null); setContextMsg(null); setShowSearch(false);
    lastMsgIdRef.current = null;
    isAtBottomRef.current = true;
    setPartnerOnline(!!chat.partner?.is_online);
    setPartnerLastSeen(chat.partner?.last_seen_at ?? null);
    setLiveChatData(chat);
    loadMessages().then(() => scrollToBottom("instant"));
    pollRef.current = setInterval(loadMessages, 1000);

    // Polling онлайн-статуса и typing партнёра каждые 3 сек
    if (chat.type === "direct" && chat.partner?.id) {
      const pollOnline = async () => {
        try {
          const data = await api(`chats`, "GET", undefined, token);
          if (Array.isArray(data)) {
            const updated = data.find((c: any) => c.id === chat.id);
            if (updated) {
              if (updated.partner) {
                setPartnerOnline(!!updated.partner.is_online);
                setPartnerLastSeen(updated.partner.last_seen_at ?? null);
              }
              setPartnerTyping(!!updated.partner_typing);
              setLiveChatData((prev: any) => ({ ...prev, partner: updated.partner, partner_typing: updated.partner_typing }));
            }
          }
        } catch (e) { void e; }
      };
      pollOnline();
      onlinePollRef.current = setInterval(pollOnline, 3000);
    }

    return () => {
      clearInterval(pollRef.current);
      clearInterval(onlinePollRef.current);
      clearTimeout(typingTimerRef.current);
      // Сбрасываем typing при выходе из чата
      if (isTypingRef.current) {
        api("typing", "POST", { chat_id: chat.id, is_typing: false }, token).catch(() => {});
      }
    };
  }, [chat.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // imageB64 может содержать видео (data:video/...) или фото
  const [fileMime, setFileMime] = useState<string>("image/jpeg");

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type || "image/jpeg";
    setFileMime(mime);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageB64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    if (!text.trim() && !imageB64) return;
    unlockAudio();
    playSendSound();
    setSending(true);
    let photo_url = "";
    let video_url = "";
    if (imageB64) {
      setUploadingPhoto(true);
      const isVideo = fileMime.startsWith("video/");
      const kind = isVideo ? "video" : "photo";
      const res = await api("upload", "POST", { image: imageB64, mime: fileMime, kind }, token);
      setUploadingPhoto(false);
      if (res.url) {
        if (isVideo) video_url = res.url;
        else photo_url = res.url;
      }
    }
    const res = await api("send", "POST", {
      chat_id: chat.id,
      text: text.trim() || undefined,
      photo_url: photo_url || undefined,
      video_url: video_url || undefined,
      forwarded_from: forwardMsg?.id,
      reply_to: replyTo?.id,
    }, token);
    setSending(false);
    if (res.ok) {
      setText(""); setImagePreview(null); setImageB64(null); setForwardMsg(null); setReplyTo(null);
      isAtBottomRef.current = true;
      await loadMessages();
    }
  };

  const sendVoice = async (b64: string, duration: number, mime = "audio/webm") => {
    unlockAudio();
    playVoiceSentSound();
    setSending(true);
    const res = await api("upload", "POST", { image: b64, mime, kind: "voice" }, token);
    if (res.url) {
      await api("send", "POST", { chat_id: chat.id, voice_url: res.url, voice_duration: duration }, token);
      isAtBottomRef.current = true;
      await loadMessages();
    }
    setSending(false);
  };

  const removeMsg = async (msg: any) => {
    await api("remove", "POST", { msg_id: msg.id, everyone: false }, token);
    setContextMsg(null);
    await loadMessages();
  };

  const removeMsgForAll = async (msg: any) => {
    await api("remove", "POST", { msg_id: msg.id, everyone: true }, token);
    setContextMsg(null);
    await loadMessages();
  };

  const react = async (msg: any, emoji: string) => {
    setReactionPickerMsg(null);
    await api("react", "POST", { msg_id: msg.id, emoji }, token);
    await loadMessages();
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const data = await api(`search_messages&chat_id=${chat.id}&q=${encodeURIComponent(q)}`, "GET", undefined, token);
    if (Array.isArray(data)) setSearchResults(data);
  };

  const scrollToMsg = (msgId: number) => {
    const el = msgRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-yellow-400/10");
      setTimeout(() => el.classList.remove("bg-yellow-400/10"), 1500);
    }
  };

  const loadGroupInfo = async () => {
    const data = await api(`group_info&chat_id=${chat.id}`, "GET", undefined, token);
    if (data.members) setGroupMembers(data.members);
    setShowGroupInfo(true);
  };

  return (
    <div className="flex flex-col h-full"
      style={{ background: theme.chatBg }}
      onClick={() => { setContextMsg(null); setReactionPickerMsg(null); }}>

      {/* Шапка */}
      <ChatHeader
        chat={liveChatData}
        partnerOnline={partnerOnline}
        partnerLastSeen={partnerLastSeen}
        partnerTyping={partnerTyping}
        onBack={onBack}
        onGroupInfoClick={loadGroupInfo}
        onGroupEditClick={() => setShowGroupEdit(true)}
        showSearch={showSearch}
        onToggleSearch={() => { setShowSearch(s => !s); setSearchQuery(""); setSearchResults([]); }}
        theme={theme}
      />

      {/* Поиск */}
      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={doSearch}
          onResultClick={id => { scrollToMsg(id); setShowSearch(false); }}
        />
      )}

      {/* Сообщения */}
      <div ref={listRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
        style={{
          background: theme.chatBg,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}>
        {messages.map((msg, i) => (
          <DzChatMessage
            key={msg.id}
            msg={msg}
            me={me}
            chat={chat}
            prevMsg={messages[i - 1]}
            nextMsg={messages[i + 1]}
            msgRef={el => { msgRefs.current[msg.id] = el; }}
            contextMsg={contextMsg}
            reactionPickerMsg={reactionPickerMsg}
            onContextMenu={m => { setContextMsg(m); setReactionPickerMsg(null); }}
            onReact={react}
            onReactionPicker={m => { setReactionPickerMsg(m); setContextMsg(null); }}
            onReply={m => { setReplyTo(m); setContextMsg(null); }}
            onForward={m => { setForwardMsg(m); setContextMsg(null); }}
            onRemove={removeMsg}
            onRemoveForAll={removeMsgForAll}
            onScrollToMsg={scrollToMsg}
            onTextareaFocus={() => textareaRef.current?.focus()}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Превью reply/forward/фото */}
      <ReplyPreview
        replyTo={replyTo}
        forwardMsg={forwardMsg}
        imagePreview={imagePreview}
        onClearReply={() => setReplyTo(null)}
        onClearForward={() => setForwardMsg(null)}
        onClearImage={() => { setImagePreview(null); setImageB64(null); }}
      />

      {/* Поле ввода */}
      <ChatInput
        text={text}
        setText={setText}
        sending={sending}
        uploadingPhoto={uploadingPhoto}
        imageB64={imageB64}
        textareaRef={textareaRef}
        onSend={send}
        onSendVoice={sendVoice}
        onPhotoSelect={handlePhoto}
        onTyping={handleTyping}
      />

      {/* Модал участников группы */}
      {showGroupInfo && (
        <GroupInfoModal members={groupMembers} onClose={() => setShowGroupInfo(false)} />
      )}

      {/* Модал редактирования группы */}
      {showGroupEdit && (
        <EditGroupModal
          chat={chat} token={token}
          onClose={() => setShowGroupEdit(false)}
          onUpdated={name => { onChatUpdate?.(); setShowGroupEdit(false); }}
        />
      )}
    </div>
  );
};

export default DzChatView;