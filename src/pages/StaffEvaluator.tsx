import { useState, useEffect } from "react";
import EvaluatorHeader from "./staffEvaluator/EvaluatorHeader";
import EvaluatorForm from "./staffEvaluator/EvaluatorForm";
import EvaluatorResult from "./staffEvaluator/EvaluatorResult";

const EVALUATOR_URL = "https://functions.poehali.dev/c19fbf1e-d61d-4b21-8f8a-d478faacdaad";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

const CATEGORIES = ["смартфон", "ноутбук", "планшет", "игровая консоль", "наушники", "умные часы", "фотоаппарат", "компьютер", "телевизор", "другое"];

type EvalResult = {
  min_price: number; avg_price: number; max_price: number;
  recommended_buy: number; recommended_sell: number; margin_pct: number;
  liquidity: string; sell_time: string; sell_days: number;
  tips: string[]; factors: string; ad_title: string; risk: string;
  db_stats?: { found?: number; our_avg_buy?: number; our_avg_sell?: number; our_min_sell?: number; our_max_sell?: number };
};

type HistoryEntry = { model: string; result: EvalResult; ts: number; condition: string };

const LSKEY = "sl_eval_history";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(LSKEY) || "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  try { localStorage.setItem(LSKEY, JSON.stringify(h.slice(0, 30))); } catch { /* ignore */ }
}

export default function StaffEvaluator() {
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("смартфон");
  const [storage, setStorage] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("хорошее");
  const [kit, setKit] = useState("без коробки");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoHint, setPhotoHint] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoLoading(true);
    setPhotoHint(null);
    setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res((ev.target?.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const resp = await fetch(EVALUATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recognize_photo", photo_base64: b64 }),
      });
      const d = await resp.json();
      if (d.error) { setError("Не удалось распознать: " + d.error); return; }
      if (d.model) setModel(d.model);
      if (d.brand) setBrand(d.brand);
      if (d.category && CATEGORIES.includes(d.category)) setCategory(d.category);
      if (d.storage) setStorage(d.storage);
      if (d.year) setYear(d.year);
      if (d.condition_hints) setNotes(d.condition_hints);
      const hint = `ИИ распознал с фото (уверенность: ${d.confidence || "?"})${d.notes ? " · " + d.notes : ""}`;
      setPhotoHint(hint);
    } catch (ex) {
      setError("Ошибка при обработке фото: " + String(ex));
    } finally {
      setPhotoLoading(false);
    }
  };

  const evaluate = async () => {
    if (!model.trim()) { setError("Введите модель устройства"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch(EVALUATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate", model, brand, category, storage, year, condition, kit, region: "Калуга", notes }),
      });
      const d = await resp.json();
      if (d.error) { setError(d.error); return; }
      setResult(d);
      const entry: HistoryEntry = { model: `${brand} ${model}`.trim(), result: d, ts: Date.now(), condition };
      const newH = [entry, ...history].slice(0, 30);
      setHistory(newH);
      saveHistory(newH);
    } catch (ex) {
      setError("Ошибка соединения: " + String(ex));
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = [
      `Оценка: ${brand} ${model}`.trim(),
      `Закупка (рек.): ${fmt(result.recommended_buy)}`,
      `Продажа (рек.): ${fmt(result.recommended_sell)}`,
      `Маржа: ${result.margin_pct}%`,
      `Рынок Авито: ${fmt(result.min_price)} — ${fmt(result.max_price)}`,
      `Ликвидность: ${result.liquidity} · Срок продажи: ${result.sell_time}`,
      `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0a0805 0%, #060504 100%)" }}>
      <EvaluatorHeader
        history={history}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(v => !v)}
        onSelectHistory={h => {
          setResult(h.result);
          setModel(h.model);
          setCondition(h.condition);
          setShowHistory(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onClearHistory={() => { setHistory([]); saveHistory([]); }}
      />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <EvaluatorForm
          model={model} setModel={v => { setModel(v); setResult(null); setError(null); setPhotoHint(null); }}
          brand={brand} setBrand={setBrand}
          category={category} setCategory={setCategory}
          storage={storage} setStorage={setStorage}
          year={year} setYear={setYear}
          condition={condition} setCondition={setCondition}
          kit={kit} setKit={setKit}
          notes={notes} setNotes={setNotes}
          loading={loading}
          photoLoading={photoLoading}
          photoHint={photoHint}
          error={error}
          onEvaluate={evaluate}
          onPhoto={handlePhoto}
        />

        {result && (
          <EvaluatorResult
            result={result}
            brand={brand}
            model={model}
            category={category}
            condition={condition}
            kit={kit}
            copied={copied}
            onCopy={copyResult}
          />
        )}
      </div>
    </div>
  );
}
