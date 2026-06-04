import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const CAB_URL = (funcUrls as Record<string, string>)["client-cabinet"];
const CHAT_URL = (funcUrls as Record<string, string>)["public-chat"];

type Message = {
  id: number;
  author_type: "client" | "staff" | "system";
  author_id: number;
  author_name: string;
  text: string | null;
  photo_url?: string | null;
  is_system: boolean;
  created_at: string;
};

const LS_AUTH = "pchat_auth";
const LS_ROOM = "pchat_room";

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const fmtDateLabel = (iso: string) => {
  try {
    const d = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - day.getTime()) / 86400000;
    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Вчера";
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  } catch {
    return "";
  }
};

export default function ClientChat({ token }: { token: string }) {
  const [authToken, setAuthToken] = useState<string>("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef(0);

  // Инициализация — получаем pchat_auth + room_id из client-cabinet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(CAB_URL, {
          method: "POST",
          headers: { "X-Client-Token": token, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "chat_init" }),
        });
        const d = await r.json();
        if (cancelled) return;
        if (d.error || !d.auth_token) {
          setError(d.error || "Не удалось подключиться к чату");
          setLoading(false);
          return;
        }
        setAuthToken(d.auth_token);
        setRoomId(d.room_id);
        localStorage.setItem(LS_AUTH, d.auth_token);
        localStorage.setItem(LS_ROOM, String(d.room_id));
      } catch {
        if (!cancelled) {
          setError("Нет связи. Проверь интернет.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Загрузка истории
  const loadRoom = useCallback(async () => {
    if (!authToken || !roomId) return;
    try {
      const r = await fetch(`${CHAT_URL}?action=room&room_id=${roomId}`, {
        headers: { "X-Auth-Token": authToken },
      });
      const d = await r.json();
      if (Array.isArray(d.messages)) {
        setMessages(d.messages);
        const last = d.messages[d.messages.length - 1];
        if (last) lastIdRef.current = last.id;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [authToken, roomId]);

  useEffect(() => {
    if (authToken && roomId) loadRoom();
  }, [authToken, roomId, loadRoom]);

  // Long-poll новых сообщений раз в 8 сек
  useEffect(() => {
    if (!authToken || !roomId) return;
    let active = true;
    const id = setInterval(async () => {
      if (!active) return;
      try {
        const r = await fetch(
          `${CHAT_URL}?action=poll&room_id=${roomId}&since=${lastIdRef.current}`,
          { headers: { "X-Auth-Token": authToken } },
        );
        if (r.status === 401 || r.status === 403) {
          active = false;
          clearInterval(id);
          setAuthToken("");
          localStorage.removeItem(LS_AUTH);
          localStorage.removeItem(LS_ROOM);
          setError("Сессия истекла. Обновите страницу.");
          return;
        }
        const d = await r.json();
        if (Array.isArray(d.messages) && d.messages.length) {
          setMessages((prev) => [...prev, ...d.messages]);
          const last = d.messages[d.messages.length - 1];
          if (last) lastIdRef.current = last.id;
        }
      } catch {
        /* ignore network errors */
      }
    }, 8000);
    return () => { active = false; clearInterval(id); };
  }, [authToken, roomId]);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async () => {
    const txt = draft.trim();
    if (!txt || !authToken || !roomId || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": authToken },
        body: JSON.stringify({ room_id: roomId, text: txt }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      setDraft("");
      loadRoom();
    } catch {
      setError("Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  // Сжатие фото перед отправкой (важно для APK / iPhone HEIC)
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            } else {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          const c = document.createElement("canvas");
          c.width = width;
          c.height = height;
          const ctx = c.getContext("2d");
          if (!ctx) {
            reject(new Error("canvas failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/jpeg", 0.85);
        };
        img.onerror = () => reject(new Error("img"));
        img.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
  };

  const sendPhoto = async (file: File) => {
    if (!authToken || !roomId) return;
    if (file.size > 12 * 1024 * 1024) {
      setError("Фото больше 12 МБ — выбери поменьше");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let blob: Blob = file;
      try {
        blob = await compressImage(file);
      } catch {
        // fallback: отправим как есть
      }
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || "").split(",")[1] || "");
        r.onerror = () => reject(new Error("read"));
        r.readAsDataURL(blob);
      });
      const r = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": authToken },
        body: JSON.stringify({
          room_id: roomId,
          photo_base64: b64,
          photo_mime: "image/jpeg",
        }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      loadRoom();
    } catch (e) {
      setError((e as Error)?.message || "Не удалось отправить фото");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (error && !messages.length) {
    return (
      <div className="text-center py-10">
        <Icon name="WifiOff" size={32} className="mx-auto text-white/20 mb-2" />
        <div className="text-sm text-white/60">{error}</div>
      </div>
    );
  }

  // Группировка по дням
  const grouped: { date: string; items: Message[] }[] = [];
  for (const m of messages) {
    const lbl = fmtDateLabel(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === lbl) last.items.push(m);
    else grouped.push({ date: lbl, items: [m] });
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#1F1F1F] rounded-2xl overflow-hidden">
      {/* Шапка */}
      <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/30 flex items-center justify-center">
          <Icon name="MessageCircle" size={16} className="text-[#FFD700]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white">Менеджер Скупка 24</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Обычно отвечаем за 5–10 минут
          </div>
        </div>
        <a
          href="tel:+79929999777"
          className="p-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20"
          title="Позвонить"
        >
          <Icon name="Phone" size={14} />
        </a>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[55vh] max-h-[55vh]">
        {grouped.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <Icon name="MessageSquareDashed" size={28} className="mx-auto mb-2 text-white/20" />
            <div className="text-xs">Напиши первым — мы на связи</div>
          </div>
        )}
        {grouped.map((g, gi) => (
          <div key={gi}>
            <div className="text-center my-2">
              <span className="text-[10px] uppercase tracking-widest text-white/30 bg-[#0A0A0A] px-2 py-0.5 rounded-full">
                {g.date}
              </span>
            </div>
            {g.items.map((m) => {
              const mine = m.author_type === "client";
              const sys = m.author_type === "system" || m.is_system;
              if (sys) {
                return (
                  <div key={m.id} className="text-center my-2">
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-full">
                      {m.text}
                    </span>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                      mine
                        ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black rounded-br-sm"
                        : "bg-[#1A1A1A] border border-[#1F1F1F] text-white rounded-bl-sm"
                    }`}
                  >
                    {!mine && (
                      <div className="text-[10px] font-bold text-[#FFD700] mb-0.5">
                        {m.author_name || "Менеджер"}
                      </div>
                    )}
                    {m.photo_url && (
                      <img
                        src={m.photo_url}
                        alt=""
                        onClick={() => m.photo_url && window.open(m.photo_url, "_blank")}
                        className="max-w-full max-h-64 rounded-lg cursor-zoom-in mb-1"
                      />
                    )}
                    {m.text && (
                      <div className="text-[13px] whitespace-pre-wrap break-words">{m.text}</div>
                    )}
                    <div className={`text-[9px] mt-0.5 ${mine ? "text-black/60" : "text-white/40"}`}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="px-3 pb-2 text-xs text-red-400">{error}</div>
      )}

      {/* Поле ввода */}
      <div className="border-t border-[#1F1F1F] p-2 flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 w-10 h-10 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] flex items-center justify-center hover:bg-[#FFD700]/20 disabled:opacity-50"
          title="Прикрепить фото"
        >
          {uploading ? (
            <Icon name="Loader" size={16} className="animate-spin" />
          ) : (
            <Icon name="ImagePlus" size={16} />
          )}
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="shrink-0 w-10 h-10 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] flex items-center justify-center hover:bg-[#FFD700]/20 disabled:opacity-50"
          title="Сфотографировать"
        >
          <Icon name="Camera" size={16} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) sendPhoto(f);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) sendPhoto(f);
            e.target.value = "";
          }}
        />
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Напиши менеджеру..."
          className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white px-3 py-2 rounded-lg text-[13px] focus:outline-none resize-none max-h-32"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black flex items-center justify-center disabled:opacity-30 hover:brightness-110"
        >
          {sending ? (
            <Icon name="Loader" size={16} className="animate-spin" />
          ) : (
            <Icon name="Send" size={16} />
          )}
        </button>
      </div>
    </div>
  );
}