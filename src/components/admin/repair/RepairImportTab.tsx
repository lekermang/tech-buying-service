import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const IMPORT_PARTS_URL = "https://functions.poehali.dev/71d1796e-9ac1-4330-abfb-b6713d9dfaf5";

type Props = {
  token: string;
};

export default function RepairImportTab({ token }: Props) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{parts_found: number; sample: {name: string; category: string; price: number; quality: string; part_type: string}[]} | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportPreview(null);
    setImportResult(null);
    try {
      const b64 = await fileToBase64(file);
      const res = await fetch(IMPORT_PARTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
        body: JSON.stringify({ action: 'preview', file: b64 }),
      });
      const data = await res.json();
      setImportPreview(data);
    } catch {
      setImportResult('Ошибка чтения файла');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const b64 = await fileToBase64(importFile);
      const res = await fetch(IMPORT_PARTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
        body: JSON.stringify({ action: 'import', file: b64 }),
      });
      const data = await res.json();
      if (data.error) setImportResult(`Ошибка: ${data.error}`);
      else setImportResult(`Загружено ${data.imported} позиций, пропущено ${data.skipped}`);
      setImportFile(null);
      setImportPreview(null);
    } catch {
      setImportResult('Ошибка соединения');
    }
    setImporting(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-xl">
      <div>
        <p className="font-roboto text-white/50 text-xs mb-3">
          Загрузи прайс-лист поставщика в формате .xlsx или .xls. Система автоматически определит колонки с названием, ценой, остатком и качеством.
        </p>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#333] hover:border-[#FFD700]/50 transition-colors cursor-pointer py-8 px-4 text-center">
          <Icon name="FileUp" size={28} className="text-white/20 mb-2" />
          <span className="font-roboto text-white/50 text-xs">
            {importFile ? importFile.name : 'Нажми или перетащи файл Excel (.xlsx)'}
          </span>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFileChange} />
        </label>
      </div>

      {importPreview && (
        <div className="border border-[#222] p-3 space-y-3">
          <p className="font-roboto text-xs text-white/60">
            Найдено строк с товаром: <span className="text-[#FFD700] font-bold">{importPreview.parts_found}</span>
          </p>
          {importPreview.sample.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-roboto">
                <thead>
                  <tr className="text-white/30 border-b border-[#222]">
                    <th className="text-left py-1 pr-3">Название</th>
                    <th className="text-left py-1 pr-3">Категория</th>
                    <th className="text-right py-1 pr-3">Цена</th>
                    <th className="text-left py-1">Качество</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.sample.map((p, i) => (
                    <tr key={i} className="border-b border-[#111] text-white/70">
                      <td className="py-1 pr-3 max-w-[180px] truncate">{p.name}</td>
                      <td className="py-1 pr-3 text-white/40">{p.category || '—'}</td>
                      <td className="py-1 pr-3 text-right">{p.price} ₽</td>
                      <td className="py-1">{p.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 text-xs uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            <Icon name={importing ? "Loader" : "Upload"} size={13} className={importing ? "animate-spin" : ""} />
            {importing ? "Загружаю..." : `Загрузить ${importPreview.parts_found} позиций`}
          </button>
        </div>
      )}

      {importResult && (
        <p className={`font-roboto text-xs ${importResult.startsWith('Ошибка') ? 'text-red-400' : 'text-green-400'}`}>
          {importResult}
        </p>
      )}
    </div>
  );
}
