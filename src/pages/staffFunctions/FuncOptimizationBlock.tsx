import { type FuncStat, FUNC_STATS, OPTIMIZATION_STEPS, ACTIVE_PLAN } from "./functionsData";
import Icon from "@/components/ui/icon";

const STATUS_STYLE: Record<FuncStat["status"], { color: string; label: string; icon: string }> = {
  done: { color: "text-green-400 bg-green-500/10 border-green-500/20", label: "Исправлено", icon: "CheckCircle2" },
  warn: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", label: "Требует внимания", icon: "AlertTriangle" },
  crit: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Критично", icon: "Flame" },
};

const AUTO_STEPS = [
  "Включаю кэш курса золота (10 мин)",
  "Замедляю авто-опрос аналитики",
  "Замедляю опрос чата с сайта (8с)",
  "Замедляю монитор заявок (раз в 3 мин)",
  "Фиксирую оптимальные таймауты",
];

const MANUAL_STEPS = [
  { text: "Выставить таймауты в Ядре: все функции 30с → 10с, золото 60с → 15с", where: "Ядро → Функции → выбрать функцию → Настройки → Таймаут" },
  { text: "Снизить частоту cron у монитора заявок", where: "Ядро → Функции → leads-monitor → Расписание" },
  { text: "Проверить причины ошибок 4xx в repair-admin и slshop", where: "Ядро → Функции → Логи" },
];

interface Props {
  totals: { hours: number; calls: number; fixed: number; total: number };
  sorted: FuncStat[];
  openFn: string | null;
  setOpenFn: (v: string | null) => void;
  analyzing: boolean;
  optBusy: boolean;
  optApplied: boolean;
  optProgress: number;
  showManual: boolean;
  lastRun: string | null;
  onReanalyze: () => void;
  onOptimizeAll: () => void;
}

export default function FuncOptimizationBlock({
  totals, sorted, openFn, setOpenFn,
  analyzing, optBusy, optApplied, optProgress, showManual, lastRun,
  onReanalyze, onOptimizeAll,
}: Props) {
  return (
    <>
      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="font-oswald font-bold text-2xl text-[#FFD700]">{totals.hours}ч</div>
          <div className="font-roboto text-[10px] text-white/40 uppercase tracking-wide mt-0.5">часов / неделю</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="font-oswald font-bold text-2xl text-white">{(totals.calls / 1000).toFixed(1)}k</div>
          <div className="font-roboto text-[10px] text-white/40 uppercase tracking-wide mt-0.5">вызовов / неделю</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="font-oswald font-bold text-2xl text-green-400">{totals.fixed}/{totals.total}</div>
          <div className="font-roboto text-[10px] text-white/40 uppercase tracking-wide mt-0.5">оптимизировано</div>
        </div>
      </div>

      {/* Повторный анализ */}
      <button
        onClick={onReanalyze}
        disabled={analyzing || optBusy}
        className="w-full flex items-center justify-center gap-2 rounded-xl p-3 mb-2.5 bg-white/5 border border-white/10 text-white/80 font-roboto font-semibold text-sm active:scale-[0.99] transition-all disabled:opacity-60"
      >
        <Icon name={analyzing ? "Loader2" : "RefreshCw"} size={17} className={analyzing ? "animate-spin text-[#FFD700]" : "text-[#FFD700]"} />
        {analyzing ? "Анализирую функции…" : "Повторить анализ"}
      </button>

      {lastRun && !analyzing && (
        <div className="text-center font-roboto text-[10.5px] text-white/30 mb-2.5">
          Последняя оптимизация: {new Date(lastRun).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {/* Кнопка «Оптимизировать всё» */}
      <button
        onClick={onOptimizeAll}
        disabled={optBusy || analyzing}
        className={`w-full flex items-center justify-center gap-2.5 rounded-xl p-4 mb-3 font-oswald font-bold text-base uppercase tracking-wide transition-all active:scale-[0.99] ${
          optApplied && !optBusy
            ? "bg-green-500/15 border border-green-500/30 text-green-400"
            : "bg-gradient-to-r from-[#FFD700] to-yellow-600 text-black shadow-lg shadow-yellow-600/20"
        } disabled:opacity-90`}
      >
        {optBusy ? (
          <>
            <Icon name="Loader2" size={20} className="animate-spin" />
            Оптимизирую… {optProgress}/{AUTO_STEPS.length}
          </>
        ) : optApplied ? (
          <>
            <Icon name="RotateCw" size={20} />
            Оптимизировать заново
          </>
        ) : (
          <>
            <Icon name="Zap" size={20} />
            Оптимизировать всё
          </>
        )}
      </button>

      {/* Прогресс автооптимизации */}
      {(optBusy || optApplied) && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 mb-3 space-y-2">
          {AUTO_STEPS.map((s, i) => {
            const done = optApplied || i < optProgress;
            const active = optBusy && i === optProgress;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <Icon
                  name={done ? "CheckCircle2" : active ? "Loader2" : "Circle"}
                  size={15}
                  className={`shrink-0 ${done ? "text-green-400" : active ? "text-[#FFD700] animate-spin" : "text-white/25"}`}
                />
                <span className={`font-roboto text-[12.5px] ${done ? "text-white/70" : "text-white/40"}`}>{s}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Чек-лист ручных шагов */}
      {showManual && (
        <div className="rounded-xl bg-[#FFD700]/5 border border-[#FFD700]/25 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Icon name="ListChecks" size={18} className="text-[#FFD700]" />
            <div className="font-oswald font-bold text-sm text-white uppercase tracking-wide">Осталось сделать вручную в Ядре</div>
          </div>
          <div className="font-roboto text-[11px] text-white/40 mb-3 leading-relaxed">
            Это нельзя изменить из кода — нужно открыть Ядро и поставить значения. Займёт ~3 минуты.
          </div>
          <div className="space-y-2.5">
            {MANUAL_STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#FFD700]/15 text-[#FFD700] flex items-center justify-center shrink-0 mt-0.5 font-oswald font-bold text-[11px]">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-roboto text-[12.5px] text-white/80 leading-snug">{s.text}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Icon name="MapPin" size={11} className="text-[#FFD700]/60 shrink-0" />
                    <span className="font-roboto text-[10.5px] text-[#FFD700]/60">{s.where}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка перехода в Ядро */}
      <a
        href="https://app.poehali.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#FFD700]/15 to-yellow-600/10 border border-[#FFD700]/30 p-3.5 mb-6 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <Icon name="Settings2" size={20} className="text-[#FFD700]" />
          <div>
            <div className="font-roboto font-semibold text-sm text-white">Открыть Ядро · Настроить таймауты</div>
            <div className="font-roboto text-[11px] text-white/40">Ядро → Функции → Настройки</div>
          </div>
        </div>
        <Icon name="ExternalLink" size={16} className="text-white/40" />
      </a>

      {/* Активный план оптимизации */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Target" size={18} className="text-emerald-400" />
          <div className="font-oswald font-bold text-base text-white uppercase tracking-wide">{ACTIVE_PLAN.name}</div>
        </div>
        <div className="font-roboto text-[12px] text-emerald-300/80 font-semibold mb-1">{ACTIVE_PLAN.goal}</div>
        <div className="font-roboto text-[11px] text-white/40 mb-3 leading-relaxed">{ACTIVE_PLAN.subtitle}</div>
        <div className="space-y-1.5">
          {ACTIVE_PLAN.steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Icon
                name={s.done ? "CheckCircle2" : "Circle"}
                size={16}
                className={`shrink-0 mt-0.5 ${s.done ? "text-emerald-400" : "text-white/25"}`}
              />
              <div className="flex-1 min-w-0">
                <div className={`font-roboto text-[12.5px] leading-snug ${s.done ? "text-white/50 line-through" : "text-white/80"}`}>
                  {s.text}
                </div>
                {!s.done && s.hint && (
                  <div className="font-roboto text-[10.5px] text-white/35 mt-0.5">{s.hint}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Список функций */}
      <div className="font-oswald font-bold text-sm text-white/70 uppercase tracking-wide mb-2">Топ функций по нагрузке</div>
      <div className="space-y-2 mb-7">
        {sorted.map((f) => {
          const st = STATUS_STYLE[f.status];
          const isOpen = openFn === f.name;
          return (
            <div key={f.name} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenFn(isOpen ? null : f.name)}
                className="w-full flex items-center gap-3 p-3 text-left active:bg-white/5"
              >
                <Icon name={st.icon} size={18} className={st.color.split(" ")[0]} />
                <div className="flex-1 min-w-0">
                  <div className="font-roboto font-semibold text-sm text-white truncate">{f.label}</div>
                  <div className="font-roboto text-[11px] text-white/40 truncate">{f.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-oswald font-bold text-base text-white">{f.hours}ч</div>
                  {f.errorsPct > 5 && (
                    <div className="font-roboto text-[10px] text-red-400">{f.errorsPct}% ошибок</div>
                  )}
                </div>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 shrink-0" />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-2 my-3">
                    <div className="text-center">
                      <div className="font-oswald font-bold text-sm text-white">{(f.calls / 1000).toFixed(1)}k</div>
                      <div className="text-[9px] text-white/40 uppercase">вызовов</div>
                    </div>
                    <div className="text-center">
                      <div className="font-oswald font-bold text-sm text-white">{f.avgSec}с</div>
                      <div className="text-[9px] text-white/40 uppercase">в среднем</div>
                    </div>
                    <div className="text-center">
                      <div className="font-oswald font-bold text-sm text-[#FFD700]">{f.curTimeout}→{f.recTimeout}с</div>
                      <div className="text-[9px] text-white/40 uppercase">таймаут</div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 mb-2.5 ${st.color}`}>
                    <Icon name={st.icon} size={12} />
                    <span className="font-roboto text-[11px] font-medium">{st.label}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {f.notes.map((n, i) => (
                      <li key={i} className="font-roboto text-[12px] text-white/60 leading-relaxed">{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* План оптимизации */}
      <div className="font-oswald font-bold text-sm text-white/70 uppercase tracking-wide mb-2">План оптимизации</div>
      <div className="space-y-2">
        {OPTIMIZATION_STEPS.map((s, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3.5">
            <div className="font-roboto font-semibold text-sm text-white mb-1">{s.title}</div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon name="MapPin" size={12} className="text-[#FFD700]/70 shrink-0" />
              <span className="font-roboto text-[11px] text-[#FFD700]/70">{s.where}</span>
            </div>
            <div className="font-roboto text-[12px] text-white/50 leading-relaxed">{s.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-green-500/5 border border-green-500/15 p-3.5 flex items-start gap-2.5">
        <Icon name="TrendingDown" size={18} className="text-green-400 shrink-0 mt-0.5" />
        <div className="font-roboto text-[12px] text-white/60 leading-relaxed">
          Цель — снизить потребление на <span className="text-green-400 font-semibold">75–80%</span>. После стабилизации
          расход упадёт в 4–5 раз и тариф можно будет кратно понизить.
        </div>
      </div>
    </>
  );
}
