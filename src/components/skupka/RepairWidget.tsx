import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";
const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";
const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";

const SIMPLE_REPAIRS = [
  { type: "Замена гнезда зарядки", priceFrom: 600, priceTo: 1000 },
  { type: "Замена кнопки", priceFrom: 600, priceTo: 800 },
  { type: "Замена стекла (без дисплея)", priceFrom: 800, priceTo: 1200 },
  { type: "Чистка от влаги", priceFrom: 700, priceTo: 1000 },
  { type: "Замена разъёма наушников", priceFrom: 600, priceTo: 900 },
  { type: "Другое", priceFrom: 600, priceTo: 2000 },
];

const REPAIR_COST = 1500;

const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  in_progress: "text-blue-400",
  waiting_parts: "text-orange-400",
  ready: "text-[#FFD700]",
  done: "text-green-400",
  cancelled: "text-red-400",
};

type PartItem = { model: string; price: number };
type PartsData = { displays: PartItem[]; batteries: PartItem[]; repair_cost: number } | null;
type OrderStatus = { id: number; name: string; model: string; repair_type: string; status: string; status_label: string; admin_note: string | null };

const normalizeModel = (name: string): string =>
  name.replace(/дисплей/i, "").replace(/аккумулятор/i, "").replace(/для\s*/i, "").replace(/\(.*?\)/g, "").trim();

export default function RepairWidget() {
  const [step, setStep] = useState<"type" | "model" | "form" | "status">("type");
  const [repairType, setRepairType] = useState<"display" | "battery" | "simple" | null>(null);
  const [simpleRepair, setSimpleRepair] = useState<(typeof SIMPLE_REPAIRS)[0] | null>(null);
  const [modelQuery, setModelQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState<PartItem | null>(null);
  const [partsData, setPartsData] = useState<PartsData>(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", model: "", comment: "" });
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  // статус заявки
  const [statusId, setStatusId] = useState("");
  const [statusResult, setStatusResult] = useState<OrderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPartsLoading(true);
    fetch(REPAIR_PARTS_URL + "?type=all")
      .then((r) => r.json())
      .then((d) => setPartsData(d))
      .catch(() => {})
      .finally(() => setPartsLoading(false));
  }, [open]);

  const parts =
    repairType === "display" ? partsData?.displays || []
    : repairType === "battery" ? partsData?.batteries || []
    : [];

  const filtered = parts.filter((p) =>
    normalizeModel(p.model).toLowerCase().includes(modelQuery.toLowerCase())
  );

  const totalPrice = selectedPart ? selectedPart.price + REPAIR_COST : null;

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return;
    setSending(true);
    const repairLabel =
      repairType === "display" ? "Замена дисплея"
      : repairType === "battery" ? "Замена аккумулятора"
      : simpleRepair?.type || "Ремонт";

    const priceVal = totalPrice ?? (simpleRepair ? Math.round((simpleRepair.priceFrom + simpleRepair.priceTo) / 2) : null);

    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          model: form.model || (selectedPart ? normalizeModel(selectedPart.model) : modelQuery) || null,
          repair_type: repairLabel,
          price: priceVal,
          comment: form.comment || null,
        }),
      });
      const data = await res.json();
      if (data.order_id) setOrderId(data.order_id);
    } catch (_e) {
      // ignore
    }
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
    setStep("type");
    setRepairType(null);
    setSimpleRepair(null);
    setModelQuery("");
    setSelectedPart(null);
    setForm({ name: "", phone: "", model: "", comment: "" });
    setOrderId(null);
  };

  return (
    <div className="border border-white/10 bg-black/30 p-3 mb-3 w-full max-w-sm">
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
            {[
              { key: "type", label: "Заявка" },
              { key: "status", label: "Статус заявки" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setStep(t.key as typeof step)}
                className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${
                  (step === "type" || step === "model" || step === "form") && t.key === "type"
                    ? "border-[#FFD700] text-[#FFD700]"
                    : step === "status" && t.key === "status"
                    ? "border-[#FFD700] text-[#FFD700]"
                    : "border-white/10 text-white/40 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Вкладка статуса */}
          {step === "status" && (
            <div>
              <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">
                Введите номер заявки
              </div>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkStatus()}
                  placeholder="Например: 42"
                  className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
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

          {/* Вкладка заявки */}
          {step !== "status" && (
            <>
              {orderId ? (
                <div className="border-t border-[#FFD700]/20 pt-2">
                  <div className="flex items-center gap-1.5 text-[#FFD700] font-roboto text-xs mb-2">
                    <Icon name="CheckCircle" size={13} />
                    Заявка #{orderId} принята! Перезвоним через 15 мин.
                  </div>
                  <div className="font-roboto text-white/40 text-[10px] mb-1">Сохраните номер заявки — по нему можно проверить статус ремонта</div>
                  <div className="flex gap-2">
                    <button onClick={reset} className="text-white/40 hover:text-white font-roboto text-[10px]">
                      Новая заявка
                    </button>
                    <button
                      onClick={() => { setStatusId(String(orderId)); setStep("status"); checkStatus(); }}
                      className="text-[#FFD700] hover:underline font-roboto text-[10px]"
                    >
                      Проверить статус →
                    </button>
                  </div>
                </div>
              ) : step === "type" ? (
                <div className="border-t border-white/10 pt-2">
                  <div className="font-roboto text-white/40 text-[10px] mb-2 uppercase tracking-wide">Выберите тип ремонта</div>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: "display", label: "Замена дисплея", icon: "Monitor" },
                      { id: "battery", label: "Замена аккумулятора", icon: "Battery" },
                      { id: "simple", label: "Другой ремонт", icon: "Wrench" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setRepairType(t.id as typeof repairType); setStep("model"); }}
                        className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-[#FFD700]/50 hover:text-[#FFD700] text-white/70 font-roboto text-xs transition-colors text-left"
                      >
                        <Icon name={t.icon} size={12} />
                        {t.label}
                        {(t.id === "display" || t.id === "battery") && <span className="ml-auto text-white/30 text-[10px]">цена по каталогу</span>}
                        {t.id === "simple" && <span className="ml-auto text-white/30 text-[10px]">600–2000 ₽</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === "model" && repairType !== "simple" ? (
                <div className="border-t border-white/10 pt-2">
                  <button onClick={() => setStep("type")} className="flex items-center gap-1 text-white/40 hover:text-white font-roboto text-[10px] mb-2 transition-colors">
                    <Icon name="ChevronLeft" size={11} /> Назад
                  </button>
                  <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">
                    {repairType === "display" ? "Замена дисплея" : "Замена аккумулятора"} — введите модель
                  </div>
                  <input
                    type="text"
                    value={modelQuery}
                    onChange={(e) => { setModelQuery(e.target.value); setSelectedPart(null); }}
                    placeholder="iPhone 14, Samsung S23..."
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors mb-1.5"
                  />
                  {partsLoading && <div className="text-white/30 font-roboto text-[10px] py-1">Загружаю каталог...</div>}
                  {modelQuery.length > 1 && !partsLoading && (
                    <div className="max-h-32 overflow-y-auto border border-white/10 mb-2">
                      {filtered.length === 0 ? (
                        <div className="px-3 py-2 font-roboto text-white/40 text-[10px]">Не найдено — оставьте заявку, уточним цену</div>
                      ) : (
                        filtered.slice(0, 20).map((p, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelectedPart(p); setModelQuery(normalizeModel(p.model)); }}
                            className={`w-full flex justify-between px-3 py-1.5 font-roboto text-xs transition-colors text-left border-b border-white/5 last:border-0 ${
                              selectedPart?.model === p.model ? "bg-[#FFD700]/10 text-[#FFD700]" : "text-white/70 hover:bg-white/5"
                            }`}
                          >
                            <span>{normalizeModel(p.model)}</span>
                            <span className="text-[#FFD700] font-bold">{(p.price + REPAIR_COST).toLocaleString("ru-RU")} ₽</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedPart && (
                    <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2 mb-2">
                      <div className="font-roboto text-[10px] text-white/40 mb-0.5">Итого:</div>
                      <div className="flex justify-between items-baseline">
                        <span className="font-roboto text-[10px] text-white/50">Запчасть {selectedPart.price.toLocaleString("ru-RU")} ₽ + работа {REPAIR_COST} ₽</span>
                        <span className="font-oswald font-bold text-[#FFD700] text-base">{totalPrice!.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setForm(p => ({ ...p, model: selectedPart ? normalizeModel(selectedPart.model) : modelQuery })); setStep("form"); }}
                    disabled={!modelQuery}
                    className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-40"
                  >
                    Далее → Оставить заявку
                  </button>
                </div>
              ) : step === "model" && repairType === "simple" ? (
                <div className="border-t border-white/10 pt-2">
                  <button onClick={() => setStep("type")} className="flex items-center gap-1 text-white/40 hover:text-white font-roboto text-[10px] mb-2 transition-colors">
                    <Icon name="ChevronLeft" size={11} /> Назад
                  </button>
                  <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">Выберите вид работы</div>
                  <div className="grid grid-cols-1 gap-1 mb-2">
                    {SIMPLE_REPAIRS.map((r) => (
                      <button
                        key={r.type}
                        onClick={() => { setSimpleRepair(r); setStep("form"); }}
                        className="flex items-center justify-between px-3 py-2 border border-white/10 hover:border-[#FFD700]/50 hover:text-[#FFD700] text-white/70 font-roboto text-xs transition-colors"
                      >
                        <span>{r.type}</span>
                        <span className="text-white/40 text-[10px]">{r.priceFrom}–{r.priceTo} ₽</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : step === "form" ? (
                <div className="border-t border-white/10 pt-2">
                  <button onClick={() => setStep("model")} className="flex items-center gap-1 text-white/40 hover:text-white font-roboto text-[10px] mb-2 transition-colors">
                    <Icon name="ChevronLeft" size={11} /> Назад
                  </button>
                  {simpleRepair && (
                    <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2 mb-2">
                      <div className="font-roboto text-[10px] text-white/50">{simpleRepair.type}</div>
                      <div className="font-oswald font-bold text-[#FFD700] text-sm">{simpleRepair.priceFrom}–{simpleRepair.priceTo} ₽</div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ваше имя *"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Телефон *"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                      placeholder="Модель телефона (iPhone 14, Samsung A54...)"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <textarea
                      value={form.comment}
                      onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                      placeholder="Опишите поломку (не включается, разбит экран, не заряжается...)"
                      rows={2}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors resize-none"
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={sending || !form.name || !form.phone}
                      className="w-full bg-[#FFD700] text-black font-oswald font-bold px-3 py-2.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50"
                    >
                      {sending ? "Отправляю..." : "Записаться на ремонт"}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}