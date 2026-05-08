import Icon from "@/components/ui/icon";

type Props = {
  description: string;
  isVisible: boolean;
  busy: boolean;
  err: string;
  savedTimer: string;
  onDescChange: (v: string) => void;
  toggleVisible: () => void;
};

export default function EditModalForm({ description, isVisible, busy, err, savedTimer, onDescChange, toggleVisible }: Props) {
  return (
    <>
      {/* Описание */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">
            Описание для витрины
          </div>
          <span className="text-[10px] text-white/40">{description.length}/500</span>
        </div>
        <textarea
          value={description}
          onChange={e => onDescChange(e.target.value.slice(0, 500))}
          placeholder="Краткое описание для покупателя: состояние, комплект, что отличает от нового..."
          rows={4}
          className="w-full bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.15)] resize-none transition-all"
        />
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/40">
          <Icon name="Info" size={10} />
          Сохраняется автоматически через секунду после остановки ввода
        </div>
      </div>

      {/* Видимость */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
        <div>
          <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
            <Icon name={isVisible ? "Eye" : "EyeOff"} size={14} className={isVisible ? "text-emerald-400" : "text-white/40"} />
            Показывать на сайте
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {isVisible ? "Виден покупателям на витрине" : "Скрыт с витрины (только в БД)"}
          </div>
        </div>
        <button
          onClick={toggleVisible}
          disabled={busy}
          className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${
            isVisible ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${
              isVisible ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {err && (
        <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 flex items-center gap-1.5">
          <Icon name="AlertCircle" size={12} />
          {err}
        </div>
      )}
      {savedTimer && (
        <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Icon name="CheckCircle2" size={12} />
          {savedTimer}
        </div>
      )}
    </>
  );
}
