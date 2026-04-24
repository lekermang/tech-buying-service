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

  const MAX_MB = 100;
  const SMALL_FILE_MB = 4;
  const [s3Key, setS3Key] = useState<string | null>(null);

  const postToFunc = async (payload: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    try {
      const res = await fetch(IMPORT_PARTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders(token) },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch { /* not json */ }
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(timer);
    }
  };

  const uploadToS3 = async (file: File, onProgress: (percent: number) => void): Promise<string> => {
    const { ok, status, data } = await postToFunc({ action: 'upload-url', filename: file.name });
    if (!ok || !data.upload_url) {
      throw new Error((data.error as string) || `не удалось получить ссылку (${status})`);
    }
    const uploadUrl = data.upload_url as string;
    const key = data.s3_key as string;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 вернул ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('сеть недоступна при загрузке в хранилище'));
      xhr.onabort = () => reject(new Error('загрузка отменена'));
      xhr.send(file);
    });

    return key;
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > MAX_MB) {
      setImportFile(null);
      setImportPreview(null);
      setS3Key(null);
      setImportResult(`Файл слишком большой: ${sizeMb.toFixed(1)} МБ. Максимум — ${MAX_MB} МБ.`);
      return;
    }

    setImportFile(file);
    setImportPreview(null);
    setS3Key(null);
    setImportResult('Подготавливаю файл...');

    try {
      let payload: Record<string, unknown>;

      if (sizeMb > SMALL_FILE_MB) {
        setImportResult('Загружаю в облачное хранилище...');
        const key = await uploadToS3(file, (p) => setImportResult(`Загрузка в хранилище: ${p}%`));
        setS3Key(key);
        payload = { action: 'preview', s3_key: key, filename: file.name };
      } else {
        const b64 = await fileToBase64(file);
        payload = { action: 'preview', file: b64, filename: file.name };
      }

      setImportResult('Анализирую прайс-лист...');
      const { ok, status, data } = await postToFunc(payload);

      if (!ok || data.error) {
        setImportResult(`Ошибка: ${(data.error as string) || `сервер вернул ${status}`}`);
        return;
      }
      const parts_found = (data.parts_found as number) || 0;
      if (!parts_found) {
        setImportResult('Не нашли строк с товаром. Проверь, что в файле есть колонки «Наименование» и «Цена».');
        return;
      }
      setImportPreview(data as unknown as { parts_found: number; sample: { name: string; category: string; price: number; quality: string; part_type: string }[] });
      setImportResult(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'неизвестная';
      if (msg.includes('abort') || msg.includes('Abort')) {
        setImportResult('Ошибка: превышено время ожидания. Попробуй ещё раз.');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('сеть')) {
        setImportResult(`Ошибка сети: ${msg}. Проверь интернет и попробуй ещё раз.`);
      } else {
        setImportResult(`Ошибка чтения файла: ${msg}`);
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult('Загружаю позиции в базу...');
    try {
      let payload: Record<string, unknown>;
      if (s3Key) {
        payload = { action: 'import', s3_key: s3Key, filename: importFile.name };
      } else {
        const b64 = await fileToBase64(importFile);
        payload = { action: 'import', file: b64, filename: importFile.name };
      }
      const { ok, status, data } = await postToFunc(payload);
      if (!ok || data.error) setImportResult(`Ошибка: ${(data.error as string) || `сервер вернул ${status}`}`);
      else setImportResult(`Загружено ${data.imported} позиций, пропущено ${data.skipped}`);
      setImportFile(null);
      setImportPreview(null);
      setS3Key(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'неизвестная';
      setImportResult(`Ошибка соединения: ${msg}`);
    }
    setImporting(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-xl">
      <div>
        <p className="font-roboto text-white/50 text-xs mb-3">
          Загрузи прайс-лист поставщика в формате .xlsx или .xls (до {MAX_MB} МБ). Большие файлы автоматически загружаются через облако. Система определит колонки с названием, ценой, остатком и качеством.
        </p>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#333] hover:border-[#FFD700]/50 transition-colors cursor-pointer py-8 px-4 text-center">
          <Icon name="FileUp" size={28} className="text-white/20 mb-2" />
          <span className="font-roboto text-white/50 text-xs">
            {importFile ? `${importFile.name} · ${(importFile.size / 1024 / 1024).toFixed(2)} МБ` : 'Нажми или перетащи файл Excel (.xlsx)'}
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