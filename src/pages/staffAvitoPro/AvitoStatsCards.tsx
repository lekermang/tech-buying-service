import Icon from "@/components/ui/icon";
import { Totals, formatNum } from "./types";

type Props = { totals: Totals };

export default function AvitoStatsCards({ totals }: Props) {
  const cards = [
    { k: "active", l: "Активные", v: totals.active, icon: "CheckCircle2", color: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-300", border: "border-emerald-500/30" },
    { k: "moderation", l: "На модерации", v: totals.moderation, icon: "Clock", color: "from-amber-500/20 to-amber-500/5", text: "text-amber-300", border: "border-amber-500/30" },
    { k: "rejected", l: "Отклонены", v: totals.rejected, icon: "AlertTriangle", color: "from-red-500/20 to-red-500/5", text: "text-red-300", border: "border-red-500/30" },
    { k: "archived", l: "В архиве", v: totals.archived, icon: "Archive", color: "from-white/10 to-white/5", text: "text-white/60", border: "border-white/15" },
    { k: "no_photo", l: "Без фото", v: totals.no_photo, icon: "ImageOff", color: "from-orange-500/20 to-orange-500/5", text: "text-orange-300", border: "border-orange-500/30" },
    { k: "total", l: "Всего", v: totals.total, icon: "Layers", color: "from-[#FFD700]/20 to-[#FFD700]/5", text: "text-[#FFD700]", border: "border-[#FFD700]/30" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {cards.map(c => (
          <div
            key={c.k}
            className={`relative p-3 rounded-lg bg-gradient-to-br ${c.color} border ${c.border} overflow-hidden group hover:scale-[1.02] transition-transform`}
          >
            <Icon name={c.icon} size={14} className={`${c.text} mb-1.5`} />
            <div className={`font-oswald font-bold text-2xl leading-none ${c.text}`}>
              {formatNum(c.v)}
            </div>
            <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wide font-roboto">
              {c.l}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30">
          <Icon name="Eye" size={14} className="text-blue-300 mb-1.5" />
          <div className="font-oswald font-bold text-2xl text-blue-300 leading-none">
            {formatNum(totals.views_total)}
          </div>
          <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wide font-roboto">
            Просмотры (30 дн)
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30">
          <Icon name="Phone" size={14} className="text-violet-300 mb-1.5" />
          <div className="font-oswald font-bold text-2xl text-violet-300 leading-none">
            {formatNum(totals.contacts_total)}
          </div>
          <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wide font-roboto">
            Контакты
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30">
          <Icon name="Heart" size={14} className="text-pink-300 mb-1.5" />
          <div className="font-oswald font-bold text-2xl text-pink-300 leading-none">
            {formatNum(totals.favorites_total)}
          </div>
          <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wide font-roboto">
            В избранном
          </div>
        </div>
      </div>
    </div>
  );
}
