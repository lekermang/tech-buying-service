import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import OwnerSalaryView from "./OwnerSalaryView";
import EmployeeSalaryView from "./EmployeeSalaryView";
import { EMPLOYEE_AUTH_URL } from "@/pages/staff.types";

interface Props {
  role: string;
  token: string;
  employeeName: string;
}

// Вспомогательный компонент: 4 поля ввода PIN
function PinInputs({
  digits, setDigits, error, refs, onComplete,
}: {
  digits: string[];
  setDigits: (d: string[]) => void;
  error: boolean;
  refs: React.RefObject<HTMLInputElement>[];
  onComplete: (pin: string) => void;
}) {
  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 3) refs[idx + 1].current?.focus();
    if (d && idx === 3) {
      const full = [...digits.slice(0, 3), d].join("");
      if (full.length === 4) onComplete(full);
    }
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
    if (e.key === "Enter" && digits.join("").length === 4) onComplete(digits.join(""));
  };
  return (
    <div className="flex items-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleDigit(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-14 h-14 text-center text-2xl font-bold rounded-xl outline-none transition-all"
          style={{
            background: d ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.05)",
            border: error
              ? "2px solid rgba(239,68,68,0.7)"
              : d ? "2px solid rgba(255,215,0,0.5)" : "2px solid rgba(255,255,255,0.1)",
            color: "#FFD700",
            caretColor: "transparent",
          }}
        />
      ))}
    </div>
  );
}

// PIN-экран для сотрудника перед просмотром зарплаты
function SalaryPinGate({ token, employeeName, onUnlock }: { token: string; employeeName: string; onUnlock: () => void }) {
  // Режим: "enter" — ввод PIN, "reset_old" — ввод старого PIN для смены, "reset_new" — ввод нового PIN, "reset_confirm" — подтверждение нового
  const [mode, setMode] = useState<"enter" | "reset_old" | "reset_new" | "reset_confirm">("enter");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [oldPinDigits, setOldPinDigits] = useState(["", "", "", ""]);
  const [newPinDigits, setNewPinDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPinSet, setHasPinSet] = useState<boolean | null>(null);

  const e0 = useRef<HTMLInputElement>(null); const e1 = useRef<HTMLInputElement>(null);
  const e2 = useRef<HTMLInputElement>(null); const e3 = useRef<HTMLInputElement>(null);
  const o0 = useRef<HTMLInputElement>(null); const o1 = useRef<HTMLInputElement>(null);
  const o2 = useRef<HTMLInputElement>(null); const o3 = useRef<HTMLInputElement>(null);
  const n0 = useRef<HTMLInputElement>(null); const n1 = useRef<HTMLInputElement>(null);
  const n2 = useRef<HTMLInputElement>(null); const n3 = useRef<HTMLInputElement>(null);
  const c0 = useRef<HTMLInputElement>(null); const c1 = useRef<HTMLInputElement>(null);
  const c2 = useRef<HTMLInputElement>(null); const c3 = useRef<HTMLInputElement>(null);
  const enterRefs   = [e0, e1, e2, e3];
  const oldRefs     = [o0, o1, o2, o3];
  const newRefs     = [n0, n1, n2, n3];
  const confirmRefs = [c0, c1, c2, c3];

  // Проверяем установлен ли PIN при первом рендере
  useEffect(() => {
    fetch(EMPLOYEE_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "check_pin", pin: "0000" }),
    }).then(r => r.json()).then(d => {
      // Если ответ "PIN не установлен" — предлагаем сразу установить
      if (d.error === "PIN не установлен") {
        setHasPinSet(false);
        setMode("reset_new");
      } else {
        setHasPinSet(true);
        setTimeout(() => enterRefs[0].current?.focus(), 50);
      }
    }).catch(() => { setHasPinSet(true); setTimeout(() => enterRefs[0].current?.focus(), 50); });
  }, []);

  useEffect(() => {
    if (mode === "enter") { setDigits(["","","",""]); setTimeout(() => enterRefs[0].current?.focus(), 50); }
    if (mode === "reset_old") { setOldPinDigits(["","","",""]); setTimeout(() => oldRefs[0].current?.focus(), 50); }
    if (mode === "reset_new") { setNewPinDigits(["","","",""]); setTimeout(() => newRefs[0].current?.focus(), 50); }
    if (mode === "reset_confirm") { setDigits(["","","",""]); setTimeout(() => confirmRefs[0].current?.focus(), 50); }
    setError(""); setSuccess("");
  }, [mode]);

  const verify = async (p: string) => {
    if (p.length < 4) { setError("Введите 4 цифры"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "check_pin", pin: p }),
      });
      const data = await res.json();
      if (data.ok) { onUnlock(); }
      else {
        setError(data.error === "PIN не установлен" ? "PIN не установлен. Нажмите «Установить PIN»" : "Неверный PIN");
        setDigits(["","","",""]); setTimeout(() => enterRefs[0].current?.focus(), 50);
      }
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
  };

  const savePin = async (oldPin: string, newPin: string) => {
    setLoading(true); setError("");
    try {
      const body: Record<string, string> = { action: "me_change_pin", new_pin: newPin };
      if (oldPin) body.current_pin = oldPin;
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess("PIN установлен! Теперь войди с новым PIN.");
        setHasPinSet(true);
        setTimeout(() => setMode("enter"), 1500);
      } else {
        setError(data.error || "Ошибка сохранения PIN");
        if (oldPin) { setOldPinDigits(["","","",""]); setTimeout(() => oldRefs[0].current?.focus(), 50); }
      }
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
  };

  const handleResetNewComplete = (pin: string) => {
    setNewPinDigits(pin.split(""));
    setMode("reset_confirm");
  };

  const handleConfirmComplete = (confirmPin: string) => {
    const newPin = newPinDigits.join("");
    if (confirmPin !== newPin) {
      setError("PIN не совпадает. Попробуй ещё раз.");
      setNewPinDigits(["","","",""]); setDigits(["","","",""]);
      setMode("reset_new"); return;
    }
    const oldPin = hasPinSet ? oldPinDigits.join("") : "";
    savePin(oldPin, newPin);
  };

  if (hasPinSet === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Icon name="Loader2" size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6">
      {/* Иконка */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)" }}>
        <Icon name={mode === "enter" ? "Wallet" : "KeyRound"} size={28} className="text-[#FFD700]" />
      </div>

      {/* Заголовок */}
      <div className="text-center">
        <div className="font-oswald font-bold text-xl uppercase tracking-wide text-white mb-1">
          {mode === "enter" ? "Зарплата" : mode === "reset_old" ? "Текущий PIN" : mode === "reset_new" ? "Новый PIN" : "Подтвердите PIN"}
        </div>
        <div className="font-roboto text-sm text-white/40">
          {mode === "enter" && "Введите ваш PIN-код для просмотра"}
          {mode === "reset_old" && "Введите текущий PIN для подтверждения"}
          {mode === "reset_new" && (hasPinSet ? "Придумайте новый 4-значный PIN" : "Придумайте PIN для доступа к зарплате")}
          {mode === "reset_confirm" && "Введите новый PIN ещё раз"}
        </div>
      </div>

      {/* Поля ввода */}
      {mode === "enter" && (
        <PinInputs digits={digits} setDigits={setDigits} error={!!error} refs={enterRefs} onComplete={verify} />
      )}
      {mode === "reset_old" && (
        <PinInputs digits={oldPinDigits} setDigits={setOldPinDigits} error={!!error} refs={oldRefs}
          onComplete={(p) => { setOldPinDigits(p.split("")); setMode("reset_new"); }} />
      )}
      {mode === "reset_new" && (
        <PinInputs digits={newPinDigits} setDigits={setNewPinDigits} error={!!error} refs={newRefs} onComplete={handleResetNewComplete} />
      )}
      {mode === "reset_confirm" && (
        <PinInputs digits={digits} setDigits={setDigits} error={!!error} refs={confirmRefs} onComplete={handleConfirmComplete} />
      )}

      {/* Ошибка / успех */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 font-roboto text-sm">
          <Icon name="AlertCircle" size={14} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 font-roboto text-sm" style={{ color: "#34d399" }}>
          <Icon name="CheckCircle" size={14} />{success}
        </div>
      )}

      {/* Кнопки */}
      {mode === "enter" && (
        <>
          <button
            onClick={() => verify(digits.join(""))}
            disabled={digits.join("").length < 4 || loading}
            className="w-full max-w-xs py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40"
            style={{
              background: digits.join("").length === 4 && !loading ? "linear-gradient(135deg,#FFD700,#d4a017)" : "rgba(255,255,255,0.06)",
              color: digits.join("").length === 4 && !loading ? "#000" : "rgba(255,255,255,0.3)",
            }}
          >
            {loading ? <span className="flex items-center justify-center gap-2"><Icon name="Loader" size={14} className="animate-spin" />Проверяю...</span> : "Войти"}
          </button>
          <button
            onClick={() => setMode(hasPinSet ? "reset_old" : "reset_new")}
            className="font-roboto text-xs transition-all"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {hasPinSet ? "Забыл PIN / изменить PIN" : "Установить PIN"}
          </button>
        </>
      )}

      {mode !== "enter" && (
        <button
          onClick={() => setMode("enter")}
          className="font-roboto text-xs"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          ← Назад
        </button>
      )}

      {(mode === "reset_new" || mode === "reset_confirm") && (
        <button
          onClick={() => {
            if (mode === "reset_new") handleResetNewComplete(newPinDigits.join(""));
            else handleConfirmComplete(digits.join(""));
          }}
          disabled={
            (mode === "reset_new" && newPinDigits.join("").length < 4) ||
            (mode === "reset_confirm" && digits.join("").length < 4) || loading
          }
          className="w-full max-w-xs py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff" }}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Icon name="Loader" size={14} className="animate-spin" />Сохраняю...</span>
            : mode === "reset_new" ? "Далее →" : "Сохранить PIN"}
        </button>
      )}
    </div>
  );
}

export default function StaffSalaryTab({ role, token, employeeName }: Props) {
  const [pinPassed, setPinPassed] = useState(false);

  // Только владелец видит панель управления зарплатами
  if (role === "owner") {
    return <OwnerSalaryView token={token} employeeName={employeeName} />;
  }

  // Все остальные (admin, staff) — своя зарплата с PIN-защитой
  if (!pinPassed) {
    return (
      <SalaryPinGate
        token={token}
        employeeName={employeeName}
        onUnlock={() => setPinPassed(true)}
      />
    );
  }

  return <EmployeeSalaryView token={token} employeeName={employeeName} />;
}