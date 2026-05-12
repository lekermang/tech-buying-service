import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { PUBLIC_CHAT_URL, MAX_BOT_URL } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  phone: string;
  name: string;
  leadId?: number | null;
  device?: string | null;
  token: string;
}

export default function InviteToChatDialog({
  open, onClose, phone, name, leadId, device, token,
}: Props) {
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const digits = (phone || "").replace(/\D/g, "");
  const e164 = digits.length === 11 ? digits : (digits.length === 10 ? "7" + digits : digits);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setInviteUrl("");
      try {
        const r = await fetch(`${PUBLIC_CHAT_URL}?action=create_invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": token,
            "X-Employee-Token": token,
          },
          body: JSON.stringify({
            phone,
            name: name || "",
            lead_id: leadId || undefined,
            device: device || undefined,
          }),
        });
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok || !d?.invite_url) {
          setError(d?.error || `Ошибка ${r.status}`);
          return;
        }
        setInviteUrl(d.invite_url as string);
      } catch {
        if (!cancelled) setError("Нет связи");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, phone, name, leadId, device, token]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("📋 Ссылка скопирована");
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  const inviteText = (n: string) =>
    `Здравствуйте${n ? `, ${n.split(" ")[0]}` : ""}! Менеджер Скупка24 на связи. Откройте чат для общения: ${inviteUrl}`;

  const handleMax = async () => {
    if (!inviteUrl) return;
    try {
      const r = await fetch(`${MAX_BOT_URL}?action=send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": token,
          "X-Employee-Token": token,
        },
        body: JSON.stringify({ phone, text: inviteText(name) }),
      });
      const d = await r.json().catch(() => ({}));
      if (d && d.ok) showToast("💬 Отправлено в MAX");
      else showToast(`❌ MAX: ${d?.error || "ошибка"}`);
    } catch {
      showToast("❌ Нет связи с MAX-ботом");
    }
  };

  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent("Скупка24 — открыть чат с менеджером")}`;
  const waUrl = `https://wa.me/${e164}?text=${encodeURIComponent(inviteText(name))}`;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-[#0F0F0F] border-2 border-[#FFD700]/30 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#FFD700]/15">
          <div className="flex items-center gap-2">
            <Icon name="MessageSquare" size={18} className="text-[#FFD700]" />
            <div className="font-oswald font-bold text-base text-white uppercase">
              Пригласить в чат
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xs font-roboto text-white/60">
            <div>Клиент: <span className="text-white">{name || "—"}</span></div>
            <div className="font-mono text-[#FFD700]">{phone}</div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-6 text-white/50 gap-2">
              <Icon name="Loader" size={16} className="animate-spin" />
              <span className="font-roboto text-sm">Создаём ссылку...</span>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {inviteUrl && (
            <>
              <div>
                <div className="font-roboto text-white/50 text-[10px] uppercase tracking-wider mb-1">
                  Ссылка приглашения (24 часа)
                </div>
                <input
                  readOnly
                  value={inviteUrl}
                  onFocus={e => e.currentTarget.select()}
                  className="w-full bg-[#0D0D0D] border border-[#333] text-[#FFD700] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#FFD700] select-all"
                />
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wider hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Icon name="Copy" size={16} />
                Скопировать
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleMax}
                  className="flex flex-col items-center gap-1 py-2.5 rounded bg-[#2787F5]/15 hover:bg-[#2787F5]/25 border border-[#2787F5]/40 text-[#76b0ff] active:scale-95 transition-all"
                  title="Отправить ссылку в MAX (если у клиента есть привязка)"
                >
                  <Icon name="MessageSquare" size={16} />
                  <span className="text-[10px] font-roboto font-bold">MAX</span>
                </button>
                <a
                  href={tgShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 py-2.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-200 active:scale-95 transition-all"
                  title="Поделиться через Telegram"
                >
                  <Icon name="Send" size={16} />
                  <span className="text-[10px] font-roboto font-bold">Telegram</span>
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 py-2.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 active:scale-95 transition-all"
                  title="Отправить через WhatsApp клиенту"
                >
                  <Icon name="MessageCircle" size={16} />
                  <span className="text-[10px] font-roboto font-bold">WhatsApp</span>
                </a>
              </div>

              <div className="text-[10px] text-white/30 font-roboto leading-relaxed">
                Клиент откроет чат на skypka24.com/chat и сможет общаться с менеджером в браузере.
              </div>
            </>
          )}
        </div>

        {toast && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
