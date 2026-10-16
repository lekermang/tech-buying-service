import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import {
  TASKS, PHASES, PRIORITY_META, KPI_TARGETS, RISKS, TEAM,
  type Phase, type Priority, type Status, type Task,
} from "@/data/growthRoadmap";

const URL = (funcUrls as Record<string, string>)["growth-roadmap"];
const NEXT: Record<Status, Status> = { todo: "progress", progress: "done", done: "todo" };
const STATUS_LABEL: Record<Status, string> = { todo: "в очереди", progress: "в работе", done: "сделано" };

type Meta = { status: Status; by: string; at: string | null };
type LogRow = { task_id: string; from: string | null; to: string; by: string; at: string };

const fmtAt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

function StatusIcon({ s }: { s: Status }) {
  if (s === "done") return <Icon name="CheckCircle2" size={20} className="text-emerald-400 shrink-0" />;
  if (s === "progress") return <Icon name="Loader2" size={20} className="text-amber-400 shrink-0 animate-spin [animation-duration:3s]" />;
  return <Icon name="Circle" size={20} className="text-zinc-500 shrink-0" />;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ring-1 whitespace-nowrap ${
        active ? "bg-white text-zinc-900 ring-white" : "bg-zinc-800/60 text-zinc-300 ring-zinc-700 hover:bg-zinc-700"
      }`}>
      {children}
    </button>
  );
}

export default function GrowthRoadmap({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [log, setLog] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [hideDone, setHideDone] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(URL, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка загрузки");
      setMeta(d.statuses || {});
      setLog(d.log || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const st = useCallback((t: Task): Status => meta[t.id]?.status ?? "todo", [meta]);

  const toggle = async (t: Task) => {
    const prev = meta[t.id];
    const next = NEXT[st(t)];
    setMeta(m => ({ ...m, [t.id]: { status: next, by: "вы", at: new Date().toISOString() } }));
    try {
      const r = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ task_id: t.id, status: next }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Не сохранилось");
      setMeta(m => ({ ...m, [t.id]: { status: next, by: d.by || "", at: new Date().toISOString() } }));
      setLog(l => [{ task_id: t.id, from: prev?.status || "todo", to: next, by: d.by || "", at: new Date().toISOString() }, ...l].slice(0, 30));
    } catch (e) {
      setMeta(m => {
        const c = { ...m };
        if (prev) c[t.id] = prev; else delete c[t.id];
        return c;
      });
      setError(e instanceof Error ? e.message : "Не сохранилось");
      setTimeout(() => setError(""), 3000);
    }
  };

  const reset = async () => {
    if (!window.confirm("Сбросить прогресс всего плана для всей команды?")) return;
    const r = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "reset" }),
    });
    if (r.ok) load();
  };

  const total = TASKS.length;
  const done = TASKS.filter(t => st(t) === "done").length;
  const inProgress = TASKS.filter(t => st(t) === "progress").length;
  const pct = Math.round((done / total) * 100);

  const phaseStats = useMemo(() => (Object.keys(PHASES) as Phase[]).map(p => {
    const list = TASKS.filter(t => t.phase === p);
    const d = list.filter(t => st(t) === "done").length;
    const pr = list.filter(t => st(t) === "progress").length;
    return { p, total: list.length, done: d, progress: pr, pct: list.length ? Math.round((d / list.length) * 100) : 0 };
  }), [st]);

  const visible = useMemo(() => TASKS.filter(t =>
    (phase === "all" || t.phase === phase) &&
    (priority === "all" || t.priority === priority) &&
    (!hideDone || st(t) !== "done"),
  ), [phase, priority, hideDone, st]);

  const grouped = useMemo(() => {
    const m = new Map<string, Task[]>();
    visible.forEach(t => m.set(t.module, [...(m.get(t.module) || []), t]));
    return [...m.entries()];
  }, [visible]);

  const nowFocus = useMemo(() => TASKS.filter(t => st(t) === "progress"), [st]);
  const taskTitle = (id: string) => TASKS.find(t => t.id === id)?.title || id;

  return (
    <div className="space-y-4 text-zinc-100 p-3 md:p-4 pb-24">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-fuchsia-950/40 p-4 md:p-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-300 ring-1 ring-fuchsia-500/30">
              <Icon name="Rocket" size={14} /> План развития Staff
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Центр управления ростом</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Staff‑панель → центр продаж, качества, цен и масштабирования. Нажмите на задачу, чтобы сменить статус: очередь → в работе → сделано. Прогресс общий для всей команды.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-zinc-400">
              {["Модульность", "Аудит", "SLA и realtime", "Роли и доступы", "Интеграции"].map(p => (
                <span key={p} className="rounded-md bg-zinc-800/80 px-2 py-1 ring-1 ring-zinc-700">{p}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 md:h-28 md:w-28">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#27272a" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="url(#growthGrad)" strokeWidth="3"
                  strokeDasharray={`${pct} 100`} strokeLinecap="round" className="transition-all duration-700" />
                <defs>
                  <linearGradient id="growthGrad"><stop offset="0%" stopColor="#d946ef" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{pct}%</span>
                <span className="text-[10px] text-zinc-500">готово</span>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="font-semibold text-emerald-400">{done}</span> <span className="text-zinc-500">сделано</span></div>
              <div><span className="font-semibold text-amber-400">{inProgress}</span> <span className="text-zinc-500">в работе</span></div>
              <div><span className="font-semibold">{total - done - inProgress}</span> <span className="text-zinc-500">в очереди</span></div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />{error}
        </div>
      )}

      {nowFocus.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
            <Icon name="Flame" size={15} /> Сейчас в работе
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nowFocus.map(t => (
              <span key={t.id} className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-200 ring-1 ring-amber-500/30">
                {t.title}{meta[t.id]?.by ? <span className="text-amber-200/50"> · {meta[t.id].by}</span> : null}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="flex md:grid gap-2 md:grid-cols-5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {phaseStats.map(({ p, total: t, done: d, progress: pr, pct: pp }, i) => (
          <button key={p} onClick={() => setPhase(phase === p ? "all" : p)}
            className={`snap-start min-w-[170px] md:min-w-0 rounded-xl border p-3 text-left transition ${
              phase === p ? "border-fuchsia-500/60 bg-fuchsia-500/10" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
            }`}>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Этап {i}</span><span>{PHASES[p].range}</span>
            </div>
            <div className="mt-1 font-semibold">{PHASES[p].label}</div>
            <div className="text-xs text-zinc-400 leading-snug">{PHASES[p].goal}</div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-400 transition-all" style={{ width: `${pp}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">{d}/{t} задач{pr > 0 ? ` · ${pr} в работе` : ""}</div>
          </button>
        ))}
      </section>

      <section className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 overflow-x-auto">
        <Icon name="Filter" size={15} className="text-zinc-500 shrink-0" />
        <Chip active={priority === "all"} onClick={() => setPriority("all")}>Все</Chip>
        {(Object.keys(PRIORITY_META) as Priority[]).map(p => (
          <Chip key={p} active={priority === p} onClick={() => setPriority(priority === p ? "all" : p)}>{PRIORITY_META[p].label}</Chip>
        ))}
        <div className="mx-1 h-5 w-px bg-zinc-700 shrink-0" />
        <Chip active={hideDone} onClick={() => setHideDone(v => !v)}>Скрыть сделанное</Chip>
        <Chip active={showLog} onClick={() => setShowLog(v => !v)}>Журнал</Chip>
        {isOwner && (
          <button onClick={reset} className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 shrink-0 pl-2">
            <Icon name="RotateCcw" size={13} /> Сбросить
          </button>
        )}
      </section>

      {showLog && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon name="History" size={15} className="text-sky-400" />Кто и когда менял</div>
          {log.length === 0 && <div className="text-xs text-zinc-500">Изменений пока нет</div>}
          <ul className="divide-y divide-zinc-800">
            {log.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                <span className="min-w-0 truncate text-zinc-300">
                  {l.task_id === "*" ? "План сброшен" : taskTitle(l.task_id)}
                  {l.task_id !== "*" && <span className="text-zinc-500"> → {STATUS_LABEL[l.to as Status] || l.to}</span>}
                </span>
                <span className="shrink-0 text-zinc-500">{l.by} · {fmtAt(l.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-zinc-500">
          <Icon name="Loader" size={18} className="animate-spin" /> Загружаю план...
        </div>
      ) : (
        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {grouped.map(([module, list]) => (
            <div key={module} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-semibold">{module}</h3>
                <span className="text-xs text-zinc-500">{list.filter(t => st(t) === "done").length}/{list.length}</span>
              </div>
              <ul className="space-y-2">
                {list.map(t => {
                  const s = st(t);
                  const m = meta[t.id];
                  return (
                    <li key={t.id} onClick={() => toggle(t)}
                      className={`cursor-pointer select-none rounded-lg border p-3 transition active:scale-[0.99] ${
                        s === "done" ? "border-emerald-500/20 bg-emerald-500/5 opacity-70"
                          : s === "progress" ? "border-amber-500/30 bg-amber-500/5"
                            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-600"
                      }`}>
                      <div className="flex items-start gap-3">
                        <StatusIcon s={s} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-sm font-medium ${s === "done" ? "line-through" : ""}`}>{t.title}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${PRIORITY_META[t.priority].color}`}>
                              {PRIORITY_META[t.priority].label}
                            </span>
                            <span className="text-[10px] text-zinc-500">{PHASES[t.phase].label}</span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">{t.desc}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                            <span className="inline-flex gap-0.5" title={`Сложность ${t.effort} из 5`}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Icon key={i} name="Flame" size={12} className={i < t.effort ? "text-orange-400" : "text-zinc-700"} />
                              ))}
                            </span>
                            {t.kpi && <span className="inline-flex items-center gap-1"><Icon name="Target" size={12} />{t.kpi}</span>}
                            {m && s !== "todo" && m.by && <span className="ml-auto">{m.by} · {fmtAt(m.at)}</span>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
              Нет задач по выбранным фильтрам
            </div>
          )}
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="mb-2.5 inline-flex items-center gap-2 font-semibold"><Icon name="TrendingUp" size={16} className="text-sky-400" /> KPI успеха</h3>
          <ul className="space-y-2">
            {KPI_TARGETS.map(k => (
              <li key={k.key} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950/50 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm">{k.label}</div>
                  <div className="text-[11px] text-zinc-500">{k.note}</div>
                </div>
                <span className="shrink-0 rounded-md bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/30">{k.target}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="mb-2.5 inline-flex items-center gap-2 font-semibold"><Icon name="ShieldAlert" size={16} className="text-red-400" /> Риски и защита</h3>
          <ul className="space-y-2">
            {RISKS.map(r => (
              <li key={r.risk} className="rounded-lg bg-zinc-950/50 px-3 py-2">
                <div className="text-sm text-red-300">{r.risk}</div>
                <div className="text-[11px] text-zinc-400">→ {r.fix}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="mb-2.5 inline-flex items-center gap-2 font-semibold"><Icon name="Users" size={16} className="text-emerald-400" /> Команда</h3>
          <div className="flex flex-wrap gap-1.5">
            {TEAM.map(t => <span key={t} className="rounded-md bg-zinc-800 px-2 py-1 text-xs ring-1 ring-zinc-700">{t}</span>)}
          </div>
          <div className="mt-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-200 leading-relaxed">
            <b>Быстрые шаги сейчас:</b> MVP (дашборд + канбан заявок + звонки) за 30 дней, параллельно копить фото и цены сделок для будущего оценщика.
          </div>
        </div>
      </section>
    </div>
  );
}
