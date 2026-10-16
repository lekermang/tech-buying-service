import Icon from "@/components/ui/icon";
import { useGoldNews } from "./useGoldNews";

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "Europe/Moscow" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  return `${date} ${time}`;
};

export default function GoldNewsList({ enabled, className = "" }: { enabled: boolean; className?: string }) {
  const { items, loading } = useGoldNews(enabled);
  if (!loading && items.length === 0) return null;

  return (
    <div className={className}>
      <div className="font-oswald font-bold text-[10px] uppercase tracking-wider text-[#FFD700]/70 mb-1.5 flex items-center gap-1.5">
        <Icon name="Newspaper" size={11} />
        Новости по золоту
      </div>
      {loading && items.length === 0 && (
        <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-roboto">
          <Icon name="Loader" size={11} className="animate-spin" />Загружаю новости...
        </div>
      )}
      <div className="divide-y divide-white/5">
        {items.map(n => (
          <a key={n.url + n.ts} href={n.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 py-1 group min-w-0">
            <span className="font-oswald font-bold text-[10px] text-[#FFD700]/70 tabular-nums whitespace-nowrap shrink-0">{fmtWhen(n.ts)}</span>
            <span className="font-roboto text-[11px] text-white/80 group-hover:text-[#FFD700] truncate transition-colors">{n.title}</span>
            <span className="hidden sm:inline font-roboto text-[9px] text-white/30 shrink-0 ml-auto">{n.source}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
