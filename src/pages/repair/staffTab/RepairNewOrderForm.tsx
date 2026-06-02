import Icon from "@/components/ui/icon";
import { EMPTY_FORM, INP, LBL, ACCEPTOR_BONUS_VALUES } from "../types";

type Props = {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  creating: boolean;
  createOrder: () => void;
};

// Богдан определяется по сохранённому имени сотрудника
function isAcceptor(): boolean {
  try {
    return (localStorage.getItem("employee_name") || "").trim().toLowerCase() === "богдан";
  } catch {
    return false;
  }
}

export default function RepairNewOrderForm({ form, setForm, creating, createOrder }: Props) {
  const showBonus = isAcceptor();
  return (
    <div className="relative mx-3 mt-3 mb-1 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* HALO ореол */}
      <div className="absolute -inset-2 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.20),transparent 75%)", filter: "blur(14px)" }} />
      {/* Conic-gradient рамка */}
      <div className="relative p-[1.5px] rounded-xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.6)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.6)_360deg)] shadow-[0_8px_28px_rgba(255,215,0,0.18)]">
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] p-4 space-y-3 rounded-[10px] overflow-hidden">
          {/* Декор */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-2">
            {/* Conic-медальон */}
            <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.4)] shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="FilePlus" size={13} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
              </div>
            </div>
            <div className="font-oswald font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
              Новая заявка на ремонт
            </div>
          </div>

          {/* ── Блок 1: Модель (САМОЕ ВАЖНОЕ — первым) ── */}
          <div className="relative">
            <label className={LBL}>
              Модель устройства <span className="text-[#FFD700]">*</span>
            </label>
            <input
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              placeholder="iPhone 15 Pro, Samsung S24, Redmi 12..."
              className={INP + (!form.model ? " border-[#FFD700]/30" : "")}
              autoFocus
            />
            {!form.model && (
              <span className="absolute right-2 top-7 text-[10px] text-[#FFD700]/60 font-roboto pointer-events-none">обязательно</span>
            )}
          </div>

          {/* ── Блок 2: Клиент ── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <label className={LBL}>Имя клиента <span className="text-white/40">*</span></label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван" className={INP} />
            </div>
            <div className="relative">
              <label className={LBL}>
                Телефон <span className="text-[#FFD700]">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+7 999 123-45-67"
                className={INP + (!form.phone ? " border-[#FFD700]/30" : "")}
              />
              {!form.phone && (
                <span className="absolute right-2 top-7 text-[10px] text-[#FFD700]/60 font-roboto pointer-events-none">обязательно</span>
              )}
            </div>
          </div>

          {/* ── Блок 3: тип ремонта + пароль + стоимость ── */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL}>Причина / что делать</label>
              <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Дисплей, батарея..." className={INP} />
            </div>
            <div>
              <label className={LBL}>Стоимость (₽)</label>
              <input type="number" inputMode="numeric" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1 500" className={INP} />
            </div>
          </div>

          {/* ── Блок 4: Пароль устройства ── */}
          <div>
            <label className={LBL}>Пароль устройства</label>
            <input
              value={form.device_password}
              onChange={e => setForm(p => ({ ...p, device_password: e.target.value }))}
              placeholder="1234 / не знает / нет пароля"
              className={INP}
            />
          </div>

          {/* ── Блок 5: Дефекты внешнего вида ── */}
          <div className="border border-white/10 bg-black/30 rounded-lg p-3">
            <div className="font-roboto text-[#FFD700] text-[10px] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Icon name="ClipboardList" size={11} />
              Внешний вид и дефекты
            </div>
            {([
              { group: "Экран",   items: ["Трещина экрана", "Скол стекла", "Битые пиксели", "Полосы", "Не реагирует тачскрин", "Пятна / засветы"] },
              { group: "Корпус",  items: ["Царапины", "Потёртости", "Вмятина", "Скол корпуса", "Трещина корпуса", "Следы влаги"] },
              { group: "Функции", items: ["Не включается", "Не заряжается", "Нет звука", "Нет сети", "Камера не работает", "Кнопки не работают"] },
            ] as { group: string; items: string[] }[]).map(({ group, items }) => (
              <div key={group} className="mb-2">
                <div className="font-roboto text-white/35 text-[9px] uppercase tracking-wider mb-1">{group}</div>
                <div className="flex flex-wrap gap-1">
                  {items.map(label => {
                    const active = (form.comment || "").includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setForm(p => {
                            const cur = p.comment || "";
                            const next = active
                              ? cur.split(", ").filter(x => x !== label).join(", ")
                              : cur ? cur + ", " + label : label;
                            return { ...p, comment: next };
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-roboto border transition-all ${
                          active
                            ? "bg-[#FFD700] border-[#FFD700] text-black font-bold"
                            : "bg-transparent border-white/15 text-white/45 hover:border-white/35 hover:text-white/65"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Итог */}
            {form.comment && (
              <div className="mt-2 px-2 py-1.5 bg-[#111] border border-[#FFD700]/20 rounded text-[10px] font-roboto text-white/60">
                <span className="text-[#FFD700]/50">В акте: </span>{form.comment}
              </div>
            )}
          </div>

          {/* ── Блок 6: email — необязательно ── */}
          <div className="relative">
            <label className={LBL}>
              Email клиента <span className="text-white/30">— для актов и чека</span>
            </label>
            <input
              type="email"
              value={form.client_email}
              onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))}
              placeholder="ivan@mail.ru"
              className={INP}
            />
            {form.client_email && (
              <span className="absolute right-2 top-7 text-[10px] text-green-400/70 font-roboto pointer-events-none">3 документа на почту</span>
            )}
          </div>

          {/* ── Бонус приёмщика (виден только Богдану) ── */}
          {showBonus && (
            <div className="border rounded-lg p-3" style={{ borderColor: "rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)" }}>
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#34d399" }}>
                <Icon name="Coffee" size={11} />
                Твой бонус с этого ремонта
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ACCEPTOR_BONUS_VALUES.map(v => {
                  const active = form.acceptor_bonus === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, acceptor_bonus: active ? 0 : v }))}
                      className="py-2 rounded-md font-oswald font-bold text-sm transition-all active:scale-95"
                      style={{
                        background: active ? "linear-gradient(135deg,#34d399,#10b981)" : "rgba(255,255,255,0.04)",
                        color: active ? "#062b1e" : "rgba(255,255,255,0.55)",
                        border: active ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <div className="font-roboto text-[10px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                {form.acceptor_bonus > 0
                  ? `Бонус ${form.acceptor_bonus} ₽ закрепится за тобой, когда ремонт станет «Готов». Это «чай» сверх зарплаты.`
                  : "Выбери сумму, если хочешь заработать с этого ремонта. Можно не выбирать."}
              </div>
            </div>
          )}

          <button
            onClick={createOrder}
            disabled={creating || !form.name || !form.phone || !form.model}
            title={!form.model ? "Укажите модель устройства" : !form.phone ? "Укажите телефон клиента" : "Создать заявку"}
            className="relative w-full btn-gold-premium !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name={creating ? "Loader" : "Check"} size={15} className={creating ? "animate-spin" : ""} />
            {creating ? "Создаю..." : (!form.model ? "Введите модель устройства" : !form.phone ? "Введите телефон клиента" : "Создать заявку")}
          </button>
        </div>
      </div>
    </div>
  );
}