import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { FUNC_STATS, OPTIMIZATION_STEPS, type FuncStat } from "./functionsData";

const STATUS_STYLE: Record<FuncStat["status"], { color: string; label: string; icon: string }> = {
  done: { color: "text-green-400 bg-green-500/10 border-green-500/20", label: "Исправлено", icon: "CheckCircle2" },
  warn: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", label: "Требует внимания", icon: "AlertTriangle" },
  crit: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Критично", icon: "Flame" },
};

export default function StaffFunctionsTab() {
  const [openFn, setOpenFn] = useState<string | null>(null);

  const totals = useMemo(() => {
    const hours = FUNC_STATS.reduce((s, f) => s + f.hours, 0);
    const calls = FUNC_STATS.reduce((s, f) => s + f.calls, 0);
    const fixed = FUNC_STATS.filter((f) => f.status === "done").length;
    return { hours: Math.round(hours), calls, fixed, total: FUNC_STATS.length };
  }, []);

  const sorted = useMemo(() => [...FUNC_STATS].sort((a, b) => b.hours - a.hours), []);

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center">
          <Icon name="Cpu" size={22} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-bold text-lg text-white uppercase tracking-wide">Функции и потребление</div>
          <div className="font-roboto text-xs text-white/40">Только для владельца · мониторинг и оптимизация</div>
        </div>
      </div>

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
            <div className="font-roboto font-semibold text-sm text-white">Настроить таймауты</div>
            <div className="font-roboto text-[11px] text-white/40">Ядро → Функции → Настройки</div>
          </div>
        </div>
        <Icon name="ExternalLink" size={16} className="text-white/40" />
      </a>

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
    </div>
  );
}
