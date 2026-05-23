/** Модалка импорта объявления с Авито по URL. */
import { useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { parseAvitoUrl, type AvitoParsed } from "./api";

export default function AvitoImportModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (data: AvitoParsed) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const u = url.trim();
    if (!u.includes("avito") || !/\d{6,}/.test(u)) {
      toast.error("Вставьте ссылку на объявление Авито");
      return;
    }
    setLoading(true);
    const r = await parseAvitoUrl(u);
    setLoading(false);
    if (!r.ok || !r.data) { toast.error(r.error || "Не удалось загрузить"); return; }
    toast.success(`Импортировано: ${r.data.photos.length} фото`);
    onImport(r.data);
    onClose();
  };

  return (
    <Modal title="Импорт с Авито" onClose={onClose}>
      <p className="text-sm text-[#999] mb-3">
        Вставьте ссылку на ваше объявление — мы автоматически заполним название, цену, описание и фото.
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="https://www.avito.ru/.../iphone_..._123456789"
        className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFD700]"
      />
      <div className="bg-[#FFD700]/[0.06] border border-[#FFD700]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#ccc] mt-3 leading-relaxed">
        <Icon name="Lightbulb" size={12} className="inline mr-1 text-[#FFD700]" />
        Объявление должно быть <b>опубликованным</b> (не архивным). Скопируйте ссылку из адресной строки.
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-[#2A2A2A] text-sm font-bold">Отмена</button>
        <button onClick={submit} disabled={loading || !url.trim()}
          className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Download" size={14} />}
          {loading ? "Загружаем..." : "Импортировать"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-5">
      <div className="w-full max-w-md bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[#999] hover:text-white">
            <Icon name="X" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
