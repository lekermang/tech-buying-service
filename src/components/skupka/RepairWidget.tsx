import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";
const REPAIR_STATUS_URL = "https://functions.poehali.dev/1fb5db63-4cb6-41be-af0f-80d6f9ce8fdf";
const REPAIR_PARTS_URL = "https://functions.poehali.dev/68da5b17-ae5f-4568-8e27-0d945b995d82";

const STATUS_COLOR: Record<string, string> = {
  new: "text-white/60",
  in_progress: "text-blue-400",
  waiting_parts: "text-orange-400",
  ready: "text-[#FFD700]",
  done: "text-green-400",
  cancelled: "text-red-400",
};

const PART_TYPE_LABEL: Record<string, string> = {
  display: "Дисплей",
  battery: "Аккумулятор",
  glass: "Стекло / тачскрин",
  camera_glass: "Стекло камеры",
  flex_board: "Шлейф / плата",
  accessory: "Прочее",
};

const QUALITY_COLOR: Record<string, string> = {
  ORIG: "text-[#FFD700]",
  AAA: "text-green-400",
  AA: "text-blue-400",
  A: "text-white/50",
};

type Part = {
  id: string; name: string; category: string;
  price: number; stock: number; quality: string;
  part_type: string; labor_cost: number; total: number;
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

  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const [statusId, setStatusId] = useState("");
  const [statusResult, setStatusResult] = useState<OrderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const model = form.model.trim();
    setSelectedPart(null);
    setParts([]);
    if (model.length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPartsLoading(true);
      try {
        const res = await fetch(`${REPAIR_PARTS_URL}?model=${encodeURIComponent(model)}`);
        const data = await res.json();
        setParts(data.parts || []);
      } catch { /* ignore */ }
      setPartsLoading(false);
    }, 600);
  }, [form.model]);

  const groupedParts = parts.reduce<Record<string, Part[]>>((acc, p) => {
    const key = p.part_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

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
          repair_type: selectedPart
            ? `${PART_TYPE_LABEL[selectedPart.part_type] || selectedPart.part_type} (${selectedPart.quality})`
            : form.fault,
          price: selectedPart ? selectedPart.total : undefined,
          comment: form.fault,
        }),
      });
      const data = await res.json();
      if (data.order_id) {
        setOrderId(data.order_id);
        ymGoal(Goals.FORM_SUCCESS, { source: "repair_widget" });
      }
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
    setParts([]);
    setSelectedPart(null);
  };

  const canSubmit = form.name && form.phone && form.model && form.fault;

  return (
    <div className="border border-white/10 bg-black/30 px-4 py-5 w-full">
      <button className="flex items-center justify-between w-full" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={20} className="text-black" />
          </div>
          <div>
            <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight">Ремонт телефонов</span>
            <span className="bg-[#FFD700] text-black font-oswald font-bold text-[11px] px-1.5 py-0.5 leading-none mt-1 inline-block">От 20 мин!</span>
          </div>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={20} className="text-white/40" />
      </button>

      {open && (
        <div className="mt-3">
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

                  {/* Модель + поиск запчастей */}
                  <div>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                      placeholder="Модель телефона * (напр: iPhone 13)"
                      className={INP}
                    />

                    {/* Индикатор поиска */}
                    {partsLoading && (
                      <div className="text-white/30 font-roboto text-[10px] mt-1 flex items-center gap-1">
                        <Icon name="Loader" size={10} className="animate-spin" /> Ищу запчасти...
                      </div>
                    )}

                    {/* Результаты поиска по типам */}
                    {!partsLoading && parts.length > 0 && (
                      <div className="mt-2 border border-white/10 bg-black/40">
                        <div className="px-2 py-1.5 border-b border-white/5 font-roboto text-[9px] text-white/30 uppercase tracking-wide flex items-center gap-1">
                          <Icon name="Wrench" size={9} /> Выберите тип ремонта — цена рассчитается автоматически
                        </div>
                        {Object.entries(groupedParts).map(([ptype, items]) => (
                          <div key={ptype} className="border-b border-white/5 last:border-0">
                            <div className="px-2 py-1 font-roboto text-[9px] text-white/40 uppercase tracking-wide bg-white/5">
                              {PART_TYPE_LABEL[ptype] || ptype}
                            </div>
                            {items.map((part) => {
                              const isSelected = selectedPart?.id === part.id;
                              return (
                                <button
                                  key={part.id}
                                  onClick={() => setSelectedPart(isSelected ? null : part)}
                                  className={`w-full text-left px-2 py-1.5 flex items-center justify-between transition-colors ${
                                    isSelected ? "bg-[#FFD700]/10 border-l-2 border-[#FFD700]" : "hover:bg-white/5 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className={`font-oswald font-bold text-[10px] mr-1.5 ${QUALITY_COLOR[part.quality] || "text-white/50"}`}>
                                      {part.quality}
                                    </span>
                                    <span className="font-roboto text-[10px] text-white/70 truncate">{part.name}</span>
                                    {part.stock <= 3 && part.stock > 0 && (
                                      <span className="ml-1 text-orange-400 font-roboto text-[9px]">мало</span>
                                    )}
                                  </div>
                                  <div className="shrink-0 ml-2 text-right">
                                    <div className="font-oswald font-bold text-xs text-[#FFD700]">
                                      {part.total.toLocaleString("ru-RU")} ₽
                                    </div>
                                    <div className="font-roboto text-[9px] text-white/30">
                                      зап. {part.price.toLocaleString("ru-RU")} + работа {part.labor_cost.toLocaleString("ru-RU")}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Выбранная запчасть — итог */}
                    {selectedPart && (
                      <div className="mt-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 px-2.5 py-2 flex items-center justify-between">
                        <div>
                          <div className="font-roboto text-[10px] text-white/60">Итоговая стоимость</div>
                          <div className="font-roboto text-[9px] text-white/40">{selectedPart.name}</div>
                        </div>
                        <div className="font-oswald font-bold text-base text-[#FFD700]">
                          {selectedPart.total.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    )}

                    {!partsLoading && form.model.trim().length >= 3 && parts.length === 0 && (
                      <div className="text-white/30 font-roboto text-[10px] mt-1">
                        Запчасти не найдены — опишите проблему ниже
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={form.fault}
                    onChange={(e) => setForm((p) => ({ ...p, fault: e.target.value }))}
                    placeholder="Опишите проблему * (не включается, разбит экран...)"
                    className={INP}
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || sending}
                    className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                  >
                    {sending ? "Отправляем..." : "Отправить заявку"}
                  </button>
                  <div className="font-roboto text-white/20 text-[9px] text-center">
                    Перезвоним в течение 15 минут
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
