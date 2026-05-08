import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { AutoloadConfig, SYNC_URL, formatDate } from "./types";

export default function AvitoAutoload() {
  const [cfg, setCfg] = useState<AutoloadConfig | null>(null);
  const [eligible, setEligible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
            <div className="text-[11px] text-white/60 mt-0.5">
              Публикация товаров на Авито через XML-фид · готовых к публикации: <b className="text-white/85">{eligible}</b>
            </div>
          </div>
          <button
            onClick={regenerate}
            disabled={busy}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide disabled:opacity-50"
          >
            <Icon name={busy ? "Loader2" : "RefreshCw"} size={12} className={busy ? "animate-spin" : ""} />
            Сгенерировать XML
          </button>
        </div>
      </div>

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
          <b className="text-white/90">Важно:</b> в фид попадают только товары со статусом «Активный» и галочкой «Показывать на сайте». Товары без фото будут отклонены Авито — сначала загрузи фото в разделе «Витрина Авито».
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
