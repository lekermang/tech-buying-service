import Icon from "@/components/ui/icon";
import { Order, INP, LBL } from "./types";

type ReadyForm = { purchase_amount: string; repair_amount: string; parts_name: string; admin_note: string };

type Props = {
  order: Order;
  form: ReadyForm;
  error: string | null;
  saving: boolean;
  onFormChange: (form: ReadyForm) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function StaffRepairReadyModal({ order, form, error, saving, onFormChange, onSubmit, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Внешний золотой HALO */}
      <div
        className="relative w-full max-w-sm"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: 'min(92dvh, calc(100dvh - 110px))',
          marginBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        }}
      >
        <span aria-hidden className="absolute -inset-3 rounded-3xl pointer-events-none" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.30),transparent 75%)", filter: "blur(20px)" }} />
        {/* Conic-gradient рамка */}
        <div className="relative p-[1.5px] rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.7)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.7)_360deg)] shadow-[0_12px_40px_rgba(255,215,0,0.25)] overflow-hidden flex flex-col" style={{ maxHeight: 'inherit' }}>
          <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] p-5 rounded-2xl overflow-y-auto overscroll-contain" style={{ maxHeight: 'inherit' }}>
            <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.06)" }} />
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent" />

            <div className="relative flex items-center gap-3 mb-4">
              {/* Conic-медальон */}
              <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.5)] shrink-0">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                  <Icon name="CheckCircle2" size={16} className="text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                </div>
              </div>
              <div>
                <div className="font-oswald font-bold text-base uppercase bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Перевод в «Готово»</div>
                <div className="font-roboto text-white/55 text-xs">#{order.id} · {order.name}</div>
              </div>
            </div>

        {/* Подсказка: суммы можно ввести позже — при выдаче */}
        <div className="relative mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/12 via-emerald-500/5 to-transparent border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.18)] flex items-start gap-2">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <Icon name="MessageSquareText" size={14} className="text-emerald-300 shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
          <div className="font-roboto text-[11px] text-emerald-100/85 leading-snug">
            Клиенту автоматически уйдёт <b className="text-emerald-200">СМС о готовности</b>. Цену и закупку можно заполнить позже — при <b className="text-emerald-200">выдаче</b>.
          </div>
        </div>

        <div className="relative space-y-3">
          <div>
            <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть <span className="text-white/30 normal-case font-normal">— необязательно</span></label>
            <input value={form.parts_name}
              onChange={e => onFormChange({ ...form, parts_name: e.target.value })}
              placeholder="Дисплей iPhone 14, аккумулятор..." className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽) <span className="text-white/30 normal-case font-normal">— позже</span></label>
              <input type="number" value={form.purchase_amount}
                onChange={e => onFormChange({ ...form, purchase_amount: e.target.value })}
                placeholder="—" className={INP} />
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer"
                onClick={() => onFormChange({ ...form, purchase_amount: "0", parts_name: form.parts_name || "Нет" })}>
                <div className={`w-3 h-3 border flex items-center justify-center transition-colors ${form.purchase_amount === "0" ? "bg-[#FFD700] border-[#FFD700]" : "border-white/30"}`}>
                  {form.purchase_amount === "0" && <span className="text-black text-[8px] font-bold">✓</span>}
                </div>
                <span className="font-roboto text-[9px] text-white/40">Без закупки (0 ₽)</span>
              </label>
            </div>
            <div>
              <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽) <span className="text-white/30 normal-case font-normal">— позже</span></label>
              <input type="number" value={form.repair_amount}
                onChange={e => onFormChange({ ...form, repair_amount: e.target.value })}
                placeholder="—" className={INP} />
            </div>
          </div>

          {form.repair_amount && form.purchase_amount && (
            <div className="relative bg-gradient-to-r from-emerald-500/15 via-[#FFD700]/8 to-transparent border border-emerald-500/40 rounded-lg p-3 font-roboto text-sm text-center shadow-[0_0_18px_rgba(16,185,129,0.20)] overflow-hidden">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
              <div className="relative text-white/55 text-[10px] uppercase tracking-wider font-bold mb-0.5">Доход мастера (50% от прибыли)</div>
              <div className="relative text-emerald-300 font-oswald font-bold text-2xl drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]">
                {Math.max(0, Math.round((parseInt(form.repair_amount) - parseInt(form.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
              </div>
              <div className="relative text-[#FFD700]/70 text-[10px] mt-0.5">
                прибыль: <span className="font-bold">{(parseInt(form.repair_amount) - parseInt(form.purchase_amount)).toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          )}

          <div>
            <label className={LBL}>Заметка</label>
            <textarea value={form.admin_note}
              onChange={e => onFormChange({ ...form, admin_note: e.target.value })}
              rows={2} placeholder="Внутренняя заметка..." className={INP + " resize-none"} />
          </div>

          {error && (
            <div className="relative bg-gradient-to-r from-red-500/15 to-red-500/5 border border-red-500/40 rounded-md px-3 py-2 flex items-center gap-1.5 text-red-300 font-roboto text-xs shadow-[0_0_12px_rgba(239,68,68,0.2)]">
              <Icon name="AlertCircle" size={12} />{error}
            </div>
          )}
        </div>

        <div className="relative flex gap-2 mt-4">
          <button onClick={onSubmit} disabled={saving}
            title="Перевести в «Готово» и отправить клиенту СМС"
            className="btn-gold-premium flex-1 !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name={saving ? "Loader" : "Send"} size={15} className={saving ? "animate-spin" : ""} />
            {saving ? "Отправляю..." : "Готов · отправить СМС"}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-md bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] border border-[#333] hover:border-red-500/40 text-white/70 hover:text-red-300 font-roboto text-xs transition-all active:scale-95">
            Отмена
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}