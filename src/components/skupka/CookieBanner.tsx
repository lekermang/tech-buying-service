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
    <div className="fixed bottom-[76px] md:bottom-5 left-0 right-0 z-[60] flex justify-center px-3 pointer-events-none">
      <div
        className="w-full max-w-xl bg-[#161616] border border-[#2a2a2a] shadow-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-[slideDown_0.3s_ease]"
        style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
      >
        <Icon name="Cookie" size={18} className="text-[#FFD700] shrink-0" />
        <p className="flex-1 text-white/50 text-xs leading-relaxed">
          Мы используем cookie для аналитики и улучшения сайта.{" "}
          <a href="#" className="text-white/70 underline hover:text-white transition-colors">
            Подробнее
          </a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-[#FFD700] text-black text-xs font-bold px-4 py-2 hover:bg-yellow-400 active:scale-95 transition-all uppercase tracking-wide"
        >
          Принять
        </button>
        <button
          onClick={accept}
          className="shrink-0 text-white/20 hover:text-white transition-colors"
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
