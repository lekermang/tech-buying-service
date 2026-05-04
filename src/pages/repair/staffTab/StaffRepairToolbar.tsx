import Icon from "@/components/ui/icon";
import { EMPTY_FORM } from "../types";
import { View, VIEWS } from "./staffTabTypes";
import { SLTooltip } from "../../slShop/slUI";

type Props = {
  view: View;
  setView: (v: View) => void;
  isOwner: boolean;
  showForm: boolean;
  setShowForm: (v: boolean | ((prev: boolean) => boolean)) => void;
  setForm: (f: typeof EMPTY_FORM) => void;
};

const VIEW_TIPS: Record<string, string> = {
  list: "Заявки — список заказов на ремонт, фильтры по статусу и дате",
  analytics: "Аналитика — выручка, прибыль, маржа и динамика по дням",
  labor_prices: "Цены — прайс-лист на работы и запчасти",
  import_parts: "Импорт — массовая загрузка позиций из Excel",
};

export default function StaffRepairToolbar({ view, setView, isOwner, showForm, setShowForm, setForm }: Props) {
  return (
    <div className="relative px-3 pt-3 pb-2.5">
      {/* Премиум-фон с золотыми свечениями */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-12 left-8 w-44 h-44 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.07)" }} />
        <div className="absolute -bottom-12 right-8 w-44 h-44 rounded-full blur-3xl" style={{ background: "rgba(255,184,0,0.04)" }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.45),transparent)]" />
      </div>

      <div className="relative flex items-center gap-2">
        {/* Сегмент-переключатель view — премиум */}
        <div className="flex flex-1 bg-gradient-to-br from-[#141414] via-[#0F0F0F] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-0.5 overflow-x-auto scrollbar-none shadow-[inset_0_1px_0_rgba(255,215,0,0.04),0_2px_8px_rgba(0,0,0,0.4)]">
          {VIEWS.filter(v => !v.ownerOnly || isOwner).map(v => {
            const active = view === v.k;
            return (
              <SLTooltip key={v.k} content={VIEW_TIPS[v.k] || v.l} placement="bottom" delay={400}>
                <button
                  onClick={() => setView(v.k)}
                  aria-label={v.l}
                  className={`relative flex-1 min-w-[72px] py-2 px-2.5 font-roboto text-[11px] rounded-md transition-all duration-300 inline-flex items-center justify-center gap-1.5 active:scale-95 overflow-hidden group ${
                    active
                      ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_4px_14px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
                      : "text-white/50 hover:text-[#FFD700] hover:bg-[#FFD700]/5"
                  }`}>
                  {/* Sweep блик при hover для неактивных */}
                  {!active && (
                    <span aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none rounded-md">
                      <span
                        className="absolute -inset-y-2 -left-1/2 w-1/2 opacity-0 group-hover:opacity-100 group-hover:left-[120%] transition-all duration-700 ease-out"
                        style={{ background: "linear-gradient(115deg,transparent 30%,rgba(255,215,0,0.35) 50%,transparent 70%)", transform: "skewX(-20deg)" }}
                      />
                    </span>
                  )}
                  {active && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-md pointer-events-none" />}
                  <Icon name={v.icon} size={13} className={active ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : "group-hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.7)] transition"} />
                  <span className="relative whitespace-nowrap">{v.l}</span>
                </button>
              </SLTooltip>
            );
          })}
        </div>

        {/* Премиум-кнопка "Заявка" */}
        {view === "list" && (
          <SLTooltip content={showForm ? "Отменить создание заявки" : "Создать новую заявку на ремонт"} placement="bottom" delay={300}>
            <button onClick={() => { setShowForm(prev => !prev); setForm(EMPTY_FORM); }}
              aria-label={showForm ? "Отмена" : "Заявка"}
              className={`relative inline-flex items-center gap-1.5 font-oswald font-bold px-3.5 py-2.5 text-xs uppercase rounded-md transition-all shrink-0 active:scale-95 overflow-hidden group ${
                showForm
                  ? "bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] text-white/70 border border-[#333] hover:border-red-500/40 hover:text-red-300"
                  : "btn-gold-premium !py-2.5 !px-3.5"
              }`}>
              <Icon name={showForm ? "X" : "Plus"} size={14} />
              {showForm ? "Отмена" : "Заявка"}
            </button>
          </SLTooltip>
        )}
      </div>
    </div>
  );
}
