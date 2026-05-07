import { useState, useEffect, useRef } from "react";
import RepairWidgetHeader from "./repair-widget/RepairWidgetHeader";
import RepairWidgetBody from "./repair-widget/RepairWidgetBody";
import { useRepairParts } from "./repair-widget/useRepairParts";
import { useRepairStatus } from "./repair-widget/useRepairStatus";
import { useRepairSubmit } from "./repair-widget/useRepairSubmit";

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Открыть виджет ремонта извне (по событию или хэшу #repair) и проскроллить к нему
  useEffect(() => {
    const openAndScroll = () => {
      setOpen(true);
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };
    const onCustom = () => openAndScroll();
    const onHash = () => {
      if (window.location.hash === "#repair") openAndScroll();
    };
    window.addEventListener("open-repair", onCustom);
    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#repair") openAndScroll();
    return () => {
      window.removeEventListener("open-repair", onCustom);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const [form, setForm] = useState({ name: "", phone: "", model: "", fault: "" });
  const [agreed, setAgreed] = useState(false);

  const parts = useRepairParts({ model: form.model, phone: form.phone });
  const status = useRepairStatus();
  const order = useRepairSubmit();

  const canSubmit = !!(form.name && form.phone && form.model && form.fault && agreed);

  const handleSubmit = () => order.submit({
    form,
    selectedPart: parts.selectedPart,
    extraWorks: parts.extraWorks,
    extraWorksList: parts.extraWorksList,
    grandTotal: parts.grandTotal,
  });

  const reset = () => {
    setForm({ name: "", phone: "", model: "", fault: "" });
    setAgreed(false);
    order.resetOrder();
    parts.resetPartsState();
  };

  return (
    <div ref={rootRef} id="repair" className="hero-premium-btn group relative bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm border-2 border-[#FFD700]/30 hover:border-[#FFD700]/70 px-4 py-4 w-full rounded-xl overflow-hidden scroll-mt-24 transition-all">
      <span aria-hidden className="absolute top-0 left-0 right-0 h-px opacity-70" style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.9), transparent)" }} />
      <span aria-hidden className="absolute top-1.5 left-1.5 w-3 h-3 border-l-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute top-1.5 right-1.5 w-3 h-3 border-r-2 border-t-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-[#FFD700]/70 group-hover:border-[#FFD700] transition-colors" />

      <div className="relative">
        <RepairWidgetHeader open={open} onToggle={() => setOpen(v => !v)} />
      </div>

      {open && (
        <RepairWidgetBody
          tab={tab}
          setTab={setTab}
          form={form}
          setForm={setForm}
          sending={order.sending}
          orderId={order.orderId}
          agreed={agreed}
          setAgreed={setAgreed}
          canSubmit={canSubmit}
          grandTotal={parts.grandTotal}
          selectedPart={parts.selectedPart}
          clientInfo={parts.clientInfo}
          partsLoading={parts.partsLoading}
          parts={parts.parts}
          showPartsList={parts.showPartsList}
          groupedParts={parts.groupedParts}
          extraWorks={parts.extraWorks}
          extraWorksList={parts.extraWorksList}
          extraTotal={parts.extraTotal}
          onSelectPart={parts.handleSelectPart}
          onToggleExtra={parts.toggleExtra}
          onChangeSelection={parts.changeSelection}
          onSubmit={handleSubmit}
          onReset={reset}
          statusId={status.statusId}
          setStatusId={status.setStatusId}
          statusLoading={status.statusLoading}
          statusError={status.statusError}
          statusResult={status.statusResult}
          phoneResults={status.phoneResults}
          phoneLoading={status.phoneLoading}
          phoneError={status.phoneError}
          onCheckStatus={status.checkStatus}
          onCheckByPhone={status.checkStatusByPhone}
        />
      )}
    </div>
  );
}