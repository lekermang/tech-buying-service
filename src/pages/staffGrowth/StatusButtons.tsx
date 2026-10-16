import Icon from "@/components/ui/icon";
import type { Status } from "@/data/growthRoadmap";

type Props = { status: Status; onChange: (s: Status) => void; onOpen?: () => void; notesCount?: number };

const BTN = "min-h-[44px] px-4 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition active:scale-[0.98]";

export default function StatusButtons({ status, onChange, onOpen, notesCount = 0 }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "todo" && (
        <button onClick={() => onChange("progress")} className={`${BTN} bg-amber-400 text-zinc-950 hover:bg-amber-300 flex-1 sm:flex-none`}>
          <Icon name="Hand" size={16} /> Беру в работу
        </button>
      )}
      {status === "progress" && (
        <>
          <button onClick={() => onChange("done")} className={`${BTN} bg-emerald-500 text-zinc-950 hover:bg-emerald-400 flex-1 sm:flex-none`}>
            <Icon name="Check" size={16} /> Готово
          </button>
          <button onClick={() => onChange("todo")} className={`${BTN} bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700`}>
            Отложить
          </button>
        </>
      )}
      {status === "done" && (
        <button onClick={() => onChange("progress")} className={`${BTN} bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700`}>
          <Icon name="RotateCcw" size={16} /> Вернуть в работу
        </button>
      )}
      {onOpen && (
        <button onClick={onOpen} className={`${BTN} bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700`}>
          <Icon name="MessageSquareText" size={16} /> Заметки{notesCount > 0 ? ` (${notesCount})` : ""}
        </button>
      )}
    </div>
  );
}
