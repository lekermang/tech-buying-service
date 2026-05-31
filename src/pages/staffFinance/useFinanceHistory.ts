import { useState, useCallback } from "react";

export type ExpCat = { name: string; amount: number; percent: number; trend?: string; comment?: string };
export type IncCat = { name: string; amount: number; percent: number };
export type TopExp = { date: string; desc: string; amount: number };

export type Parsed = {
  debit_balance: string | null;
  savings_balance: string | null;
  total_money: string | null;
  profit_total: string | null;
  profit_period: string | null;
  days_runway: string | null;
  safety_level: "green" | "yellow" | "red" | null;
  main_problem: string | null;
  budget_today: string | null;
  budget_today_explain: string | null;
  actions: string[];
  expense_categories: ExpCat[];
  income_categories: IncCat[];
  top_expenses: TopExp[];
  savings_tips: string[];
  cash_flow_summary: string | null;
};

export type StockData = {
  in_stock: number; stock_value: number; stock_sell_value: number;
  total_profit: number; total_invested: number; total_revenue: number;
  sold_count: number; last30_buy: number; last30_revenue: number; last30_profit: number;
};

export type ReportResult = {
  parsed: Parsed; stock: StockData;
  generated_at: string; days_left_month: number; day_of_month: number;
};

export type HistoryEntry = {
  id: string;          // уникальный ключ
  period: string;      // "Май 2026"
  saved_at: string;    // ISO дата сохранения
  result: ReportResult;
};

const LS_KEY = "finance_report_history_v2";
const MAX_ENTRIES = 6; // максимум 6 периодов

function load(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* ignore */ }
}

export function useFinanceHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => load());

  const addEntry = useCallback((period: string, result: ReportResult) => {
    const id = `${period}_${Date.now()}`;
    const entry: HistoryEntry = { id, period, saved_at: new Date().toISOString(), result };
    setHistory(prev => {
      // Если уже есть запись за этот период — заменяем её
      const filtered = prev.filter(e => e.period !== period);
      const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearAll };
}

// Извлекаем числовое значение из строк типа "45 230 руб" или "45230"
export function parseAmount(s: string | null | undefined): number {
  if (!s) return 0;
  const clean = String(s).replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}
