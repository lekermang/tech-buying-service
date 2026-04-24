import { useEffect, useRef, useState } from "react";
import { REPAIR_PARTS_URL, Part, ExtraWork, ClientInfo } from "./types";

/** Загрузка запчастей по модели + производные вычисления (группировка, итоги). */
export function useRepairParts(params: { model: string; phone: string }) {
  const { model, phone } = params;

  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showPartsList, setShowPartsList] = useState(false);
  const [extraWorks, setExtraWorks] = useState<string[]>([]);
  const [extraWorksList, setExtraWorksList] = useState<ExtraWork[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const m = model.trim();
    setSelectedPart(null);
    setParts([]);
    setShowPartsList(false);
    setExtraWorks([]);
    if (m.length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPartsLoading(true);
      try {
        const res = await fetch(`${REPAIR_PARTS_URL}?model=${encodeURIComponent(m)}&phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        const fetched = data.parts || [];
        setParts(fetched);
        if (fetched.length > 0) setShowPartsList(true);
        setExtraWorksList(data.extra_works || []);
        setClientInfo(data.client || null);
      } catch { /* ignore */ }
      setPartsLoading(false);
    }, 600);
  }, [model, phone]);

  const groupedParts = parts.reduce<Record<string, Part[]>>((acc, p) => {
    if (!acc[p.part_type]) acc[p.part_type] = [];
    acc[p.part_type].push(p);
    return acc;
  }, {});

  const extraTotal = extraWorksList
    .filter(w => extraWorks.includes(String(w.id)))
    .reduce((s, w) => s + w.price, 0);

  const discountPct = clientInfo?.found ? (clientInfo.discount_pct || 0) : 0;
  const grandTotal = Math.round(((selectedPart?.total ?? 0) + extraTotal) * (1 - discountPct / 100));

  const toggleExtra = (id: string) =>
    setExtraWorks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSelectPart = (part: Part) => {
    setSelectedPart(part);
    setShowPartsList(false);
    setExtraWorks([]);
  };

  const changeSelection = () => {
    setShowPartsList(true);
    setSelectedPart(null);
    setExtraWorks([]);
  };

  const resetPartsState = () => {
    setParts([]);
    setSelectedPart(null);
    setShowPartsList(false);
    setExtraWorks([]);
    setExtraWorksList([]);
    setClientInfo(null);
  };

  return {
    parts, partsLoading, selectedPart, showPartsList, extraWorks, extraWorksList,
    clientInfo, groupedParts, extraTotal, grandTotal,
    setShowPartsList, setSelectedPart, setExtraWorks,
    toggleExtra, handleSelectPart, changeSelection, resetPartsState,
  };
}
