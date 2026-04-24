import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const GOLD_PRICE_URL = "https://functions.poehali.dev/0e3260ee-7b92-4be2-833b-d3fcc9d2472d";
const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "Что принимаем", href: "#catalog" },
  { label: "Как работает", href: "#how" },
  { label: "Гарантии", href: "#guarantees" },
  { label: "Филиалы", href: "#branches" },
  { label: "Контакты", href: "#contacts" },
  { label: "Вакансии", href: "#jobs" },
];

interface HeaderProps {
  scrollTo: (href: string) => void;
  goldOpen?: boolean;
}

const PROBES = [
  { label: "375", value: 375, coeff: 0.375 },
  { label: "500", value: 500, coeff: 0.500 },
  { label: "585", value: 585, coeff: 0.585 },
  { label: "750", value: 750, coeff: 0.750 },
  { label: "850", value: 850, coeff: 0.850 },
  { label: "900", value: 900, coeff: 0.900 },
  { label: "916", value: 916, coeff: 0.916 },
  { label: "999", value: 999, coeff: 0.999 },
];

const Header = ({ scrollTo, goldOpen = false }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [goldPrice, setGoldPrice] = useState<{ buy: number; date: string } | null>(null);
  const [goldHistory, setGoldHistory] = useState<{ date: string; price: number }[]>([]);
  const [goldSettings, setGoldSettings] = useState({
    retail_discount: 15, retail_deduction: 0,
    wholesale_discount: 10, wholesale_deduction: 0,
    bulk_discount: 15, bulk_deduction: 50,
  });
  const [sellOpen, setSellOpen] = useState(false);
  const [clientType, setClientType] = useState<'retail' | 'wholesale' | 'bulk'>('retail');
  const [probe, setProbe] = useState(585);
  const [weight, setWeight] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (goldOpen) setSellOpen(true);
  }, [goldOpen]);

  useEffect(() => {
    const load = () => {
      fetch(GOLD_PRICE_URL)
        .then(r => r.json())
        .then(d => {
          if (d && typeof d.buy === 'number') {
            setGoldPrice({ buy: d.buy, date: d.date || '' });
          }
          if (Array.isArray(d.history) && d.history.length > 0) setGoldHistory(d.history);
          if (d.settings) {
            setGoldSettings(prev => ({ ...prev, ...d.settings }));
          }
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = (href: string) => {
    scrollTo(href);
    setMenuOpen(false);
  };

  const selectedProbe = PROBES.find(p => p.value === probe) || PROBES[2];

  const getDiscountAndDeduction = () => {
    if (clientType === 'bulk') return { discount: goldSettings.bulk_discount / 100, deduction: goldSettings.bulk_deduction };
    if (clientType === 'wholesale') return { discount: goldSettings.wholesale_discount / 100, deduction: goldSettings.wholesale_deduction };
    return { discount: goldSettings.retail_discount / 100, deduction: goldSettings.retail_deduction };
  };
  const { discount, deduction } = getDiscountAndDeduction();

  const calcPrice = (coeff: number) =>
    goldPrice ? Math.round(goldPrice.buy * coeff * (1 - discount) - deduction) : null;

  const activePrice = calcPrice(selectedProbe.coeff);
  const weightNum = parseFloat(weight.replace(',', '.')) || 0;
  const totalPrice = activePrice && weightNum > 0 ? Math.round(activePrice * weightNum) : null;

  const priceRetail999 = goldPrice
    ? Math.round(goldPrice.buy * 0.999 * (1 - goldSettings.retail_discount / 100) - goldSettings.retail_deduction)
    : null;
  const priceWholesale999 = goldPrice
    ? Math.round(goldPrice.buy * 0.999 * (1 - goldSettings.wholesale_discount / 100) - goldSettings.wholesale_deduction)
    : null;

  const clientLabel = clientType === 'retail' ? 'Физлицо' : clientType === 'wholesale' ? 'Оптовый (от 30 г)' : 'Крупный опт (от 300 г)';

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
          desc: `Проба: ${probe}, вес: ${weight || '?'} г, цена: ${activePrice} ₽/г, итого: ${totalPrice ? totalPrice.toLocaleString('ru-RU') : '?'} ₽. Тип: ${clientLabel}`,
          client_type: clientLabel,
          gold_price: `${activePrice} ₽/г (проба ${probe}, вес ${weight || '?'} г = ${totalPrice ? totalPrice.toLocaleString('ru-RU') : '?'} ₽)`,
          weight: weight || null,
          purity: probe || null,
          total_price: totalPrice || null,
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
      <div className="bg-[#FFD700] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-black text-sm sm:text-base font-oswald font-bold uppercase tracking-wider">🥇 Золото 999:</span>
          {goldPrice?.buy ? (
            <span className="text-black font-roboto font-bold text-base sm:text-xl">
              {goldPrice.buy.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽/г
            </span>
          ) : (
            <span className="text-black/50 font-roboto text-sm">загрузка...</span>
          )}
        </div>

        {goldPrice?.buy && (
          <div className="hidden md:flex items-center gap-3 font-roboto text-sm">
            {/* Мини-график 7 дней */}
            {goldHistory.length >= 2 && (() => {
              const W = 80, H = 28, pad = 3;
              const prices = goldHistory.map(h => h.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const range = max - min || 1;
              const pts = prices.map((p, i) => {
                const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
                const y = H - pad - ((p - min) / range) * (H - pad * 2);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              const last = prices[prices.length - 1];
              const first = prices[0];
              const up = last >= first;
              const color = up ? '#16a34a' : '#dc2626';
              const lastX = pad + (W - pad * 2);
              const lastY = H - pad - ((last - min) / range) * (H - pad * 2);
              return (
                <div className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded" title="Изменение цены за 7 дней">
                  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
                  </svg>
                  <span className="text-[11px] font-bold" style={{ color }}>
                    {up ? '▲' : '▼'} {Math.abs(((last - first) / first) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-black/40">7д</span>
                </div>
              );
            })()}
            <div className="w-px h-5 bg-black/20" />
            <span className="bg-black/10 px-2.5 py-1 text-black font-semibold">
              Физлица: {priceRetail999?.toLocaleString('ru-RU')} ₽/г
            </span>
            <span className="bg-black/10 px-2.5 py-1 text-black font-semibold">
              Опт от 30 г: {priceWholesale999?.toLocaleString('ru-RU')} ₽/г
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <a href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="hidden sm:flex items-center gap-1.5 bg-black/15 hover:bg-black/25 active:scale-95 transition-all px-3 py-1.5 rounded">
            <Icon name="Phone" size={14} className="text-black" />
            <div className="flex flex-col leading-none">
              <span className="font-oswald font-bold text-black text-sm tracking-wide">8 800 600-68-33</span>
              <span className="font-roboto text-black/60 text-[10px]">звонок бесплатный</span>
            </div>
          </a>
          <a href="tel:88006006833"
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ticker" })}
            className="sm:hidden flex items-center gap-1 bg-black/15 hover:bg-black/25 active:scale-95 transition-all px-2.5 py-1.5 rounded">
            <Icon name="Phone" size={14} className="text-black" />
            <span className="font-oswald font-bold text-black text-sm">8-800</span>
          </a>
          <button
            onClick={() => { setSellOpen(true); setSent(false); setForm({ name: "", phone: "" }); }}
            className="bg-black text-[#FFD700] font-oswald font-bold text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 uppercase tracking-wide hover:bg-[#1A1A1A] active:scale-95 transition-all flex items-center gap-2 shrink-0">
            <Icon name="Zap" size={15} />
            Продать
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
              alt="Скупка24"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div>
              <span className="font-oswald font-bold text-lg sm:text-xl tracking-wider animate-shimmer">СКУПКА24</span>
              <div className="font-roboto text-white/40 text-[10px] leading-tight hidden sm:block">Кирова 7/47 · Кирова 11</div>
            </div>
          </div>

          {/* Планшет: компактная навигация */}
          <nav className="hidden md:flex lg:hidden items-center gap-3">
            {NAV_LINKS.slice(0, 3).map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)}
                className="font-roboto text-xs text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide">
                {l.label}
              </button>
            ))}
            <a href="/catalog" className="font-roboto text-xs text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide flex items-center gap-1">
              <Icon name="ShoppingBag" size={12} />
              Каталог
            </a>
          </nav>

          {/* ПК: полная навигация */}
          <nav className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)}
                className="font-roboto text-sm text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide">
                {l.label}
              </button>
            ))}
            <a href="/catalog"
              className="font-roboto text-sm text-white hover:text-[#FFD700] transition-colors uppercase tracking-wide flex items-center gap-1">
              <Icon name="ShoppingBag" size={13} />
              Каталог
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })} className="hidden lg:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-base hover:opacity-80 transition-opacity">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
            {/* Планшет: только иконка телефона */}
            <a href="tel:+79929990333" onClick={() => ymGoal(Goals.CALL_CLICK, { place: "header" })} className="hidden md:flex lg:hidden items-center justify-center w-9 h-9 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors">
              <Icon name="Phone" size={16} />
            </a>
            <a href="/staff" className="hidden md:flex items-center gap-1.5 border border-[#FFD700]/30 text-[#FFD700]/70 hover:text-[#FFD700] hover:border-[#FFD700] font-roboto text-xs px-2.5 py-1.5 transition-colors">
              <Icon name="LogIn" size={13} />
              <span className="hidden lg:inline">Войти</span>
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white hover:text-[#FFD700] active:scale-95 transition-all">
              <Icon name={menuOpen ? "X" : "Menu"} size={26} />
            </button>
          </div>
        </div>

      </div>

      {/* Мобильное меню — полноэкранное, вне хедер-дива */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-0 bottom-0 bg-[#0D0D0D] z-[60] flex flex-col overflow-y-auto pt-[88px]">
          <div className="px-4 py-2 flex-1">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)}
                className="flex items-center justify-between w-full py-4 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-base">
                {l.label}
                <Icon name="ChevronRight" size={16} className="text-white/20" />
              </button>
            ))}
            <a href="/catalog" className="flex items-center justify-between w-full py-4 font-roboto text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-base font-bold">
              <span className="flex items-center gap-2"><Icon name="ShoppingBag" size={16} />Каталог техники</span>
              <Icon name="ChevronRight" size={16} className="text-[#FFD700]/40" />
            </a>
          </div>
          <div className="px-4 pt-4 pb-8 space-y-3">
            <a href="tel:+79929990333"
              className="flex items-center justify-center gap-3 w-full bg-[#FFD700] text-black font-oswald font-bold text-xl py-4 uppercase tracking-wide active:scale-95 transition-all">
              <Icon name="Phone" size={22} />
              +7 (992) 999-03-33
            </a>
            <a href="https://t.me/skypka24"
              target="_blank" rel="noopener noreferrer"
              onClick={() => ymGoal(Goals.TELEGRAM_CLICK, { place: "mobile_menu" })}
              className="flex items-center justify-center gap-3 w-full border-2 border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-base py-3.5 uppercase tracking-wide active:scale-95 transition-all">
              <Icon name="MessageCircle" size={18} />
              Написать в Telegram
            </a>
            <a href="/staff" className="flex items-center justify-center gap-2 text-white/30 font-roboto text-sm py-2 transition-colors hover:text-white">
              <Icon name="LogIn" size={14} />
              Войти в панель сотрудника
            </a>
          </div>
        </div>
      )}

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