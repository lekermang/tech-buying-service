import { PHASES, PRIORITY_META, effortLabel, type Status, type Task } from "@/data/growthRoadmap";
import type { Meta, Note } from "./useGrowthData";
import StatusButtons from "./StatusButtons";
import { isNextStep, stripNext } from "./NoteText";

type Props = { task: Task; status: Status; meta?: Meta; notes: Note[]; onChange: (s: Status) => void; onOpen: () => void };

export default function TaskCard({ task, status, meta, notes, onChange, onOpen }: Props) {
  const next = notes.find(n => isNextStep(n.text));
  return (
    <div className={`rounded-xl border p-4 ${
      status === "done" ? "border-emerald-500/25 bg-emerald-500/5"
        : status === "progress" ? "border-amber-500/40 bg-amber-500/5"
          : "border-zinc-800 bg-zinc-900/70"
    }`}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5 text-sm">
        {status === "progress" && <span className="font-semibold text-amber-300">В работе{meta?.by ? ` · ${meta.by}` : ""}</span>}
        {status === "done" && <span className="font-semibold text-emerald-300">Сделано{meta?.by ? ` · ${meta.by}` : ""}</span>}
        {status === "todo" && <span className="text-zinc-400">Ждёт исполнителя</span>}
      </div>
      <h3 className={`text-base font-semibold leading-snug ${status === "done" ? "text-zinc-400 line-through" : "text-white"}`}>{task.title}</h3>
      <p className="mt-1 text-sm text-zinc-300 leading-relaxed">{task.desc}</p>
      {next && (
        <div className="mt-2 rounded-lg bg-sky-500/10 ring-1 ring-sky-500/30 px-3 py-2 text-sm text-sky-200">
          <b>Следующий шаг:</b> {stripNext(next.text)}
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-sm">
        <span className={`rounded-md px-2 py-0.5 ring-1 ${PRIORITY_META[task.priority].color}`}>{PRIORITY_META[task.priority].label}</span>
        <span className="rounded-md px-2 py-0.5 bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700">{effortLabel(task.effort)}</span>
        <span className="rounded-md px-2 py-0.5 bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">Шаг {PHASES[task.phase].step}</span>
      </div>
      {task.kpi && <div className="mt-2 text-sm text-zinc-400">Цель: {task.kpi}</div>}
      <div className="mt-3">
        <StatusButtons status={status} onChange={onChange} onOpen={onOpen} notesCount={notes.length} />
      </div>
    </div>
  );
}
