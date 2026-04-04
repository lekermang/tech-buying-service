import { useState } from "react";
import Icon from "@/components/ui/icon";

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";
const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";

const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  in_progress: "text-blue-400",
  waiting_parts: "text-orange-400",
  ready: "text-[#FFD700]",
  done: "text-green-400",
  cancelled: "text-red-400",
};

type OrderStatus = {
  id: number; name: string; model: string; repair_type: string;
  status: string; status_label: string; admin_note: string | null;
};

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors";

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", model: "", fault: "" });
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [statusId, setStatusId] = useState("");
  const [statusResult, setStatusResult] = useState<OrderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.model || !form.fault) return;
    setSending(true);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          model: form.model,
          repair_type: "Ремонт",
          comment: form.fault,
        }),
      });
      const data = await res.json();
      if (data.order_id) setOrderId(data.order_id);
    } catch (_e) { /* ignore */ }
    setSending(false);
  };

  const checkStatus = async () => {
    if (!statusId.trim()) return;
    setStatusLoading(true);
    setStatusError("");
    setStatusResult(null);
    try {
      const res = await fetch(REPAIR_STATUS_URL + "?id=" + statusId.trim());
      const data = await res.json();
      if (res.ok) setStatusResult(data);
      else setStatusError(data.error || "Заявка не найдена");
    } catch {
      setStatusError("Ошибка соединения");
    }
    setStatusLoading(false);
  };

  const reset = () => {
    setForm({ name: "", phone: "", model: "", fault: "" });
    setOrderId(null);
  };

  const canSubmit = form.name && form.phone && form.model && form.fault;

  return (
    <div className="border border-white/10 bg-black/30 px-3 py-3 w-full">
      <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={11} className="text-black" />
          </div>
          <span className="font-oswald font-bold text-xs uppercase text-white tracking-wide">Ремонт телефонов</span>
          <span className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-1.5 py-0.5 leading-none">От 20 мин!</span>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/40" />
      </button>

      {open && (
        <div className="mt-3">
          {/* Табы */}
          <div className="flex gap-1 mb-3">
            {[{ key: "form", label: "Заявка" }, { key: "status", label: "Статус заявки" }].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as "form" | "status")}
                className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${
                  tab === t.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Статус заявки */}
          {tab === "status" && (
            <div>
              <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">Введите номер заявки</div>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkStatus()}
                  placeholder="Например: 42"
                  className={INP}
                />
                <button
                  onClick={checkStatus}
                  disabled={statusLoading}
                  className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0"
                >
                  {statusLoading ? "..." : "Проверить"}
                </button>
              </div>
              {statusError && (
                <div className="text-red-400 font-roboto text-[10px] flex items-center gap-1">
                  <Icon name="AlertCircle" size={11} /> {statusError}
                </div>
              )}
              {statusResult && (
                <div className="border border-white/10 p-2.5 bg-black/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-roboto text-white/40 text-[10px]">Заявка #{statusResult.id}</span>
                    <span className={`font-oswald font-bold text-xs ${STATUS_COLOR[statusResult.status] || "text-white"}`}>
                      {statusResult.status_label}
                    </span>
                  </div>
                  <div className="font-roboto text-white/70 text-[10px]">
                    {statusResult.model && <span>{statusResult.model} · </span>}
                    {statusResult.repair_type}
                  </div>
                  {statusResult.admin_note && (
                    <div className="mt-1.5 font-roboto text-white/50 text-[10px] border-t border-white/10 pt-1.5">
                      {statusResult.admin_note}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Форма заявки */}
          {tab === "form" && (
            <>
              {orderId ? (
                <div className="border-t border-[#FFD700]/20 pt-2">
                  <div className="flex items-center gap-1.5 text-[#FFD700] font-roboto text-xs mb-2">
                    <Icon name="CheckCircle" size={13} />
                    Заявка #{orderId} принята! Перезвоним через 15 мин.
                  </div>
                  <div className="font-roboto text-white/40 text-[10px] mb-2">
                    Сохраните номер — по нему можно проверить статус ремонта
                  </div>
                  <div className="flex gap-3">
                    <button onClick={reset} className="text-white/40 hover:text-white font-roboto text-[10px] transition-colors">
                      Новая заявка
                    </button>
                    <button
                      onClick={() => { setStatusId(String(orderId)); setTab("status"); checkStatus(); }}
                      className="text-[#FFD700] hover:underline font-roboto text-[10px]"
                    >
                      Проверить статус →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ваше имя *"
                    className={INP}
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Телефон *"
                    className={INP}
                  />
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                    placeholder="Модель телефона * (iPhone 14, Samsung A54...)"
                    className={INP}
                  />
                  <textarea
                    value={form.fault}
                    onChange={(e) => setForm((p) => ({ ...p, fault: e.target.value }))}
                    placeholder="Заявленная неисправность * (не включается, разбит экран...)"
                    rows={2}
                    className={INP + " resize-none"}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={sending || !canSubmit}
                    className="w-full bg-[#FFD700] text-black font-oswald font-bold px-3 py-2.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-40"
                  >
                    {sending ? "Отправляю..." : "Записаться на ремонт"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}