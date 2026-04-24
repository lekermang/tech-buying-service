import Icon from "@/components/ui/icon";
import { EMPTY_FORM } from "../types";
import { View, VIEWS } from "./staffTabTypes";

type Props = {
  view: View;
  setView: (v: View) => void;
  isOwner: boolean;
  showForm: boolean;
  setShowForm: (v: boolean | ((prev: boolean) => boolean)) => void;
  setForm: (f: typeof EMPTY_FORM) => void;
};

export default function StaffRepairToolbar({ view, setView, isOwner, showForm, setShowForm, setForm }: Props) {
  return (
    <div className="px-3 pt-3 pb-2 border-b border-[#1A1A1A] bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 bg-[#141414] border border-[#1F1F1F] rounded-md p-0.5 overflow-x-auto scrollbar-none">
          {VIEWS.filter(v => !v.ownerOnly || isOwner).map(v => {
            const active = view === v.k;
            return (
              <button
                key={v.k}
                onClick={() => setView(v.k)}
                className={`flex-1 min-w-[72px] py-2 px-2.5 font-roboto text-[11px] rounded-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                  active
                    ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-lg shadow-[#FFD700]/20"
                    : "text-white/50 hover:text-white/80"
                }`}>
                <Icon name={v.icon} size={13} />
                <span className="whitespace-nowrap">{v.l}</span>
              </button>
            );
          })}
        </div>
        {view === "list" && (
          <button onClick={() => { setShowForm(prev => !prev); setForm(EMPTY_FORM); }}
            className={`flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all shrink-0 active:scale-95 ${
              showForm
                ? "bg-[#2A2A2A] text-white/60 border border-[#333]"
                : "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40"
            }`}>
            <Icon name={showForm ? "X" : "Plus"} size={14} />
            {showForm ? "Отмена" : "Заявка"}
          </button>
        )}
      </div>
    </div>
  );
}
