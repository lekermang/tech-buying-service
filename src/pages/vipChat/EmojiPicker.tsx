import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const CATEGORIES: { name: string; icon: string; emoji: string[] }[] = [
  {
    name: "Часто",
    icon: "Star",
    emoji: ["👍","❤️","😂","🔥","✅","🙏","👌","💯","😎","🤝","🎯","💪"],
  },
  {
    name: "Эмоции",
    icon: "Smile",
    emoji: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
      "😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨",
      "😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕",
      "🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁",
      "☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣",
      "😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹",
    ],
  },
  {
    name: "Жесты",
    icon: "ThumbsUp",
    emoji: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
      "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","💪",
      "🦾","🤳","💅","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄",
    ],
  },
  {
    name: "Сердца",
    icon: "Heart",
    emoji: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","💌","💋"],
  },
  {
    name: "Объекты",
    icon: "Package",
    emoji: [
      "📱","💻","⌚","📷","📸","📹","🎥","💿","📀","💾","💽","💻","🖥️","🖨️","⌨️","🖱️",
      "🔋","🔌","💡","🔦","🕯️","🧯","🪔","💰","💴","💵","💶","💷","💸","💳","🧾","💎",
      "🎁","🎈","🎉","🎊","🎀","🎗️","🏆","🥇","🥈","🥉","⚽","🏀","🎮","🕹️","🎲","🃏",
    ],
  },
  {
    name: "Символы",
    icon: "Hash",
    emoji: [
      "✅","☑️","✔️","❌","✖️","➕","➖","➗","✳️","✴️","❇️","‼️","⁉️","❓","❔","❕","❗",
      "💯","🔥","💢","💥","💫","💦","💨","🕳️","💣","💬","👁️‍🗨️","🗨️","🗯️","💭","💤","🆗","🆕","🆒","🆙","🆓",
      "⭐","🌟","✨","⚡","☄️","💎","🔔","🔕","🎵","🎶","💲","®️","©️","™️","#️⃣","*️⃣",
    ],
  },
];

export default function EmojiPicker({
  open, onClose, onPick, anchorClass = "bottom-full left-0 mb-2",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  anchorClass?: string;
}) {
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const cat = CATEGORIES[tab];

  return (
    <div
      ref={ref}
      className={`absolute ${anchorClass} z-50 w-[300px] sm:w-[340px] rounded-xl border border-[#FFD700]/30 bg-[#0F0F0F] shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(255,215,0,0.15)] overflow-hidden`}
    >
      {/* Категории */}
      <div className="flex items-center justify-between gap-1 p-2 border-b border-white/10 bg-black/40">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setTab(i)}
            title={c.name}
            className={`p-1.5 rounded-lg transition-all active:scale-90 ${
              tab === i ? "bg-[#FFD700] text-black" : "text-white/50 hover:text-[#FFD700] hover:bg-white/5"
            }`}
          >
            <Icon name={c.icon} size={14} />
          </button>
        ))}
      </div>
      {/* Сетка эмодзи */}
      <div className="p-2 max-h-[260px] overflow-y-auto scrollbar-premium">
        <div className="grid grid-cols-8 gap-0.5">
          {cat.emoji.map((e, i) => (
            <button
              key={`${e}-${i}`}
              onClick={() => onPick(e)}
              className="text-xl leading-none p-1.5 rounded hover:bg-[#FFD700]/15 active:scale-90 transition-all"
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
