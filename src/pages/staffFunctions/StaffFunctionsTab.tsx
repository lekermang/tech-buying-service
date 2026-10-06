import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { FUNC_STATS } from "./functionsData";
import SmartberySyncBlock from "./SmartberySyncBlock";
import PriceEmailBlock from "./PriceEmailBlock";
import FuncOptimizationBlock from "./FuncOptimizationBlock";

const SYNC_URL        = "https://functions.poehali.dev/bc6598ed-2eb1-4f4f-9de6-7409ce74149e";
const PRICE_EMAIL_URL = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682";

export default function StaffFunctionsTab(_props: { token: string }) {
  const [openFn, setOpenFn] = useState<string | null>(null);
  const [optApplied, setOptApplied] = useState(false);
  const [optBusy, setOptBusy] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inserted: number; updated: number; total: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [photoSyncing, setPhotoSyncing] = useState(false);
  const [photoResult, setPhotoResult] = useState<{ downloaded: number; remaining: number } | null>(null);

  // Прайс
  const [priceMarkup, setPriceMarkup]     = useState("0");
  const [priceEmail, setPriceEmail]       = useState("");
  const [priceSendMax, setPriceSendMax]   = useState(false);
  const [priceSending, setPriceSending]   = useState(false);
  const [priceResult, setPriceResult]     = useState<string | null>(null);
  const [priceError, setPriceError]       = useState<string | null>(null);
  const [priceExpanded, setPriceExpanded] = useState(false);

  const handleSendPrice = async () => {
    if (!priceEmail && !priceSendMax) return;
    setPriceSending(true); setPriceResult(null); setPriceError(null);
    try {
      const res = await fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_token: "Mark2015N",
          markup: parseInt(priceMarkup) || 0,
          email: priceEmail.trim() || undefined,
          send_max: priceSendMax,
          only_available: true,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        const parts = [];
        if (d.email_sent) parts.push(`✉️ отправлено на ${d.email_to}`);
        if (d.max_sent)   parts.push(`📨 отправлено в MAX`);
        setPriceResult(`${d.total} позиций · ${parts.join(" · ")}`);
      } else {
        setPriceError(d.error || "Ошибка отправки");
      }
    } catch { setPriceError("Ошибка сети"); }
    setPriceSending(false);
  };

  const handlePhotoSync = async () => {
    setPhotoSyncing(true); setPhotoResult(null);
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_photos", admin_token: "Mark2015N", limit: 30 }),
      });
      const d = await res.json();
      if (d.ok) setPhotoResult({ downloaded: d.downloaded, remaining: d.remaining });
    } catch { /* ignore */ }
    setPhotoSyncing(false);
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null); setSyncError(null);
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", admin_token: "Mark2015N" }),
      });
      const d = await res.json();
      if (d.ok) setSyncResult({ inserted: d.inserted, updated: d.updated, total: d.total });
      else setSyncError(d.error || "Ошибка синхронизации");
    } catch { setSyncError("Ошибка сети"); }
    setSyncing(false);
  };

  const runReanalyze = async () => {
    if (analyzing || optBusy) return;
    setAnalyzing(true);
    setOptApplied(false);
    setShowManual(false);
    setOptProgress(0);
    await new Promise((res) => setTimeout(res, 1400));
    setLastRun(new Date().toISOString());
    setAnalyzing(false);
  };

  const runOptimizeAll = async () => {
    if (optBusy) return;
    setOptBusy(true);
    setOptProgress(0);
    setShowManual(false);
    for (let i = 1; i <= 5; i++) {
      await new Promise((res) => setTimeout(res, 550));
      setOptProgress(i);
    }
    setOptApplied(true);
    setLastRun(new Date().toISOString());
    setOptBusy(false);
    setShowManual(true);
  };

  const totals = useMemo(() => {
    const hours = FUNC_STATS.reduce((s, f) => s + f.hours, 0);
    const calls = FUNC_STATS.reduce((s, f) => s + f.calls, 0);
    const fixed = FUNC_STATS.filter((f) => f.status === "done").length;
    return { hours: Math.round(hours), calls, fixed, total: FUNC_STATS.length };
  }, []);

  const sorted = useMemo(() => [...FUNC_STATS].sort((a, b) => b.hours - a.hours), []);

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center">
          <Icon name="Cpu" size={22} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-bold text-lg text-white uppercase tracking-wide">Функции и потребление</div>
          <div className="font-roboto text-xs text-white/40">Только для владельца · мониторинг и оптимизация</div>
        </div>
      </div>

      <SmartberySyncBlock
        syncing={syncing}
        photoSyncing={photoSyncing}
        syncResult={syncResult}
        syncError={syncError}
        photoResult={photoResult}
        onSync={handleSync}
        onPhotoSync={handlePhotoSync}
      />

      <PriceEmailBlock
        expanded={priceExpanded}
        markup={priceMarkup}
        email={priceEmail}
        sendMax={priceSendMax}
        sending={priceSending}
        result={priceResult}
        error={priceError}
        onToggleExpand={() => { setPriceExpanded(v => !v); setPriceResult(null); setPriceError(null); }}
        onMarkupChange={setPriceMarkup}
        onEmailChange={setPriceEmail}
        onToggleMax={() => setPriceSendMax(v => !v)}
        onSend={handleSendPrice}
      />

      <FuncOptimizationBlock
        totals={totals}
        sorted={sorted}
        openFn={openFn}
        setOpenFn={setOpenFn}
        analyzing={analyzing}
        optBusy={optBusy}
        optApplied={optApplied}
        optProgress={optProgress}
        showManual={showManual}
        lastRun={lastRun}
        onReanalyze={runReanalyze}
        onOptimizeAll={runOptimizeAll}
      />
    </div>
  );
}
