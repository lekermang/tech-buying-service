export type Channel = "call" | "tg" | "max" | "wa";

export const CHANNEL_META: Record<
  Channel,
  { label: string; emoji: string; bg: string; ring: string }
> = {
  call: { label: "Звонок",   emoji: "📞", bg: "bg-blue-500/15 text-blue-300",     ring: "border-blue-500/40" },
  tg:   { label: "Telegram", emoji: "✈️", bg: "bg-sky-500/15 text-sky-300",       ring: "border-sky-500/40" },
  max:  { label: "MAX",      emoji: "💬", bg: "bg-[#2787F5]/15 text-[#76b0ff]",   ring: "border-[#2787F5]/40" },
  wa:   { label: "WhatsApp", emoji: "🟢", bg: "bg-emerald-500/15 text-emerald-300", ring: "border-emerald-500/40" },
};

export const parseChannels = (raw: string | string[] | null | undefined): Channel[] => {
  if (!raw) return [];
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) arr = parsed;
      } catch {
        arr = trimmed.split(",");
      }
    } else {
      arr = trimmed.split(",");
    }
  }
  const out: Channel[] = [];
  for (const v of arr) {
    const k = String(v).trim().toLowerCase();
    if (k === "call" || k === "phone") out.push("call");
    else if (k === "tg" || k === "telegram") out.push("tg");
    else if (k === "max") out.push("max");
    else if (k === "wa" || k === "whatsapp") out.push("wa");
  }
  return Array.from(new Set(out));
};

export const channelHref = (ch: Channel, phone: string): string => {
  const digits = (phone || "").replace(/\D/g, "");
  const e164 = digits.length === 11 ? digits : (digits.length === 10 ? "7" + digits : digits);
  if (ch === "call") return `tel:+${e164}`;
  if (ch === "wa") return `https://wa.me/${e164}`;
  if (ch === "tg") return `https://t.me/+${e164}`;
  if (ch === "max") return `max://u/+${e164}`;
  return "#";
};
