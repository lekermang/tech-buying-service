import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const STORAGE_HIDDEN = "chat_bubble_hidden_until";

export default function ChatBubble() {
  const [hidden, setHidden] = useState<boolean>(() => {
    try {
      const v = parseInt(localStorage.getItem(STORAGE_HIDDEN) || "0", 10);
      return v > Date.now();
    } catch { return false; }
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Не показываем пузырь, если мы уже на странице чата
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/chat")) {
      setHidden(true);
    }
  }, []);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    localStorage.setItem(STORAGE_HIDDEN, String(Date.now() + 24 * 3600 * 1000));
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <a
      href="/chat"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-4 right-4 z-[120] group"
      title="Чат с командой Скупка24"
    >
      {/* Tooltip */}
      <div className={`absolute bottom-full right-0 mb-2 transition-all duration-200 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"}`}>
        <div className="bg-[#0F0F0F] border border-[#FFD700]/40 rounded-lg px-3 py-2 shadow-xl text-sm text-white whitespace-nowrap">
          <div className="font-bold text-[#FFD700]">💬 Скупка24 LIVE</div>
          <div className="text-white/70 text-[11px]">Чат с командой и клиентами</div>
        </div>
      </div>

      {/* Кнопка */}
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-[#FFD700]/40 blur-xl animate-pulse" />
        <button
          className="relative bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_8px_24px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] active:scale-95 transition-transform flex items-center justify-center"
        >
          <Icon name="MessageCircle" size={26} />
        </button>
        {/* Зелёная точка - онлайн */}
        <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full ring-2 ring-[#0A0A0A] animate-pulse" />
      </div>

      {/* Кнопка скрыть */}
      <button
        onClick={dismiss}
        className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-black/85 hover:bg-red-500/80 text-white/55 hover:text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
        title="Скрыть на день"
      >
        <Icon name="X" size={10} />
      </button>
    </a>
  );
}
