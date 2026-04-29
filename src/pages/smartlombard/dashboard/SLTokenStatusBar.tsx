import Icon from "@/components/ui/icon";

type Props = {
  tokenError: string;
  tokenTtl: number | null;
  tokenAge: number | null;
  diagLoading: boolean;
  tokenChecking: boolean;
  onRunDiag: () => void;
  onCheckToken: (force: boolean) => void;
};

export function SLTokenStatusBar({
  tokenError, tokenTtl, tokenAge,
  diagLoading, tokenChecking,
  onRunDiag, onCheckToken,
}: Props) {
  return (
    <div className={`rounded-lg p-2.5 border flex items-center justify-between gap-2 ${
      tokenError
        ? "bg-red-500/10 border-red-500/30"
        : tokenTtl !== null && tokenTtl < 120
          ? "bg-orange-500/10 border-orange-500/30"
          : "bg-green-500/5 border-green-500/20"
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          name={tokenError ? "AlertCircle" : "ShieldCheck"}
          size={14}
          className={tokenError ? "text-red-400 shrink-0" : "text-green-400 shrink-0"}
        />
        <div className="min-w-0">
          <div className={`font-oswald font-bold text-[10px] uppercase tracking-wide ${tokenError ? "text-red-300" : "text-green-300"}`}>
            Токен SmartLombard
          </div>
          <div className="font-roboto text-white/60 text-[11px] truncate">
            {tokenError ? (
              tokenError
            ) : tokenTtl !== null ? (
              <>
                Действует ещё <span className="font-bold text-white tabular-nums">{Math.floor(tokenTtl / 60)} мин {tokenTtl % 60} сек</span>
                {tokenAge !== null && <span className="text-white/30 ml-1">(возраст: {Math.floor(tokenAge / 60)}м)</span>}
              </>
            ) : (
              "Проверка..."
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRunDiag}
          disabled={diagLoading}
          title="Диагностика API: что реально вернул SmartLombard"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-500/15 border border-blue-400/40 text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
        >
          <Icon name={diagLoading ? "Loader" : "Bug"} size={11} className={diagLoading ? "animate-spin" : ""} />
          Диагностика
        </button>
        <button
          onClick={() => onCheckToken(true)}
          disabled={tokenChecking}
          title="Принудительно перевыпустить токен (нужно при ошибках авторизации)"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
        >
          <Icon name={tokenChecking ? "Loader" : "RefreshCw"} size={11} className={tokenChecking ? "animate-spin" : ""} />
          Перевыпустить
        </button>
      </div>
    </div>
  );
}

export default SLTokenStatusBar;
