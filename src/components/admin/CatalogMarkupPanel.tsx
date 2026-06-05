import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import { CATALOG_URL, PRICE_URL } from "./catalogTypes";

interface Props {
  token: string;
  onMarkupApplied: () => void;
}

export function CatalogMarkupPanel({ token, onMarkupApplied }: Props) {
  const [markupApplying, setMarkupApplying] = useState(false);
  const [markupResult, setMarkupResult] = useState<{ updated: number; wholesale_delta: number; retail_delta: number } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; to?: string; error?: string } | null>(null);
  const [emailInput, setEmailInput] = useState("lekermanya@yandex.ru");
  const [priceType, setPriceType] = useState<"retail" | "wholesale">("retail");

  const handleBulkMarkup = async (wholesaleDelta: number, retailDelta: number) => {
    if (!confirm(`Применить ко всем позициям:\nОпт: +${wholesaleDelta} ₽\nРозница: +${retailDelta} ₽?`)) return;
    setMarkupApplying(true); setMarkupResult(null);
    try {
      const res = await fetch(
        `${CATALOG_URL}?action=bulk_markup&wholesale_delta=${wholesaleDelta}&retail_delta=${retailDelta}`,
        { headers: { ...adminHeaders(token) } }
      );
      const d = await res.json();
      if (d.ok) { setMarkupResult(d); onMarkupApplied(); }
      else alert(d.error || "Ошибка");
    } catch { alert("Ошибка сети"); }
    setMarkupApplying(false);
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) return;
    setEmailSending(true); setEmailResult(null);
    try {
      const res = await fetch(`${PRICE_URL}?action=send_price_email`, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), price_type: priceType }),
      });
      const d = await res.json();
      setEmailResult(d.ok ? { ok: true, to: d.to } : { ok: false, error: d.error });
    } catch { setEmailResult({ ok: false, error: "Ошибка сети" }); }
    setEmailSending(false);
  };

  return (
    <div className="mb-4 border border-[#2a2a2a] bg-[#111]">
      <div className="px-3 py-2 border-b border-[#222] font-roboto text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-2">
        <Icon name="Tag" size={11} />
        Наценка и прайс
      </div>
      <div className="p-3 flex flex-wrap gap-4 items-end">

        {/* Кнопки быстрой наценки */}
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Массовая наценка ко всем позициям</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkMarkup(500, 1000)}
              disabled={markupApplying}
              className="flex items-center gap-1.5 border border-[#FFD700]/35 text-[#FFD700] font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-[#FFD700]/10 transition-colors disabled:opacity-40">
              <Icon name="Plus" size={12} />
              Стандарт (+500 опт / +1000 розница)
            </button>
            <button
              onClick={() => handleBulkMarkup(300, 700)}
              disabled={markupApplying}
              className="flex items-center gap-1.5 border border-white/15 text-white/50 font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-white/5 transition-colors disabled:opacity-40">
              <Icon name="Plus" size={12} />
              Минимум (+300 / +700)
            </button>
          </div>
          {markupApplying && (
            <div className="font-roboto text-[10px] text-[#FFD700]/60 mt-1 flex items-center gap-1">
              <Icon name="Loader" size={10} className="animate-spin" />Применяю...
            </div>
          )}
          {markupResult && (
            <div className="font-roboto text-[10px] text-[#6ee7b7] mt-1 flex items-center gap-1">
              <Icon name="CheckCircle" size={10} />
              Обновлено {markupResult.updated} позиций · опт +{markupResult.wholesale_delta}₽ · розница +{markupResult.retail_delta}₽
            </div>
          )}
        </div>

        {/* Вертикальный разделитель */}
        <div className="hidden sm:block w-px bg-[#2a2a2a] self-stretch" />

        {/* Отправка прайса на email */}
        <div className="flex-1 min-w-[280px]">
          <div className="font-roboto text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Отправить прайс на email</div>
          <div className="flex gap-2 items-center">
            {/* Тип цены */}
            <div className="flex border border-[#333]">
              {(["retail", "wholesale"] as const).map(t => (
                <button key={t} onClick={() => setPriceType(t)}
                  className="px-2.5 py-1.5 font-roboto text-[10px] uppercase transition-colors"
                  style={{ background: priceType === t ? "rgba(255,215,0,0.15)" : "transparent", color: priceType === t ? "#FFD700" : "rgba(255,255,255,0.35)" }}>
                  {t === "retail" ? "Розница" : "Опт"}
                </button>
              ))}
            </div>
            <input
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-2.5 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
            />
            <button
              onClick={handleSendEmail}
              disabled={emailSending || !emailInput.trim()}
              className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors disabled:opacity-40 whitespace-nowrap">
              <Icon name={emailSending ? "Loader" : "Send"} size={12} className={emailSending ? "animate-spin" : ""} />
              {emailSending ? "Отправляю..." : "Отправить"}
            </button>
          </div>
          {emailResult && (
            <div className={`font-roboto text-[10px] mt-1 flex items-center gap-1 ${emailResult.ok ? "text-[#6ee7b7]" : "text-[#fca5a5]"}`}>
              <Icon name={emailResult.ok ? "CheckCircle" : "AlertCircle"} size={10} />
              {emailResult.ok ? `Прайс отправлен на ${emailResult.to}` : `Ошибка: ${emailResult.error}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
