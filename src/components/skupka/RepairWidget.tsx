import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";
const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";
const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";

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
type OrderStatus = {
  id: number; name: string; model: string; repair_type: string;
  status: string; status_label: string; admin_note: string | null;
};

const normalizeModel = (name: string): string =>
  name.replace(/дисплей/i, "").replace(/аккумулятор/i, "").replace(/для\s*/i, "").replace(/\(.*?\)/g, "").trim();

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors";

type RepairKind = "display" | "battery" | "simple" | null;

const SIMPLE_REPAIRS = [
  { type: "Замена гнезда зарядки", priceTo: 1000 },
  { type: "Замена кнопки", priceTo: 800 },
  { type: "Замена стекла (без дисплея)", priceTo: 1200 },
  { type: "Чистка от влаги", priceTo: 1000 },
  { type: "Замена разъёма наушников", priceTo: 900 },
  { type: "Другое", priceTo: 2000 },
];

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);

  // Шаг 1: выбор типа
  const [repairKind, setRepairKind] = useState<RepairKind>(null);
  const [simpleType, setSimpleType] = useState<(typeof SIMPLE_REPAIRS)[0] | null>(null);

  // Каталог запчастей
  const [partsData, setPartsData] = useState<PartsData>(null);
  const [partsLoading, setPartsLoading] = useState(false);

  // Поиск по каталогу
  const [modelQuery, setModelQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState<PartItem | null>(null);

  // Форма клиента
  const [form, setForm] = useState({ name: "", phone: "", model: "", fault: "" });
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Статус заявки
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
    repairKind === "display" ? partsData?.displays || []
    : repairKind === "battery" ? partsData?.batteries || []
    : [];

  const filtered = parts.filter((p) =>
    normalizeModel(p.model).toLowerCase().includes(modelQuery.toLowerCase())
  );

  const catalogPrice = selectedPart ? selectedPart.price + REPAIR_COST : null;

  // Предварительная цена — максимум из диапазона (для клиента)
  const estimatedPrice: number | null =
    catalogPrice ??
    (simpleType ? simpleType.priceTo : null);

  const repairLabel =
    repairKind === "display" ? "Замена дисплея"
    : repairKind === "battery" ? "Замена аккумулятора"
    : simpleType?.type || null;

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
          repair_type: repairLabel || "Не указан",
          price: estimatedPrice,
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
    setRepairKind(null);
    setSimpleType(null);
    setModelQuery("");
    setSelectedPart(null);
    setForm({ name: "", phone: "", model: "", fault: "" });
    setOrderId(null);
  };

  const canSubmit = form.name && form.phone && form.model && form.fault && repairLabel;

  return (
    <div className="border border-white/10 bg-black/30 p-3 mb-3 w-full max-w-sm">
      {/* Заголовок-аккордеон */}
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

          {/* ── СТАТУС ЗАЯВКИ ── */}
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

          {/* ── ФОРМА ЗАЯВКИ ── */}
          {tab === "form" && (
            <>
              {orderId ? (
                /* Успех */
                <div className="border-t border-[#FFD700]/20 pt-2">
                  <div className="flex items-center gap-1.5 text-[#FFD700] font-roboto text-xs mb-2">
                    <Icon name="CheckCircle" size={13} />
                    Заявка #{orderId} принята! Перезвоним через 15 мин.
                  </div>
                  <div className="font-roboto text-white/40 text-[10px] mb-2">
                    Сохраните номер заявки — по нему можно проверить статус ремонта
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
                <div className="border-t border-white/10 pt-2 flex flex-col gap-2">

                  {/* Шаг 1: тип ремонта */}
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-0.5">Тип ремонта *</div>
                  <div className="grid grid-cols-1 gap-1 mb-1">
                    {[
                      { id: "display", label: "Замена дисплея", icon: "Monitor", hint: "цена по каталогу" },
                      { id: "battery", label: "Замена аккумулятора", icon: "BatteryCharging", hint: "цена по каталогу" },
                      { id: "simple", label: "Другой ремонт", icon: "Wrench", hint: "от 600 ₽" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setRepairKind(t.id as RepairKind); setSimpleType(null); setSelectedPart(null); setModelQuery(""); }}
                        className={`flex items-center gap-2 px-3 py-2 border transition-colors text-left text-xs font-roboto ${
                          repairKind === t.id
                            ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5"
                            : "border-white/10 text-white/60 hover:border-[#FFD700]/40 hover:text-white"
                        }`}
                      >
                        <Icon name={t.icon} size={12} />
                        {t.label}
                        <span className="ml-auto text-[10px] text-white/30">{t.hint}</span>
                      </button>
                    ))}
                  </div>

                  {/* Подвид «другого ремонта» */}
                  {repairKind === "simple" && (
                    <div>
                      <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">Вид работы *</div>
                      <div className="grid grid-cols-1 gap-1 mb-1">
                        {SIMPLE_REPAIRS.map((r) => (
                          <button
                            key={r.type}
                            onClick={() => setSimpleType(r)}
                            className={`flex items-center justify-between px-3 py-1.5 border text-xs font-roboto transition-colors ${
                              simpleType?.type === r.type
                                ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5"
                                : "border-white/10 text-white/60 hover:border-[#FFD700]/40"
                            }`}
                          >
                            <span>{r.type}</span>
                            <span className="text-[10px] text-white/30">до {r.priceTo.toLocaleString("ru-RU")} ₽</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Поиск по каталогу (дисплей / аккумулятор) */}
                  {(repairKind === "display" || repairKind === "battery") && (
                    <div>
                      <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide mb-1">
                        Поиск цены по модели (необязательно)
                      </div>
                      <input
                        type="text"
                        value={modelQuery}
                        onChange={(e) => { setModelQuery(e.target.value); setSelectedPart(null); }}
                        placeholder="iPhone 14, Samsung S23..."
                        className={INP}
                      />
                      {partsLoading && <div className="text-white/30 font-roboto text-[10px] py-1">Загружаю каталог...</div>}
                      {modelQuery.length > 1 && !partsLoading && (
                        <div className="max-h-28 overflow-y-auto border border-white/10 mt-1">
                          {filtered.length === 0 ? (
                            <div className="px-3 py-2 font-roboto text-white/40 text-[10px]">Не найдено — уточним цену при встрече</div>
                          ) : (
                            filtered.slice(0, 15).map((p, i) => (
                              <button
                                key={i}
                                onClick={() => { setSelectedPart(p); setModelQuery(normalizeModel(p.model)); setForm(f => ({ ...f, model: normalizeModel(p.model) })); }}
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
                        <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-1.5 mt-1 flex justify-between items-center">
                          <span className="font-roboto text-[10px] text-white/40">Предварительная цена</span>
                          <span className="font-oswald font-bold text-[#FFD700] text-sm">{catalogPrice!.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Поля контакта */}
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
                    placeholder="Заявленная неисправность * (не включается, разбит экран, не заряжается...)"
                    rows={2}
                    className={INP + " resize-none"}
                  />

                  {/* Итог цена */}
                  {estimatedPrice && (
                    <div className="flex items-center justify-between bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2">
                      <span className="font-roboto text-[10px] text-white/40">Предварительная цена (максимум)</span>
                      <span className="font-oswald font-bold text-[#FFD700]">{estimatedPrice.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  )}

                  {!repairLabel && (
                    <div className="font-roboto text-[10px] text-white/30 italic">
                      ← Выберите тип ремонта выше
                    </div>
                  )}

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