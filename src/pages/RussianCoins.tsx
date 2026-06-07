import { useState } from "react";
import PageSEO from "@/components/seo/PageSEO";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import RussianCoinsHero from "./russianCoins/RussianCoinsHero";
import RussianCoinsSections from "./russianCoins/RussianCoinsSections";
import { RussianCoinsCtaBlock, RussianCoinsModal } from "./russianCoins/RussianCoinsCta";

export default function RussianCoins() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PageSEO
        title="Скупка русских монет в Калуге — царские, советские | Скупка24"
        description="Купим русские монеты: царская Россия, советский период, Киевская Русь. Бесплатная оценка, честная цена. Скупка24 Калуга — Кирова 11."
        keywords="скупка русских монет Калуга, царские монеты Калуга, советские монеты Калуга, оценка монет, нумизматика"
        url="https://skypka24.com/russian-coins"
        schema={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "PawnShop"],
          name: "Скупка24 — Скупка русских монет",
          description: "Скупка русских монет всех периодов в Калуге.",
          url: "https://skypka24.com/russian-coins",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        }}
      />
      <Header scrollTo={() => {}} />

      <RussianCoinsHero onOpenForm={() => setFormOpen(true)} />

      <RussianCoinsSections
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
      />

      <RussianCoinsCtaBlock
        ctaPhone={ctaPhone}
        setCtaPhone={setCtaPhone}
        ctaSent={ctaSent}
        setCtaSent={setCtaSent}
      />

      <RussianCoinsModal
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        phone={phone}
        setPhone={setPhone}
        sent={sent}
        setSent={setSent}
      />

      <ContactsFooter scrollTo={() => {}} />

      <style>{`
        @keyframes goldShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}