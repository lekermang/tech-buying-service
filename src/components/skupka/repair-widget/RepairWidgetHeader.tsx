import Icon from "@/components/ui/icon";

interface RepairWidgetHeaderProps {
  open: boolean;
  onToggle: () => void;
}

/** Свёрнутая шапка виджета ремонта (кликабельная полоска с иконкой ключа). */
const RepairWidgetHeader = ({ open, onToggle }: RepairWidgetHeaderProps) => (
  <button className="flex items-center justify-between w-full" onClick={onToggle}>
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
);

export default RepairWidgetHeader;
