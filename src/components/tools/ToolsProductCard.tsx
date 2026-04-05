import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Product, fmt, disc } from "./types";

interface Props {
  p: Product;
  onAdd: (p: Product) => void;
}

export default function ToolsProductCard({ p, onAdd }: Props) {
  const d = disc(p);
  const inStock = p.amount === "В наличии";
  const myPrice = p.discount_price || p.base_price;
  const [imgErr, setImgErr] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col hover:shadow-lg hover:shadow-black/40 hover:border-orange-500/50 transition-all group cursor-pointer">
      <div className="relative bg-gray-800 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "1" }}>
        {d > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
            -{d}%
          </span>
        )}
        {p.is_hit && (
          <span className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Хит
          </span>
        )}
        {p.image_url && !imgErr ? (
          <img src={p.image_url} alt={p.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <Icon name="Package" size={48} className="text-gray-700" />
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="text-[11px] text-gray-600 font-mono mb-1">Арт. {p.article}</div>

        <p className="text-sm text-gray-300 leading-snug flex-1 mb-2 line-clamp-3 group-hover:text-orange-400 transition-colors">
          {p.name}
        </p>

        {p.brand && (
          <div className="text-[11px] text-gray-600 mb-2">{p.brand}</div>
        )}

        <div className="flex items-center gap-1.5 mb-3">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-green-500" : "bg-gray-700"}`} />
          <span className={`text-[11px] ${inStock ? "text-green-400" : "text-gray-600"}`}>
            {inStock ? "В наличии" : "Уточняйте"}
          </span>
        </div>

        <div className="mb-3">
          {myPrice > 0 ? (
            <>
              {d > 0 && (
                <div className="text-xs text-gray-600 line-through">{fmt(p.base_price)}</div>
              )}
              <div className="text-xl font-bold text-white">{fmt(myPrice)}</div>
            </>
          ) : (
            <div className="text-sm text-gray-600">Цена по запросу</div>
          )}
        </div>

        <button
          onClick={() => { onAdd(p); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
          className={`w-full py-2 text-sm font-semibold rounded transition-all ${
            added
              ? "bg-green-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {added ? "✓ Добавлено" : "В корзину"}
        </button>
      </div>
    </div>
  );
}
