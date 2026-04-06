import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const STORAGE_KEY = "cookie_accepted";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    // На мобайл — над sticky bar + safe-area; на десктопе — просто снизу
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center px-3 pointer-events-none md:bottom-5"
      style={{ bottom: "calc(68px + env(safe-area-inset-bottom, 0px) + 8px)" }}
    >
      {/* На десктопе переопределяем через md: */}
      <style>{`@media (min-width: 768px) { .cookie-wrap { bottom: 1.25rem !important; } }`}</style>
      <div
        className="w-full max-w-xl bg-[#161616] border border-[#2a2a2a] shadow-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-[slideDown_0.3s_ease]"
        style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
      >
        <Icon name="Cookie" size={18} className="text-[#FFD700] shrink-0" />
        <p className="flex-1 text-white/50 text-xs leading-relaxed">
          Мы используем cookie для аналитики и улучшения сайта.
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-[#FFD700] text-black text-xs font-bold px-4 py-2.5 hover:bg-yellow-400 active:scale-95 transition-all uppercase tracking-wide min-w-[80px]"
        >
          Принять
        </button>
        <button
          onClick={accept}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-white/20 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
