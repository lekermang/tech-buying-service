import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { PHASES, PRIORITY_META, effortLabel, type Status, type Task } from "@/data/growthRoadmap";
import type { Note } from "./useGrowthData";
import StatusButtons from "./StatusButtons";
import NoteText, { isNextStep } from "./NoteText";

type Props = {
  task: Task; status: Status; notes: Note[];
  onChange: (s: Status) => void;
  onAddNote: (text: string) => Promise<boolean>;
  onClose: () => void;
};

const fmt = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function TaskSheet({ task, status, notes, onChange, onAddNote, onClose }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true); setFailed(false);
    const ok = await onAddNote(t);
    setSending(false);
    if (ok) setText(""); else setFailed(true);
  };

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 100) onClose();
    setDragY(0); startY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full md:max-w-xl max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl bg-zinc-900 border border-zinc-700 animate-in slide-in-from-bottom-8 duration-200"
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragY ? "none" : "transform 0.2s" }}
      >
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="shrink-0 pt-2 pb-1 px-4 cursor-grab">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-600 md:hidden" />
          <div className="mt-2 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-white leading-snug">{task.title}</h2>
            <button onClick={onClose} aria-label="Закрыть"
              className="shrink-0 h-11 w-11 -mr-2 -mt-1 rounded-full inline-flex items-center justify-center text-zinc-300 hover:bg-zinc-800">
              <Icon name="X" size={22} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-5 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{task.desc}</p>
          <div className="flex flex-wrap gap-1.5 text-sm">
            <span className={`rounded-md px-2 py-0.5 ring-1 ${PRIORITY_META[task.priority].color}`}>{PRIORITY_META[task.priority].label}</span>
            <span className="rounded-md px-2 py-0.5 bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700">{effortLabel(task.effort)}</span>
            <span className="rounded-md px-2 py-0.5 bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">Шаг {PHASES[task.phase].step}: {PHASES[task.phase].label}</span>
          </div>
          {task.kpi && <div className="text-sm text-zinc-400">Цель: {task.kpi}</div>}

          <StatusButtons status={status} onChange={onChange} />

          <div className="border-t border-zinc-800 pt-4">
            <label htmlFor="growth-note" className="block text-sm font-semibold text-white mb-2">Написать, что сделано или что дальше</label>
            <textarea
              id="growth-note"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder="Например: Дальше: созвониться с подрядчиком в среду"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400"
            />
            <div className="mt-1 text-sm text-zinc-500">Начните со слова «Дальше:» — и это появится на карточке как следующий шаг.</div>
            {failed && (
              <div className="mt-2 rounded-lg bg-red-500/10 ring-1 ring-red-500/30 px-3 py-2 text-sm text-red-200">
                Не удалось сохранить. Проверьте интернет и нажмите ещё раз.
              </div>
            )}
            <button onClick={send} disabled={sending || !text.trim()}
              className="mt-2 min-h-[44px] w-full sm:w-auto px-5 rounded-lg bg-sky-500 text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40">
              <Icon name={sending ? "Loader" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
              {failed ? "Повторить" : "Добавить"}
            </button>
          </div>

          <div className="space-y-2">
            {notes.length === 0 && <div className="text-sm text-zinc-500">Заметок пока нет. Напишите первую — что уже сделано или что дальше.</div>}
            {notes.map(n => (
              <div key={n.id} className={`rounded-lg px-3 py-2 text-sm ${isNextStep(n.text) ? "bg-sky-500/10 ring-1 ring-sky-500/30 text-sky-100" : "bg-zinc-950/60 ring-1 ring-zinc-800 text-zinc-200"}`}>
                <NoteText text={n.text} />
                <div className="mt-1 text-[13px] text-zinc-500">{n.by} · {fmt(n.at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
