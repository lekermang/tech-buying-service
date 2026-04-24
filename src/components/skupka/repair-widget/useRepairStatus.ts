import { useState } from "react";
import { REPAIR_STATUS_URL, OrderStatus } from "./types";

/** Проверка статуса заявки по ID и по телефону. */
export function useRepairStatus() {
  const [statusId, setStatusId] = useState("");
  const [statusResult, setStatusResult] = useState<OrderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [phoneResults, setPhoneResults] = useState<OrderStatus[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const checkStatus = async () => {
    if (!statusId.trim()) return;
    setStatusLoading(true);
    setStatusError("");
    setStatusResult(null);
    try {
      const res = await fetch(REPAIR_STATUS_URL + "?id=" + statusId.trim());
      const data = await res.json();
      if (res.ok) setStatusResult(data);
      else setStatusError(data.error || "Заявка не найдена");
    } catch {
      setStatusError("Ошибка соединения");
    }
    setStatusLoading(false);
  };

  const checkStatusByPhone = async (phone: string) => {
    if (!phone.trim()) return;
    setPhoneLoading(true);
    setPhoneError("");
    setPhoneResults([]);
    try {
      const res = await fetch(REPAIR_STATUS_URL + "?phone=" + encodeURIComponent(phone.trim()));
      const data = await res.json();
      if (res.ok && data.orders) setPhoneResults(data.orders);
      else setPhoneError(data.error || "Заявки не найдены");
    } catch {
      setPhoneError("Ошибка соединения");
    }
    setPhoneLoading(false);
  };

  return {
    statusId, setStatusId,
    statusResult, statusLoading, statusError,
    phoneResults, phoneLoading, phoneError,
    checkStatus, checkStatusByPhone,
  };
}
