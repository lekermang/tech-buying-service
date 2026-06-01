import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const FINANCE_URL = "https://functions.poehali.dev/f7e6a419-7cd3-4768-86b6-8a63dfc212ee";
const PARSE_PDF_URL = "https://functions.poehali.dev/030f7058-cbff-43cc-8e5b-12110c9ceb5f";

type PdfState = { file: File | null; text: string; loading: boolean; pages: number; error: string | null };
const emptyPdf = (): PdfState => ({ file: null, text: "", loading: false, pages: 0, error: null });

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function extractPdfText(
  file: File,
  token: string,
  financeUrl: string
): Promise<{ text: string; pages: number }> {
  const CHUNK = 50 * 1024;
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const buf = await file.arrayBuffer();
  const totalChunks = Math.ceil(buf.byteLength / CHUNK);

  for (let i = 0; i < totalChunks; i++) {
    const slice = buf.slice(i * CHUNK, (i + 1) * CHUNK);
    const chunkB64 = bufToB64(slice);
    const r = await fetch(financeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "upload_chunk", token, file_id: fileId, chunk_index: i, chunk_b64: chunkB64 }),
    });
    if (!r.ok) throw new Error(`Ошибка загрузки чанка ${i}: HTTP ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
  }

  const asmResp = await fetch(financeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
    body: JSON.stringify({ action: "assemble_pdf", token, file_id: fileId, total_chunks: totalChunks }),
  });
  if (!asmResp.ok) throw new Error(`Ошибка сборки: HTTP ${asmResp.status}`);
  const asmData = await asmResp.json();
  if (asmData.error) throw new Error(asmData.error);

  const parseResp = await fetch(PARSE_PDF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
    body: JSON.stringify({ token, s3_key: asmData.s3_key }),
  });
  if (!parseResp.ok) throw new Error(`Ошибка парсинга: HTTP ${parseResp.status}`);
  const parseData = await parseResp.json();
  if (parseData.error) throw new Error(parseData.error);
  if (!parseData.text?.trim()) throw new Error("PDF не содержит текста — возможно, скан. Выгрузите выписку из Сбербанк Онлайн заново.");
  return { text: parseData.text, pages: parseData.pages || 1 };
}

function PdfZone({ label, hint, state, onFile, onClear, token }: {
  label: string; hint: string; state: PdfState;
  onFile: (s: PdfState) => void; onClear: () => void; token: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type && !file.type.includes("pdf")) {
      onFile({ ...emptyPdf(), error: "Нужен PDF-файл" }); return;
    }
    onFile({ ...emptyPdf(), file, loading: true });
    try {
      const { text, pages } = await extractPdfText(file, token, FINANCE_URL);
      onFile({ file, text, loading: false, pages, error: null });
    } catch (ex) {
      onFile({ ...emptyPdf(), file, error: String(ex).replace("Error: ", "") });
    }
  };

  const isOk = !!state.text && !state.loading;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
        {state.file && <button onClick={onClear} className="font-roboto text-[10px]" style={{ color: "rgba(248,113,113,0.7)" }}>Удалить</button>}
      </div>
      {!state.file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl cursor-pointer transition-all"
          style={{
            background: drag ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.03)",
            border: `1.5px dashed ${drag ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <Icon name="FileUp" size={22} style={{ color: drag ? "#FFD700" : "rgba(255,255,255,0.3)" }} />
          <div className="text-center">
            <div className="font-roboto text-sm font-semibold" style={{ color: drag ? "#FFD700" : "rgba(255,255,255,0.5)" }}>Загрузить PDF</div>
            <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</div>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{
          border: `1px solid ${isOk ? "rgba(52,211,153,0.3)" : state.error ? "rgba(248,113,113,0.3)" : "rgba(255,215,0,0.25)"}`,
          background: isOk ? "rgba(52,211,153,0.05)" : state.error ? "rgba(248,113,113,0.05)" : "rgba(255,215,0,0.04)",
        }}>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
              {state.loading ? <Icon name="Loader2" size={16} className="animate-spin" style={{ color: "#FFD700" }} />
                : isOk ? <Icon name="CheckCircle2" size={16} style={{ color: "#34d399" }} />
                : <Icon name="AlertCircle" size={16} style={{ color: "#f87171" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-sm truncate text-white/80">{state.file.name}</div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {state.loading ? "Загружаю и извлекаю текст..."
                  : state.error ? state.error
                  : `${state.pages} стр. · ${state.text.length.toLocaleString("ru-RU")} симв.`}
              </div>
            </div>
          </div>
          {isOk && (
            <div className="px-3 pb-3">
              <div className="px-3 py-2 rounded-lg font-roboto text-[11px] leading-relaxed" style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{state.text.slice(0, 280)}…</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  token: string;
  debitPdf: PdfState;
  savingsPdf: PdfState;
  period: string;
  loading: boolean;
  error: string | null;
  canAnalyze: boolean;
  onDebitFile: (s: PdfState) => void;
  onSavingsFile: (s: PdfState) => void;
  onDebitClear: () => void;
  onSavingsClear: () => void;
  onPeriodChange: (v: string) => void;
  onAnalyze: () => void;
}

export default function FinanceInputView({
  token, debitPdf, savingsPdf, period, loading, error, canAnalyze,
  onDebitFile, onSavingsFile, onDebitClear, onSavingsClear, onPeriodChange, onAnalyze,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Период</label>
        <input value={period} onChange={e => onPeriodChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
        />
      </div>
      <PdfZone label="Выписка · Дебетовая карта" hint="Перетащите или нажмите · PDF из банка"
        state={debitPdf} onFile={onDebitFile} onClear={onDebitClear} token={token} />
      <PdfZone label="Выписка · Накопительный счёт" hint="Необязательно"
        state={savingsPdf} onFile={onSavingsFile} onClear={onSavingsClear} token={token} />
      {!debitPdf.file && !savingsPdf.file && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <Icon name="Info" size={13} className="shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
          <span className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Скачайте выписку в банковском приложении → формат PDF → загрузите сюда. Текст извлечётся автоматически.
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="font-roboto text-sm text-red-400">{error}</span>
        </div>
      )}
      <button onClick={onAnalyze} disabled={loading || !canAnalyze}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg,#FFE34D,#FFD700)",
          boxShadow: loading || !canAnalyze ? "none" : "0 0 24px rgba(255,215,0,0.35), 0 2px 0 rgba(255,255,255,0.2) inset",
        }}
      >
        {loading
          ? <><Icon name="Loader2" size={18} className="animate-spin" /> Анализирую...</>
          : <><Icon name="LineChart" size={18} /> Сформировать отчёт</>
        }
      </button>
    </div>
  );
}
