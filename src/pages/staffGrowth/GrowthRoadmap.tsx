import { useCallback, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  TASKS, PHASES, PHASE_ORDER, PRIORITY_META, GOALS, RISKS,
  type Phase, type Priority, type Status, type Task,
} from "@/data/growthRoadmap";
import { useGrowthData, type Note } from "./useGrowthData";
import TaskCard from "./TaskCard";
import TaskSheet from "./TaskSheet";
import Onboarding from "./Onboarding";
import BottomToast, { type ToastData } from "./BottomToast";

const ONBOARD_KEY = "staff.growth.onboarded.v1";
const STATUS_WORD: Record<Status, string> = { todo: "возвращена в очередь", progress: "взята в работу", done: "отмечена как сделанная" };

const fmtAt = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function GrowthRoadmap({ token, isOwner }: { token: string; isOwner: boolean }) {
  const { meta, log, notes, me, state, load, setStatus, addNote } = useGrowthData(token);
  const [onboard, setOnboard] = useState(() => {
    try { return !localStorage.getItem(ONBOARD_KEY); } catch { return false; }
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [phaseSel, setPhaseSel] = useState<Phase | null>(null);
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [showDone, setShowDone] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  const st = useCallback((t: Task): Status => meta[t.id]?.status ?? "todo", [meta]);

  const currentPhase: Phase = useMemo(
    () => PHASE_ORDER.find(p => TASKS.some(t => t.phase === p && st(t) !== "done")) ?? "p4",
    [st],
  );
  const phase = phaseSel ?? currentPhase;

  const notesBy = useMemo(() => {
    const m: Record<string, Note[]> = {};
    notes.forEach(n => { (m[n.task_id] ||= []).push(n); });
    return m;
  }, [notes]);

  const nextTask = useMemo(() => {
    const order: Priority[] = ["critical", "security", "ops", "analytics", "growth"];
    return TASKS
      .filter(t => t.phase === currentPhase && st(t) === "todo")
      .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority) || a.effort - b.effort)[0];
  }, [currentPhase, st]);

  const myTasks = useMemo(
    () => TASKS.filter(t => st(t) === "progress" && meta[t.id]?.by && meta[t.id].by === me),
    [st, meta, me],
  );

  const inPhase = TASKS.filter(t => t.phase === phase && (priority === "all" || t.priority === priority));
  const myIds = new Set(myTasks.map(t => t.id));
  const active = inPhase.filter(t => st(t) !== "done" && !myIds.has(t.id))
    .sort((a, b) => (st(a) === "progress" ? 0 : 1) - (st(b) === "progress" ? 0 : 1));
  const doneList = inPhase.filter(t => st(t) === "done");

  const total = TASKS.length;
  const doneAll = TASKS.filter(t => st(t) === "done").length;
  const pct = Math.round((doneAll / total) * 100);
  const phaseTasks = TASKS.filter(t => t.phase === phase);
  const phaseDone = phaseTasks.filter(t => st(t) === "done").length;

  const change = async (task: Task, next: Status, silent = false) => {
    const prev = st(task);
    const ok = await setStatus(task.id, next);
    if (!ok) {
      setToast({ id: Date.now(), tone: "error", text: "Не удалось сохранить. Проверьте интернет и нажмите ещё раз.", action: { label: "Повторить", run: () => change(task, next, silent) }, ttl: 8000 });
      return;
    }
    if (silent) return;
    setToast({
      id: Date.now(),
      text: `Задача «${task.title}» ${STATUS_WORD[next]}.`,
      action: { label: "Отменить", run: () => change(task, prev, true) },
    });
  };

  const closeOnboard = () => {
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch { /* ignore */ }
    setOnboard(false);
  };

  const taskTitle = (id: string) => TASKS.find(t => t.id === id)?.title || "Задача";
  const openTask = openId ? TASKS.find(t => t.id === openId) : null;
  const dismissToast = useCallback(() => setToast(null), []);

  if (state === "forbidden") {
    return (
      <div className="p-6 flex flex-col items-center text-center gap-3 py-20">
        <Icon name="Lock" size={32} className="text-zinc-500" />
        <div className="text-lg font-semibold text-white">Раздел недоступен</div>
        <p className="text-sm text-zinc-400 max-w-sm">Этот раздел доступен владельцу и администратору. Если он нужен вам — попросите доступ у владельца.</p>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-zinc-400 text-sm">
        <Icon name="Loader" size={18} className="animate-spin" /> Загружаю план...
      </div>
    );
  }

  if (state === "offline") {
    return (
      <div className="p-6 flex flex-col items-center text-center gap-3 py-20">
        <Icon name="WifiOff" size={32} className="text-zinc-500" />
        <div className="text-lg font-semibold text-white">Не удалось загрузить план</div>
        <p className="text-sm text-zinc-400">Проверьте интернет и нажмите ещё раз.</p>
        <button onClick={load} className="min-h-[48px] px-6 rounded-lg bg-white text-zinc-950 font-semibold">Повторить</button>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 pb-28 space-y-4 text-zinc-100 max-w-3xl mx-auto">
      {onboard && <Onboarding onClose={closeOnboard} />}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white">План развития</h1>
            <p className="text-sm text-zinc-400">Сделано {doneAll} из {total} задач</p>
          </div>
          <button onClick={() => setOnboard(true)} aria-label="Как пользоваться"
            className="shrink-0 min-h-[44px] px-3 rounded-lg text-sm text-zinc-300 ring-1 ring-zinc-700 inline-flex items-center gap-1.5">
            <Icon name="CircleHelp" size={16} /> Как пользоваться
          </button>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {nextTask ? (
        <section className="rounded-2xl border-2 border-amber-400/60 bg-amber-400/10 p-4">
          <div className="text-sm font-semibold text-amber-300 mb-1">Что делать сейчас</div>
          <h2 className="text-lg font-bold text-white leading-snug">{nextTask.title}</h2>
          <p className="mt-1 text-sm text-zinc-300">{nextTask.desc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => change(nextTask, "progress")}
              className="min-h-[48px] flex-1 sm:flex-none px-6 rounded-lg bg-amber-400 text-zinc-950 text-base font-bold inline-flex items-center justify-center gap-2">
              <Icon name="Hand" size={18} /> Беру
            </button>
            <button onClick={() => setOpenId(nextTask.id)}
              className="min-h-[48px] px-4 rounded-lg bg-zinc-800 text-zinc-200 text-sm ring-1 ring-zinc-700">
              Подробнее
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Все задачи шага {PHASES[currentPhase].step} уже взяты в работу. Отметьте «Готово», когда закончите.
        </section>
      )}

      {myTasks.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-2">Мои задачи в работе</h2>
          <div className="space-y-3">
            {myTasks.map(t => (
              <TaskCard key={t.id} task={t} status={st(t)} meta={meta[t.id]} notes={notesBy[t.id] || []}
                onChange={s => change(t, s)} onOpen={() => setOpenId(t.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">Шаг {PHASES[phase].step}: {PHASES[phase].label}</h2>
            <p className="text-sm text-zinc-400">{PHASES[phase].when} · сделано {phaseDone} из {phaseTasks.length}</p>
          </div>
          <button onClick={() => setFiltersOpen(v => !v)}
            className={`shrink-0 min-h-[44px] px-3 rounded-lg text-sm inline-flex items-center gap-1.5 ring-1 ${filtersOpen ? "bg-white text-zinc-950 ring-white" : "text-zinc-200 ring-zinc-700"}`}>
            <Icon name="SlidersHorizontal" size={16} /> Фильтры
          </button>
        </div>

        {filtersOpen && (
          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-3">
            <div>
              <div className="text-sm text-zinc-400 mb-1.5">Какой шаг показать</div>
              <div className="flex flex-col gap-1.5">
                {PHASE_ORDER.map(p => {
                  const list = TASKS.filter(t => t.phase === p);
                  const d = list.filter(t => st(t) === "done").length;
                  const sel = phase === p;
                  return (
                    <button key={p} onClick={() => setPhaseSel(p === currentPhase ? null : p)}
                      className={`min-h-[44px] px-3 rounded-lg text-left text-sm flex items-center justify-between gap-2 ring-1 ${sel ? "bg-white text-zinc-950 ring-white" : "bg-zinc-950/50 text-zinc-200 ring-zinc-800"}`}>
                      <span>Шаг {PHASES[p].step}: {PHASES[p].label}{p === currentPhase ? " (текущий)" : ""}</span>
                      <span className={sel ? "text-zinc-600" : "text-zinc-500"}>{d}/{list.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1.5">Тип задач</div>
              <div className="flex flex-wrap gap-1.5">
                {(["all", ...Object.keys(PRIORITY_META)] as (Priority | "all")[]).map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`min-h-[44px] px-3 rounded-lg text-sm ring-1 ${priority === p ? "bg-white text-zinc-950 ring-white" : "text-zinc-200 ring-zinc-700"}`}>
                    {p === "all" ? "Все" : PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {active.map(t => (
            <TaskCard key={t.id} task={t} status={st(t)} meta={meta[t.id]} notes={notesBy[t.id] || []}
              onChange={s => change(t, s)} onOpen={() => setOpenId(t.id)} />
          ))}
          {active.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400">
              В этом шаге всё сделано. Откройте «Фильтры», чтобы посмотреть следующий шаг.
            </div>
          )}
        </div>

        {doneList.length > 0 && (
          <div className="mt-3">
            <button onClick={() => setShowDone(v => !v)}
              className="w-full min-h-[48px] px-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-200 flex items-center justify-between">
              <span>Сделано: {doneList.length} {doneList.length === 1 ? "задача" : doneList.length < 5 ? "задачи" : "задач"}</span>
              <Icon name={showDone ? "ChevronUp" : "ChevronDown"} size={18} />
            </button>
            {showDone && (
              <div className="mt-3 space-y-3">
                {doneList.map(t => (
                  <TaskCard key={t.id} task={t} status="done" meta={meta[t.id]} notes={notesBy[t.id] || []}
                    onChange={s => change(t, s)} onOpen={() => setOpenId(t.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <button onClick={() => setShowLog(v => !v)}
          className="w-full min-h-[48px] px-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-200 flex items-center justify-between">
          <span className="inline-flex items-center gap-2"><Icon name="History" size={16} /> Кто и когда что менял</span>
          <Icon name={showLog ? "ChevronUp" : "ChevronDown"} size={18} />
        </button>
        {showLog && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            {log.length === 0 ? (
              <p className="text-sm text-zinc-400">Пока никто ничего не менял. Начните с задачи выше.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {log.map((l, i) => (
                  <li key={i} className="py-2 text-sm">
                    <div className="text-zinc-200">
                      {l.task_id === "*" ? "План сброшен" : `«${taskTitle(l.task_id)}» ${STATUS_WORD[l.to as Status] || ""}`}
                    </div>
                    <div className="text-zinc-500">{l.by} · {fmtAt(l.at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button onClick={() => setShowGoals(v => !v)}
          className="w-full min-h-[48px] px-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-sm text-zinc-200 flex items-center justify-between">
          <span className="inline-flex items-center gap-2"><Icon name="Target" size={16} /> К чему стремимся и чего опасаемся</span>
          <Icon name={showGoals ? "ChevronUp" : "ChevronDown"} size={18} />
        </button>
        {showGoals && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Цели</h3>
              <ul className="space-y-2">
                {GOALS.map(g => (
                  <li key={g.label} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-950/50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-200">{g.label}</div>
                      <div className="text-[13px] text-zinc-500">{g.note}</div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-sky-300">{g.target}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Что может помешать</h3>
              <ul className="space-y-2">
                {RISKS.map(r => (
                  <li key={r.risk} className="rounded-lg bg-zinc-950/50 px-3 py-2">
                    <div className="text-sm text-red-300">{r.risk}</div>
                    <div className="text-[13px] text-zinc-400">Что делаем: {r.fix}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {isOwner && <div className="text-center text-[13px] text-zinc-600">Прогресс общий для всей команды</div>}

      {openTask && (
        <TaskSheet
          task={openTask}
          status={st(openTask)}
          notes={notesBy[openTask.id] || []}
          onChange={s => change(openTask, s)}
          onAddNote={text => addNote(openTask.id, text)}
          onClose={() => setOpenId(null)}
        />
      )}

      <BottomToast toast={toast} onDone={dismissToast} />
    </div>
  );
}