import { useState } from "react";
import Icon from "@/components/ui/icon";

type Channel = "call" | "tg" | "max" | "wa";

const CHANNELS: { value: Channel; label: string; emoji: string }[] = [
  { value: "call", label: "Звонок", emoji: "📞" },
  { value: "tg", label: "Telegram", emoji: "✈️" },
  { value: "max", label: "MAX", emoji: "💬" },
  { value: "wa", label: "WhatsApp", emoji: "🟢" },
];

interface Props {
  value: string[];
  onChange: (channels: string[]) => void;
  timeNote: string;
  onTimeChange: (s: string) => void;
  variant?: "dark" | "light" | "compact";
}

export default function ContactChannelsBlock({
  value,
  onChange,
  timeNote,
  onTimeChange,
  variant = "dark",
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (ch: Channel) => {
    if (value.includes(ch)) onChange(value.filter(v => v !== ch));
    else onChange([...value, ch]);
  };

  const isLight = variant === "light";
  const isCompact = variant === "compact";

  const linkCls = isLight
    ? "text-[#0071e3] hover:underline"
    : "text-[#FFD700]/70 hover:text-[#FFD700]";

  const cardCls = isLight
    ? "bg-[#f5f5f7] border border-black/5 rounded-xl p-3"
    : "bg-[#0D0D0D] border border-[#FFD700]/15 p-3";

  const labelCls = isLight
    ? "text-[#1d1d1f]/60 text-xs"
    : "text-white/50 text-xs uppercase tracking-wider";

  const chipBase = "flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-roboto transition-colors cursor-pointer select-none";
  const chipOff = isLight
    ? "border-black/10 bg-white text-[#1d1d1f]/70 hover:border-[#0071e3]/40"
    : "border-white/15 bg-[#141414] text-white/60 hover:border-[#FFD700]/40";
  const chipOn = isLight
    ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]"
    : "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]";

  const inputCls = isLight
    ? "w-full bg-white border border-black/10 text-[#1d1d1f] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#0071e3] placeholder:text-[#1d1d1f]/30"
    : "w-full bg-[#141414] border border-[#333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] placeholder:text-white/25";

  return (
    <div className={isCompact ? "text-xs" : ""}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1 font-roboto text-xs ${linkCls} transition-colors`}
      >
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} />
        <span className="underline underline-offset-2">
          Уточнить способ связи <span className="opacity-60">(необязательно)</span>
        </span>
        {value.length > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isLight ? "bg-[#0071e3] text-white" : "bg-[#FFD700] text-black"}`}>
            {value.length}
          </span>
        )}
      </button>

      {open && (
        <div className={`mt-2 ${cardCls}`}>
          <div className={`${labelCls} block mb-1.5`}>Как удобнее связаться</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CHANNELS.map(ch => {
              const active = value.includes(ch.value);
              return (
                <label
                  key={ch.value}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                  onClick={e => { e.preventDefault(); toggle(ch.value); }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(ch.value)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <span className="text-base leading-none">{ch.emoji}</span>
                  <span>{ch.label}</span>
                </label>
              );
            })}
          </div>

          <div className={`${labelCls} block mb-1`}>Удобное время для связи</div>
          <input
            type="text"
            value={timeNote}
            onChange={e => onTimeChange(e.target.value)}
            placeholder="Напр.: после 18:00, в будни"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
