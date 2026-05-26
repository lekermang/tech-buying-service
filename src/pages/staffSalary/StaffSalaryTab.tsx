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

// PIN-экран для сотрудника перед просмотром зарплаты
function SalaryPinGate({ token, employeeName, onUnlock }: { token: string; employeeName: string; onUnlock: () => void }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  const pin = digits.join("");

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError("");
    if (d && idx < 3) refs[idx + 1].current?.focus();
    // Автосабмит при заполнении последней цифры
    if (d && idx === 3) {
      const fullPin = [...digits.slice(0, 3), d].join("");
      if (fullPin.length === 4) verify(fullPin);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
    if (e.key === "Enter" && pin.length === 4) verify(pin);
  };

  const verify = async (p: string) => {
    if (p.length < 4) { setError("Введите 4 цифры"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "check_pin", pin: p }),
      });
      const data = await res.json();
      if (data.ok) {
        onUnlock();
      } else {
        setError("Неверный PIN");
        setDigits(["", "", "", ""]);
        setTimeout(() => refs[0].current?.focus(), 50);
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-6">
      {/* Иконка */}
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)" }}>
        <Icon name="Wallet" size={28} className="text-[#FFD700]" />
      </div>

      {/* Заголовок */}
      <div className="text-center">
        <div className="font-oswald font-bold text-xl uppercase tracking-wide text-white mb-1">
          Зарплата
        </div>
        <div className="font-roboto text-sm text-white/40">
          Введите ваш PIN-код для просмотра
        </div>
      </div>

      {/* Поля ввода PIN */}
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
                : d
                  ? "2px solid rgba(255,215,0,0.5)"
                  : "2px solid rgba(255,255,255,0.1)",
              color: "#FFD700",
              caretColor: "transparent",
            }}
          />
        ))}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 font-roboto text-sm animate-in fade-in duration-200">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {/* Кнопка */}
      <button
        onClick={() => verify(pin)}
        disabled={pin.length < 4 || loading}
        className="w-full max-w-xs py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40"
        style={{
          background: pin.length === 4 && !loading
            ? "linear-gradient(135deg, #FFD700, #d4a017)"
            : "rgba(255,255,255,0.06)",
          color: pin.length === 4 && !loading ? "#000" : "rgba(255,255,255,0.3)",
        }}
      >
        {loading
          ? <span className="flex items-center justify-center gap-2"><Icon name="Loader" size={14} className="animate-spin" />Проверяю...</span>
          : "Войти"}
      </button>
    </div>
  );
}

export default function StaffSalaryTab({ role, token, employeeName }: Props) {
  const [pinPassed, setPinPassed] = useState(false);

  if (role === "owner" || role === "admin") {
    return <OwnerSalaryView token={token} />;
  }

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