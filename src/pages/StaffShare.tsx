import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

/**
 * Обработчик share_target из staff-manifest.json.
 * Принимает POST multipart с полями {title, text, url, media[]}.
 *
 * Однако PWA share_target в браузерах прилетает как обычный навигейт на /staff/share
 * с form-data в URL (для GET) или после захвата запроса через Service Worker.
 * Здесь мы делаем UX-обёртку: показываем превью фото и кнопку «Прикрепить к заявке».
 *
 * Фото складываем в sessionStorage (как dataURL) и редиректим на /staff?openShare=1,
 * чтобы Staff-приложение само открыло селектор заявки и прикрепило фото.
 */
const StaffShare = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const title = params.get("title") || "";
    const txt = params.get("text") || "";
    const url = params.get("url") || "";
    setText([title, txt, url].filter(Boolean).join("\n"));

    // SW перехватит POST и положит файлы в Cache Storage под именем 'shared-media'.
    // Если SW есть — забираем оттуда. Если нет — fallback: пользователь выберет фото вручную.
    (async () => {
      try {
        if ("caches" in window) {
          const cache = await caches.open("shared-media");
          const keys = await cache.keys();
          const out: { name: string; url: string }[] = [];
          for (const req of keys) {
            const resp = await cache.match(req);
            if (resp) {
              const blob = await resp.blob();
              out.push({ name: req.url.split("/").pop() || "photo", url: URL.createObjectURL(blob) });
            }
          }
          setFiles(out);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [params]);

  const handleAttach = () => {
    // Сохраняем в sessionStorage и переходим в Staff
    try {
      sessionStorage.setItem(
        "staff_share_payload",
        JSON.stringify({ text, files: files.map((f) => f.url) })
      );
    } catch {
      /* ignore */
    }
    navigate("/staff?openShare=1", { replace: true });
  };

  const handleManualPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const out: { name: string; url: string }[] = [];
    for (const f of Array.from(fl)) {
      out.push({ name: f.name, url: URL.createObjectURL(f) });
    }
    setFiles(out);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#222] bg-[#0A0A0A] px-4 py-3">
        <button
          onClick={() => navigate("/staff")}
          className="rounded-full p-2 hover:bg-[#1A1A1A]"
          aria-label="Назад"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div>
          <h1 className="font-oswald text-lg font-bold uppercase">Прикрепить к заявке</h1>
          <p className="text-xs text-[#888]">Поделиться с приложением Скупка24</p>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] p-4">
        {text && (
          <div className="mb-4 rounded-xl border border-[#222] bg-[#111] p-3">
            <div className="mb-1 text-xs uppercase tracking-wider text-[#888]">Текст</div>
            <p className="whitespace-pre-wrap text-sm">{text}</p>
          </div>
        )}

        {files.length === 0 && (
          <div className="mb-4 rounded-xl border-2 border-dashed border-[#333] bg-[#111] p-6 text-center">
            <Icon name="ImagePlus" size={40} className="mx-auto mb-3 text-[#FFD700]" />
            <p className="mb-3 text-sm text-[#aaa]">
              Файлы не получены автоматически.
              <br />
              Выберите фото вручную:
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#FFD700] px-5 py-2 font-semibold text-black hover:opacity-90">
              <Icon name="Camera" size={18} />
              Выбрать фото
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleManualPick}
              />
            </label>
          </div>
        )}

        {files.length > 0 && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-lg border border-[#222] bg-[#111]"
                >
                  <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>

            <button
              onClick={handleAttach}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFD700] py-3 font-semibold text-black hover:opacity-90"
            >
              <Icon name="Paperclip" size={18} />
              Прикрепить к заявке
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default StaffShare;
