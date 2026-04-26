import { useState, useEffect } from "react";
import GoldTicker from "./header/GoldTicker";
import MainNav, { type NavLink } from "./header/MainNav";
import MobileMenu from "./header/MobileMenu";
import SellGoldModal, { type ClientType, type Probe } from "./header/SellGoldModal";

const GOLD_PRICE_URL = "https://functions.poehali.dev/0e3260ee-7b92-4be2-833b-d3fcc9d2472d";
const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const NAV_LINKS: NavLink[] = [
  { label: "Главная", href: "#hero" },
  { label: "Что принимаем", href: "#catalog" },
  { label: "Trade In", href: "#tradein" },
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

const PROBES: Probe[] = [
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
  const [goldPrice, setGoldPrice] = useState<{ buy: number; buy_usd?: number; xau_usd?: number; date: string } | null>(null);
  const [goldHistory, setGoldHistory] = useState<{ date: string; price: number }[]>([]);
  const [goldSettings, setGoldSettings] = useState({
    retail_discount: 15, retail_deduction: 0,
    wholesale_discount: 10, wholesale_deduction: 0,
    bulk_discount: 15, bulk_deduction: 50,
  });
  const [sellOpen, setSellOpen] = useState(false);
  const [clientType, setClientType] = useState<ClientType>('retail');
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
            setGoldPrice({
              buy: d.buy,
              buy_usd: typeof d.buy_usd === 'number' ? d.buy_usd : undefined,
              xau_usd: typeof d.xau_usd === 'number' ? d.xau_usd : undefined,
              date: d.date || '',
            });
          }
          if (Array.isArray(d.history) && d.history.length > 0) setGoldHistory(d.history);
          if (d.settings) {
            setGoldSettings(prev => ({ ...prev, ...d.settings }));
          }
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // обновление каждые 5 минут
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
      <GoldTicker
        goldPrice={goldPrice}
        goldHistory={goldHistory}
        priceRetail999={priceRetail999}
        priceWholesale999={priceWholesale999}
        onSellClick={() => { setSellOpen(true); setSent(false); setForm({ name: "", phone: "" }); }}
      />

      <MainNav
        navLinks={NAV_LINKS}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        onNav={handleNav}
      />

      <MobileMenu
        open={menuOpen}
        navLinks={NAV_LINKS}
        onNav={handleNav}
      />

      <SellGoldModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        probes={PROBES}
        clientType={clientType}
        setClientType={setClientType}
        probe={probe}
        setProbe={setProbe}
        weight={weight}
        setWeight={setWeight}
        goldPrice={goldPrice}
        activePrice={activePrice}
        weightNum={weightNum}
        totalPrice={totalPrice}
        sent={sent}
        sending={sending}
        form={form}
        setForm={setForm}
        onSubmit={handleSell}
      />
    </header>
  );
};

export default Header;