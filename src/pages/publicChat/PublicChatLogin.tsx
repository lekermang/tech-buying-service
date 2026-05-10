// === Простой режим: имя + телефон, без OTP ===
// Если захочешь вернуть выбор способов (SMS / Telegram / Zvonok / бот / гость) —
// см. src/pages/publicChat/PublicChatLogin.full.tsx (сохранена полная версия с виджетами).

import { useState } from "react";
import Icon from "@/components/ui/icon";
import { pchatApi, PCHAT_TOKEN_KEY, PCHAT_NAME_KEY, PCHAT_DIRECT_KEY } from "./types";

type Props = { onSuccess: () => void };

const PCHAT_PHONE_KEY = "pchat_phone";

// Маска +7 (XXX) XXX-XX-XX
const formatPhone = (raw: string): string => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);
  const a = d.slice(1, 4);
  const b = d.slice(4, 7);
  const c = d.slice(7, 9);
  const e = d.slice(9, 11);
  let out = "+7";
  if (a) out += " (" + a;
  if (a.length === 3) out += ")";
  if (b) out += " " + b;
  if (c) out += "-" + c;
  if (e) out += "-" + e;
  return out;
};

const phoneDigits = (s: string) => s.replace(/\D/g, "");

export default function PublicChatLogin({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const phoneOk = phoneDigits(phone).length === 11;
  const nameOk = name.trim().length >= 2;
  const canSubmit = nameOk && phoneOk && !busy;

  const enter = async () => {
    if (!nameOk) { setErr("Введите имя (минимум 2 буквы)"); return; }
    if (!phoneOk) { setErr("Введите телефон полностью"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("guest_login", {
      name: name.trim().slice(0, 40),
      phone: "+" + phoneDigits(phone),
    });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка входа"); return; }
    localStorage.setItem(PCHAT_TOKEN_KEY, r.token as string);
    localStorage.setItem(PCHAT_NAME_KEY, r.name as string);
    localStorage.setItem(PCHAT_PHONE_KEY, "+" + phoneDigits(phone));
    localStorage.removeItem(PCHAT_DIRECT_KEY);
    onSuccess();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) enter();
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#d4a017] items-center justify-center shadow-[0_8px_24px_rgba(255,215,0,0.3)] mb-3">
            <Icon name="MessageCircle" size={26} className="text-black" />
          </div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wide">Скупка24 LIVE</h1>
          <p className="text-white/55 text-sm mt-1">Чат с командой</p>
        </div>

        <div className="bg-[#101010] border border-[#1F1F1F] rounded-2xl p-5 shadow-xl">
          <div className="text-[12px] text-white/55 mb-4 text-center">
            Оставьте имя и телефон — менеджер свяжется с вами, если потеряем связь в чате.
          </div>

          <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">
            Как вас называть?
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={onKey}
            placeholder="Иван"
            maxLength={40}
            autoFocus
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-base px-3 py-3 rounded-lg outline-none mb-3"
          />

          <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold block mb-1">
            Телефон для связи
          </label>
          <input
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            onKeyDown={onKey}
            placeholder="+7 (___) ___-__-__"
            inputMode="tel"
            type="tel"
            autoComplete="tel"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white text-base px-3 py-3 rounded-lg outline-none mb-3"
          />

          {err && <div className="text-red-400 text-xs mb-2">{err}</div>}

          <button
            onClick={enter}
            disabled={!canSubmit}
            className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Icon name={busy ? "Loader" : "ArrowRight"} size={16} className={busy ? "animate-spin" : ""} />
            {busy ? "Заходим..." : "Войти в чат"}
          </button>

          <p className="text-[10px] text-white/35 text-center mt-3">
            Нажимая «Войти», вы соглашаетесь, что мы можем перезвонить по этому номеру
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-white/40 hover:text-[#FFD700] text-xs">← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  );
}
