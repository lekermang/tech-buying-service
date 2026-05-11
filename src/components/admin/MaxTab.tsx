import { useState } from "react";
import Icon from "@/components/ui/icon";
import SubscribersList, { type MaxClient } from "./max/SubscribersList";
import QuickSend from "./max/QuickSend";
import BroadcastForm from "./max/BroadcastForm";

type SubTab = "subscribers" | "quick" | "broadcast";

const SUBTABS: { key: SubTab; label: string; icon: string; desc: string }[] = [
  { key: "subscribers", label: "Подписчики",       icon: "Users",        desc: "Список клиентов в MAX" },
  { key: "quick",       label: "Быстрая отправка", icon: "Send",         desc: "Сообщение одному по номеру" },
  { key: "broadcast",   label: "Рассылка всем",    icon: "Megaphone",    desc: "Сообщение всем подписчикам" },
];

export default function MaxTab({ token }: { token: string }) {
  const [sub, setSub] = useState<SubTab>("subscribers");
  const [presetPhone, setPresetPhone] = useState<string>("");

  const handlePickClient = (c: MaxClient) => {
    setPresetPhone(c.phone || "");
    setSub("quick");
  };

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="MessageCircle" size={18} className="text-[#FFD700]" />
        <div>
          <div className="font-oswald font-bold text-white text-base uppercase tracking-wide">MAX мессенджер</div>
          <div className="text-white/40 text-xs font-roboto">
            Подписчики, быстрая отправка и массовая рассылка через нашего MAX-бота
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-[#222]">
        {SUBTABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            title={t.desc}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-roboto font-bold uppercase tracking-wide transition-colors -mb-px ${
              sub === t.key
                ? "text-[#FFD700] border-b-2 border-[#FFD700]"
                : "text-white/40 hover:text-white border-b-2 border-transparent"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {sub === "subscribers" && <SubscribersList token={token} onPickClient={handlePickClient} />}
      {sub === "quick"       && <QuickSend token={token} initialPhone={presetPhone} key={presetPhone} />}
      {sub === "broadcast"   && <BroadcastForm token={token} />}
    </div>
  );
}
