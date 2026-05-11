import { useEffect, useState } from "react";
import {
  pchatApi, PUBLIC_CHAT_URL,
  PCHAT_TOKEN_KEY, PCHAT_NAME_KEY, PCHAT_PHONE_KEY, PCHAT_DIRECT_KEY,
  type Room,
} from "./publicChat/types";
import PublicChatLogin from "./publicChat/PublicChatLogin";
import PublicChatRoom from "./publicChat/PublicChatRoom";

const useQuery = () => {
  const [params, setParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    const onPop = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return params;
};

export default function PublicChat() {
  const params = useQuery();
  const inviteToken = params.get("invite") || "";

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(PCHAT_TOKEN_KEY));
  const [name, setName] = useState<string>(() => localStorage.getItem(PCHAT_NAME_KEY) || "Клиент");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number>(0);
  const [inviteBusy, setInviteBusy] = useState(false);

  // Активация invite-токена (если пришли по ссылке из SMS)
  useEffect(() => {
    if (!inviteToken || token) return;
    setInviteBusy(true);
    pchatApi("invite_open", { invite_token: inviteToken }).then(r => {
      if (r.ok) {
        localStorage.setItem(PCHAT_TOKEN_KEY, r.token as string);
        localStorage.setItem(PCHAT_NAME_KEY, (r.name as string) || "Клиент");
        if (r.direct_room_id) localStorage.setItem(PCHAT_DIRECT_KEY, String(r.direct_room_id));
        setToken(r.token as string);
        setName((r.name as string) || "Клиент");
        // убираем invite из URL
        window.history.replaceState({}, "", "/chat");
      }
    }).finally(() => setInviteBusy(false));
  }, [inviteToken, token]);

  // Подгружаем список комнат когда есть токен
  const loadRooms = async () => {
    if (!token) return;
    const r = await fetch(`${PUBLIC_CHAT_URL}?action=rooms&token=${encodeURIComponent(token)}`);
    const d = await r.json();
    if (d.ok) {
      setRooms(d.rooms || []);
      if (!activeRoomId && d.rooms?.length) {
        // дефолт: личный диалог если есть, иначе общий
        const direct = d.rooms.find((x: Room) => x.type === "direct");
        setActiveRoomId(direct ? direct.id : d.rooms[0].id);
      }
    } else if (d.error === "Auth required") {
      // токен невалиден — выйти
      handleLogout();
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRooms();
    // 20с вместо 12с + пропуск скрытой вкладки (экономия compute)
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      loadRooms();
    };
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem(PCHAT_TOKEN_KEY);
    localStorage.removeItem(PCHAT_NAME_KEY);
    localStorage.removeItem(PCHAT_PHONE_KEY);
    localStorage.removeItem(PCHAT_DIRECT_KEY);
    setToken(null); setRooms([]); setActiveRoomId(0);
  };

  if (inviteBusy) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-white/55">Открываем чат...</div>
      </div>
    );
  }

  if (!token) {
    return <PublicChatLogin onSuccess={() => { setToken(localStorage.getItem(PCHAT_TOKEN_KEY)); setName(localStorage.getItem(PCHAT_NAME_KEY) || "Клиент"); }} />;
  }

  if (!activeRoomId || rooms.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-white/55">Загружаем комнаты...</div>
      </div>
    );
  }

  return (
    <PublicChatRoom
      token={token}
      myName={name}
      rooms={rooms}
      activeRoomId={activeRoomId}
      setActiveRoomId={setActiveRoomId}
      onLogout={handleLogout}
      onRoomsRefresh={loadRooms}
    />
  );
}