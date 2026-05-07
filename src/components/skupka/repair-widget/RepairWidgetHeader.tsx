import Icon from "@/components/ui/icon";

interface RepairWidgetHeaderProps {
  open: boolean;
  onToggle: () => void;
}

/** Свёрнутая шапка виджета ремонта (кликабельная полоска с иконкой ключа). */
const RepairWidgetHeader = ({ open, onToggle }: RepairWidgetHeaderProps) => (
  <button className="flex items-center justify-between w-full" onClick={onToggle}>
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 rounded-full p-[2px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.45)] shrink-0">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] flex items-center justify-center">
          <Icon name="Wrench" size={22} className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
        </div>
      </div>
      <div className="text-left">
        <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight drop-shadow-[0_0_8px_rgba(255,215,0,0.15)]">Ремонт телефонов</span>
        <span className="inline-flex items-center gap-1 bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-2 py-0.5 leading-none mt-1 rounded-sm uppercase tracking-wider">
          <Icon name="Clock" size={9} />
          При вас · 20 минут · от 300 ₽
        </span>
      </div>
    </div>
    <Icon name={open ? "ChevronUp" : "ChevronDown"} size={22} className="text-[#FFD700]/60 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
  </button>
);

export default RepairWidgetHeader;