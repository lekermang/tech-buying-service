import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import funcUrls from "../../../backend/func2url.json";
import VipChatSidebar from "./VipChatSidebar";
import VipChatConversation from "./VipChatConversation";
import VipChatAvatarModal from "./VipChatAvatarModal";
import { Msg, Member, Me, isOnline } from "./vipChatTypes";

const VIP_CHAT_URL = (funcUrls as Record<string, string>)["vip-chat"];

export default function VipChatTab({ token }: { token: string }) {
  // peer = 0 — общий чат, иначе ID собеседника
  const [peer, setPeer] = useState<number>(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const lastIdRef = useRef(0);
  const peerRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const apiCall = useCallback(
    async (action: string, body: Record<string, unknown> = {}) => {
      const r = await fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("employee_token");
        window.location.reload();
        throw new Error("SESSION_EXPIRED");
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    },
    [token],
  );

  const poll = useCallback(async () => {
    try {
      const d = await apiCall("poll", {
        after_id: lastIdRef.current,
        peer_id: peerRef.current,
      });
      if (d.me?.id) setMe(d.me);
      if (Array.isArray(d.members)) setMembers(d.members);
      if (Array.isArray(d.messages) && d.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = d.messages.filter((m: Msg) => !ids.has(m.id));
          if (fresh.length === 0) return prev;
          const next = [...prev, ...fresh];
          lastIdRef.current = Math.max(lastIdRef.current, ...fresh.map((m: Msg) => m.id));
          return next;
        });
        const lastId = d.messages[d.messages.length - 1].id;
        await apiCall("mark_read", { msg_id: lastId, peer_id: peerRef.current }).catch(() => {});
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Смена диалога: сбрасываем сообщения и грузим заново
  useEffect(() => {
    peerRef.current = peer;
    lastIdRef.current = 0;
    setMessages([]);
    setLoading(true);
    poll();
  }, [peer, poll]);

  // Поллинг каждые 8 сек
  useEffect(() => {
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [poll]);

  // Автоскролл вниз
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await apiCall("send", { text: t, recipient_id: peer || undefined });
      setText("");
      setShowEmoji(false);
      await poll();
    } catch (e) {
      setError("Не удалось отправить: " + (e as Error).message);
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

  const uploadPhoto = async (file: File) => {
    setSending(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = String(r.result || "");
          resolve(s.split(",")[1] || "");
        };
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const up = await apiCall("upload_photo", { base64: b64, mime_type: file.type });
      if (up?.photo_url) {
        await apiCall("send", {
          text: text.trim() || undefined,
          photo_url: up.photo_url,
          recipient_id: peer || undefined,
        });
        setText("");
        await poll();
      }
    } catch (e) {
      setError("Фото не загружено: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const uploadMyAvatar = async (file: File) => {
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || "").split(",")[1] || "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const up = await apiCall("upload_photo", { base64: b64, mime_type: file.type });
      if (up?.photo_url) {
        await apiCall("update_avatar", { avatar_url: up.photo_url });
        setShowAvatarModal(false);
        await poll();
      }
    } catch (e) {
      setError("Аватар не обновлён: " + (e as Error).message);
    }
  };

  const peerMember = useMemo(
    () => (peer ? members.find((m) => m.id === peer) || null : null),
    [peer, members],
  );
  const myAvatar = useMemo(
    () => (me ? members.find((m) => m.id === me.id)?.avatar_url || null : null),
    [me, members],
  );

  // Сортированный список собеседников: сначала с непрочитанными, потом онлайн, потом остальные
  const dialogList = useMemo(() => {
    if (!me) return [];
    return members
      .filter((m) => m.id !== me.id)
      .sort((a, b) => {
        const ua = a.unread || 0;
        const ub = b.unread || 0;
        if (ua !== ub) return ub - ua;
        const oa = isOnline(a.last_seen_at) ? 1 : 0;
        const ob = isOnline(b.last_seen_at) ? 1 : 0;
        if (oa !== ob) return ob - oa;
        return a.full_name.localeCompare(b.full_name, "ru");
      });
  }, [members, me]);

  const totalDmUnread = useMemo(
    () => dialogList.reduce((s, m) => s + (m.unread || 0), 0),
    [dialogList],
  );

  return (
    <div className="flex h-[calc(100dvh-180px)] gap-3 p-2 sm:p-3">
      <VipChatSidebar
        me={me}
        myAvatar={myAvatar}
        peer={peer}
        dialogList={dialogList}
        totalDmUnread={totalDmUnread}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
        setPeer={setPeer}
        setShowAvatarModal={setShowAvatarModal}
      />

      <VipChatConversation
        token={token}
        peer={peer}
        peerMember={peerMember}
        members={members}
        me={me}
        messages={messages}
        loading={loading}
        error={error}
        text={text}
        sending={sending}
        showEmoji={showEmoji}
        scrollRef={scrollRef}
        fileInputRef={fileInputRef}
        setText={setText}
        setShowEmoji={setShowEmoji}
        setShowMobileSidebar={setShowMobileSidebar}
        send={send}
        onKeyDown={onKeyDown}
        uploadPhoto={uploadPhoto}
      />

      {showAvatarModal && me && (
        <VipChatAvatarModal
          me={me}
          myAvatar={myAvatar}
          avatarInputRef={avatarInputRef}
          setShowAvatarModal={setShowAvatarModal}
          uploadMyAvatar={uploadMyAvatar}
          onRemoveAvatar={async () => {
            await apiCall("update_avatar", { avatar_url: "" }).catch(() => {});
            setShowAvatarModal(false);
            await poll();
          }}
        />
      )}
    </div>
  );
}