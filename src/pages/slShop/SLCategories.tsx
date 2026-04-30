import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory } from "./types";

export default function SLCategories({ token }: { token: string }) {
  const [list, setList] = useState<SLCategory[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");

  const load = useCallback(async () => {
    const r = await slApi<SLCategory[]>(token, "categories");
    if (r.ok && r.data) setList(r.data);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    const r = await slApi(token, "category_create", { method: "POST", body: { name, icon } });
    if (r.ok) { setAdding(false); setName(""); setIcon("Package"); load(); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {list.map(c => (
          <div key={c.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 flex items-center gap-2">
            <Icon name={c.icon} size={18} className="text-[#FFD700]" />
            <div className="font-medium text-sm">{c.name}</div>
          </div>
        ))}
      </div>
      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="w-full bg-[#141414] border border-dashed border-[#1F1F1F] rounded-lg py-3 text-sm text-white/50 flex items-center justify-center gap-2">
          <Icon name="Plus" size={14} />Добавить категорию
        </button>
      ) : (
        <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название категории"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Иконка (lucide name, например Smartphone)"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 bg-[#141414] py-2 rounded text-sm">Отмена</button>
            <button onClick={add} className="flex-1 bg-[#FFD700] text-black font-bold py-2 rounded text-sm">Добавить</button>
          </div>
        </div>
      )}
    </div>
  );
}
