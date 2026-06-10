import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PROMO_API = "https://functions.poehali.dev/d0b139ce-b968-40cb-be48-3bdb67713efb";

interface Promo {
  id: number;
  slug: string;
  title: string;
  short_desc: string;
  full_desc: string;
  image_url: string | null;
  ends_at: string | null;
  max_participants: number | null;
  leads_count: number;
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "+7";
  if (d.length <= 1) return "+7";
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const tick = () => setDiff(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (diff <= 0) return <span className="text-red-400 text-sm font-bold">Акция завершена</span>;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-2">
      {[
        { v: d, l: "дн" },
        { v: h, l: "ч" },
        { v: m, l: "мин" },
        { v: s, l: "сек" },
      ].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-oswald font-black text-xl"
            style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
            {String(v).padStart(2, "0")}
          </div>
          <div className="text-[9px] text-white/40 mt-0.5 font-roboto">{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function PromoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${PROMO_API}?action=get&slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.id) setPromo(d);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const nameOk  = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, "").length === 11;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    setSending(true); setErr(null);
    try {
      const r = await fetch(`${PROMO_API}?action=submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: name.trim(), phone }),
      });
      const d = await r.json();
      if (d.ok) setDone(true);
      else setErr(d.error || "Ошибка. Попробуйте ещё раз.");
    } catch {
      setErr("Ошибка сети. Попробуйте ещё раз.");
    }
    setSending(false);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = promo ? `${promo.title} — Скупка24` : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#FFD700] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !promo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#0a0a0a" }}>
        <div className="text-6xl">🎁</div>
        <h1 className="font-oswald font-bold text-2xl text-white uppercase">Акция не найдена</h1>
        <p className="text-white/40 text-sm">Возможно, акция завершена или ссылка устарела.</p>
        <a href="/" className="mt-2 px-6 py-3 rounded-xl font-oswald font-bold text-sm uppercase text-black"
          style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
          На главную
        </a>
      </div>
    );
  }

  const spotsLeft = promo.max_participants ? promo.max_participants - promo.leads_count : null;

  return (
    <div className="min-h-screen font-roboto" style={{ background: "#0a0a0a", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .font-roboto { font-family: 'Roboto', sans-serif; }
      `}</style>

      {/* Шапка */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,215,0,0.2)", backdropFilter: "blur(12px)" }}>
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
            <span className="text-black font-black text-sm">С</span>
          </div>
          <span className="font-oswald font-bold text-sm text-white/70 uppercase tracking-wide">Скупка24</span>
        </a>
        <span className="text-white/20 text-xs ml-auto">Акция</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Фото */}
        {promo.image_url && (
          <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "900/480", border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={promo.image_url} alt={promo.title}
              className="w-full h-full object-cover" />
          </div>
        )}

        {/* Заголовок */}
        <div>
          <h1 className="font-oswald font-bold text-3xl sm:text-4xl uppercase leading-tight"
            style={{ background: "linear-gradient(135deg,#fff3a0,#FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {promo.title}
          </h1>
          {promo.short_desc && (
            <p className="mt-2 text-white/60 text-[15px] leading-relaxed">{promo.short_desc}</p>
          )}
        </div>

        {/* Таймер + лимит */}
        <div className="flex flex-wrap items-center gap-4">
          {promo.ends_at && <Countdown endsAt={promo.ends_at} />}
          {spotsLeft !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: spotsLeft <= 10 ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.1)", border: `1px solid ${spotsLeft <= 10 ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.25)"}` }}>
              <Icon name="Users" size={14} className={spotsLeft <= 10 ? "text-red-400" : "text-green-400"} />
              <span className={`font-oswald font-bold text-sm ${spotsLeft <= 10 ? "text-red-300" : "text-green-300"}`}>
                Осталось {spotsLeft} мест
              </span>
            </div>
          )}
        </div>

        {/* Полное описание */}
        {promo.full_desc && (
          <div className="rounded-2xl p-5 space-y-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {promo.full_desc.split("\n").map((line, i) => (
              <p key={i} className="text-[14px] text-white/75 leading-relaxed">{line}</p>
            ))}
          </div>
        )}

        {/* Форма */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.2)" }}>
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-5xl">✅</div>
              <div className="font-oswald font-bold text-xl uppercase text-white">Заявка принята!</div>
              <p className="text-white/50 text-sm">Мы перезвоним вам в ближайшее время</p>
            </div>
          ) : (
            <>
              <div className="font-oswald font-bold text-lg uppercase tracking-wide" style={{ color: "#FFD700" }}>
                🎁 Хочу участвовать
              </div>
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя *"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${touched && !nameOk ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                  }}
                />
                <input
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${touched && !phoneOk ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
                  }}
                />
                {err && <p className="text-red-400 text-xs">{err}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full py-4 rounded-xl font-oswald font-bold text-base uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)", boxShadow: "0 4px 20px rgba(255,215,0,0.3)" }}>
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Отправляем…
                    </span>
                  ) : "Хочу участвовать →"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Поделиться */}
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">Поделиться:</span>
          <a href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: "rgba(0,119,255,0.15)", border: "1px solid rgba(0,119,255,0.3)", color: "#60a5fa" }}>
            ВКонтакте
          </a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: "rgba(0,136,204,0.15)", border: "1px solid rgba(0,136,204,0.3)", color: "#38bdf8" }}>
            Telegram
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank" rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#4ade80" }}>
            WhatsApp
          </a>
        </div>

        {/* Контакты */}
        <div className="rounded-2xl p-5 grid grid-cols-2 gap-4 text-sm"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Адреса</div>
            <div className="text-white/70 leading-relaxed text-[13px]">
              ул. Кирова, 11<br />ул. Кирова, 7/47
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Телефон</div>
            <a href="tel:+79929990333" className="font-bold" style={{ color: "#FFD700" }}>
              +7 (992) 999-03-33
            </a>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Режим работы</div>
            <div className="text-white/70 text-[13px]">Ежедневно 10:00–21:00</div>
          </div>
          <div>
            <div className="text-white/40 text-xs uppercase tracking-wide mb-1">Сайт</div>
            <a href="https://skypka24.com" className="text-white/50 text-[13px]">skypka24.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
