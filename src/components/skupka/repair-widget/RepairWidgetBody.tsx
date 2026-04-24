import Icon from "@/components/ui/icon";
import RepairStatusTab from "./RepairStatusTab";
import RepairForm from "./RepairForm";
import { Part, ExtraWork, OrderStatus, ClientInfo } from "./types";

interface RepairWidgetBodyProps {
  tab: "form" | "status";
  setTab: (t: "form" | "status") => void;

  // form state
  form: { name: string; phone: string; model: string; fault: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; model: string; fault: string }>>;
  sending: boolean;
  orderId: number | null;
  agreed: boolean;
  setAgreed: React.Dispatch<React.SetStateAction<boolean>>;
  canSubmit: boolean;
  grandTotal: number;

  // parts
  selectedPart: Part | null;
  clientInfo: ClientInfo | null;
  partsLoading: boolean;
  parts: Part[];
  showPartsList: boolean;
  groupedParts: Record<string, Part[]>;
  extraWorks: string[];
  extraWorksList: ExtraWork[];
  extraTotal: number;

  // callbacks
  onSelectPart: (p: Part) => void;
  onToggleExtra: (id: string) => void;
  onChangeSelection: () => void;
  onSubmit: () => void;
  onReset: () => void;

  // status
  statusId: string;
  setStatusId: (v: string) => void;
  statusLoading: boolean;
  statusError: string;
  statusResult: OrderStatus | null;
  phoneResults: OrderStatus[];
  phoneLoading: boolean;
  phoneError: string;
  onCheckStatus: () => void;
  onCheckByPhone: (phone: string) => void;
}

const FEATURES: { icon: Parameters<typeof Icon>[0]["name"]; text: string }[] = [
  { icon: "ShieldCheck", text: "Бесплатная диагностика" },
  { icon: "UserCheck", text: "Профессиональные мастера" },
  { icon: "Star", text: 'Комплектующие "Original"' },
];

const RepairWidgetBody = (p: RepairWidgetBodyProps) => (
  <div className="mt-3">
    {/* Преимущества */}
    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
      {FEATURES.map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-1">
          <Icon name={icon} size={11} className="text-[#FFD700]" />
          <span className="font-roboto text-[10px] text-white/50">{text}</span>
        </div>
      ))}
    </div>

    {/* Табы */}
    <div className="flex gap-1 mb-3">
      {[{ key: "form", label: "Заявка" }, { key: "status", label: "Статус заявки" }].map(t => (
        <button key={t.key} onClick={() => p.setTab(t.key as "form" | "status")}
          className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${
            p.tab === t.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"
          }`}>
          {t.label}
        </button>
      ))}
    </div>

    {/* Статус заявки */}
    {p.tab === "status" && (
      <RepairStatusTab
        statusId={p.statusId}
        setStatusId={p.setStatusId}
        statusLoading={p.statusLoading}
        statusError={p.statusError}
        statusResult={p.statusResult}
        onCheck={p.onCheckStatus}
        onCheckByPhone={p.onCheckByPhone}
        phoneResults={p.phoneResults}
        phoneLoading={p.phoneLoading}
        phoneError={p.phoneError}
      />
    )}

    {/* Форма заявки */}
    {p.tab === "form" && (
      <RepairForm
        form={p.form}
        setForm={p.setForm}
        sending={p.sending}
        orderId={p.orderId}
        agreed={p.agreed}
        setAgreed={p.setAgreed}
        canSubmit={p.canSubmit}
        grandTotal={p.grandTotal}
        selectedPart={p.selectedPart}
        clientInfo={p.clientInfo}
        partsLoading={p.partsLoading}
        parts={p.parts}
        showPartsList={p.showPartsList}
        groupedParts={p.groupedParts}
        extraWorks={p.extraWorks}
        extraWorksList={p.extraWorksList}
        extraTotal={p.extraTotal}
        onSelectPart={p.onSelectPart}
        onToggleExtra={p.onToggleExtra}
        onChangeSelection={p.onChangeSelection}
        onSubmit={p.onSubmit}
        onReset={p.onReset}
        onCheckStatus={p.onCheckStatus}
        setStatusId={p.setStatusId}
        setTab={p.setTab}
      />
    )}
  </div>
);

export default RepairWidgetBody;
