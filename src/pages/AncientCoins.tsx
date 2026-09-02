import { useState } from "react";
import PageSEO from "@/components/seo/PageSEO";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import AncientCoinsHero from "./ancientCoins/AncientCoinsHero";
import AncientCoinsContent from "./ancientCoins/AncientCoinsContent";
import AncientCoinsCta from "./ancientCoins/AncientCoinsCta";
import { SEND_LEAD_URL } from "./ancientCoins/data";

export default function AncientCoins() {
  const [activeEra, setActiveEra] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSend = async () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name: "Клиент", category: "Древние монеты", desc: "Заявка с формы оценки монеты" }) }).catch(() => {});
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PageSEO
        title="Скупка древних монет в Калуге — оценка бесплатно | Скупка24"
        description="Купим древние монеты в Калуге: Античная Греция, Рим, Парфия, Древняя Русь. Бесплатная оценка нумизмата, выплата в день обращения. ☎ +7 (992) 999-03-33"
        keywords="скупка монет Калуга, купить старинные монеты Калуга, оценка монет Калуга, нумизматика Калуга, античные монеты"
        url="https://skypka24.com/ancient-coins"
        schema={{
          "@context": "https://schema.org",
          "@type": ["LocalBusiness", "PawnShop"],
          name: "Скупка24 — Скупка монет",
          description: "Скупка древних и старинных монет в Калуге. Бесплатная оценка, выплата в день обращения.",
          url: "https://skypka24.com/ancient-coins",
          telephone: "+79929990333",
          address: { "@type": "PostalAddress", streetAddress: "ул. Кирова, 7", addressLocality: "Калуга", addressCountry: "RU" },
        }}
      />
      <Header scrollTo={() => {}} />

      <AncientCoinsHero onOpenForm={() => setFormOpen(true)} />

      <AncientCoinsContent
        activeEra={activeEra}
        setActiveEra={setActiveEra}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
        onOpenForm={() => setFormOpen(true)}
      />

      <AncientCoinsCta
        phone={phone}
        setPhone={setPhone}
        sent={sent}
        handleSend={handleSend}
        formOpen={formOpen}
        setFormOpen={setFormOpen}
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