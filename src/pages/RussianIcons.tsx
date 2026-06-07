import { useState } from "react";
import PageSEO from "@/components/seo/PageSEO";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import IconsHero from "./icons/IconsHero";
import IconsContent from "./icons/IconsContent";
import IconsCta from "./icons/IconsCta";
import { SEND_LEAD_URL } from "./icons/data";

export default function RussianIcons() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleModalSend = async () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name: "Клиент", category: "Православные иконы", desc: "Заявка с формы оценки иконы" }) }).catch(() => {});
    setSent(true);
  };

  const handleCtaSend = async () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ctaPhone, name: "Клиент", category: "Православные иконы", desc: "Заявка с CTA блока — Перезвоните мне" }) }).catch(() => {});
    setCtaSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PageSEO
        title="Скупка старинных икон в Калуге — оценка бесплатно | Скупка24"
        description="Купим старинные православные иконы в Калуге: XVI–XIX вв., оклады, финифть. Бесплатная оценка эксперта, выплата в день. ☎ +7 (992) 999-03-33"
        keywords="скупка икон Калуга, купить иконы Калуга, оценка икон Калуга, старинные иконы, православный антиквариат"
        url="https://skypka24.com/icons"
        schema={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "PawnShop"],
          name: "Скупка24 — Скупка икон",
          description: "Скупка православных икон и церковного антиквариата в Калуге.",
          url: "https://skypka24.com/icons",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        }}
      />
      <Header scrollTo={() => {}} />

      <IconsHero onOpenForm={() => setFormOpen(true)} />

      <IconsContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
      />

      <IconsCta
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
        @keyframes amberShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}