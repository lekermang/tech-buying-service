import { useState } from "react";
import Icon from "@/components/ui/icon";

export type ContactChannel = "call" | "tg" | "max" | "wa";

interface Props {
  value: ContactChannel[];
  onChange: (next: ContactChannel[]) => void;
  device?: string;
  onDeviceChange?: (next: string) => void;
  className?: string;
}

const CHANNELS: { value: ContactChannel; label: string; emoji: string }[] = [
  { value: "call", label: "Звонок", emoji: "📞" },
  { value: "tg", label: "Telegram", emoji: "✈️" },
  { value: "max", label: "MAX", emoji: "💬" },
  { value: "wa", label: "WhatsApp", emoji: "🟢" },
];

export default function ContactChannelsPicker({
  value,
  onChange,
  device,
  onDeviceChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (ch: ContactChannel) => {
    if (value.includes(ch)) onChange(value.filter(v => v !== ch));
    else onChange([...value, ch]);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 font-roboto text-xs text-[#888] hover:text-white transition-colors select-none"
      >
        <span>Уточнить способ связи</span>
        <Icon
          name={open ? "ChevronUp" : "ChevronDown"}
          size={13}
          className="opacity-70"
        />
        {value.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFD700] text-black leading-none">
            {value.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 bg-[#1A1A1A] border border-[#333] rounded p-4">
          <div className="font-roboto text-white/50 text-[11px] uppercase tracking-wider mb-2">
            Как удобнее связаться
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {CHANNELS.map(ch => {
              const active = value.includes(ch.value);
              return (
                <label
                  key={ch.value}
                  className={`flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors select-none ${
                    active
                      ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                      : "border-[#333] bg-[#141414] text-white/70 hover:border-[#FFD700]/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(ch.value)}
                    className="w-4 h-4 accent-[#FFD700] cursor-pointer"
                  />
                  <span className="text-base leading-none">{ch.emoji}</span>
                  <span className="font-roboto text-sm">{ch.label}</span>
                </label>
              );
            })}
          </div>

          {onDeviceChange && (
            <div>
              <div className="font-roboto text-white/50 text-[11px] uppercase tracking-wider mb-1">
                Модель устройства <span className="text-white/30 normal-case">(необязательно)</span>
              </div>
              <input
                type="text"
                value={device || ""}
                onChange={e => onDeviceChange(e.target.value)}
                placeholder="iPhone 13, Samsung S21..."
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/25"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
