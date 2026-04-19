import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Requisites = () => {
  const navigate = useNavigate();

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-[#FFD700]/10 gap-1">
      <span className="font-roboto text-white/50 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-roboto text-white font-medium">{value}</span>
        <button
          onClick={() => copy(value)}
          className="text-white/30 hover:text-[#FFD700] transition-colors"
          title="Скопировать"
        >
          <Icon name="Copy" size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-[#FFD700] transition-colors mb-8 font-roboto text-sm"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>

        <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Юридическая информация</p>
        <h1 className="font-oswald text-3xl md:text-5xl font-bold uppercase mb-10">Реквизиты</h1>

        {/* Основные данные ИП */}
        <div className="border border-[#FFD700]/20 mb-6">
          <div className="bg-[#FFD700]/5 px-6 py-4 border-b border-[#FFD700]/20">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-wide">Сведения об ИП</h2>
          </div>
          <div className="px-6">
            <Row label="Наименование" value="ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ МАМЕДОВ АДИЛЬ МИРЗА ОГЛЫ" />
            <Row label="ИНН" value="402810962699" />
            <Row label="ОГРНИП" value="307402814200032" />
          </div>
        </div>

        {/* Банковские реквизиты */}
        <div className="border border-[#FFD700]/20 mb-6">
          <div className="bg-[#FFD700]/5 px-6 py-4 border-b border-[#FFD700]/20">
            <h2 className="font-oswald text-lg font-bold uppercase tracking-wide">Банковские реквизиты</h2>
          </div>
          <div className="px-6">
            <Row label="Расчётный счёт" value="40802810422270001866" />
            <Row label="Банк" value="КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК" />
            <Row label="БИК" value="042908612" />
            <Row label="Корреспондентский счёт" value="30101810100000000612" />
            <Row label="ИНН банка" value="7707083893" />
            <Row label="КПП банка" value="402702001" />
            <Row label="Дата открытия счёта" value="19.06.2025" />
            <Row label="Адрес" value="г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11" />
          </div>
        </div>

        <p className="font-roboto text-white/30 text-xs text-center mt-8">
          © 2015–2026 Скупка24. Все права защищены.
        </p>
      </div>
    </div>
  );
};

export default Requisites;