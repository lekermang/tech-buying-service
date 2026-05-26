import { useState } from "react";
import Header from "@/components/skupka/Header";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import PorcelainHero from "./porcelain/PorcelainHero";
import PorcelainContent from "./porcelain/PorcelainContent";
import PorcelainCta from "./porcelain/PorcelainCta";
import { SEND_LEAD_URL } from "./porcelain/data";

export default function RussianPorcelain() {
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaSent, setCtaSent] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleModalSend = async () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name: "Клиент", category: "Фарфор и хрусталь", desc: "Заявка с формы оценки фарфора" }) }).catch(() => {});
    setSent(true);
  };

  const handleCtaSend = async () => {
    if (ctaPhone.replace(/\D/g, "").length < 10) return;
    fetch(SEND_LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: ctaPhone, name: "Клиент", category: "Фарфор и хрусталь", desc: "Заявка с CTA блока — Перезвоните мне" }) }).catch(() => {});
    setCtaSent(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Header scrollTo={() => {}} />

      <PorcelainHero onOpenForm={() => setFormOpen(true)} />

      <PorcelainContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFaq={activeFaq}
        setActiveFaq={setActiveFaq}
      />

      <PorcelainCta
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
        @keyframes blueShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
