import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const GOLD_PRICE_URL = "https://functions.poehali.dev/0e3260ee-7b92-4be2-833b-d3fcc9d2472d";
const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "Что принимаем", href: "#catalog" },
  { label: "Как работает", href: "#how" },
  { label: "Гарантии", href: "#guarantees" },
  { label: "Филиалы", href: "#branches" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
];

interface HeaderProps {
  scrollTo: (href: string) => void;
}

const PROBES = [
  { label: "375", value: 375, coeff: 0.375 },
  { label: "500", value: 500, coeff: 0.500 },
  { label: "585", value: 585, coeff: 0.585 },
  { label: "750", value: 750, coeff: 0.750 },
  { label: "916", value: 916, coeff: 0.916 },
  { label: "999", value: 999, coeff: 0.999 },
];

const Header = ({ scrollTo }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [goldPrice, setGoldPrice] = useState<{ buy: number; date: string } | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [clientType, setClientType] = useState<'retail' | 'wholesale'>('retail');
  const [probe, setProbe] = useState(585);
  const [weight, setWeight] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const load = () => {
      fetch(GOLD_PRICE_URL)
        .then(r => r.json())
        .then(d => setGoldPrice({ buy: d.buy, date: d.date }))
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = (href: string) => {
    scrollTo(href);
    setMenuOpen(false);
  };

  const selectedProbe = PROBES.find(p => p.value === probe) || PROBES[2];
  const discount = clientType === 'retail' ? 0.85 : 0.90;

  const calcPrice = (coeff: number) =>
    goldPrice ? Math.round(goldPrice.buy * coeff * discount) : null;

  const activePrice = calcPrice(selectedProbe.coeff);
  const weightNum = parseFloat(weight.replace(',', '.')) || 0;
  const totalPrice = activePrice && weightNum > 0 ? Math.round(activePrice * weightNum) : null;

  const priceRetail999 = goldPrice ? Math.round(goldPrice.buy * 0.999 * 0.85) : null;
  const priceWholesale999 = goldPrice ? Math.round(goldPrice.buy * 0.999 * 0.90) : null;

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          category: "Золото",
          desc: `Проба: ${probe}, вес: ${weight || '?'} г, цена: ${activePrice} ₽/г, итого: ${totalPrice ? totalPrice.toLocaleString('ru-RU') : '?'} ₽. Тип: ${clientType === 'retail' ? 'Физлицо' : 'Оптовый'}`,
          client_type: clientType === 'retail' ? 'Физлицо' : 'Оптовый (от 30 г)',
          gold_price: `${activePrice} ₽/г (проба ${probe}, вес ${weight || '?'} г = ${totalPrice ? totalPrice.toLocaleString('ru-RU') : '?'} ₽)`,
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Gold ticker */}
      <div className="bg-[#FFD700] px-4 py-1.5 flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-black text-xs font-oswald font-bold uppercase tracking-wider">🥇 Биржа 999:</span>
          {goldPrice ? (
            <span className="text-black font-roboto font-bold text-sm">
              {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/г
            </span>
          ) : (
            <span className="text-black/50 font-roboto text-xs">загрузка...</span>
          )}
        </div>

        {goldPrice && (
          <>
            <div className="w-px h-4 bg-black/20 hidden md:block" />
            <div className="hidden md:flex items-center gap-2 text-xs font-roboto">
              <span className="bg-black/10 px-2 py-0.5 text-black font-semibold">
                Физлица 999: {priceRetail999?.toLocaleString('ru-RU')} ₽/г
              </span>
              <span className="bg-black/10 px-2 py-0.5 text-black font-semibold">
                Опт 999: {priceWholesale999?.toLocaleString('ru-RU')} ₽/г
                <span className="text-black/60 ml-1 font-normal">от 30 г</span>
              </span>
            </div>
            <div className="w-px h-4 bg-black/20 hidden md:block" />
            <span className="hidden md:block text-black/50 font-roboto text-[10px]">Калькулятор по пробам →</span>
          </>
        )}

        <button
          onClick={() => { setSellOpen(true); setSent(false); setForm({ name: "", phone: "" }); }}
          className="bg-black text-[#FFD700] font-oswald font-bold text-xs px-4 py-1.5 uppercase tracking-wide hover:bg-[#1A1A1A] transition-colors flex items-center gap-1.5">
          <Icon name="Zap" size={12} />
          Продать золото
        </button>
      </div>

      {/* Main header */}
      <div className="bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-oswald font-bold text-xl tracking-wider animate-shimmer">СКУПКА24</span>
              <div className="font-roboto text-white/40 text-[10px] leading-tight">Кирова 7/47 · Кирова 11</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)}
                className="font-roboto text-sm text-white/70 hover:text-[#FFD700] transition-colors uppercase tracking-wide">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:+79929990333" className="hidden md:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-base hover:opacity-80 transition-opacity">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
            <a href="/staff" className="hidden md:flex items-center gap-1.5 border border-[#FFD700]/30 text-[#FFD700]/70 hover:text-[#FFD700] hover:border-[#FFD700] font-roboto text-xs px-3 py-1.5 transition-colors">
              <Icon name="LogIn" size={13} />
              Войти
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-white hover:text-[#FFD700]">
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-[#1A1A1A] border-t border-[#FFD700]/20 px-4 py-4">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)}
                className="block w-full text-left py-3 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-sm">
                {l.label}
              </button>
            ))}
            <a href="tel:+79929990333" className="flex items-center gap-2 mt-4 text-[#FFD700] font-oswald font-semibold text-lg">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
            <a href="/staff" className="flex items-center gap-2 mt-3 text-[#FFD700]/60 hover:text-[#FFD700] font-roboto text-sm transition-colors">
              <Icon name="LogIn" size={15} />
              Войти в панель
            </a>
          </div>
        )}
      </div>

      {/* Sell modal */}
      {sellOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#FFD700]/30 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#FFD700]/20">
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-[#FFD700]" />
                <h3 className="font-oswald text-xl font-bold uppercase">Продать золото</h3>
              </div>
              <button onClick={() => setSellOpen(false)} className="text-white/40 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-5">
              {/* Client type selector */}
              <div className="grid grid-cols-2 gap-2 mb-4">
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
              </div>

              {/* Probe selector */}
              <div className="mb-5">
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-2">Проба изделия</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {PROBES.map(p => (
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

                {goldPrice && (
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
                  <button onClick={() => setSellOpen(false)} className="mt-4 text-[#FFD700] text-sm hover:underline font-roboto">
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSell} className="space-y-3">
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
      )}
    </header>
  );
};

export default Header;