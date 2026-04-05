import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const IMPORT_URL = "https://functions.poehali.dev/465711ab-0bef-49fe-b8c4-18c7f3064970";
const SYNC_URL = "https://functions.poehali.dev/8e9219e9-9dcf-4726-a272-69c6ce976b80";

interface Preview {
  article: string;
  name: string;
  brand: string;
  category: string;
}

interface ToolsImportTabProps {
  token: string;
}

const ToolsImportTab = ({ token }: ToolsImportTabProps) => {
  const [count, setCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<Preview[]>([]);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; imported?: number; error?: string } | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    const res = await fetch(`${IMPORT_URL}?token=${token}`);
    const data = await res.json();
    setCount(data.count ?? 0);
    setPreview(data.preview ?? []);
    setHasCredentials(data.has_credentials ?? false);
  };

  useEffect(() => { loadStats(); }, []);

  const pollStatus = async () => {
    const res = await fetch(`${IMPORT_URL}?token=${token}`);
    const data = await res.json();
    setCount(data.count ?? 0);
    setPreview(data.preview ?? []);
    const s = data.sync_status || {};
    if (s.running) {
      setTimeout(pollStatus, 3000);
    } else {
      setSyncing(false);
      if (s.error) setResult({ ok: false, error: s.error });
      else if (s.last != null) setResult({ ok: true, imported: s.last });
    }
  };

  const pollJob = async (jobId: number) => {
    try {
      const res = await fetch(`${SYNC_URL}?token=${token}&job_id=${jobId}`);
      const data = await res.json();
      if (data.status === "running") {
        setTimeout(() => pollJob(jobId), 5000);
      } else if (data.status === "done") {
        setResult({ ok: true, imported: data.imported });
        loadStats();
        setSyncing(false);
      } else {
        setResult({ ok: false, error: data.error || "Неизвестная ошибка" });
        setSyncing(false);
      }
    } catch {
      setTimeout(() => pollJob(jobId), 5000);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch(`${SYNC_URL}?token=${token}&action=start`);
      const data = await res.json();
      if (data.ok && data.job_id) {
        setTimeout(() => pollJob(data.job_id), 5000);
      } else {
        setResult({ ok: false, error: data.error || "Не удалось запустить" });
        setSyncing(false);
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
      setSyncing(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      try {
        const res = await fetch(`${IMPORT_URL}?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, delimiter }),
        });
        const data = await res.json();
        setResult(data.ok ? { ok: true, imported: data.imported } : { ok: false, error: data.error });
        if (data.ok) loadStats();
      } catch (err) {
        setResult({ ok: false, error: String(err) });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 text-white max-w-4xl">
      <div className="mb-6">
        <p className="font-roboto text-white/40 text-xs uppercase tracking-widest mb-1">Импорт данных</p>
        <h2 className="font-oswald text-2xl font-bold uppercase">Наименования товаров</h2>
        <p className="font-roboto text-white/40 text-sm mt-1">
          Загрузите CSV-файл с колонками: <span className="text-white/70">article</span> (артикул) и <span className="text-white/70">name</span> (наименование). Опционально: <span className="text-white/70">brand</span>, <span className="text-white/70">category</span>.
        </p>
      </div>

      {/* Статистика */}
      {count !== null && (
        <div className="flex items-center gap-3 mb-6 p-4 border border-[#FFD700]/20 bg-[#FFD700]/5">
          <Icon name="Database" size={18} className="text-[#FFD700]" />
          <span className="font-roboto text-sm">
            В базе: <span className="text-[#FFD700] font-bold">{count.toLocaleString("ru-RU")}</span> товаров
          </span>
          <button onClick={loadStats} className="ml-auto text-white/30 hover:text-white transition-colors">
            <Icon name="RefreshCw" size={14} />
          </button>
        </div>
      )}

      {/* Автосинхронизация */}
      <div className="border border-[#FFD700]/20 p-4 mb-4 bg-[#FFD700]/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-oswald font-bold text-sm uppercase text-[#FFD700]">Синхронизация с instrument.ru</p>
            <p className="font-roboto text-white/40 text-xs mt-0.5">
              Скачивает фид «Скупка24» с instrument.ru и обновляет все названия товаров
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold uppercase text-sm px-5 py-2.5 hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name={syncing ? "Loader" : "RefreshCw"} size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Загружаю каталог..." : "Синхронизировать"}
          </button>
        </div>
        {result && (
          <div className={`mt-3 flex items-center gap-2 font-roboto text-sm p-2.5 border ${result.ok ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
            <Icon name={result.ok ? "CheckCircle" : "AlertCircle"} size={15} />
            {result.ok ? `Загружено ${result.imported?.toLocaleString("ru-RU")} товаров из instrument.ru` : result.error}
          </div>
        )}
      </div>

      {/* Форма загрузки */}
      <div className="border border-[#333] p-5 mb-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div>
            <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Разделитель</label>
            <div className="flex gap-2">
              {[",", ";", "\t"].map(d => (
                <button key={d} onClick={() => setDelimiter(d)}
                  className={`font-roboto text-sm px-3 py-1.5 border transition-colors ${delimiter === d ? "border-[#FFD700] text-[#FFD700]" : "border-[#333] text-white/40 hover:text-white"}`}>
                  {d === "\t" ? "TAB" : `"${d}"`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className={`flex flex-col items-center justify-center border-2 border-dashed px-8 py-10 cursor-pointer transition-colors ${uploading ? "border-white/10 opacity-50" : "border-[#333] hover:border-[#FFD700]/40"}`}>
          <Icon name={uploading ? "Loader" : "Upload"} size={28} className={`text-white/30 mb-3 ${uploading ? "animate-spin" : ""}`} />
          <span className="font-roboto text-sm text-white/50 mb-1">
            {uploading ? "Загружаю..." : "Нажмите или перетащите файл"}
          </span>
          <span className="font-roboto text-xs text-white/30">CSV (UTF-8 или Windows-1251)</span>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>

      </div>

      {/* Инструкция по формату */}
      <div className="border border-white/5 p-4 mb-6">
        <p className="font-oswald font-bold text-sm uppercase mb-3 text-white/50">Пример формата CSV</p>
        <pre className="font-roboto text-xs text-[#FFD700]/70 bg-[#111] p-3 overflow-x-auto">
{`article,name,brand,category
89551,Молоток слесарный 300г с деревянной ручкой,СИБРТЕХ,Слесарный инструмент
89530,Набор отвёрток 6пр.,SPARTA,Прочий инструмент
89532,Уровень строительный 60см,MATRIX,Измерительный инструмент`}
        </pre>
      </div>

      {/* Предпросмотр данных из БД */}
      {preview.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-[#FFD700]" />
            <p className="font-oswald font-bold text-sm uppercase">Последние записи в базе</p>
          </div>
          <div className="border border-[#FFD700]/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FFD700]/10 border-b border-[#FFD700]/20">
                  {["Артикул", "Наименование", "Бренд", "Категория"].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-oswald font-bold text-xs uppercase tracking-wide text-[#FFD700]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(p => (
                  <tr key={p.article} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-roboto text-xs text-white/60">{p.article}</td>
                    <td className="py-2 px-3 font-roboto text-sm text-white/90">{p.name}</td>
                    <td className="py-2 px-3 font-roboto text-xs text-white/50">{p.brand}</td>
                    <td className="py-2 px-3 font-roboto text-xs text-white/50">{p.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsImportTab;