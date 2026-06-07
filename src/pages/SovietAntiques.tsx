import { useState } from "react";
import PageSEO from "@/components/seo/PageSEO";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import SovietHero from "./soviet/SovietHero";
import SovietContent from "./soviet/SovietContent";
import SovietCta from "./soviet/SovietCta";
import { SEND_LEAD_URL } from "./soviet/data";

export default function SovietAntiques() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleModalSend = async () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name: "Клиент", category: "Советский антиквариат", desc: "Заявка с формы оценки" }) }).catch(() => {});
    setSent(true);
  };

  const handleCtaSend = async () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ctaPhone, name: "Клиент", category: "Советский антиквариат", desc: "Заявка с CTA блока — Перезвоните мне" }) }).catch(() => {});
    setCtaSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PageSEO
        title="Скупка советского антиквариата в Калуге — ордена, фарфор | Скупка24"
        description="Купим советский антиквариат в Калуге: ордена, медали, фарфор ЛФЗ, авангард, мебель. Бесплатная оценка, выплата в день обращения."
        keywords="скупка советского антиквариата Калуга, советские ордена Калуга, медали СССР, ЛФЗ фарфор, советский авангард"
        url="https://skypka24.com/soviet-antiques"
        schema={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "PawnShop"],
          name: "Скупка24 — Советский антиквариат",
          description: "Скупка советского антиквариата, орденов и фарфора в Калуге.",
          url: "https://skypka24.com/soviet-antiques",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        }}
      />
      <Header scrollTo={() => {}} />

      <SovietHero onOpenForm={() => setFormOpen(true)} />

      <SovietContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
      />

      <SovietCta
        ctaPhone={ctaPhone}
        setCtaPhone={setCtaPhone}
        ctaSent={ctaSent}
        handleCtaSend={handleCtaSend}
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        phone={phone}
        setPhone={setPhone}
        sent={sent}
        handleModalSend={handleModalSend}
      />

      <ContactsFooter scrollTo={() => {}} />

      <style>{`
        @keyframes redShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}