import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { cleanPhone } from "./helpers";

type Props = {
  phone?: string | null;
  message?: string;
  size?: "sm" | "md";
};

export default function C14dContactButtons({ phone, message, size = "sm" }: Props) {
  const d = cleanPhone(phone);
  if (!d) {
    return <div className="text-[10px] text-white/30">Телефон не указан</div>;
  }
  const h = size === "md" ? "py-2 text-[12px]" : "py-1.5 text-[11px]";
  const base = `flex-1 flex items-center justify-center gap-1 rounded-md font-bold uppercase tracking-wide border transition active:scale-[0.97] ${h}`;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const text = encodeURIComponent(message || "");

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`+${d}`);
      toast.success("Номер скопирован");
    } catch {
      toast.message(`+${d}`);
    }
  };

  return (
    <div className="flex gap-1.5">
      <a href={`tel:+${d}`} onClick={stop}
        className={`${base} bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20`}>
        <Icon name="Phone" size={12} /> Позвонить
      </a>
      <a href={`https://wa.me/${d}${text ? `?text=${text}` : ""}`} target="_blank" rel="noreferrer" onClick={stop}
        className={`${base} bg-[#25D366]/10 border-[#25D366]/40 text-[#4ade80] hover:bg-[#25D366]/20`}>
        <Icon name="MessageCircle" size={12} /> WhatsApp
      </a>
      <a href={`https://t.me/+${d}`} target="_blank" rel="noreferrer" onClick={stop}
        className={`${base} bg-sky-500/10 border-sky-500/40 text-sky-300 hover:bg-sky-500/20`}>
        <Icon name="Send" size={12} /> Telegram
      </a>
      <button onClick={copy} title="Скопировать номер"
        className={`${base} flex-none px-2.5 bg-white/5 border-white/15 text-white/60 hover:bg-white/10`}>
        <Icon name="Copy" size={12} />
      </button>
    </div>
  );
}
