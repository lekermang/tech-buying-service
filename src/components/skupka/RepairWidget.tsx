import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import {
  REPAIR_ORDER_URL, REPAIR_STATUS_URL, REPAIR_PARTS_URL,
  PART_TYPE_LABEL, STATIC_EXTRAS,
  Part, ExtraWork, OrderStatus, ClientInfo,
} from "./repair-widget/types";
import RepairStatusTab from "./repair-widget/RepairStatusTab";
import RepairForm from "./repair-widget/RepairForm";

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", model: "", fault: "" });
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showPartsList, setShowPartsList] = useState(false);
  const [extraWorks, setExtraWorks] = useState<string[]>([]);
  const [extraWorksList, setExtraWorksList] = useState<ExtraWork[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  const [statusId, setStatusId] = useState("");
  const [statusResult, setStatusResult] = useState<OrderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const model = form.model.trim();
    setSelectedPart(null);
    setParts([]);
    setShowPartsList(false);
    setExtraWorks([]);
    if (model.length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPartsLoading(true);
      try {
        const res = await fetch(`${REPAIR_PARTS_URL}?model=${encodeURIComponent(model)}&phone=${encodeURIComponent(form.phone)}`);
        const data = await res.json();
        const fetched = data.parts || [];
        setParts(fetched);
        if (fetched.length > 0) setShowPartsList(true);
        setExtraWorksList(data.extra_works || []);
        setClientInfo(data.client || null);
      } catch { /* ignore */ }
      setPartsLoading(false);
    }, 600);
  }, [form.model, form.phone]);

  const groupedParts = parts.reduce<Record<string, Part[]>>((acc, p) => {
    if (!acc[p.part_type]) acc[p.part_type] = [];
    acc[p.part_type].push(p);
    return acc;
  }, {});

  const extraTotal = extraWorksList
    .filter(w => extraWorks.includes(String(w.id)))
    .reduce((s, w) => s + w.price, 0);

  const discountPct = clientInfo?.found ? (clientInfo.discount_pct || 0) : 0;
  const grandTotal = Math.round(((selectedPart?.total ?? 0) + extraTotal) * (1 - discountPct / 100));

  const toggleExtra = (id: string) =>
    setExtraWorks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSelectPart = (part: Part) => {
    setSelectedPart(part);
    setShowPartsList(false);
    setExtraWorks([]);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.model || !form.fault) return;
    setSending(true);
    const extraLabels = extraWorksList.filter(w => extraWorks.includes(String(w.id))).map(w => w.label);
    const staticExtraLabels = STATIC_EXTRAS.filter(w => extraWorks.includes(w.id)).map(w => w.label);
    const staticExtraTotal = STATIC_EXTRAS.filter(w => extraWorks.includes(w.id)).reduce((s, w) => s + w.price, 0);
    const allExtras = [...extraLabels, ...staticExtraLabels];
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          model: form.model,
          repair_type: selectedPart
            ? `${PART_TYPE_LABEL[selectedPart.part_type] || selectedPart.part_type}${allExtras.length ? " + " + allExtras.join(", ") : ""}`
            : [form.fault, ...staticExtraLabels].filter(Boolean).join(" + "),
          price: selectedPart ? grandTotal : (staticExtraTotal > 0 ? staticExtraTotal : undefined),
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
    setShowPartsList(false);
    setExtraWorks([]);
    setExtraWorksList([]);
    setClientInfo(null);
    setAgreed(false);
  };

  const canSubmit = !!(form.name && form.phone && form.model && form.fault && agreed);

  return (
    <div className="border border-white/10 bg-black/30 px-4 py-5 w-full">
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={20} className="text-black" />
          </div>
          <div>
            <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight">Ремонт телефонов</span>
            <span className="bg-[#FFD700] text-black font-oswald font-bold text-[11px] px-1.5 py-0.5 leading-none mt-1 inline-block">При вас за 20 минут · от 300 ₽</span>
          </div>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={20} className="text-white/40" />
      </button>

      {open && (
        <div className="mt-3">
          {/* Преимущества */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {[
              { icon: "ShieldCheck", text: "Бесплатная диагностика" },
              { icon: "UserCheck", text: "Профессиональные мастера" },
              { icon: "Star", text: 'Комплектующие "Original"' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1">
                <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={11} className="text-[#FFD700]" />
                <span className="font-roboto text-[10px] text-white/50">{text}</span>
              </div>
            ))}
          </div>

          {/* Табы */}
          <div className="flex gap-1 mb-3">
            {[{ key: "form", label: "Заявка" }, { key: "status", label: "Статус заявки" }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as "form" | "status")}
                className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${
                  tab === t.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Статус заявки */}
          {tab === "status" && (
            <RepairStatusTab
              statusId={statusId}
              setStatusId={setStatusId}
              statusLoading={statusLoading}
              statusError={statusError}
              statusResult={statusResult}
              onCheck={checkStatus}
            />
          )}

          {/* Форма заявки */}
          {tab === "form" && (
            <RepairForm
              form={form}
              setForm={setForm}
              sending={sending}
              orderId={orderId}
              agreed={agreed}
              setAgreed={setAgreed}
              canSubmit={canSubmit}
              grandTotal={grandTotal}
              selectedPart={selectedPart}
              clientInfo={clientInfo}
              partsLoading={partsLoading}
              parts={parts}
              showPartsList={showPartsList}
              groupedParts={groupedParts}
              extraWorks={extraWorks}
              extraWorksList={extraWorksList}
              extraTotal={extraTotal}
              onSelectPart={handleSelectPart}
              onToggleExtra={toggleExtra}
              onChangeSelection={() => { setShowPartsList(true); setSelectedPart(null); setExtraWorks([]); }}
              onSubmit={handleSubmit}
              onReset={reset}
              onCheckStatus={checkStatus}
              setStatusId={setStatusId}
              setTab={setTab}
            />
          )}
        </div>
      )}
    </div>
  );
}
