import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { AutoloadConfig, SYNC_URL, formatDate } from "./types";

export default function AvitoAutoload() {
  const [cfg, setCfg] = useState<AutoloadConfig | null>(null);
  const [eligible, setEligible] = useState(0);
  const [noPhoto, setNoPhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${SYNC_URL}?action=autoload_status`);
      const d = await r.json();
      if (d.ok) {
        setCfg(d.config || null);
        setEligible(d.eligible || 0);
        setNoPhoto(d.no_photo || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadPhotos = async () => {
    if (photoLoading) return;
    setPhotoLoading(true);
    setPhotoProgress({ done: 0, total: noPhoto });
    try {
      // Грузим батчами по 30, чтобы не упереться в таймаут функции
      const BATCH = 30;
      let totalDone = 0;
      let attempts = 0;
      const maxAttempts = Math.ceil(noPhoto / BATCH) + 2;
      while (attempts < maxAttempts) {
        attempts += 1;
        const r = await fetch(`${SYNC_URL}?action=refresh&limit=${BATCH}`);
        const d = await r.json();
        if (!d.ok) {
          flash("err", d.error || "Ошибка загрузки фото");
          break;
        }
        const processed = Number(d.processed || d.updated || 0);
        const uploaded = Number(d.photos_uploaded || d.uploaded || 0);
        totalDone += uploaded;
        setPhotoProgress({ done: totalDone, total: noPhoto });
        // Если ничего не обработали — выходим (нечего больше грузить)
        if (processed === 0 && uploaded === 0) break;
      }
      flash("ok", `Загружено фото: ${totalDone}`);
      await load();
    } finally {
      setPhotoLoading(false);
      setTimeout(() => setPhotoProgress(null), 2000);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=autoload_regenerate`, { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        flash("ok", `Готово: ${d.items} товаров в фиде, ${(d.size / 1024).toFixed(1)} КБ`);
        load();
      } else {
        flash("err", d.error || "Не удалось");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    if (!cfg) return;
    setBusy(true);
    try {
      const r = await fetch(`${SYNC_URL}?action=autoload_save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !cfg.is_enabled }),
      });
      const d = await r.json();
      if (d.ok) load();
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = () => {
    if (cfg?.feed_url) {
      navigator.clipboard.writeText(cfg.feed_url);
      flash("ok", "Ссылка скопирована");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Шапка */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 p-3">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="Upload" size={16} className="text-emerald-300" />
              <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Avito Autoload</span>
            </div>
            <div className="text-[11px] text-white/60 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                <Icon name="CheckCircle2" size={11} className="inline -mt-0.5 mr-1 text-emerald-400" />
                Готовы к публикации: <b className="text-emerald-300">{eligible}</b>
              </span>
              {noPhoto > 0 && (
                <span>
                  <Icon name="ImageOff" size={11} className="inline -mt-0.5 mr-1 text-orange-400" />
                  Без фото: <b className="text-orange-300">{noPhoto}</b>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={regenerate}
            disabled={busy || eligible === 0}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-40"
            title={eligible === 0 ? "Нет товаров с фото — сначала загрузите фото" : "Создать актуальный XML-фид"}
          >
            <Icon name={busy ? "Loader2" : "RefreshCw"} size={12} className={busy ? "animate-spin" : ""} />
            Сгенерировать XML
          </button>
        </div>
      </div>

      {/* Плашка-проблема "товары без фото" */}
      {noPhoto > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-orange-500/15 to-red-500/5 border-2 border-orange-500/40 p-3 shadow-[0_0_20px_rgba(251,146,60,0.15)]">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Icon name="AlertTriangle" size={18} className="text-orange-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Товары без фото: {noPhoto}
              </div>
              <div className="text-[11px] text-white/70 mt-1 leading-relaxed">
                Авито отклонит объявления без изображений. Загружу фото с самого Авито за 1 клик —
                это займёт минуту-две.
              </div>
              {photoProgress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                    <span>Загружаю фото...</span>
                    <span className="font-oswald font-bold text-orange-300">
                      {photoProgress.done} / {photoProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                      style={{
                        width: `${Math.min(100, (photoProgress.done / Math.max(1, photoProgress.total)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={loadPhotos}
                disabled={photoLoading}
                className="mt-2.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_16px_rgba(251,146,60,0.4)] text-white font-oswald font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wide disabled:opacity-50 transition-all"
              >
                <Icon
                  name={photoLoading ? "Loader2" : "ImagePlus"}
                  size={12}
                  className={photoLoading ? "animate-spin" : ""}
                />
                {photoLoading ? "Загружаю..." : `Загрузить фото с Авито`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Состояние "всё ок" */}
      {noPhoto === 0 && eligible > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 p-3 flex items-center gap-2">
          <Icon name="CheckCircle2" size={16} className="text-emerald-300 shrink-0" />
          <div className="text-[12px] text-white/80">
            <b className="text-emerald-300">Все товары с фото.</b> Можно генерировать фид и подключать автозагрузку на Авито.
          </div>
        </div>
      )}

      {msg && (
        <div className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
          msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}>
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}

      {cfg?.feed_url && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Link" size={14} className="text-emerald-300" />
            <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Публичная ссылка на фид</span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={cfg.feed_url}
              className="flex-1 bg-[#0D0D0D] border border-white/15 text-white/80 px-2 py-1.5 font-roboto text-[11px] rounded select-all"
            />
            <button onClick={copyUrl} className="bg-white/5 hover:bg-white/10 text-white text-xs px-3 rounded flex items-center gap-1">
              <Icon name="Copy" size={12} />
              Копировать
            </button>
          </div>
          <div className="text-[10px] text-white/40 mt-2 flex items-center gap-1">
            <Icon name="Info" size={10} />
            Последняя генерация: {formatDate(cfg.last_generated_at)} · товаров в фиде: {cfg.last_items_count || 0}
          </div>
        </div>
      )}

      {/* Инструкция */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
        <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
          <Icon name="ListChecks" size={14} className="text-[#FFD700]" />
          Как подключить (один раз)
        </div>

        <div className="space-y-2">
          <Step n={1}>
            Зайди в <b className="text-white">Avito Pro → Каталог → Автозагрузка</b>
            <br />
            <a href="https://www.avito.ru/profile/autoload" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 mt-1">
              <Icon name="ExternalLink" size={11} />
              Открыть Автозагрузку
            </a>
          </Step>
          <Step n={2}>
            Создай новую автозагрузку с типом <b className="text-white">«По ссылке»</b>
          </Step>
          <Step n={3}>
            Вставь нашу ссылку (см. выше) в поле <b className="text-white">«URL файла»</b>. Авито будет сам забирать XML каждые 1–24 часа.
          </Step>
          <Step n={4}>
            После первой загрузки Авито пришлёт отчёт об ошибках — поправим в товарах если что
          </Step>
        </div>
      </div>

      {/* Состояние */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
              Включить автозагрузку
            </div>
            <div className="text-[11px] text-white/60 mt-0.5">
              Когда включено — мы регулярно обновляем XML с актуальными товарами и Авито их подтягивает
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            disabled={busy || !cfg?.feed_url}
            className={`w-12 h-6 rounded-full transition-all relative shrink-0 disabled:opacity-50 ${
              cfg?.is_enabled ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-white/15"
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${cfg?.is_enabled ? "left-6" : "left-0.5"}`} />
          </button>
        </label>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 p-3 flex items-start gap-2">
        <Icon name="Lightbulb" size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
        <div className="text-[11px] text-white/70 leading-relaxed">
          <b className="text-white/90">Как это работает:</b> в фид попадают только активные товары с фото и галочкой «Показывать на сайте». Если у товара нет фото — он автоматически исключается из фида (Авито такие отклонит). Кнопка <b className="text-white/90">«Загрузить фото с Авито»</b> подтянет недостающие изображения за один клик.
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-oswald font-bold text-xs flex items-center justify-center">
        {n}
      </div>
      <div className="text-[12px] text-white/80 leading-relaxed flex-1">{children}</div>
    </div>
  );
}