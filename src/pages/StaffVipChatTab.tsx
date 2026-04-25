import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  isPushSupported, vipChatPushState, enableVipChatPush, disableVipChatPush,
} from "@/lib/vipChatPush";
import {
  VIP_CHAT_URL, POLL_INTERVAL_MS,
  Member, Message, PollResp,
  isOnline, fmtDate,
} from "./vipChat/types";
import MembersList from "./vipChat/MembersList";
import ChatHeader from "./vipChat/ChatHeader";
import MessagesList from "./vipChat/MessagesList";
import ChatComposer from "./vipChat/ChatComposer";

type Props = { token: string; onUnread?: (n: number) => void };

export default function StaffVipChatTab({ token, onUnread }: Props) {
  const [meId, setMeId] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Push
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHint, setPushHint] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef(0);
  const initialLoadDone = useRef(false);

  const api = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch(VIP_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  }, [token]);

  const scrollToBottom = (smooth: boolean = true) => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    });
  };

  const poll = useCallback(async () => {
    try {
      const data: PollResp = await api("poll", { after_id: lastIdRef.current });
      if (data.error) { setError(data.error); return; }
      setError(null);
      if (data.me) setMeId(data.me.id);
      if (data.members) setMembers(data.members);
      if (data.unread != null) {
        setUnread(data.unread);
        onUnread?.(data.unread);
      }

      if (data.messages?.length) {
        const wasAtBottom = (() => {
          const el = listRef.current;
          if (!el) return true;
          return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        })();

        setMessages(prev => {
          if (lastIdRef.current === 0) return data.messages;
          const ids = new Set(prev.map(m => m.id));
          const merged = [...prev];
          for (const m of data.messages) if (!ids.has(m.id)) merged.push(m);
          return merged;
        });
        const maxId = Math.max(...data.messages.map(m => m.id));
        if (maxId > lastIdRef.current) lastIdRef.current = maxId;

        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          scrollToBottom(false);
        } else if (wasAtBottom) {
          scrollToBottom(true);
        }
      } else if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка соединения");
    }
  }, [api, onUnread]);

  // Polling каждые N секунд
  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [poll]);

  // Стартовое состояние Web Push
  useEffect(() => {
    setPushSupported(isPushSupported());
    vipChatPushState().then(s => {
      setPushSubscribed(s.subscribed);
      setPushPermission(s.permission);
    });
  }, []);

  const togglePush = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    setPushHint(null);
    try {
      if (pushSubscribed) {
        await disableVipChatPush(token);
        setPushSubscribed(false);
        setPushHint("Уведомления отключены");
      } else {
        const res = await enableVipChatPush(token);
        if (res.ok) {
          setPushSubscribed(true);
          setPushPermission("granted");
          setPushHint("✓ Уведомления включены");
        } else {
          setPushHint(res.error || "Не удалось включить");
        }
      }
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushHint(null), 4000);
    }
  };

  // Отметка о прочтении при просмотре
  useEffect(() => {
    if (!messages.length) return;
    const maxId = messages[messages.length - 1].id;
    api("mark_read", { msg_id: maxId }).catch(() => {});
  }, [messages, api]);

  // Загрузка фото
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Можно загружать только изображения"); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Файл больше 8 МБ"); return; }

    setError(null);
    const objUrl = URL.createObjectURL(file);
    setPhotoPreview(objUrl);
    setPhotoUploading(true);
    setPhotoUrl(null);

    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(((reader.result as string) || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const data = await api("upload_photo", { base64: b64, mime_type: file.type });
      if (data.error) { setError(data.error); setPhotoPreview(null); return; }
      setPhotoUrl(data.photo_url);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Ошибка загрузки");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const cancelPhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
  };

  const send = async () => {
    const t = text.trim();
    if (!t && !photoUrl) return;
    if (sending || photoUploading) return;
    setSending(true);
    try {
      const data = await api("send", { text: t, photo_url: photoUrl });
      if (data.error) { setError(data.error); return; }
      setText("");
      setPhotoPreview(null);
      setPhotoUrl(null);
      await poll();
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Группировка по дням
  const grouped = useMemo(() => {
    const out: { day: string; items: Message[] }[] = [];
    let lastDay = "";
    for (const m of messages) {
      const d = fmtDate(m.created_at);
      if (d !== lastDay) {
        out.push({ day: d, items: [m] });
        lastDay = d;
      } else {
        out[out.length - 1].items.push(m);
      }
    }
    return out;
  }, [messages]);

  const onlineCount = members.filter(isOnline).length;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[480px] bg-[#0A0A0A] text-white">
      <MembersList
        members={members}
        meId={meId}
        onlineCount={onlineCount}
        showMembers={showMembers}
      />

      <section className={`${showMembers ? "hidden" : "flex"} lg:flex flex-1 flex-col min-w-0`}>
        <ChatHeader
          onlineCount={onlineCount}
          membersCount={members.length}
          unread={unread}
          pushSupported={pushSupported}
          pushSubscribed={pushSubscribed}
          pushPermission={pushPermission}
          pushBusy={pushBusy}
          pushHint={pushHint}
          onTogglePush={togglePush}
          onShowMembers={() => setShowMembers(true)}
        />

        <MessagesList
          ref={listRef}
          grouped={grouped}
          meId={meId}
          messagesCount={messages.length}
          error={error}
          onOpenLightbox={(url) => setLightbox(url)}
        />

        <ChatComposer
          ref={fileRef}
          text={text}
          setText={setText}
          sending={sending}
          photoPreview={photoPreview}
          photoUploading={photoUploading}
          photoUrl={photoUrl}
          onCancelPhoto={cancelPhoto}
          onPickFile={() => fileRef.current?.click()}
          onFileChange={handleFile}
          onSend={send}
          onKeyDown={onKeyDown}
          lightbox={lightbox}
          onCloseLightbox={() => setLightbox(null)}
        />
      </section>
    </div>
  );
}
