import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { setToken, getToken, authCall, aiCall, INP } from "./unlockConstants";
import { Panel } from "./UnlockShared";

/* ══════════════════════════════════════════════════════════════════════════
   ЭКРАН ВХОДА / РЕГИСТРАЦИИ
   ══════════════════════════════════════════════════════════════════════════ */
type AuthMode = "login" | "register" | "reset";

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ email: "", password: "", new_password: "", full_name: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    setLoading(true); setMsg(null);
    try {
      if (mode === "login") {
        const d = await authCall({ action: "login", email: form.email, password: form.password });
        if (d.token) { setToken(d.token); onAuth(); }
        else setMsg({ ok: false, text: d.error || "Неверный email или пароль" });

      } else if (mode === "register") {
        if (form.password !== form.confirm) { setMsg({ ok: false, text: "Пароли не совпадают" }); setLoading(false); return; }
        if (!form.full_name.trim()) { setMsg({ ok: false, text: "Введите имя" }); setLoading(false); return; }
        const d = await authCall({ action: "register_unlock", email: form.email, password: form.password, full_name: form.full_name });
        if (d.token) { setToken(d.token); onAuth(); }
        else setMsg({ ok: false, text: d.error || "Ошибка регистрации" });

      } else {
        if (!form.new_password || form.new_password.length < 6) {
          setMsg({ ok: false, text: "Введите новый пароль (мин. 6 символов)" });
          setLoading(false); return;
        }
        const d = await authCall({ action: "request_reset_direct", email: form.email, new_password: form.new_password });
        if (d.token) {
          setToken(d.token);
          setMsg({ ok: true, text: "Пароль изменён! Входим..." });
          setTimeout(onAuth, 900);
        } else {
          setMsg({ ok: false, text: d.error || "Аккаунт не найден" });
        }
      }
    } catch { setMsg({ ok: false, text: "Ошибка сети" }); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#060406" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(255,215,0,0.07) 0%,transparent 65%)" }} />

      <div className="relative w-full max-w-md">
        {/* Лого */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}>
              <Icon name="Unlock" size={22} className="text-black" />
            </div>
            <div className="text-left">
              <div className="font-oswald font-black text-2xl uppercase text-white">Unlock</div>
              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35">Скупка24 · Разблокировки</div>
            </div>
          </div>
          <p className="text-white/40 text-sm font-roboto">
            {mode === "login" ? "Войдите в личный кабинет" : mode === "register" ? "Создайте аккаунт" : "Сброс пароля"}
          </p>
        </div>

        <Panel>
          <div className="p-6 sm:p-8 space-y-4">
            {/* Переключатель вход/регистрация */}
            {mode !== "reset" && (
              <div className="flex rounded-xl overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {(["login", "register"] as AuthMode[]).map(m => (
                  <button key={m} onClick={() => { setMode(m); setMsg(null); }}
                    className="flex-1 py-2.5 font-roboto text-sm font-medium transition-all"
                    style={{
                      background: mode === m ? "rgba(255,215,0,0.12)" : "transparent",
                      color: mode === m ? "#FFD700" : "rgba(255,255,255,0.4)",
                      borderRight: m === "login" ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}>
                    {m === "login" ? "Войти" : "Регистрация"}
                  </button>
                ))}
              </div>
            )}

            {/* Поля */}
            {mode === "register" && (
              <input className={INP} placeholder="Имя *" value={form.full_name} onChange={set("full_name")} autoComplete="name" />
            )}
            <input className={INP} placeholder="Email *" value={form.email} onChange={set("email")} type="email" autoComplete="email" />
            {mode === "login" && (
              <input className={INP} placeholder="Пароль *" value={form.password} onChange={set("password")} type="password" autoComplete="current-password" />
            )}
            {mode === "register" && (
              <>
                <input className={INP} placeholder="Пароль * (мин. 6 символов)" value={form.password} onChange={set("password")} type="password" autoComplete="new-password" />
                <input className={INP} placeholder="Повторите пароль *" value={form.confirm} onChange={set("confirm")} type="password" />
              </>
            )}
            {mode === "reset" && (
              <>
                <input className={INP} placeholder="Новый пароль * (мин. 6 символов)" value={form.new_password} onChange={set("new_password")} type="password" autoComplete="new-password" />
                <div className="font-roboto text-[11px] text-white/30 -mt-2 px-1">
                  Введи новый пароль — он сразу применится без письма на почту
                </div>
              </>
            )}

            {/* Сообщение */}
            {msg && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: msg.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
                  border: `1px solid ${msg.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
                }}>
                <Icon name={msg.ok ? "CheckCircle" : "AlertCircle"} size={15}
                  style={{ color: msg.ok ? "#6ee7b7" : "#fca5a5", flexShrink: 0 }} />
                <span className="font-roboto text-sm" style={{ color: msg.ok ? "#6ee7b7" : "#fca5a5" }}>{msg.text}</span>
              </div>
            )}

            {/* Кнопка */}
            <button onClick={submit} disabled={loading}
              className="group relative w-full overflow-hidden py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-sm text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                boxShadow: "0 0 0 1px rgba(255,215,0,0.6),0 10px 30px rgba(255,215,0,0.3)",
              }}>
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {loading
                ? <><Icon name="Loader" size={15} className="animate-spin relative" />Загрузка...</>
                : <span className="relative">{mode === "login" ? "Войти" : mode === "register" ? "Создать аккаунт" : "Сменить пароль"}</span>
              }
            </button>

            {/* Ссылки */}
            <div className="flex items-center justify-between pt-1">
              {mode === "login" && (
                <button onClick={() => { setMode("reset"); setMsg(null); }}
                  className="font-roboto text-xs text-white/30 hover:text-white/60 transition-colors">
                  Забыли пароль?
                </button>
              )}
              {mode === "reset" && (
                <button onClick={() => { setMode("login"); setMsg(null); }}
                  className="font-roboto text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                  <Icon name="ArrowLeft" size={11} />Назад
                </button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AI ЧАТ ВИДЖЕТ
   ══════════════════════════════════════════════════════════════════════════ */
interface ChatMsg { role: "user" | "assistant"; content: string; }

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "👋 Привет! Я AI-ассистент Skypka24.\n\nПомогу выбрать услугу разблокировки, объясню как оформить заказ и отвечу на вопросы.\n\nС чего начнём?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs(p => [...p, { role: "user", content: text }]);
    setLoading(true);
    try {
      const d = await aiCall({ action: "chat", message: text, session_id: sessionId });
      if (d.reply) {
        setMsgs(p => [...p, { role: "assistant", content: d.reply }]);
        if (d.session_id) setSessionId(d.session_id);
      } else {
        setMsgs(p => [...p, { role: "assistant", content: "Ошибка: " + (d.error || "нет ответа") }]);
      }
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Ошибка соединения. Попробуйте снова." }]);
    }
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const QUICK = ["Как разблокировать iPhone?", "Что такое FRP?", "Как найти IMEI?", "Статус заказа"];

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="fixed bottom-24 right-5 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open ? "rgba(20,16,8,0.95)" : "linear-gradient(135deg,#FFD700,#b8860b)",
          border: open ? "2px solid rgba(255,215,0,0.4)" : "2px solid transparent",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.3),0 8px 32px rgba(255,215,0,0.35)",
        }}
        title="AI-ассистент">
        <Icon name={open ? "X" : "MessageCircle"} size={22}
          style={{ color: open ? "#FFD700" : "#000" }} />
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#6ee7b7", color: "#000" }}>AI</span>
        )}
      </button>

      {/* Окно чата */}
      {open && (
        <div className="fixed bottom-44 right-4 lg:bottom-24 lg:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(145deg,rgba(12,9,5,0.98) 0%,rgba(6,6,10,0.99) 100%)",
            border: "1px solid rgba(255,215,0,0.2)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.06),0 24px 60px rgba(0,0,0,0.7)",
            maxHeight: "70vh",
          }}>
          {/* Шапка */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0"
            style={{ borderColor: "rgba(255,215,0,0.12)", background: "rgba(255,215,0,0.04)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
              <Icon name="Bot" size={15} className="text-black" />
            </div>
            <div className="flex-1">
              <div className="font-oswald font-bold text-sm uppercase text-white">Sky AI</div>
              <div className="font-roboto text-[9px] text-white/35 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7] animate-pulse inline-block" />
                DeepSeek · Онлайн
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/25 hover:text-white/60 transition-colors">
              <Icon name="X" size={15} />
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.25)" }}>
                    <Icon name="Bot" size={11} style={{ color: "#FFD700" }} />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl font-roboto text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "text-white/90 rounded-tr-sm"
                    : "text-white/80 rounded-tl-sm"
                }`}
                  style={{
                    background: m.role === "user"
                      ? "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.08))"
                      : "rgba(255,255,255,0.05)",
                    border: m.role === "user"
                      ? "1px solid rgba(255,215,0,0.25)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.25)" }}>
                  <Icon name="Bot" size={11} style={{ color: "#FFD700" }} />
                </div>
                <div className="px-3 py-2.5 rounded-xl rounded-tl-sm flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Быстрые вопросы */}
          {msgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0); }}
                  className="px-2.5 py-1 rounded-lg font-roboto text-[10px] transition-all"
                  style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.18)", color: "rgba(255,215,0,0.7)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,215,0,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,215,0,0.07)")}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Ввод */}
          <div className="p-3 border-t shrink-0 flex gap-2 items-end"
            style={{ borderColor: "rgba(255,215,0,0.1)" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Спросите AI... (Enter — отправить)"
              rows={1}
              className="flex-1 resize-none px-3 py-2.5 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,215,0,0.15)",
                maxHeight: "80px",
                lineHeight: "1.4",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.15)")}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#FFD700,#b8860b)",
                boxShadow: "0 0 12px rgba(255,215,0,0.3)",
              }}>
              <Icon name="Send" size={16} className="text-black" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
