import Icon from "@/components/ui/icon";
import { Stats } from "./types";

type Props = {
  stats: Stats;
  progress: number;
  syncing: boolean;
  msg: { type: "ok" | "err"; text: string } | null;
  onOpenHelper: () => void;
  onRunSync: () => void;
};

export default function SLAvitoHeader({ stats, progress, syncing, msg, onOpenHelper, onRunSync }: Props) {
  return (
    <>
      {/* Шапка с прогрессом */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 p-3 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FFD700]/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

        <div className="relative flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
              <Icon name="Sparkles" size={18} className="text-black drop-shadow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-oswald font-bold uppercase text-[14px] tracking-[0.04em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#FFE34D] to-[#FFD700] bg-clip-text text-transparent">
                Витрина Авито
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                Загрузи фото с телефона — товары появятся в премиум-карточках на сайте
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-1.5">
            <button
              onClick={onOpenHelper}
              disabled={stats.no_photos === 0}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-violet-500 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)] text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-40 transition-all"
              title="Открыть инструкцию по авто-загрузке фото с Авито"
            >
              <Icon name="Wand2" size={14} />
              🪄 Авто-загрузка фото
            </button>
            <button
              onClick={onRunSync}
              disabled={syncing}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFE55C] hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-50 transition-all"
            >
              <Icon name={syncing ? "Loader2" : "RefreshCw"} size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Синхронизирую..." : "Обновить список"}
            </button>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="relative mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50 font-roboto uppercase tracking-wide">
              Готовность витрины
            </span>
            <span className="font-oswald font-bold text-[11px] text-[#FFD700]">{progress}%</span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#b8860b] via-[#FFD700] to-[#FFE34D] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/55 font-roboto">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <b className="text-emerald-400">{stats.with_photos}</b> готовы
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <b className="text-orange-400">{stats.no_photos}</b> ждут фото
            </span>
            <span>всего {stats.total_active}</span>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}
        >
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}
    </>
  );
}
