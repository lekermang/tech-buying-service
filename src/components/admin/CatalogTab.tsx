import { useState } from "react";
import Icon from "@/components/ui/icon";
import ParserSection from "./catalog/ParserSection";
import PhotosManager from "./catalog/PhotosManager";

export default function CatalogTab({ token }: { token: string }) {
  const [activeSection, setActiveSection] = useState<"parser" | "photos">("parser");

  return (
    <div className="px-4 py-4">
      {/* Переключатель секций */}
      <div className="flex gap-1 mb-4">
        {[
          { key: "parser", label: "Синхронизация", icon: "RefreshCw" },
          { key: "photos", label: "Фото товаров", icon: "Camera" },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as "parser" | "photos")}
            className={`flex items-center gap-1.5 font-oswald font-bold text-xs px-3 py-1.5 uppercase transition-colors ${
              activeSection === s.key ? "bg-[#FFD700] text-black" : "border border-[#333] text-white/40 hover:text-white"
            }`}>
            <Icon name={s.icon} size={12} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Секция: Синхронизация */}
      {activeSection === "parser" && <ParserSection token={token} />}

      {/* Секция: Фото товаров */}
      {activeSection === "photos" && <PhotosManager token={token} />}
    </div>
  );
}
