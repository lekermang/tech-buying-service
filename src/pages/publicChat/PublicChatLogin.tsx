// === Простой режим: только имя, без проверок ===
// Если захочешь вернуть выбор способов (SMS / Telegram / Zvonok / бот / гость) —
// см. src/pages/publicChat/PublicChatLogin.full.tsx (сохранена полная версия с виджетами).

import { useState } from "react";
import Icon from "@/components/ui/icon";
import { pchatApi, PCHAT_TOKEN_KEY, PCHAT_NAME_KEY, PCHAT_DIRECT_KEY } from "./types";

type Props = { onSuccess: () => void };

export default function PublicChatLogin({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const enter = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setErr("Введите имя (минимум 2 буквы)"); return; }
    setBusy(true); setErr(null);
    const r = await pchatApi("guest_login", { name: trimmed.slice(0, 40) });
    setBusy(false);
    if (!r.ok) { setErr((r.error as string) || "Ошибка входа"); return; }
    localStorage.setItem(PCHAT_TOKEN_KEY, r.token as string);
    localStorage.setItem(PCHAT_NAME_KEY, r.name as string);
    localStorage.removeItem(PCHAT_DIRECT_KEY);
    onSuccess();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim().length >= 2 && !busy) enter();
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
          <div className="text-[12px] text-white/55 mb-3 text-center">
            Введите имя и нажмите «Войти». Без регистрации.
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

          {err && <div className="text-red-400 text-xs mb-2">{err}</div>}

          <button
            onClick={enter}
            disabled={busy || name.trim().length < 2}
            className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-bold py-3 rounded-lg disabled:opacity-50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Icon name={busy ? "Loader" : "ArrowRight"} size={16} className={busy ? "animate-spin" : ""} />
            {busy ? "Заходим..." : "Войти в чат"}
          </button>

          <p className="text-[10px] text-white/35 text-center mt-3">
            Команда Скупка24 ответит вам в течение нескольких минут
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-white/40 hover:text-[#FFD700] text-xs">← Вернуться на сайт</a>
        </div>
      </div>
    </div>
  );
}
