import Icon from "@/components/ui/icon";

interface Props {
  aiEnabled: boolean | null;
  aiBusy: boolean;
  onToggle: () => void;
}

export default function AiToggleBlock({ aiEnabled, aiBusy, onToggle }: Props) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aiEnabled ? "bg-green-500/15" : "bg-white/10"}`}>
          <Icon name="Bot" size={20} className={aiEnabled ? "text-green-400" : "text-white/40"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-roboto font-semibold text-sm text-white">ИИ-ответы клиентам</div>
          <div className="font-roboto text-[11px] text-white/40">
            {aiEnabled === null ? "Загрузка..." : aiEnabled
              ? "Бот отвечает клиентам в чате с сайта и MAX, пока менеджер молчит"
              : "Автоответы выключены — отвечают только сотрудники"}
          </div>
        </div>
        <button
          onClick={onToggle}
          disabled={aiEnabled === null || aiBusy}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${aiEnabled ? "bg-green-500" : "bg-white/20"}`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${aiEnabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
    </div>
  );
}
