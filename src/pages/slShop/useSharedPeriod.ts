import { useEffect, useState, useCallback } from "react";

const KEY = "slshop_period";
const EVENT = "slshop:period-change";
const DEFAULT = "30d";

export function getSharedPeriod(): string {
  if (typeof window === "undefined") return DEFAULT;
  return localStorage.getItem(KEY) || DEFAULT;
}

export function setSharedPeriod(v: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, v);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
}

export function useSharedPeriod(): [string, (v: string) => void] {
  const [period, setPeriodState] = useState<string>(() => getSharedPeriod());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setPeriodState(detail || getSharedPeriod());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPeriodState(e.newValue || DEFAULT);
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((v: string) => {
    setSharedPeriod(v);
  }, []);

  return [period, update];
}
