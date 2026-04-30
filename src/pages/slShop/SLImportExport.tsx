import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, SLSHOP_URL } from "./types";

export default function SLImportExport({ token }: { token: string }) {
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [delimiter, setDelimiter] = useState(";");

  const downloadExport = async (fmt: "csv" | "json" | "text") => {
    const url = `${SLSHOP_URL}?action=export&format=${fmt}`;
    const res = await fetch(url, { headers: { "X-Employee-Token": token } });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `slshop-export-${new Date().toISOString().slice(0, 10)}.${fmt === "json" ? "json" : fmt === "text" ? "txt" : "csv"}`;
    a.click();
  };

  const parseCsv = (text: string, sep: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 1) return [];
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const cells = line.split(sep);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (cells[i] || "").trim(); });
      return row;
    });
  };

  const parsePlainText = (text: string): Record<string, string>[] => {
    // формат: "Название | характеристики | цена"
    return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
      const parts = line.split("|").map(p => p.trim());
      return {
        title: parts[0] || "",
        specs_short: parts[1] || "",
        sell_price: (parts[2] || "0").replace(/[^\d.]/g, ""),
      };
    });
  };

  const onFileImport = async (file: File) => {
    setImporting(true); setImportMsg(null);
    const text = await file.text();
    const rows = parseCsv(text, delimiter);
    await sendImport(rows);
  };

  const onPasteImport = async () => {
    if (!pasted.trim()) return;
    setImporting(true); setImportMsg(null);
    const text = pasted.trim();
    const rows = text.includes("|") && !text.includes(delimiter) ? parsePlainText(text) : parseCsv(text, delimiter);
    await sendImport(rows);
  };

  const sendImport = async (rows: Record<string, string>[]) => {
    if (!rows.length) { setImporting(false); setImportMsg("Не удалось распознать данные"); return; }
    const r = await slApi<{ created: number; errors: { row: number; err: string }[] }>(
      token, "import", { method: "POST", body: { rows } }
    );
    setImporting(false);
    if (r.ok && r.data) {
      setImportMsg(`Создано: ${r.data.created} • Ошибок: ${r.data.errors.length}`);
    } else {
      setImportMsg(r.error || "Ошибка");
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Экспорт</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => downloadExport("csv")}
            className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-lg p-3 text-sm flex flex-col items-center gap-1">
            <Icon name="FileSpreadsheet" size={20} className="text-emerald-300" />
            <span>CSV / Excel</span>
          </button>
          <button onClick={() => downloadExport("json")}
            className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-lg p-3 text-sm flex flex-col items-center gap-1">
            <Icon name="FileCode2" size={20} className="text-blue-300" />
            <span>JSON</span>
          </button>
          <button onClick={() => downloadExport("text")}
            className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-lg p-3 text-sm flex flex-col items-center gap-1">
            <Icon name="FileText" size={20} className="text-yellow-300" />
            <span>Текст</span>
          </button>
        </div>
        <div className="text-[10px] text-white/40 mt-2">
          CSV открывается в Excel / Google Sheets. Текст: «Название | хар-ки | цена» построчно.
        </div>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Импорт из CSV/Excel</div>

        <label className="block bg-[#141414] border-2 border-dashed border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-lg p-4 text-center cursor-pointer transition-colors">
          <Icon name="Upload" size={20} className="mx-auto text-white/40" />
          <div className="text-sm mt-1">Загрузить файл .csv</div>
          <div className="text-[11px] text-white/40 mt-0.5">title;category;brand;model;specs_short;storage;color;condition;imei;buy_price;sell_price;status</div>
          <input type="file" accept=".csv,.txt" hidden onChange={e => {
            const f = e.target.files?.[0];
            if (f) onFileImport(f);
          }} />
        </label>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-white/50">Разделитель:</span>
          {[";", ",", "\t"].map(d => (
            <button key={d} onClick={() => setDelimiter(d)}
              className={`text-[10px] px-2 py-0.5 rounded ${delimiter === d ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] text-white/60"}`}>
              {d === "\t" ? "Tab" : d === ";" ? "; (Excel RU)" : ", (запятая)"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
        <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Вставить текстом</div>
        <textarea value={pasted} onChange={e => setPasted(e.target.value)}
          rows={6} placeholder={`iPhone 13 | 6.1" 4/128GB | 25000\nSamsung Galaxy S22 | 6.1" 8/128GB | 32000`}
          className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg px-2 py-2 text-sm font-mono resize-none" />
        <button onClick={onPasteImport} disabled={importing || !pasted.trim()}
          className="w-full mt-2 bg-[#FFD700] text-black font-bold py-2 rounded-lg disabled:opacity-50">
          {importing ? "Импорт..." : "Импортировать"}
        </button>
      </div>

      {importMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-sm">
          {importMsg}
        </div>
      )}
    </div>
  );
}
