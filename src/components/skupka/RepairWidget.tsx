import { useState } from "react";
import RepairWidgetHeader from "./repair-widget/RepairWidgetHeader";
import RepairWidgetBody from "./repair-widget/RepairWidgetBody";
import { useRepairParts } from "./repair-widget/useRepairParts";
import { useRepairStatus } from "./repair-widget/useRepairStatus";
import { useRepairSubmit } from "./repair-widget/useRepairSubmit";

export default function RepairWidget() {
  const [tab, setTab] = useState<"form" | "status">("form");
  const [open, setOpen] = useState(false);

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
    <div className="border border-white/10 bg-black/30 px-4 py-5 w-full">
      <RepairWidgetHeader open={open} onToggle={() => setOpen(v => !v)} />

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
