import { useState, useRef } from "react";
import type { SLCategory, SLClient, SLBranch } from "../types";

/**
 * Полный набор состояний формы скупки.
 * Вынесено из SLBuyForm.tsx 1:1 без изменения логики.
 */
export function useSLBuyFormState() {
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [branches, setBranches] = useState<SLBranch[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [specsShort, setSpecsShort] = useState("");
  const [specs, setSpecs] = useState("");
  const [storage, setStorage] = useState("");
  const [ramGb, setRamGb] = useState("");
  const [storageGb, setStorageGb] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [imei, setImei] = useState("");
  const [serial, setSerial] = useState("");
  const [battery, setBattery] = useState("");
  const [hasBox, setHasBox] = useState(false);
  const [hasCharger, setHasCharger] = useState(false);
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [source, setSource] = useState<"buyout" | "consignment">("buyout");
  const [consignmentPercent, setConsignmentPercent] = useState("");
  const [status, setStatus] = useState<"stock" | "showcase" | "consignment">("stock");
  const [description, setDescription] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [clientResults, setClientResults] = useState<SLClient[]>([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<number | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const autofillTimer = useRef<number | null>(null);

  // Производные значения (computed)
  const isPhoneCategory = (() => {
    const cat = cats.find(c => c.id === categoryId);
    const t = `${cat?.path || ""} ${cat?.name || ""} ${title}`.toLowerCase();
    return t.includes("телефон") || t.includes("смартфон") || t.includes("phone") || t.includes("iphone");
  })();

  const isAppleDevice = (() => {
    const t = `${brand} ${model} ${title}`.toLowerCase();
    return t.includes("iphone") || t.includes("apple");
  })();

  // Аксессуары — обычно принимают партиями (5, 10 шт): чехлы, стёкла, зарядки.
  // Для них показываем подсказку и крупное поле количества.
  const isAccessoryCategory = (() => {
    const cat = cats.find(c => c.id === categoryId);
    const t = `${cat?.path || ""} ${cat?.name || ""}`.toLowerCase();
    return /аксес|чехл|стекл|заряд|кабел|power\s*bank|держател|переходник|карты пам/i.test(t);
  })();
  const qtyNum = Math.max(1, parseInt(quantity, 10) || 1);
  const buyPriceNum = Number(buyPrice) || 0;

  return {
    // Справочники
    cats, setCats,
    branches, setBranches,
    branchId, setBranchId,
    // Товар
    title, setTitle,
    categoryId, setCategoryId,
    brand, setBrand,
    model, setModel,
    specsShort, setSpecsShort,
    specs, setSpecs,
    storage, setStorage,
    ramGb, setRamGb,
    storageGb, setStorageGb,
    color, setColor,
    condition, setCondition,
    imei, setImei,
    serial, setSerial,
    battery, setBattery,
    hasBox, setHasBox,
    hasCharger, setHasCharger,
    // Цены и партия
    buyPrice, setBuyPrice,
    sellPrice, setSellPrice,
    minPrice, setMinPrice,
    quantity, setQuantity,
    // Тип приёма / статус
    source, setSource,
    consignmentPercent, setConsignmentPercent,
    status, setStatus,
    description, setDescription,
    // Клиент
    clientQuery, setClientQuery,
    clientId, setClientId,
    clientResults, setClientResults,
    showClientDrop, setShowClientDrop,
    showQuickClient, setShowQuickClient,
    // Служебные
    autofilled, setAutofilled,
    saving, setSaving,
    msg, setMsg,
    createdItemId, setCreatedItemId,
    autoPrint, setAutoPrint,
    aiBusy, setAiBusy,
    aiMsg, setAiMsg,
    autofillTimer,
    // Computed
    isPhoneCategory,
    isAppleDevice,
    isAccessoryCategory,
    qtyNum,
    buyPriceNum,
  };
}

export type SLBuyFormState = ReturnType<typeof useSLBuyFormState>;
