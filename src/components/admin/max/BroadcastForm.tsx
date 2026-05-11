import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const MAX_BOT_URL = "https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c";
const MAX_LEN = 4000;

const TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Праздничная акция",
    text: "🎉 Дорогие клиенты! У нас праздничная акция: скидка 15% на все ремонты до конца недели. Пишите модель — оценим бесплатно.",
  },
  {
    label: "Скидка на ремонт",
    text: "🔧 Только сегодня — замена дисплея iPhone со скидкой 20%! Запись по телефону или прямо в MAX.",
  },
  {
    label: "Новинка в каталоге",
    text: "📱 Новые поступления Б/У iPhone в идеальном состоянии. Гарантия 30 дней. Открыть каталог: https://skypka24.com/catalog",
  },
];

type BroadcastResult = {
  sent?: number;
  failed?: number;
  total?: number;
  dry_run?: boolean;
  error?: string;
};

export default function BroadcastForm({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null); setResult(null);
    const t = text.trim();
    if (!t) { setError("Введите текст рассылки"); return; }
    if (t.length > MAX_LEN) { setError(`Слишком длинный текст (${t.length}/${MAX_LEN})`); return; }

    if (!dryRun) {
      const probeRes = await fetch(`${MAX_BOT_URL}?action=broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ text: t, dry_run: true }),
      }).catch(() => null);
      const probe = probeRes ? await probeRes.json().catch(() => ({})) : {};
      const total: number = probe?.total || 0;
      if (total > 50) {
        const ok = window.confirm(
          `Рассылка уйдёт ${total} подписчикам MAX. Продолжить?`
        );
        if (!ok) return;
      }
    }

    setSending(true);
    try {
      const res = await fetch(`${MAX_BOT_URL}?action=broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ text: t, dry_run: dryRun }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("Нет доступа: проверь админ-токен");
      } else if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(`Сетевая ошибка: ${e}`);
    }
    setSending(false);
  };

  const charsLeft = MAX_LEN - text.length;

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Рассылка всем подписчикам MAX</div>
        <div className="text-white/40 text-xs font-roboto">Сообщение уйдёт всем клиентам, которые писали нашему MAX-боту</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-roboto">Текст рассылки</label>
            <span className={`text-[10px] font-roboto ${charsLeft < 0 ? "text-red-400" : charsLeft < 100 ? "text-orange-400" : "text-white/30"}`}>
              {text.length} / {MAX_LEN}
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            placeholder="Текст для всех подписчиков MAX..."
            className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700] transition-colors font-roboto resize-none"
          />
        </div>

        <div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider font-roboto mb-1.5">Шаблоны</div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => setText(t.text)}
                className="text-[10px] font-roboto px-2.5 py-1.5 border border-[#FFD700]/25 text-[#FFD700]/80 hover:bg-[#FFD700]/10 hover:text-[#FFD700] transition-colors flex items-center gap-1"
              >
                <Icon name="FileText" size={10} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={e => setDryRun(e.target.checked)}
            className="accent-[#FFD700] w-4 h-4"
          />
          <span className="text-white/70 text-xs font-roboto">
            Тестовый запуск (только посчитать, никому не отправлять)
          </span>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={send}
            disabled={sending || charsLeft < 0}
            className={`font-oswald font-bold uppercase tracking-wide text-sm px-5 py-2.5 transition-colors disabled:opacity-50 flex items-center gap-2 ${
              dryRun
                ? "border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10"
                : "bg-[#FFD700] hover:bg-yellow-400 text-black"
            }`}
          >
            <Icon name={sending ? "Loader2" : dryRun ? "Calculator" : "Megaphone"} size={14} className={sending ? "animate-spin" : ""} />
            {sending ? "Идёт..." : dryRun ? "Посчитать" : "Отправить всем"}
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-roboto flex items-center gap-2">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}

        {result && (
          <div className="px-3 py-2 border border-green-500/30 bg-green-500/10 text-green-300 text-xs font-roboto flex items-center gap-2">
            <Icon name="CheckCircle" size={14} />
            {result.dry_run ? (
              <span>Тестовый запуск: будет отправлено <b>{result.total ?? 0}</b> подписчикам</span>
            ) : (
              <span>
                Готово: отправлено <b>{result.sent ?? 0}</b>, ошибок <b>{result.failed ?? 0}</b>, всего <b>{result.total ?? 0}</b>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
