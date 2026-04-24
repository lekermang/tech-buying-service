import Icon from "@/components/ui/icon";

export type Probe = { label: string; value: number; coeff: number };

export type ClientType = 'retail' | 'wholesale' | 'bulk';

interface SellGoldModalProps {
  open: boolean;
  onClose: () => void;
  probes: Probe[];
  clientType: ClientType;
  setClientType: (t: ClientType) => void;
  probe: number;
  setProbe: (v: number) => void;
  weight: string;
  setWeight: (v: string) => void;
  goldPrice: { buy: number; date: string } | null;
  activePrice: number | null;
  weightNum: number;
  totalPrice: number | null;
  sent: boolean;
  sending: boolean;
  form: { name: string; phone: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  onSubmit: (e: React.FormEvent) => void;
}

const SellGoldModal = ({
  open, onClose, probes, clientType, setClientType, probe, setProbe,
  weight, setWeight, goldPrice, activePrice, weightNum, totalPrice,
  sent, sending, form, setForm, onSubmit,
}: SellGoldModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-[#FFD700]/30 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#FFD700]/20">
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 bg-[#FFD700]" />
            <h3 className="font-oswald text-xl font-bold uppercase">Продать золото</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Client type selector */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setClientType('retail')}
              className={`p-3 border-2 text-left transition-colors ${clientType === 'retail' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#333] hover:border-[#FFD700]/40'}`}>
              <div className="font-oswald font-bold text-sm uppercase mb-0.5">Физлицо</div>
              <div className="font-roboto text-white/40 text-xs">Стандартная цена</div>
            </button>
            <button onClick={() => setClientType('wholesale')}
              className={`p-3 border-2 text-left transition-colors ${clientType === 'wholesale' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#333] hover:border-[#FFD700]/40'}`}>
              <div className="font-oswald font-bold text-sm uppercase mb-0.5">Оптовый</div>
              <div className="font-roboto text-white/40 text-xs">от 30 грамм</div>
            </button>
            <button onClick={() => setClientType('bulk')}
              className={`p-3 border-2 text-left transition-colors ${clientType === 'bulk' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#333] hover:border-[#FFD700]/40'}`}>
              <div className="font-oswald font-bold text-sm uppercase mb-0.5">Крупный опт</div>
              <div className="font-roboto text-white/40 text-xs">от 300 грамм</div>
            </button>
          </div>

          {/* Probe selector */}
          <div className="mb-5">
            <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-2">Проба изделия</label>
            <div className="grid grid-cols-4 gap-1.5">
              {probes.map(p => (
                <button key={p.value} onClick={() => setProbe(p.value)}
                  className={`py-2 border-2 font-oswald font-bold text-sm transition-colors ${probe === p.value ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]' : 'border-[#333] text-white/60 hover:border-[#FFD700]/40'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {/* Weight input */}
            <div className="mt-3">
              <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Вес изделия (граммы)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="Например: 15.5"
                className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>

            {goldPrice?.buy && (
              <div className="mt-3 bg-[#0D0D0D] border border-[#FFD700]/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-roboto text-white/50 text-xs">Цена за грамм ({probe} проба)</span>
                  <span className="font-oswald font-bold text-[#FFD700]">{activePrice?.toLocaleString('ru-RU')} ₽/г</span>
                </div>
                {totalPrice ? (
                  <>
                    <div className="w-full h-px bg-[#FFD700]/20 mb-2" />
                    <div className="flex items-center justify-between">
                      <span className="font-roboto text-white/50 text-xs">Итого за {weightNum} г</span>
                      <span className="font-oswald font-bold text-2xl text-[#FFD700]">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </>
                ) : (
                  <div className="font-roboto text-white/30 text-[10px]">Введите вес для расчёта итоговой суммы</div>
                )}
                <div className="font-roboto text-white/20 text-[10px] mt-2">
                  Биржа 999: {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/г · {goldPrice.date}
                </div>
              </div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#FFD700] flex items-center justify-center mx-auto mb-3">
                <Icon name="Check" size={28} className="text-black" />
              </div>
              <h4 className="font-oswald text-xl font-bold text-[#FFD700] mb-1">ЗАЯВКА ОТПРАВЛЕНА</h4>
              <p className="font-roboto text-white/50 text-sm">Перезвоним в течение 15 минут</p>
              <button onClick={onClose} className="mt-4 text-[#FFD700] text-sm hover:underline font-roboto">
                Закрыть
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Иван"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <div>
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              </div>
              <button type="submit" disabled={sending}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold text-base py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Icon name="Send" size={16} />
                {sending ? "Отправляем..." : totalPrice ? `Продать за ${totalPrice.toLocaleString('ru-RU')} ₽` : `Продать за ${activePrice?.toLocaleString('ru-RU')} ₽/г`}
              </button>
              <p className="font-roboto text-white/25 text-[10px] text-center">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellGoldModal;
