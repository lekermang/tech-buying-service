import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PRICE_EMAIL_URL = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682";
const PUBLIC_PRICE_URL = "https://functions.poehali.dev/b39f271a-3a63-4998-b83b-3c64eeace265";

const MARKUP_PRESETS = [
  { label: "Без наценки", value: "0" },
  { label: "+500 ₽", value: "500" },
  { label: "+1 000 ₽", value: "1000" },
  { label: "+1 500 ₽", value: "1500" },
];

interface Props {
  token: string;
}

export default function PriceFloatingButton({ token: _token }: Props) {
  const [open, setOpen] = useState(false);
  const [markup, setMarkup] = useState("0");
  const [email, setEmail] = useState("");
  const [sendMax, setSendMax] = useState(true);
  const [sending, setSending] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Магнитный эффект
  const btnRef = useRef<HTMLButtonElement>(null);
  const [magOffset, setMagOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    setMagOffset({ x: dx * 0.35, y: dy * 0.35 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMagOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleSend = async () => {
    if (!email.trim() && !sendMax) return;
    setSending(true); setResult(null); setError(null);
    try {
      const res = await fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_token: "Mark2015N",
          markup: parseInt(markup) || 0,
          email: email.trim() || undefined,
          send_max: sendMax,
          only_available: true,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        const parts: string[] = [];
        if (d.email_sent) parts.push(`✉️ ${d.email_to}`);
        if (d.max_sent) parts.push(`📨 MAX`);
        const total = typeof d.total === "number" ? d.total : "?";
        setResult(`${total} позиций · ${parts.join(" · ")}`);
      } else {
        setError(d.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    }
    setSending(false);
  };

  // Загружает прайс и открывает окно печати браузера
  const handlePrint = async () => {
    setPrinting(true); setResult(null); setError(null);
    try {
      const m = parseInt(markup) || 0;
      const res = await fetch(`${PUBLIC_PRICE_URL}?markup=${m}`);
      const d = await res.json();
      if (!d.ok || !d.groups) throw new Error("Не удалось загрузить прайс");

      const today = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit", month: "long", year: "numeric",
      });
      const markupStr = m > 0 ? `+${m.toLocaleString("ru-RU")} ₽` : "без наценки";

      const CAT_EMOJI: Record<string, string> = {
        "iPhone": "📱", "MacBook": "💻", "iPad": "🖥️",
        "Apple Watch": "⌚", "AirPods": "🎧",
        "Смартфоны Samsung": "📲", "Смартфоны Xiaomi": "📲",
        "Наушники": "🎧", "Планшеты": "📋",
        "Игровые консоли": "🎮", "Аксессуары Apple": "🔌",
        "Аксессуары": "🔌", "Прочее": "📦",
      };

      let sectionsHtml = "";
      for (const [cat, items] of Object.entries(d.groups) as [string, { name: string; price: string; region: string; photo: string | null }[]][]) {
        const emoji = CAT_EMOJI[cat] || "📦";
        let rows = "";
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const bg = i % 2 === 0 ? "#f9f9f9" : "#fff";
          const regionBadge = item.region
            ? `<span style="font-size:8px;background:#eee;color:#555;border:1px solid #ccc;border-radius:3px;padding:1px 4px;margin-left:4px;vertical-align:middle">${item.region}</span>`
            : "";
          const photoCell = item.photo
            ? `<td style="width:44px;padding:3px 6px;background:${bg};border-bottom:1px solid #eee;vertical-align:middle"><img src="${item.photo}" width="36" height="36" style="border-radius:4px;object-fit:cover;display:block"></td>`
            : `<td style="width:44px;padding:3px 6px;background:${bg};border-bottom:1px solid #eee;text-align:center;vertical-align:middle;font-size:16px">${emoji}</td>`;
          rows += `<tr>${photoCell}
            <td style="padding:5px 8px;background:${bg};border-bottom:1px solid #eee;font-size:11px;color:#222">${item.name}${regionBadge}</td>
            <td style="padding:5px 12px;background:${bg};border-bottom:1px solid #eee;text-align:right;font-size:11px;font-weight:700;color:${item.price === "—" ? "#bbb" : "#c47900"};white-space:nowrap">${item.price}</td>
          </tr>`;
        }
        sectionsHtml += `
          <tr><td colspan="3" style="padding:12px 8px 4px;background:#f0f0f0">
            <div style="font-size:12px;font-weight:800;color:#333;letter-spacing:0.5px;text-transform:uppercase">
              ${emoji} ${cat} <span style="font-size:10px;color:#999;font-weight:400">(${items.length} шт.)</span>
            </div>
          </td></tr>${rows}`;
      }

      const html = `<!DOCTYPE html><html lang="ru"><head>
        <meta charset="utf-8">
        <title>Прайс Скупка24 — ${today}</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; background: #fff; color: #000; }
          table { width: 100%; border-collapse: collapse; }
          .cat-block { page-break-inside: avoid; }
        </style>
      </head><body>
        <table style="border-bottom:2px solid #FFD700;margin-bottom:12px;padding-bottom:8px">
          <tr>
            <td><div style="font-size:18px;font-weight:900;letter-spacing:1px">СКУПКА24 — ПРАЙС-ЛИСТ</div>
                <div style="font-size:11px;color:#888;margin-top:2px">Актуальные цены · Smartbery · ${d.total} позиций</div></td>
            <td style="text-align:right;font-size:11px;color:#888;line-height:1.8">
              ${today}<br>Наценка: ${markupStr}<br>
              skypka24.com · +7 (992) 990-33-33
            </td>
          </tr>
        </table>
        <table>${sectionsHtml}</table>
        <div style="text-align:center;margin-top:20px;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:8px">
          г. Калуга, ул. Кирова 7/47 и ул. Кирова 11 · skypka24.com · © ${new Date().getFullYear()} Скупка24
        </div>
      </body></html>`;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => { win.focus(); win.print(); };
      }
      setResult(`Прайс готов: ${d.total} позиций`);
    } catch (e) {
      setError("Ошибка формирования прайса");
    }
    setPrinting(false);
  };

  const canSend = email.trim() || sendMax;

  return (
    <>
      {/* FAB кнопка */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(true); setResult(null); setError(null); }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="fixed z-[55] right-4 group"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 12px)",
          transform: `translate(${magOffset.x}px, ${magOffset.y}px)`,
          transition: isHovered ? "transform 0.15s ease-out" : "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <span className="absolute inset-0 rounded-2xl bg-[#FFD700]/30 blur-xl scale-110 animate-pulse pointer-events-none" />
        <span
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase tracking-widest text-black select-none overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)",
            boxShadow: isHovered
              ? "0 8px 32px rgba(255,215,0,0.6), 0 2px 8px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-2xl" />
          <Icon name="Send" size={15} className="text-black/80 relative z-10" />
          <span className="relative z-10">Прайс</span>
        </span>
      </button>

      {/* Модал */}
      {open && (
        <div
          className="fixed inset-0 z-[58] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #1a1a1a 0%, #111 100%)",
              border: "1px solid rgba(255,215,0,0.2)",
              boxShadow: "0 -8px 48px rgba(255,215,0,0.15), 0 0 0 1px rgba(255,255,255,0.04)",
              maxHeight: "92dvh",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ручка */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Скроллируемый контент */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Заголовок */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,215,0,0.05))", border: "1px solid rgba(255,215,0,0.25)" }}>
                  <Icon name="Send" size={20} className="text-[#FFD700]" />
                </div>
                <div>
                  <div className="font-oswald font-bold text-[16px] text-white uppercase tracking-wide">Отправить прайс</div>
                  <div className="text-[11px] text-white/40">Актуальные цены Smartbery · SIM/eSIM</div>
                </div>
              </div>

              {/* Наценка */}
              <div>
                <div className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Наценка к каждой позиции</div>
                <div className="flex gap-2 flex-wrap">
                  {MARKUP_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setMarkup(p.value)}
                      className="px-3 py-1.5 rounded-xl font-oswald font-bold text-[12px] transition-all"
                      style={{
                        background: markup === p.value ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${markup === p.value ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)"}`,
                        color: markup === p.value ? "#FFD700" : "rgba(255,255,255,0.45)",
                        boxShadow: markup === p.value ? "0 0 12px rgba(255,215,0,0.15)" : "none",
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="number" min="0" step="100" value={markup}
                  onChange={e => setMarkup(e.target.value)} placeholder="Своя сумма"
                  className="mt-2 w-32 px-3 py-1.5 rounded-xl font-roboto text-[13px] text-white/80 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              {/* ── Блок: Отправить для печати ── */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                <div className="px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Printer" size={14} className="text-white/50" />
                    <span className="font-oswald font-bold text-[13px] text-white/70 uppercase tracking-wide">Отправить для печати</span>
                  </div>
                  <div className="text-[11px] text-white/30 mb-2.5">
                    Формат А4 · цветной · дата и шапка автоматически
                  </div>
                  <button onClick={handlePrint} disabled={printing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-oswald font-bold text-[13px] uppercase tracking-wide transition-all disabled:opacity-40"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}>
                    <Icon name={printing ? "Loader2" : "Printer"} size={15}
                      className={printing ? "animate-spin" : ""} />
                    {printing ? "Загружаю…" : "Распечатать прайс А4"}
                  </button>
                </div>
              </div>

              {/* ── Блок: Отправить по email / MAX ── */}
              <div style={{ border: "1px solid rgba(255,215,0,0.12)", borderRadius: 14, overflow: "hidden" }}>
                <div className="px-3.5 py-2.5" style={{ background: "rgba(255,215,0,0.03)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Mail" size={14} className="text-[#FFD700]/70" />
                    <span className="font-oswald font-bold text-[13px] text-white/70 uppercase tracking-wide">Отправить на почту / MAX</span>
                  </div>

                  {/* Email */}
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="client@mail.ru (оставь пустым если только MAX)"
                    className="w-full px-3.5 py-2.5 rounded-xl font-roboto text-[13px] text-white/80 outline-none mb-2.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />

                  {/* MAX чат */}
                  <button onClick={() => setSendMax(v => !v)}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all mb-3"
                    style={{
                      background: sendMax ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${sendMax ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0"
                      style={{ background: sendMax ? "#FFD700" : "rgba(255,255,255,0.1)" }}>
                      {sendMax && <Icon name="Check" size={12} className="text-black" />}
                    </div>
                    <div className="text-left">
                      <div className="font-roboto text-[13px] text-white/80">Отправить в общий чат MAX</div>
                      <div className="font-roboto text-[10px] text-white/35">Группа Скупка24 · все сотрудники увидят прайс</div>
                    </div>
                  </button>

                  <button onClick={handleSend} disabled={sending || !canSend}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-widest text-black transition-all disabled:opacity-40 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #FFD700 0%, #f59e0b 60%, #d97706 100%)",
                      boxShadow: canSend && !sending ? "0 4px 24px rgba(255,215,0,0.4)" : "none",
                    }}>
                    <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                    <Icon name={sending ? "Loader2" : "Send"} size={16}
                      className={`relative z-10 ${sending ? "animate-spin" : ""}`} />
                    <span className="relative z-10">{sending ? "Отправляю…" : "Отправить прайс"}</span>
                  </button>
                </div>
              </div>

              {result && (
                <div className="flex items-center gap-2 text-[12px] text-green-400 bg-green-500/10 rounded-xl px-3 py-2">
                  <Icon name="CheckCircle2" size={14} />
                  {result}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Кнопка закрыть */}
            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-white/[0.06]"
              style={{ background: "rgba(17,17,17,0.98)" }}>
              <button onClick={() => setOpen(false)}
                className="w-full py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase tracking-wide text-white/40 transition-all hover:text-white/60"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
