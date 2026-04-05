import { useState } from "react";
import Icon from "@/components/ui/icon";

const SYNC_URL = "https://functions.poehali.dev/8e9219e9-9dcf-4726-a272-69c6ce976b80";
const CHUNK_SIZE = 500;

interface ChunkResult {
  offset: number;
  saved: number;
  has_more: boolean;
  next_offset: number | null;
}

interface LogLine {
  time: string;
  msg: string;
  type: "info" | "ok" | "error";
}

export default function ToolsSync() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [dbStats, setDbStats] = useState<{ total: number; with_price: number; with_image: number } | null>(null);

  const addLog = (msg: string, type: LogLine["type"] = "info") => {
    const time = new Date().toLocaleTimeString("ru-RU");
    setLog(prev => [...prev, { time, msg, type }]);
  };

  const loadStats = async () => {
    const r = await fetch(`${SYNC_URL}?action=status`);
    const d = await r.json();
    setDbStats(d);
    return d;
  };

  const runChunk = async (offset: number): Promise<ChunkResult> => {
    const r = await fetch(`${SYNC_URL}?action=sync_chunk&offset=${offset}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  const startSync = async () => {
    setRunning(true);
    setDone(false);
    setTotalSaved(0);
    setCurrentOffset(0);
    setLog([]);

    addLog("Загружаю статистику БД...");
    const stats = await loadStats();
    addLog(`В БД: ${stats.total} товаров, с ценами: ${stats.with_price}, с фото: ${stats.with_image}`);
    addLog(`Начинаю загрузку из фида instrument.ru по ${CHUNK_SIZE} товаров...`);

    let offset = 0;
    let saved = 0;
    let chunkNum = 1;

    try {
      while (true) {
        addLog(`Чанк ${chunkNum}: offset=${offset}...`);
        setCurrentOffset(offset);

        const result = await runChunk(offset);
        saved += result.saved;
        setTotalSaved(saved);

        addLog(`✓ Чанк ${chunkNum}: сохранено ${result.saved} товаров (итого: ${saved})`, "ok");

        if (!result.has_more) {
          break;
        }

        offset = result.next_offset!;
        chunkNum++;

        // Небольшая пауза между чанками
        await new Promise(res => setTimeout(res, 300));
      }

      addLog(`Синхронизация завершена! Загружено ${saved} товаров.`, "ok");
      const finalStats = await loadStats();
      addLog(`Итог в БД: ${finalStats.total} товаров, с ценами: ${finalStats.with_price}, с фото: ${finalStats.with_image}`, "ok");
      setDone(true);
    } catch (e) {
      addLog(`Ошибка: ${e instanceof Error ? e.message : String(e)}`, "error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <a href="/tools" className="text-white/30 hover:text-[#FFD700]"><Icon name="ArrowLeft" size={20} /></a>
          <div className="w-1 h-6 bg-[#FFD700]" />
          <h1 className="text-xl font-bold uppercase tracking-wider">Синхронизация каталога</h1>
        </div>

        {/* Статистика */}
        {dbStats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Товаров в БД", value: dbStats.total },
              { label: "С ценами", value: dbStats.with_price },
              { label: "С фото", value: dbStats.with_image },
            ].map(s => (
              <div key={s.label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#FFD700]">{s.value.toLocaleString("ru-RU")}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Прогресс */}
        {running && (
          <div className="bg-[#1A1A1A] border border-[#FFD700]/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Loader" size={18} className="text-[#FFD700] animate-spin" />
              <span className="text-sm text-white/70">Загружено: <span className="text-[#FFD700] font-bold">{totalSaved.toLocaleString("ru-RU")}</span> товаров</span>
              <span className="text-xs text-white/30">offset: {currentOffset}</span>
            </div>
            <div className="w-full bg-[#2A2A2A] rounded-full h-2">
              <div
                className="bg-[#FFD700] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSaved / 3610) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-white/30 mt-1 text-right">{Math.round((totalSaved / 3610) * 100)}%</div>
          </div>
        )}

        {done && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-400" />
            <span className="text-green-400 font-medium">Синхронизация успешно завершена! {totalSaved.toLocaleString("ru-RU")} товаров загружено.</span>
          </div>
        )}

        {/* Кнопка */}
        <button
          onClick={startSync}
          disabled={running}
          className="w-full bg-[#FFD700] hover:bg-[#FFE033] disabled:opacity-50 text-black font-bold py-4 rounded-sm transition-colors text-base flex items-center justify-center gap-2 mb-6"
        >
          {running ? (
            <><Icon name="Loader" size={18} className="animate-spin" />Синхронизирую...</>
          ) : (
            <><Icon name="RefreshCw" size={18} />Запустить синхронизацию</>
          )}
        </button>

        {/* Лог */}
        {log.length > 0 && (
          <div className="bg-[#111] border border-[#2A2A2A] rounded-lg p-4 max-h-72 overflow-y-auto">
            <div className="text-xs text-white/30 mb-2 font-mono uppercase">Лог</div>
            {log.map((l, i) => (
              <div key={i} className={`text-xs font-mono mb-1 ${l.type === "ok" ? "text-green-400" : l.type === "error" ? "text-red-400" : "text-white/50"}`}>
                <span className="text-white/20">{l.time}</span> {l.msg}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-white/20 text-center mt-4">
          Каждый чанк = 500 товаров. Страница загружает их один за другим автоматически.
        </p>
      </div>
    </div>
  );
}