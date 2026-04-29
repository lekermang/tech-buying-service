import Icon from "@/components/ui/icon";

type PathInfo = {
  path: string;
  label: string;
  http_status?: number;
  count?: number;
  sample?: unknown[];
  message?: string | null;
  error?: string;
};

type AccountInfo = {
  account_id: string;
  auth_error?: string;
  paths?: PathInfo[];
};

type Props = {
  data: Record<string, unknown> | null;
  loading: boolean;
  onRun: () => void;
  onClose: () => void;
};

export function SLAccountCheckPanel({ data, loading, onRun, onClose }: Props) {
  const accounts = ((data?.accounts as AccountInfo[]) || []);
  const totalItems = accounts.reduce((s, a) =>
    s + (a.paths || []).reduce((ss, p) => ss + (p.count || 0), 0), 0);

  return (
    <div className="bg-purple-500/5 border border-purple-400/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-oswald font-bold text-purple-300 text-[11px] uppercase flex items-center gap-1.5">
          <Icon name="Database" size={12} />
          Что есть в аккаунте SmartLombard
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-purple-500/15 border border-purple-400/40 text-purple-200 hover:bg-purple-500/25 active:scale-95 transition-all font-oswald font-bold text-[10px] uppercase disabled:opacity-50"
          >
            <Icon name={loading ? "Loader" : "Search"} size={11} className={loading ? "animate-spin" : ""} />
            {data ? "Перепроверить" : "Проверить"}
          </button>
          {data && (
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
      </div>

      {!data && (
        <div className="font-roboto text-white/50 text-[11px] leading-relaxed">
          Опросит у SmartLombard филиалы, сотрудников, клиентов, билеты и категории —
          чтобы понять, есть ли в аккаунте вообще какие-то данные. Безопасно (только чтение).
        </div>
      )}

      {data && (
        <>
          <div className={`rounded p-2 text-[11px] ${
            totalItems === 0
              ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-200"
              : "bg-green-500/10 border border-green-500/30 text-green-200"
          }`}>
            {totalItems === 0
              ? "В аккаунте не найдено ни одной записи. Скорее всего это пустой/демо-аккаунт SmartLombard."
              : `Найдено ${totalItems} записей в справочниках. Аккаунт рабочий!`}
          </div>

          <div className="space-y-2">
            {accounts.map((acc, i) => (
              <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white/70 text-[11px]">#{acc.account_id}</span>
                  {acc.auth_error && (
                    <span className="text-red-300 text-[10px]">авторизация не прошла</span>
                  )}
                </div>
                {acc.auth_error && (
                  <div className="text-red-300/80 text-[10px] break-words">{acc.auth_error}</div>
                )}
                {acc.paths && (
                  <div className="grid grid-cols-1 gap-1">
                    {acc.paths.map((p, j) => {
                      const isOk = (p.count || 0) > 0;
                      const isEmpty = !p.error && p.count === 0;
                      return (
                        <div key={j} className={`flex items-center justify-between gap-2 px-2 py-1 rounded text-[10px] border ${
                          isOk ? "bg-green-500/10 border-green-500/30" :
                          isEmpty ? "bg-yellow-500/5 border-yellow-500/20" :
                          "bg-red-500/10 border-red-500/30"
                        }`}>
                          <span className="text-white/70 shrink-0">{p.label}</span>
                          <span className={`font-bold tabular-nums ${
                            isOk ? "text-green-300" :
                            isEmpty ? "text-yellow-300" :
                            "text-red-300"
                          }`}>
                            {p.error
                              ? p.error.slice(0, 40)
                              : p.message
                                ? p.message.slice(0, 40)
                                : `${p.count ?? 0} шт.`}
                            <span className="text-white/30 ml-1">[{p.http_status}]</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <details className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-md p-2">
            <summary className="text-white/50 text-[10px] cursor-pointer uppercase">Сырой JSON</summary>
            <pre className="font-mono text-[10px] text-white/70 whitespace-pre-wrap break-all max-h-[200px] overflow-auto mt-2">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

export default SLAccountCheckPanel;
