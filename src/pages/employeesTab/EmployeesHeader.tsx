import Icon from "@/components/ui/icon";

type Props = {
  total: number;
  active: number;
  inactive: number;
  showAdd: boolean;
  setShowAdd: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function EmployeesHeader({ total, active, inactive, showAdd, setShowAdd }: Props) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-60" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.15),transparent 70%)", filter: "blur(14px)" }} />
      <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/25 p-4 rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.05)] overflow-hidden">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
        <span aria-hidden className="absolute -top-12 -left-12 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
        <span aria-hidden className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(59,130,246,0.06)" }} />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Conic-медальон команды */}
            <div className="relative w-11 h-11 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_16px_rgba(255,215,0,0.4)] shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="Users" size={17} className="text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.7)]" />
              </div>
            </div>
            <div>
              <div className="font-oswald font-bold uppercase text-base bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer leading-tight">
                Команда
              </div>
              <div className="font-oswald font-bold text-white text-2xl tabular-nums leading-tight drop-shadow-[0_0_4px_rgba(255,215,0,0.3)]">
                {total}
                <span className="font-roboto text-white/40 text-[10px] uppercase tracking-wider ml-1.5">сотрудников</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            title={showAdd ? "Отменить добавление" : "Добавить нового сотрудника"}
            className={`relative inline-flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all active:scale-95 overflow-hidden ${
              showAdd
                ? "bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] text-white/70 border border-[#333] hover:border-red-500/40 hover:text-red-300"
                : "btn-gold-premium !py-2.5 !px-3.5"
            }`}>
            <Icon name={showAdd ? "X" : "UserPlus"} size={14} />
            {showAdd ? "Отмена" : "Добавить"}
          </button>
        </div>
        <div className="relative flex gap-2 text-[10px] font-roboto flex-wrap">
          <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.20)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_currentColor]" />
            <span className="text-emerald-300 font-bold tabular-nums">{active}</span>
            <span className="text-emerald-400/80 uppercase tracking-wider">активны</span>
          </div>
          {inactive > 0 && (
            <div className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.18)]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_4px_currentColor]" />
              <span className="text-red-300 font-bold tabular-nums">{inactive}</span>
              <span className="text-red-400/80 uppercase tracking-wider">неактивны</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
