import Icon from "@/components/ui/icon";
import { AvitoProduct, formatPrice } from "../types";

type Props = {
  item: AvitoProduct;
  isReady: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

export default function EditModalHeader({ item, isReady, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  return (
    <div className="shrink-0 flex items-start justify-between gap-2 p-3 border-b border-white/10">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/40 flex items-center justify-center text-white/70 disabled:opacity-30 transition-all shrink-0"
          title="Предыдущий"
        >
          <Icon name="ChevronLeft" size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-oswald font-bold text-white text-sm leading-tight line-clamp-2">{item.title}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-oswald font-bold text-[#FFD700] text-lg">{formatPrice(item.price)}</span>
            {item.category && <span className="text-[10px] text-white/40">· {item.category}</span>}
            {isReady && (
              <span className="bg-emerald-500/20 text-emerald-300 font-roboto text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                <Icon name="CheckCircle2" size={9} />
                Готов
              </span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#FFD700]/70 hover:text-[#FFD700] mt-1 transition-colors"
          >
            <Icon name="ExternalLink" size={10} />
            На Авито
          </a>
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD700]/40 flex items-center justify-center text-white/70 disabled:opacity-30 transition-all shrink-0"
          title="Следующий"
        >
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white shrink-0"
      >
        <Icon name="X" size={18} />
      </button>
    </div>
  );
}
