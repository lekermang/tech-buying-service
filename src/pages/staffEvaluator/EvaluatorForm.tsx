import { useRef } from "react";
import Icon from "@/components/ui/icon";

const CONDITIONS = ["новый", "хорошее", "среднее", "плохое"];
const KITS = ["без коробки", "с коробкой", "полный комплект"];
const CATEGORIES = ["смартфон", "ноутбук", "планшет", "игровая консоль", "наушники", "умные часы", "фотоаппарат", "компьютер", "телевизор", "другое"];

const QUICK = [
  { l: "iPhone 15 Pro", brand: "Apple", cat: "смартфон", storage: "256 GB", year: "2023" },
  { l: "iPhone 14", brand: "Apple", cat: "смартфон", storage: "128 GB", year: "2022" },
  { l: "iPhone 13", brand: "Apple", cat: "смартфон", storage: "128 GB", year: "2021" },
  { l: "Samsung S24", brand: "Samsung", cat: "смартфон", storage: "128 GB", year: "2024" },
  { l: "MacBook Air M2", brand: "Apple", cat: "ноутбук", storage: "8/256 GB", year: "2022" },
  { l: "PlayStation 5", brand: "Sony", cat: "игровая консоль", storage: "825 GB", year: "2021" },
  { l: "iPad Air 5", brand: "Apple", cat: "планшет", storage: "64 GB", year: "2022" },
  { l: "AirPods Pro 2", brand: "Apple", cat: "наушники", storage: "", year: "2022" },
];

interface Props {
  model: string; setModel: (v: string) => void;
  brand: string; setBrand: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  storage: string; setStorage: (v: string) => void;
  year: string; setYear: (v: string) => void;
  condition: string; setCondition: (v: string) => void;
  kit: string; setKit: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  loading: boolean;
  photoLoading: boolean;
  photoHint: string | null;
  error: string | null;
  onEvaluate: () => void;
  onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EvaluatorForm({
  model, setModel, brand, setBrand, category, setCategory,
  storage, setStorage, year, setYear, condition, setCondition,
  kit, setKit, notes, setNotes,
  loading, photoLoading, photoHint, error,
  onEvaluate, onPhoto,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const fillQuick = (q: typeof QUICK[0]) => {
    setModel(q.l); setBrand(q.brand); setCategory(q.cat);
    setStorage(q.storage); setYear(q.year);
  };

  return (
    <>
      {/* Быстрый выбор */}
      <div>
        <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Быстрый выбор</div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(q => (
            <button key={q.l} onClick={() => fillQuick(q)}
              className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,215,0,0.1)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,215,0,0.3)";
                (e.currentTarget as HTMLButtonElement).style.color = "#FFD700";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
              }}
            >{q.l}</button>
          ))}
        </div>
      </div>

      {/* Форма */}
      <div className="rounded-xl p-4 space-y-4" style={{
        background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
        border: "1px solid rgba(255,215,0,0.12)",
        boxShadow: "0 2px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.5)",
      }}>
        {/* Фото-кнопка */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={photoLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-roboto text-sm font-semibold transition-all active:scale-95"
            style={{
              background: photoLoading ? "rgba(255,215,0,0.05)" : "linear-gradient(145deg, rgba(255,215,0,0.12), rgba(255,215,0,0.06))",
              border: "1.5px dashed rgba(255,215,0,0.35)",
              color: photoLoading ? "rgba(255,215,0,0.4)" : "rgba(255,215,0,0.9)",
            }}
          >
            {photoLoading
              ? <><Icon name="Loader" size={16} className="animate-spin" /> Распознаю фото...</>
              : <><Icon name="Camera" size={16} /> Сфоткать устройство / коробку для автоопределения</>
            }
          </button>
          {photoHint && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg" style={{
              background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
            }}>
              <Icon name="CheckCircle2" size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-roboto text-xs" style={{ color: "rgba(52,211,153,0.9)" }}>{photoHint}</span>
            </div>
          )}
        </div>

        {/* Модель + Бренд */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Модель *
            </label>
            <input value={model} onChange={e => setModel(e.target.value)}
              placeholder="iPhone 14 Pro 128GB"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Бренд</label>
            <input value={brand} onChange={e => setBrand(e.target.value)}
              placeholder="Apple"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Категория + Память + Год */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Категория</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Память</label>
            <input value={storage} onChange={e => setStorage(e.target.value)}
              placeholder="128 GB"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Год</label>
            <input value={year} onChange={e => setYear(e.target.value)}
              placeholder="2023"
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
        </div>

        {/* Состояние */}
        <div>
          <label className="block font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Состояние</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => setCondition(c)}
                className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
                style={{
                  background: condition === c ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${condition === c ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: condition === c ? "#FFD700" : "rgba(255,255,255,0.5)",
                  fontWeight: condition === c ? "600" : "400",
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Комплектация */}
        <div>
          <label className="block font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Комплектация</label>
          <div className="flex flex-wrap gap-2">
            {KITS.map(k => (
              <button key={k} onClick={() => setKit(k)}
                className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
                style={{
                  background: kit === k ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${kit === k ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: kit === k ? "#FFD700" : "rgba(255,255,255,0.5)",
                  fontWeight: kit === k ? "600" : "400",
                }}
              >{k}</button>
            ))}
          </div>
        </div>

        {/* Дефекты */}
        <div>
          <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
            Дефекты / особенности
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Царапина на экране, нет зарядника, Face ID не работает..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all resize-none placeholder:text-white/20"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
            <span className="font-roboto text-sm text-red-400">{error}</span>
          </div>
        )}

        <button onClick={onEvaluate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FFE34D, #FFD700)",
            boxShadow: loading ? "none" : "0 0 24px rgba(255,215,0,0.4), 0 2px 0 rgba(255,255,255,0.25) inset",
          }}
        >
          {loading
            ? <><Icon name="Loader" size={18} className="animate-spin" /> Анализирую рынок...</>
            : <><Icon name="TrendingUp" size={18} /> Оценить стоимость</>
          }
        </button>
      </div>
    </>
  );
}
