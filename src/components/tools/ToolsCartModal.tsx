import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CartItem, fmt } from "./types";

const SEND_API = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

interface Props {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (a: string) => void;
  onQty: (a: string, d: number) => void;
}

export default function ToolsCartModal({ cart, onClose, onRemove, onQty }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const total = cart.reduce((s, i) => s + (i.discount_price || i.base_price) * i.qty, 0);

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim()) { setErr("Заполните имя и телефон"); return; }
    setSending(true); setErr("");
    try {
      const lines = cart.map(i =>
        `• Арт. ${i.article} — ${i.name} × ${i.qty} шт. = ${fmt((i.discount_price || i.base_price) * i.qty)}`
      ).join("\n");
      await fetch(SEND_API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, category: "Инструменты", desc: `${lines}\n\nИтого: ${fmt(total)}` }),
      });
      setSent(true);
    } catch { setErr("Ошибка отправки"); } finally { setSending(false); }
  };

  if (sent) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <div className="text-xl font-bold text-white mb-2">Заказ принят!</div>
        <p className="text-gray-500 text-sm mb-6">Мы свяжемся с вами в ближайшее время</p>
        <button onClick={onClose} className="bg-orange-500 text-white font-bold px-8 py-2.5 rounded">Закрыть</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <span className="font-bold text-white text-lg">
            Корзина {cart.length > 0 && `(${cart.reduce((s, i) => s + i.qty, 0)} шт.)`}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><Icon name="X" size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {cart.length === 0 && <p className="text-gray-600 text-center py-10">Корзина пуста</p>}
          {cart.map(item => (
            <div key={item.article} className="flex gap-3 items-start border border-gray-800 rounded-lg p-3 bg-gray-800/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-mono">Арт. {item.article}</p>
                <p className="text-sm text-gray-300 leading-snug mt-0.5 line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-white mt-1">{fmt((item.discount_price || item.base_price) * item.qty)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onQty(item.article, -1)} className="w-7 h-7 border border-gray-700 rounded flex items-center justify-center hover:bg-gray-700 text-gray-400 font-bold">−</button>
                <span className="text-white text-sm w-6 text-center font-bold">{item.qty}</span>
                <button onClick={() => onQty(item.article, 1)} className="w-7 h-7 border border-gray-700 rounded flex items-center justify-center hover:bg-gray-700 text-gray-400 font-bold">+</button>
                <button onClick={() => onRemove(item.article)} className="w-7 h-7 text-gray-700 hover:text-red-400 flex items-center justify-center ml-1"><Icon name="X" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-800 space-y-3">
            <div className="flex justify-between font-bold text-white text-lg">
              <span>Итого:</span>
              <span className="text-orange-400">{fmt(total)}</span>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-orange-400 placeholder-gray-600" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-orange-400 placeholder-gray-600" />
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button onClick={handleOrder} disabled={sending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors text-base">
              {sending ? "Отправляю..." : "Оформить заказ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}