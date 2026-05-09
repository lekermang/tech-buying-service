import { useState } from "react";
import Icon from "@/components/ui/icon";
import { pchatApi, PCHAT_TOKEN_KEY, PCHAT_NAME_KEY, PCHAT_PHONE_KEY, PCHAT_DIRECT_KEY } from "./types";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";

type Props = { onSuccess: () => void };

export default function PublicChatLogin({ onSuccess }: Props) {
  const [phone, setPhone] = useState("+7");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const requestOtp = async () => {
    if (!isPhoneValid(phone)) { setErr("Введите номер целиком"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("request_otp", { phone });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка"); return; }
    setStep("code");
  };

  const verifyOtp = async () => {
    if (code.length !== 4) { setErr("Введите 4-значный код"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("verify_otp", { phone, code, name });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Неверный код"); return; }
    localStorage.setItem(PCHAT_TOKEN_KEY, r.token as string);
    localStorage.setItem(PCHAT_NAME_KEY, (r.name as string) || name);
    localStorage.setItem(PCHAT_PHONE_KEY, phone);
    if (r.direct_room_id) localStorage.setItem(PCHAT_DIRECT_KEY, String(r.direct_room_id));
    onSuccess();
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#d4a017] items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.3)] mb-3">
            <Icon name="MessageCircle" size={26} className="text-black" />
          </div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wide">Скупка24 LIVE</h1>
          <p className="text-white/55 text-sm mt-1">Чат с командой и клиентами</p>
        </div>

        <div className="bg-[#101010] border border-[#1F1F1F] rounded-2xl p-5 shadow-xl">
          {step === "phone" && (
            <>
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Имя (по желанию)</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван"
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3"
              />
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Телефон</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="+7 (___) ___-__-__"
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-3"
              />
              {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
              <button
                onClick={requestOtp}
                disabled={busy}
                className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95 transition"
              >
                {busy ? "Отправляем..." : "Получить код в SMS"}
              </button>
              <p className="text-[10px] text-white/35 text-center mt-2">
                Нажимая, соглашаетесь с обработкой персональных данных
              </p>
            </>
          )}

          {step === "code" && (
            <>
              <div className="text-sm text-white/70 mb-3">
                Код отправлен на <b className="text-[#FFD700]">{phone}</b>
              </div>
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">Код из SMS</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-2xl text-center tracking-[0.6em] font-bold px-3 py-3 rounded-lg outline-none mb-3"
              />
              {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
              <button
                onClick={verifyOtp}
                disabled={busy || code.length !== 4}
                className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95 transition"
              >
                {busy ? "Проверяем..." : "Войти в чат"}
              </button>
              <button
                onClick={() => { setStep("phone"); setCode(""); setErr(null); }}
                className="w-full mt-2 text-white/55 hover:text-white text-xs"
              >
                ← Изменить номер
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-white/40 hover:text-[#FFD700] text-xs">← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  );
}
